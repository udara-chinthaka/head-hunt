import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter } from 'lucide-react';
import CVCard from '@/components/CVCard';

interface Organization {
  id: string;
  name: string;
}

interface CandidateWithCV {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  skills: string[] | null;
  experience_years: number | null;
  cv_uploads: {
    id: string;
    file_name: string;
    file_path: string;
    status: string;
    uploaded_at: string;
    viewed_at: string | null;
    shortlisted_at: string | null;
    hired_at: string | null;
  }[];
}

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [candidates, setCandidates] = useState<CandidateWithCV[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateWithCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    
    checkOrganization();
  }, [user, navigate, authLoading]);

  useEffect(() => {
    if (organization) {
      loadCandidates();
    }
  }, [organization]);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, skillFilter, locationFilter]);

  const checkOrganization = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(id, name)')
        .eq('user_id', user?.id)
        .single();

      if (memberError || !memberData) {
        navigate('/recruiter/auth');
        return;
      }

      setOrganization(memberData.organizations as Organization);
    } catch (error) {
      console.error('Error checking organization:', error);
      navigate('/recruiter/auth');
    }
  };

  const loadCandidates = async () => {
    try {
      setLoading(true);
      
      // Get assigned CVs
      const { data: assignments, error: assignError } = await supabase
        .from('cv_assignments')
        .select('cv_id')
        .eq('organization_id', organization?.id);

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      const cvIds = assignments.map(a => a.cv_id);

      // Get CVs with candidate details
      const { data: cvs, error: cvError } = await supabase
        .from('cv_uploads')
        .select(`
          id,
          file_name,
          file_path,
          status,
          uploaded_at,
          viewed_at,
          shortlisted_at,
          hired_at,
          candidate_id
        `)
        .in('id', cvIds);

      if (cvError) throw cvError;

      if (!cvs || cvs.length === 0) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      const candidateIds = [...new Set(cvs.map(cv => cv.candidate_id))];

      // Get candidate details
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .in('id', candidateIds);

      if (candidateError) throw candidateError;

      // Combine data
      const combined = candidateData?.map(candidate => ({
        ...candidate,
        cv_uploads: cvs.filter(cv => cv.candidate_id === candidate.id),
      })) || [];

      setCandidates(combined);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load candidates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = [...candidates];

    if (searchTerm) {
      filtered = filtered.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (skillFilter) {
      filtered = filtered.filter(c => 
        c.skills?.some(skill => 
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(c => 
        c.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredCandidates(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
            <p className="text-sm text-muted-foreground">{organization?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/recruiter/profile')}>
              Edit Profile
            </Button>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                placeholder="Filter by skills..."
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              />
              <Input
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {candidates.length === 0 
                  ? 'No CVs assigned yet. Please wait for admin to assign CVs to your organization.'
                  : 'No candidates match your search criteria.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCandidates.map((candidate) => (
              <CVCard
                key={candidate.id}
                candidate={candidate}
                organizationId={organization?.id || ''}
                onUpdate={loadCandidates}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}