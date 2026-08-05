-- schools and skills are lookup tables that students populate as they sign
-- up (autocomplete-or-create in the profile form). Public read so anyone
-- can search; authenticated-only write so it's not open to anonymous spam.

alter table schools enable row level security;
alter table skills enable row level security;
alter table student_skills enable row level security;

create policy schools_public_read on schools for select using (true);
create policy schools_authenticated_insert on schools for insert
  to authenticated with check (true);

create policy skills_public_read on skills for select using (true);
create policy skills_authenticated_insert on skills for insert
  to authenticated with check (true);

create policy student_skills_owner on student_skills for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
