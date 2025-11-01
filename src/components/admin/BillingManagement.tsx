import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ITEMS_PER_PAGE = 10;

const BillingManagement = () => {
  const { toast } = useToast();
  const [billings, setBillings] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hiringFee, setHiringFee] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBillings = async () => {
    try {
      const { data, error, count } = await supabase
        .from("billing")
        .select(`
          *,
          organizations(name),
          candidates(first_name, last_name),
          cv_uploads(file_name)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setBillings(data || []);
      setTotal(count || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch billing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, [page]);

  const updateFee = async (billingId: string) => {
    if (!hiringFee || isNaN(Number(hiringFee))) {
      toast({
        title: "Error",
        description: "Please enter a valid fee amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("billing")
        .update({ hiring_fee: Number(hiringFee) })
        .eq("id", billingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hiring fee updated",
      });

      fetchBillings();
      setHiringFee("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update fee",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (billingId: string) => {
    try {
      const { error } = await supabase
        .from("billing")
        .update({ 
          status: "paid",
          paid_at: new Date().toISOString()
        })
        .eq("id", billingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Marked as paid",
      });

      fetchBillings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Management ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>CV</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hired At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billings.map((billing) => (
              <TableRow key={billing.id}>
                <TableCell>{billing.organizations.name}</TableCell>
                <TableCell>
                  {billing.candidates.first_name} {billing.candidates.last_name}
                </TableCell>
                <TableCell>{billing.cv_uploads.file_name}</TableCell>
                <TableCell>${Number(billing.hiring_fee).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={billing.status === "paid" ? "text-green-600" : "text-yellow-600"}>
                    {billing.status}
                  </span>
                </TableCell>
                <TableCell>
                  {billing.hired_at ? new Date(billing.hired_at).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Set Fee</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Set Hiring Fee</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="fee">Fee Amount ($)</Label>
                            <Input
                              id="fee"
                              type="number"
                              step="0.01"
                              value={hiringFee}
                              onChange={(e) => setHiringFee(e.target.value)}
                              placeholder="Enter fee amount"
                            />
                          </div>
                          <Button onClick={() => updateFee(billing.id)}>Update Fee</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {billing.status !== "paid" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsPaid(billing.id)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && setPage(page - 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  onClick={() => setPage(p)}
                  isActive={p === page}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => page < totalPages && setPage(page + 1)}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardContent>
    </Card>
  );
};

export default BillingManagement;
