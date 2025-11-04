-- Drop existing views and recreate without SECURITY DEFINER
drop view if exists public.public_active_forms;
drop view if exists public.public_form_questions;
drop view if exists public.public_form_themes;

-- Create public view for active forms (without SECURITY DEFINER)
create view public.public_active_forms as
select 
  id,
  title,
  description,
  form_type,
  end_date,
  created_at
from public.forms
where status = 'ativo' and (end_date is null or end_date >= CURRENT_DATE);

grant select on public.public_active_forms to anon, authenticated;

-- Create public view for questions of active forms (without SECURITY DEFINER)
create view public.public_form_questions as
select 
  q.id,
  q.form_id,
  q.question_text,
  q.question_type,
  q.ordem,
  q.is_required,
  q.custom_options,
  q.theme_id
from public.questions q
join public.forms f on f.id = q.form_id
where f.status = 'ativo' and (f.end_date is null or f.end_date >= CURRENT_DATE);

grant select on public.public_form_questions to anon, authenticated;

-- Create public view for themes of active forms (without SECURITY DEFINER)
create view public.public_form_themes as
select 
  t.id,
  t.form_id,
  t.title,
  t.description,
  t.ordem,
  t.created_at
from public.form_themes t
join public.forms f on f.id = t.form_id
where f.status = 'ativo' and (f.end_date is null or f.end_date >= CURRENT_DATE);

grant select on public.public_form_themes to anon, authenticated;