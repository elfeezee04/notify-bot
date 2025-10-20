-- Insert admin user role
-- Note: You'll need to manually create the user account via Supabase Auth with:
-- Email: admin@example.com
-- Password: admin123
-- Then get the user_id and run this insert

-- For now, we'll create a SQL function to help set up the admin
CREATE OR REPLACE FUNCTION setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user exists by looking for user with metadata
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@example.com'
  LIMIT 1;
  
  -- If admin user exists, ensure they have admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;