import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, 
  Upload, 
  Eye, 
  CheckCircle2, 
  Trophy, 
  X,
  LogOut,
  Settings,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';
import CandidateProfile from '@/components/CandidateProfile';
import CVUpload from '@/components/CVUpload';

interface CandidateData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  skills?: string[];
  experience_years?: number;
  bio?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

interface RecruiterAction {
  id: string;
  action: string;
  created_at: string;
  details?: any;
  recruiter?: {
    email: string;
  };
  organization?: {
    name: string;
  };
}

interface CVUploadData {
  id: string;
  file_name: string;
  file_path: string;
  status: 'pending' | 'viewed' | 'shortlisted' | 'hired' | 'rejected' | 'interviewed' | 'not_selected';
  uploaded_at: string;
  viewed_at?: string;
  shortlisted_at?: string;
  hired_at?: string;
  recruiter_actions?: RecruiterAction[];
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [cvUploads, setCvUploads] = useState<CVUploadData[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'cv' | 'status'>('profile');
  const [dataLoading, setDataLoading] = useState(true);
  const [candidateChecked, setCandidateChecked] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCandidateData();
      fetchCVUploads();
    }
  }, [user]);

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchCandidateData = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching candidate:', error);
        toast.error('Failed to load profile data');
        return;
      }

      setCandidate(data);
      setCandidateChecked(true);
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast.error('Failed to load profile data');
      setCandidateChecked(true);
    }
  };

  const fetchCVUploads = async () => {
    try {
      const { data: candidateData } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (candidateData) {
        const { data, error } = await supabase
          .from('cv_uploads')
          .select(`
            *,
            recruiter_actions:recruiter_actions(
              id,
              action,
              created_at,
              details,
              user_id,
              organization_id
            )
          `)
          .eq('candidate_id', candidateData.id)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error('Error fetching CV uploads:', error);
          return;
        }

        // Fetch organization details for each action
        const cvWithDetails = await Promise.all((data || []).map(async (cv) => {
          if (cv.recruiter_actions && cv.recruiter_actions.length > 0) {
            const actionsWithDetails = await Promise.all(
              cv.recruiter_actions.map(async (action: any) => {
                // Fetch organization name
                const { data: orgData } = await supabase
                  .from('organizations')
                  .select('name')
                  .eq('id', action.organization_id)
                  .maybeSingle();

                return {
                  ...action,
                  organization: orgData ? { name: orgData.name } : null,
                };
              })
            );
            
            return {
              ...cv,
              recruiter_actions: actionsWithDetails.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ),
            };
          }
          return cv;
        }));

        setCvUploads(cvWithDetails);
      }
    } catch (error) {
      console.error('Error fetching CV uploads:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'viewed':
        return <Eye className="h-4 w-4" />;
      case 'shortlisted':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'hired':
        return <Trophy className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'viewed':
        return 'secondary';
      case 'shortlisted':
        return 'default';
      case 'hired':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">HeadHunt</h1>
              <span className="text-muted-foreground">Candidate Portal</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Welcome, {candidate?.first_name || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'profile' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === 'cv' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('cv')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  CV Upload
                </Button>
                <Button
                  variant={activeTab === 'status' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('status')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Application Status
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total CVs</span>
                  <Badge variant="secondary">{cvUploads.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Viewed</span>
                  <Badge variant="secondary">
                    {cvUploads.filter(cv => cv.status === 'viewed').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Shortlisted</span>
                  <Badge variant="default">
                    {cvUploads.filter(cv => cv.status === 'shortlisted').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hired</span>
                  <Badge variant="default">
                    {cvUploads.filter(cv => cv.status === 'hired').length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <CandidateProfile 
                candidate={candidate} 
                onUpdate={fetchCandidateData}
              />
            )}

            {activeTab === 'cv' && (
              <>
                {!candidate && candidateChecked ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Complete Your Profile First</CardTitle>
                      <CardDescription>
                        Please complete your profile before uploading your CV
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => setActiveTab('profile')}>
                        <User className="h-4 w-4 mr-2" />
                        Go to Profile
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <CVUpload 
                    candidate={candidate}
                    onSuccess={() => {
                      fetchCVUploads();
                      toast.success('CV uploaded successfully!');
                    }}
                  />
                )}
              </>
            )}

            {activeTab === 'status' && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>
                    Track the status of your CV submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!candidate && candidateChecked ? (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Complete Your Profile First</h3>
                      <p className="text-muted-foreground mb-4">
                        Please complete your profile before uploading CVs
                      </p>
                      <Button onClick={() => setActiveTab('profile')}>
                        <User className="h-4 w-4 mr-2" />
                        Go to Profile
                      </Button>
                    </div>
                  ) : cvUploads.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No CVs uploaded yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload your CV to start applying for positions
                      </p>
                      <Button onClick={() => setActiveTab('cv')}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload CV
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cvUploads.map((cv) => (
                        <div key={cv.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{cv.file_name}</h4>
                            <Badge variant={getStatusColor(cv.status)}>
                              {getStatusIcon(cv.status)}
                              <span className="ml-1 capitalize">{cv.status}</span>
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Uploaded: {new Date(cv.uploaded_at).toLocaleDateString()}</p>
                            {cv.viewed_at && (
                              <p>Viewed: {new Date(cv.viewed_at).toLocaleDateString()}</p>
                            )}
                            {cv.shortlisted_at && (
                              <p>Shortlisted: {new Date(cv.shortlisted_at).toLocaleDateString()}</p>
                            )}
                            {cv.hired_at && (
                              <p>Hired: {new Date(cv.hired_at).toLocaleDateString()}</p>
                            )}
                          </div>

                          {/* Recruiter Actions Timeline */}
                          {cv.recruiter_actions && cv.recruiter_actions.length > 0 && (
                            <>
                              <Separator className="my-3" />
                              <div className="space-y-2">
                                <h5 className="text-sm font-medium">Activity Timeline</h5>
                                {cv.recruiter_actions.map((action) => (
                                  <div key={action.id} className="text-sm border-l-2 border-primary/20 pl-3 py-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium capitalize text-foreground">{action.action.replace('_', ' ')}</span>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-muted-foreground">{new Date(action.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {action.organization && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Organization: {action.organization.name}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;