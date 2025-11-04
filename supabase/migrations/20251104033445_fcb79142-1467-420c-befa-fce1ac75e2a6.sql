-- Create public view for themes of active forms
create or replace view public.public_form_themes as
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

-- Grant read access to anon and authenticated roles
grant select on public.public_form_themes to anon, authenticated;