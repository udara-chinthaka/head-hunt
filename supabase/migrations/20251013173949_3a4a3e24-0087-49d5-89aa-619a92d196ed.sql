-- Grant admin role to all three users
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Grant admin to ucexperiment360@gmail.com
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'ucexperiment360@gmail.com' LIMIT 1;
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- Grant admin to udarachinthaka135@gmail.com
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'udarachinthaka135@gmail.com' LIMIT 1;
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- Grant admin to admin@headhunt.com if exists
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@headhunt.com' LIMIT 1;
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;