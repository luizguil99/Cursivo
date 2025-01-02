-- Criar tabela de mensagens do chat
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references perfis(id) on delete cascade not null,
  message text not null,
  attachment_url text,
  attachment_type text,
  attachment_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table chat_messages enable row level security;

-- Criar política para leitura (todos podem ler)
create policy "Todos podem ler mensagens do chat"
  on chat_messages for select
  using (true);

-- Criar política para inserção (usuários autenticados podem enviar mensagens)
create policy "Usuários autenticados podem enviar mensagens"
  on chat_messages for insert
  with check (auth.role() = 'authenticated');

-- Criar índices para melhor performance
create index if not exists chat_messages_user_id_idx on chat_messages(user_id);
create index if not exists chat_messages_created_at_idx on chat_messages(created_at desc);

-- Criar função para obter informações do usuário junto com a mensagem
create or replace function get_user_info(message_row chat_messages)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'nome', raw_user_meta_data->>'nome',
    'avatar_url', raw_user_meta_data->>'avatar_url'
  )
  from auth.users u
  where u.id = message_row.user_id;
$$;
