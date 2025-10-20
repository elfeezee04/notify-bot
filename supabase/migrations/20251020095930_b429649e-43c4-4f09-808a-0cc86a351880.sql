-- Create a secure function to set up admin role that bypasses RLS
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove any existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_admin_role(uuid) TO authenticated;