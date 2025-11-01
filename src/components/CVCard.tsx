import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye, UserCheck, Briefcase, XCircle, FileCheck, Phone } from 'lucide-react';

interface CV {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  uploaded_at: string;
  viewed_at: string | null;
  shortlisted_at: string | null;
  hired_at: string | null;
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  skills: string[] | null;
  experience_years: number | null;
  cv_uploads: CV[];
}

interface CVCardProps {
  candidate: Candidate;
  organizationId: string;
  onUpdate: () => void;
}

export default function CVCard({ candidate, organizationId, onUpdate }: CVCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const cv = candidate.cv_uploads[0];

  const logAction = async (action: string, details?: any) => {
    await supabase.from('recruiter_actions').insert([{
      organization_id: organizationId,
      user_id: user?.id,
      cv_id: cv.id,
      action,
      details,
    }]);
  };

  const handleDownload = async () => {
    try {
      setActionLoading('download');
      
      const { data, error } = await supabase.storage
        .from('cvs')
        .download(cv.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = cv.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Auto-update status to 'viewed' if currently 'pending'
      if (cv.status === 'pending') {
        await supabase
          .from('cv_uploads')
          .update({ 
            status: 'viewed',
            viewed_at: new Date().toISOString()
          })
          .eq('id', cv.id);
      }

      await logAction('download', { file_name: cv.file_name });

      toast({
        title: 'Success',
        description: 'CV downloaded successfully',
      });

      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download CV',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsViewed = async () => {
    try {
      setActionLoading('viewed');
      
      const { error } = await supabase
        .from('cv_uploads')
        .update({ 
          status: 'viewed',
          viewed_at: new Date().toISOString()
        })
        .eq('id', cv.id);

      if (error) throw error;

      await logAction('mark_viewed');

      toast({
        title: 'Success',
        description: 'CV marked as viewed',
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleShortlist = async () => {
    try {
      setActionLoading('shortlist');
      
      const { error } = await supabase
        .from('cv_uploads')
        .update({ 
          status: 'shortlisted',
          shortlisted_at: new Date().toISOString()
        })
        .eq('id', cv.id);

      if (error) throw error;

      await logAction('shortlist');

      toast({
        title: 'Success',
        description: 'Candidate shortlisted. Admin will be notified to send email.',
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to shortlist candidate',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsInterviewed = async () => {
    try {
      setActionLoading('interviewed');
      
      const { error } = await supabase
        .from('cv_uploads')
        .update({ status: 'interviewed' })
        .eq('id', cv.id);

      if (error) throw error;

      await logAction('mark_interviewed');

      toast({
        title: 'Success',
        description: 'Candidate marked as interviewed',
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleHire = async () => {
    try {
      setActionLoading('hire');
      
      const { error } = await supabase
        .from('cv_uploads')
        .update({ 
          status: 'hired',
          hired_at: new Date().toISOString()
        })
        .eq('id', cv.id);

      if (error) throw error;

      await logAction('hire');

      toast({
        title: 'Success',
        description: 'Candidate hired! System and billing will be updated.',
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to hire candidate',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading('reject');
      
      const { error } = await supabase
        .from('cv_uploads')
        .update({ status: 'not_selected' })
        .eq('id', cv.id);

      if (error) throw error;

      await logAction('reject');

      toast({
        title: 'Success',
        description: 'Candidate marked as not selected',
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      viewed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      shortlisted: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      interviewed: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      hired: 'bg-green-500/10 text-green-500 border-green-500/20',
      not_selected: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[status] || '';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">
              {candidate.first_name} {candidate.last_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{candidate.email}</p>
            {candidate.phone && (
              <p className="text-sm text-muted-foreground">{candidate.phone}</p>
            )}
          </div>
          <Badge variant="outline" className={getStatusColor(cv.status)}>
            {cv.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {candidate.location && (
            <div>
              <span className="font-medium">Location:</span> {candidate.location}
            </div>
          )}
          {candidate.experience_years !== null && (
            <div>
              <span className="font-medium">Experience:</span> {candidate.experience_years} years
            </div>
          )}
        </div>

        {candidate.skills && candidate.skills.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Skills:</p>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={actionLoading === 'download'}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CV
          </Button>

          {candidate.phone && (
            <Button
              size="sm"
              variant="outline"
              asChild
            >
              <a href={`tel:${candidate.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call Candidate
              </a>
            </Button>
          )}

          {cv.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAsViewed}
              disabled={actionLoading === 'viewed'}
            >
              <Eye className="h-4 w-4 mr-2" />
              Mark as Viewed
            </Button>
          )}

          {(cv.status === 'viewed' || cv.status === 'pending') && (
            <Button
              size="sm"
              variant="default"
              onClick={handleShortlist}
              disabled={actionLoading === 'shortlist'}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Shortlist
            </Button>
          )}

          {(cv.status === 'shortlisted' || cv.status === 'viewed') && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAsInterviewed}
              disabled={actionLoading === 'interviewed'}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Mark as Interviewed
            </Button>
          )}

          {cv.status === 'interviewed' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={handleHire}
                disabled={actionLoading === 'hire'}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Hire
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading === 'reject'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Not Selected
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
          <p>Uploaded: {new Date(cv.uploaded_at).toLocaleDateString()}</p>
          {cv.viewed_at && <p>Viewed: {new Date(cv.viewed_at).toLocaleDateString()}</p>}
          {cv.shortlisted_at && <p>Shortlisted: {new Date(cv.shortlisted_at).toLocaleDateString()}</p>}
          {cv.hired_at && <p>Hired: {new Date(cv.hired_at).toLocaleDateString()}</p>}
        </div>
      </CardContent>
    </Card>
  );
}