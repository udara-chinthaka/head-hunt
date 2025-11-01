import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Upload, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CandidateData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CVUploadProps {
  candidate: CandidateData | null;
  onSuccess: () => void;
}

const CVUpload: React.FC<CVUploadProps> = ({ candidate, onSuccess }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a PDF, DOC, or DOCX file only.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 20MB.';
    }
    return null;
  };

  const uploadCV = async (file: File) => {
    if (!candidate) {
      toast.error('Please complete your profile first');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create file path with user ID for security
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(50);

      // Save CV record to database
      const { error: dbError } = await supabase
        .from('cv_uploads')
        .insert([{
          candidate_id: candidate.id,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          status: 'pending'
        }]);

      if (dbError) {
        // If database insert fails, try to clean up uploaded file
        await supabase.storage.from('cvs').remove([fileName]);
        throw dbError;
      }

      setUploadProgress(80);

      // Log the activity
      await supabase.rpc('log_activity', {
        _action: 'cv_uploaded',
        _entity_type: 'cv_upload',
        _details: { 
          file_name: file.name,
          file_size: file.size
        }
      });

      setUploadProgress(100);
      toast.success('CV uploaded successfully!');
      onSuccess();

    } catch (error) {
      console.error('Error uploading CV:', error);
      toast.error('Failed to upload CV. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadCV(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadCV(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  if (!candidate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CV Upload</CardTitle>
          <CardDescription>
            Upload your CV to start applying for positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete your profile first before uploading your CV.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CV Upload</CardTitle>
        <CardDescription>
          Upload your CV to start applying for positions. Supported formats: PDF, DOC, DOCX (max 20MB)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUploading ? (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium">Uploading your CV...</h3>
              <p className="text-sm text-muted-foreground">Please don't close this window</p>
            </div>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              {uploadProgress}% complete
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Drop your CV here or click to browse
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, DOC, and DOCX files up to 20MB
                  </p>
                </div>
                
                <Button variant="outline">
                  <File className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Upload Guidelines:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use a clear, professional file name</li>
                <li>• Ensure your CV is up to date with relevant experience</li>
                <li>• Include contact information and key skills</li>
                <li>• Keep file size under 20MB for faster processing</li>
              </ul>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Your CV will be reviewed by our admin team and forwarded to relevant organizations. 
                You'll be notified of any status updates via email and in your dashboard.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CVUpload;