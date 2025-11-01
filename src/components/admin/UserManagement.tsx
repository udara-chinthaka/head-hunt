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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [candidatePage, setCandidatePage] = useState(1);
  const [orgPage, setOrgPage] = useState(1);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [orgTotal, setOrgTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async (page: number, search: string = "") => {
    try {
      let query = supabase
        .from("candidates")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setCandidates(data || []);
      setCandidateTotal(count || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch candidates",
        variant: "destructive",
      });
    }
  };

  const fetchOrganizations = async (page: number, search: string = "") => {
    try {
      let query = supabase
        .from("organizations")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setOrganizations(data || []);
      setOrgTotal(count || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch organizations",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCandidates(candidatePage, searchTerm),
        fetchOrganizations(orgPage, searchTerm),
      ]);
      setLoading(false);
    };

    loadData();
  }, [candidatePage, orgPage]);

  const handleSearch = () => {
    setCandidatePage(1);
    setOrgPage(1);
    fetchCandidates(1, searchTerm);
    fetchOrganizations(1, searchTerm);
  };

  const toggleCandidateStatus = async (candidateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("candidates")
        .update({ is_active: !currentStatus } as any)
        .eq("id", candidateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate status updated",
      });

      fetchCandidates(candidatePage, searchTerm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    }
  };

  const toggleOrgStatus = async (orgId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ is_active: !currentStatus } as any)
        .eq("id", orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization status updated",
      });

      fetchOrganizations(orgPage, searchTerm);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update organization status",
        variant: "destructive",
      });
    }
  };

  const candidatePages = Math.ceil(candidateTotal / ITEMS_PER_PAGE);
  const orgPages = Math.ceil(orgTotal / ITEMS_PER_PAGE);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Candidates ({candidateTotal})</TabsTrigger>
          <TabsTrigger value="organizations">Organizations ({orgTotal})</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle>Manage Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>{`${candidate.first_name} ${candidate.last_name}`}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>{candidate.phone || "N/A"}</TableCell>
                      <TableCell>{candidate.location || "N/A"}</TableCell>
                      <TableCell>
                        <span className={candidate.is_active ? "text-green-600" : "text-red-600"}>
                          {candidate.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCandidateStatus(candidate.id, candidate.is_active)}
                        >
                          {candidate.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => candidatePage > 1 && setCandidatePage(candidatePage - 1)}
                      className={candidatePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: candidatePages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCandidatePage(page)}
                        isActive={page === candidatePage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => candidatePage < candidatePages && setCandidatePage(candidatePage + 1)}
                      className={candidatePage === candidatePages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Manage Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>{org.name}</TableCell>
                      <TableCell>{org.email}</TableCell>
                      <TableCell>{org.industry || "N/A"}</TableCell>
                      <TableCell>
                        <span className={org.is_active ? "text-green-600" : "text-red-600"}>
                          {org.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOrgStatus(org.id, org.is_active)}
                        >
                          {org.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => orgPage > 1 && setOrgPage(orgPage - 1)}
                      className={orgPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: orgPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setOrgPage(page)}
                        isActive={page === orgPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => orgPage < orgPages && setOrgPage(orgPage + 1)}
                      className={orgPage === orgPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
