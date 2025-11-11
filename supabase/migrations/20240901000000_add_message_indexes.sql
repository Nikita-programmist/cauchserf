create index if not exists messages_conversation_created_desc_idx
  on public.messages (conversation_id, created_at desc);

create index if not exists messages_sender_created_desc_idx
  on public.messages (sender_id, created_at desc);
