-- Fix remaining SECURITY DEFINER views
-- Check which views still have SECURITY DEFINER
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%security definer%';