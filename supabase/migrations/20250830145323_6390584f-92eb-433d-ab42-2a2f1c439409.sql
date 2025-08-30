-- Ensure all public reporting views use SECURITY INVOKER semantics and are security barriers
-- This prevents privilege escalation by enforcing caller permissions and safe predicate pushdown

-- 1) Apply to view_active_forms (public)
ALTER VIEW public.view_active_forms SET (security_invoker = true);
ALTER VIEW public.view_active_forms SET (security_barrier = true);

-- 2) Apply to view_form_summary (authenticated-only via underlying table RLS)
ALTER VIEW public.view_form_summary SET (security_invoker = true);
ALTER VIEW public.view_form_summary SET (security_barrier = true);

-- 3) Apply to view_question_summary (authenticated-only via underlying table RLS)
ALTER VIEW public.view_question_summary SET (security_invoker = true);
ALTER VIEW public.view_question_summary SET (security_barrier = true);

-- 4) Apply to view_responses_export (authenticated-only via underlying table RLS)
ALTER VIEW public.view_responses_export SET (security_invoker = true);
ALTER VIEW public.view_responses_export SET (security_barrier = true);

-- Verify view options
SELECT
  n.nspname as schema,
  c.relname as view,
  obj_description(c.oid, 'pg_class') as description
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v' AND n.nspname = 'public'
ORDER BY 1,2;