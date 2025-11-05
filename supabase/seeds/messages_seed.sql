insert into public.messages (conversation_id, sender_id, text)
select c.id, c.traveler_id, 'Добро пожаловать в чат!'
from public.conversations c
where not exists (
  select 1
  from public.messages m
  where m.conversation_id = c.id
)
limit 1;
