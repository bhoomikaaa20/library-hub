-- Create a function to manually insert user roles (for admin setup only)
CREATE OR REPLACE FUNCTION public.insert_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users (will be controlled by application logic)
GRANT EXECUTE ON FUNCTION public.insert_user_role TO authenticated;