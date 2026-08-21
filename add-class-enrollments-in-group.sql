-- Not every enrolled student is a group-tutoring student (some are 1-on-1
-- or otherwise not part of the Tue/Sat/Sun sessions). Lets the teacher
-- exclude a student's School Topics data from the Planning page's counts,
-- calendar, and AI weekly plan for a given class — reversible, nothing is
-- deleted. Also exempts that student from the School Topics login gate for
-- that class, since there's no reason to ask them.
alter table class_enrollments add column if not exists in_group boolean not null default true;
