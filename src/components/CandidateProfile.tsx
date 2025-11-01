import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Plus, X } from 'lucide-react';
import { z } from 'zod';

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

interface CandidateProfileProps {
  candidate: CandidateData | null;
  onUpdate: () => void;
}

const candidateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number must be less than 20 characters'),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  experience_years: z.number().min(0, 'Experience cannot be negative').max(50, 'Experience cannot exceed 50 years').optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  linkedin_url: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Please enter a valid portfolio URL').optional().or(z.literal(''))
});

const CandidateProfile: React.FC<CandidateProfileProps> = ({ candidate, onUpdate }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!candidate);
  const [newSkill, setNewSkill] = useState('');
  const [formData, setFormData] = useState({
    first_name: candidate?.first_name || '',
    last_name: candidate?.last_name || '',
    email: candidate?.email || user?.email || '',
    phone: candidate?.phone || '',
    location: candidate?.location || '',
    skills: candidate?.skills || [],
    experience_years: candidate?.experience_years || 0,
    bio: candidate?.bio || '',
    linkedin_url: candidate?.linkedin_url || '',
    portfolio_url: candidate?.portfolio_url || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience_years' ? parseInt(value) || 0 : value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      const validatedData = candidateSchema.parse({
        ...formData,
        linkedin_url: formData.linkedin_url || undefined,
        portfolio_url: formData.portfolio_url || undefined,
        location: formData.location || undefined,
        bio: formData.bio || undefined,
        experience_years: formData.experience_years || undefined
      });

      const profileData = {
        user_id: user?.id,
        ...validatedData,
        skills: formData.skills
      };

      let result;
      if (candidate) {
        // Update existing profile
        result = await supabase
          .from('candidates')
          .update(profileData)
          .eq('id', candidate.id);
      } else {
        // Create new profile
        result = await supabase
          .from('candidates')
          .insert([profileData]);
      }

      if (result.error) {
        throw result.error;
      }

      // Log the activity
      await supabase.rpc('log_activity', {
        _action: candidate ? 'profile_updated' : 'profile_created',
        _entity_type: 'candidate',
        _details: { action: candidate ? 'update' : 'create' }
      });

      toast.success(candidate ? 'Profile updated successfully!' : 'Profile created successfully!');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        console.error('Error saving profile:', error);
        toast.error('Failed to save profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (candidate) {
      setFormData({
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone || '',
        location: candidate.location || '',
        skills: candidate.skills || [],
        experience_years: candidate.experience_years || 0,
        bio: candidate.bio || '',
        linkedin_url: candidate.linkedin_url || '',
        portfolio_url: candidate.portfolio_url || ''
      });
      setIsEditing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {candidate ? 'Your Profile' : 'Create Your Profile'}
            </CardTitle>
            <CardDescription>
              {candidate 
                ? 'Manage your professional information and skills'
                : 'Complete your profile to start applying for positions'
              }
            </CardDescription>
          </div>
          {candidate && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  name="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself, your experience, and what you're looking for..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio_url">Portfolio URL</Label>
                <Input
                  id="portfolio_url"
                  name="portfolio_url"
                  type="url"
                  value={formData.portfolio_url}
                  onChange={handleInputChange}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" onClick={handleAddSkill} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="pl-2 pr-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
              {candidate && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          candidate && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {candidate.first_name} {candidate.last_name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {candidate.email}</p>
                    {candidate.phone && <p><span className="text-muted-foreground">Phone:</span> {candidate.phone}</p>}
                    {candidate.location && <p><span className="text-muted-foreground">Location:</span> {candidate.location}</p>}
                    {candidate.experience_years !== undefined && (
                      <p><span className="text-muted-foreground">Experience:</span> {candidate.experience_years} years</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Links</h3>
                  <div className="space-y-2 text-sm">
                    {candidate.linkedin_url && (
                      <p>
                        <span className="text-muted-foreground">LinkedIn:</span>{' '}
                        <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          View Profile
                        </a>
                      </p>
                    )}
                    {candidate.portfolio_url && (
                      <p>
                        <span className="text-muted-foreground">Portfolio:</span>{' '}
                        <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          View Portfolio
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {candidate.bio && (
                <div>
                  <h3 className="font-medium mb-2">Bio</h3>
                  <p className="text-sm text-muted-foreground">{candidate.bio}</p>
                </div>
              )}

              {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateProfile;