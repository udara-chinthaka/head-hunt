import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

const ActivityLogs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [candidateOpen, setCandidateOpen] = useState(false);

  const fetchFilters = async () => {
    try {
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("id, first_name, last_name")
        .order("first_name");

      setOrganizations(orgsData || []);
      setCandidates(candidatesData || []);
    } catch (error: any) {
      console.error("Failed to fetch filters:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from("recruiter_actions")
        .select(`
          *,
          cv_uploads(file_name, candidate_id, candidates(id, first_name, last_name)),
          organizations(name)
        `, { count: "exact" });

      if (selectedOrg) {
        query = query.eq("organization_id", selectedOrg);
      }

      if (selectedCandidate) {
        query = query.eq("cv_uploads.candidate_id", selectedCandidate);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setLogs(data || []);
      setTotal(count || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedOrg("");
    setSelectedCandidate("");
    setPage(1);
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, selectedOrg, selectedCandidate]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recruiter Activity Logs ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filter by organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={candidateOpen} onOpenChange={setCandidateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={candidateOpen}
                className="w-[250px] justify-between"
              >
                {selectedCandidate
                  ? candidates.find((candidate) => candidate.id === selectedCandidate)
                      ? `${candidates.find((c) => c.id === selectedCandidate)?.first_name} ${candidates.find((c) => c.id === selectedCandidate)?.last_name}`
                      : "Filter by candidate"
                  : "Filter by candidate"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search candidate..." />
                <CommandList>
                  <CommandEmpty>No candidate found.</CommandEmpty>
                  <CommandGroup>
                    {candidates.map((candidate) => (
                      <CommandItem
                        key={candidate.id}
                        value={`${candidate.first_name} ${candidate.last_name}`}
                        onSelect={() => {
                          setSelectedCandidate(candidate.id === selectedCandidate ? "" : candidate.id);
                          setCandidateOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCandidate === candidate.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {candidate.first_name} {candidate.last_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {(selectedOrg || selectedCandidate) && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>CV</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="capitalize font-medium">{log.action}</TableCell>
                <TableCell>{log.organizations.name}</TableCell>
                <TableCell>
                  {log.cv_uploads.candidates.first_name} {log.cv_uploads.candidates.last_name}
                </TableCell>
                <TableCell>{log.cv_uploads.file_name}</TableCell>
                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {log.details ? JSON.stringify(log.details) : "N/A"}
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

export default ActivityLogs;
