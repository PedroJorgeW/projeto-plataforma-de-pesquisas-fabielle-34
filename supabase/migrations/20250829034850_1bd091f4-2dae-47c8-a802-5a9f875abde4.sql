-- Remove senha_hash functionality as Supabase Auth handles passwords
DROP FUNCTION IF EXISTS public.update_admin_user_profile(text, text);

-- Create simplified admin profile update function without password handling
CREATE OR REPLACE FUNCTION public.update_admin_user_profile(new_nome text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update only the nome field
  UPDATE public.admin_users 
  SET 
    nome = new_nome,
    updated_at = now()
  WHERE user_id = auth.uid();
  
  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found or unauthorized';
  END IF;
END;
$function$;

-- Remove senha_hash column from admin_users table as it's no longer needed
ALTER TABLE public.admin_users DROP COLUMN IF EXISTS senha_hash;