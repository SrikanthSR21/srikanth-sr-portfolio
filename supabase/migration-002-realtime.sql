-- Run ONCE in Supabase → SQL Editor. Lets admin changes appear instantly on open visitor tabs.
alter publication supabase_realtime add table public.site_content, public.projects, public.ad_campaigns, public.experience;
