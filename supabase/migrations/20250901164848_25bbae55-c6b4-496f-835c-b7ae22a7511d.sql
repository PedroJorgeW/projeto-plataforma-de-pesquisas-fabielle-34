-- Fix security vulnerability: Enable RLS on view_responses_export
-- This view contains sensitive survey response data and should only be accessible to admin users

-- Enable Row Level Security on the view_responses_export table
ALTER TABLE view_responses_export ENABLE ROW LEVEL SECURITY;

-- Create policy to restrict access to admin users only
CREATE POLICY "Only admins can view response exports"
ON view_responses_export
FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Ensure no public access is allowed
-- (RLS is now enabled, so only authenticated users with admin privileges can access)