-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  industry TEXT,
  company_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create organization_members table (links users to organizations)
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create cv_assignments table (tracks which CVs are assigned to which organizations)
CREATE TABLE public.cv_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cv_id UUID NOT NULL REFERENCES public.cv_uploads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cv_id, organization_id)
);

-- Expand cv_status enum to include recruiter workflow statuses
ALTER TYPE cv_status ADD VALUE IF NOT EXISTS 'interviewed';
ALTER TYPE cv_status ADD VALUE IF NOT EXISTS 'not_selected';

-- Create recruiter_actions table for audit trail
CREATE TABLE public.recruiter_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id UUID NOT NULL REFERENCES public.cv_uploads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Organizations can view own data"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create organization"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Organization members can update own organization"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Members can view own memberships"
  ON public.organization_members FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Anyone can create membership"
  ON public.organization_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for cv_assignments
CREATE POLICY "Organizations can view assigned CVs"
  ON public.cv_assignments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for recruiter_actions
CREATE POLICY "Recruiters can create actions"
  ON public.recruiter_actions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizations can view own actions"
  ON public.recruiter_actions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update cv_uploads RLS to allow organizations to view assigned CVs
CREATE POLICY "Organizations can view assigned CVs"
  ON public.cv_uploads FOR SELECT
  USING (
    id IN (
      SELECT cv_id FROM public.cv_assignments
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organizations can update assigned CVs"
  ON public.cv_uploads FOR UPDATE
  USING (
    id IN (
      SELECT cv_id FROM public.cv_assignments
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_cv_assignments_org_id ON public.cv_assignments(organization_id);
CREATE INDEX idx_cv_assignments_cv_id ON public.cv_assignments(cv_id);
CREATE INDEX idx_recruiter_actions_org_id ON public.recruiter_actions(organization_id);
CREATE INDEX idx_recruiter_actions_cv_id ON public.recruiter_actions(cv_id);