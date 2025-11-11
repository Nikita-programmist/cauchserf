insert into public.messages (room_id, user_id, content)
select rm.room_id, rm.user_id, 'Добро пожаловать в чат!'
from public.room_members rm
where not exists (
  select 1
  from public.messages m
  where m.room_id = rm.room_id
)
limit 1;
