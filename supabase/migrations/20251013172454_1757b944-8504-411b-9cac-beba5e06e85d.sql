-- Grant admin role to existing users and setup for easy admin access
-- This will allow you to easily grant admin role to any user

-- First, grant admin role to rapidminds99@gmail.com if the user exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get user ID for rapidminds99@gmail.com from auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'rapidminds99@gmail.com'
  LIMIT 1;
  
  -- If user exists, grant admin role (insert only if not already exists)
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Create a helper function to easily grant admin role to any user by email
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = _email
  LIMIT 1;
  
  -- If user doesn't exist, return false
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Grant admin to admin@headhunt.com if it exists (for the test admin account)
DO $$
DECLARE
  test_admin_id uuid;
BEGIN
  SELECT id INTO test_admin_id 
  FROM auth.users 
  WHERE email = 'admin@headhunt.com'
  LIMIT 1;
  
  IF test_admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (test_admin_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;