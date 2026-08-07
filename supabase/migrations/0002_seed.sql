-- ============================================================================
-- Seed data — minimal set to make the student profile form usable.
-- Expand the countries list as you add launch markets; the schema supports
-- any country, this just seeds a sensible starting set.
-- ============================================================================

insert into countries (iso_code, name) values
  ('US', 'United States'), ('CA', 'Canada'), ('GB', 'United Kingdom'),
  ('AU', 'Australia'), ('IN', 'India'), ('NG', 'Nigeria'), ('PK', 'Pakistan'),
  ('PH', 'Philippines'), ('DE', 'Germany'), ('FR', 'France'), ('BR', 'Brazil'),
  ('MX', 'Mexico'), ('CN', 'China'), ('KE', 'Kenya'), ('ZA', 'South Africa'),
  ('EG', 'Egypt'), ('ID', 'Indonesia'), ('VN', 'Vietnam'), ('BD', 'Bangladesh'),
  ('JP', 'Japan'), ('KR', 'South Korea'), ('ES', 'Spain'), ('IT', 'Italy'),
  ('NL', 'Netherlands'), ('SG', 'Singapore'), ('AE', 'United Arab Emirates'),
  ('NZ', 'New Zealand'), ('IE', 'Ireland'), ('GH', 'Ghana'), ('OT', 'Other')
on conflict (iso_code) do nothing;

-- US states
insert into provinces (country_id, name, code)
select c.id, s.name, s.code
from countries c
cross join (values
  ('Alabama','AL'),('Alaska','AK'),('Arizona','AZ'),('Arkansas','AR'),('California','CA'),
  ('Colorado','CO'),('Connecticut','CT'),('Delaware','DE'),('Florida','FL'),('Georgia','GA'),
  ('Hawaii','HI'),('Idaho','ID'),('Illinois','IL'),('Indiana','IN'),('Iowa','IA'),
  ('Kansas','KS'),('Kentucky','KY'),('Louisiana','LA'),('Maine','ME'),('Maryland','MD'),
  ('Massachusetts','MA'),('Michigan','MI'),('Minnesota','MN'),('Mississippi','MS'),('Missouri','MO'),
  ('Montana','MT'),('Nebraska','NE'),('Nevada','NV'),('New Hampshire','NH'),('New Jersey','NJ'),
  ('New Mexico','NM'),('New York','NY'),('North Carolina','NC'),('North Dakota','ND'),('Ohio','OH'),
  ('Oklahoma','OK'),('Oregon','OR'),('Pennsylvania','PA'),('Rhode Island','RI'),('South Carolina','SC'),
  ('South Dakota','SD'),('Tennessee','TN'),('Texas','TX'),('Utah','UT'),('Vermont','VT'),
  ('Virginia','VA'),('Washington','WA'),('West Virginia','WV'),('Wisconsin','WI'),('Wyoming','WY'),
  ('District of Columbia','DC')
) as s(name, code)
where c.iso_code = 'US'
on conflict (country_id, name) do nothing;

-- Canadian provinces/territories
insert into provinces (country_id, name, code)
select c.id, p.name, p.code
from countries c
cross join (values
  ('Ontario','ON'),('Quebec','QC'),('British Columbia','BC'),('Alberta','AB'),
  ('Manitoba','MB'),('Saskatchewan','SK'),('Nova Scotia','NS'),('New Brunswick','NB'),
  ('Newfoundland and Labrador','NL'),('Prince Edward Island','PE'),
  ('Northwest Territories','NT'),('Yukon','YT'),('Nunavut','NU')
) as p(name, code)
where c.iso_code = 'CA'
on conflict (country_id, name) do nothing;

-- Starter STEM skills — the form lets students add more; this just seeds
-- the autocomplete so it isn't empty on day one.
insert into skills (name, category) values
  ('Python', 'Programming'), ('JavaScript', 'Programming'), ('Java', 'Programming'),
  ('C++', 'Programming'), ('MATLAB', 'Programming'), ('R', 'Programming'),
  ('SQL', 'Programming'), ('Machine Learning', 'AI/Data'), ('Data Analysis', 'AI/Data'),
  ('Statistics', 'AI/Data'), ('CAD Design', 'Engineering'), ('Circuit Design', 'Engineering'),
  ('3D Printing', 'Engineering'), ('Robotics', 'Engineering'), ('Arduino', 'Engineering'),
  ('Laboratory Techniques', 'Research'), ('Scientific Writing', 'Research'),
  ('Public Speaking', 'Soft Skills'), ('Leadership', 'Soft Skills'), ('Project Management', 'Soft Skills'),
  ('Biology', 'Science'), ('Chemistry', 'Science'), ('Physics', 'Science'),
  ('Environmental Science', 'Science'), ('Web Development', 'Programming'),
  ('Mobile App Development', 'Programming'), ('Cybersecurity', 'Programming'),
  ('Video Editing', 'Creative'), ('Graphic Design', 'Creative'), ('Excel/Spreadsheets', 'Soft Skills')
on conflict (name) do nothing;
