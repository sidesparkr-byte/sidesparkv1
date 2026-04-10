-- Extend looking_for_requests statuses for admin workflow.

alter table public.looking_for_requests
drop constraint if exists looking_for_requests_status_chk;

alter table public.looking_for_requests
add constraint looking_for_requests_status_chk
check (status in ('open', 'reviewed', 'fulfilled', 'archived'));

