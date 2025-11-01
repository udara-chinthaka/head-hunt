import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const CVAssignments = () => {
  const { toast } = useToast();
  const [cvs, setCvs] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedCV, setSelectedCV] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [cvsResult, orgsResult, assignmentsResult] = await Promise.all([
        supabase.from("cv_uploads").select("*, candidates(first_name, last_name)"),
        supabase.from("organizations").select("*").eq("is_active", true),
        supabase
          .from("cv_assignments")
          .select(`
            *,
            cv_uploads(*, candidates(first_name, last_name)),
            organizations(name)
          `, { count: "exact" })
          .order("assigned_at", { ascending: false })
          .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1),
      ]);

      if (cvsResult.error) throw cvsResult.error;
      if (orgsResult.error) throw orgsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;

      setCvs(cvsResult.data || []);
      setOrganizations(orgsResult.data || []);
      setAssignments(assignmentsResult.data || []);
      setTotal(assignmentsResult.count || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleAssign = async () => {
    if (!selectedCV || !selectedOrg) {
      toast({
        title: "Error",
        description: "Please select both CV and organization",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if this CV's candidate has been hired
      const { data: cvData } = await supabase
        .from("cv_uploads")
        .select("candidate_id")
        .eq("id", selectedCV)
        .single();

      if (cvData) {
        const { data: billingData } = await supabase
          .from("billing")
          .select("organization_id, organizations(name)")
          .eq("candidate_id", cvData.candidate_id)
          .eq("status", "paid")
          .single();

        if (billingData) {
          toast({
            title: "Error",
            description: `This candidate is already hired by ${billingData.organizations.name}`,
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase.from("cv_assignments").insert({
        cv_id: selectedCV,
        organization_id: selectedOrg,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "CV assigned successfully",
      });

      setSelectedCV("");
      setSelectedOrg("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign CV to Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedCV} onValueChange={setSelectedCV}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select CV" />
              </SelectTrigger>
              <SelectContent>
                {cvs.map((cv) => (
                  <SelectItem key={cv.id} value={cv.id}>
                    {cv.candidates.first_name} {cv.candidates.last_name} - {cv.file_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select Organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleAssign}>
              <Plus className="mr-2 h-4 w-4" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CV Assignments ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>CV File</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Assigned At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {assignment.cv_uploads.candidates.first_name}{" "}
                    {assignment.cv_uploads.candidates.last_name}
                  </TableCell>
                  <TableCell>{assignment.cv_uploads.file_name}</TableCell>
                  <TableCell>{assignment.organizations.name}</TableCell>
                  <TableCell>{new Date(assignment.assigned_at).toLocaleString()}</TableCell>
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
    </div>
  );
};

export default CVAssignments;
