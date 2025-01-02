-- Criar tabela de notificações
create table if not exists public.notificacoes (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    message text not null,
    type text default 'info',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    read_by uuid[] default array[]::uuid[],
    deleted_at timestamp with time zone
);

-- Adicionar políticas RLS
alter table public.notificacoes enable row level security;

-- Política para permitir leitura por todos os usuários autenticados
create policy "Permitir leitura de notificações para usuários autenticados"
    on public.notificacoes
    for select
    to authenticated
    using (deleted_at is null);

-- Política para permitir inserção apenas por administradores
create policy "Permitir inserção de notificações apenas por administradores"
    on public.notificacoes
    for insert
    to authenticated
    with check (
        exists (
            select 1
            from public.perfis
            where perfis.id = auth.uid()
            and perfis.papel = 'admin'
        )
    );

-- Política para permitir atualização apenas por administradores
create policy "Permitir atualização de notificações apenas por administradores"
    on public.notificacoes
    for update
    to authenticated
    using (
        exists (
            select 1
            from public.perfis
            where perfis.id = auth.uid()
            and perfis.papel = 'admin'
        )
    );

-- Política para permitir exclusão apenas por administradores
create policy "Permitir exclusão de notificações apenas por administradores"
    on public.notificacoes
    for delete
    to authenticated
    using (
        exists (
            select 1
            from public.perfis
            where perfis.id = auth.uid()
            and perfis.papel = 'admin'
        )
    );

-- Adicionar índices para melhor performance
create index if not exists notificacoes_created_at_idx on public.notificacoes (created_at desc);
create index if not exists notificacoes_deleted_at_idx on public.notificacoes (deleted_at);

-- Comentários para documentação
comment on table public.notificacoes is 'Tabela para armazenar notificações do sistema';
comment on column public.notificacoes.id is 'Identificador único da notificação';
comment on column public.notificacoes.title is 'Título da notificação';
comment on column public.notificacoes.message is 'Mensagem da notificação';
comment on column public.notificacoes.type is 'Tipo da notificação (info, warning, success, etc)';
comment on column public.notificacoes.created_at is 'Data e hora de criação da notificação';
comment on column public.notificacoes.read_by is 'Array de IDs dos usuários que já leram a notificação';
comment on column public.notificacoes.deleted_at is 'Data e hora de exclusão da notificação (soft delete)';
