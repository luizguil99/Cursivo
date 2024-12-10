Cursivo é uma plataforma de venda de cursos online com foco em escolas.
A plataforma é feita em Vite/React e Javascript, utilizando o framework Shadcn UI e tailwind Css.
Anteriormente a plataforma utilizava o Firebase para armazenar os dados dos cursos e do usuario.
Agora a plataforma utiliza o Supabase para armazenar os dados.
Aqui está um guia dos componenses utilizados na plataforma:
AdminRoute.jsx: Rota específica para administradores
PrivateRoute.jsx: Rota para usuários autenticados
ProtectedRoute.jsx: Rota com proteção geral
Componentes de UI (Interface do Usuário):
Componentes básicos:
button.jsx: Botões customizados
input.jsx: Campos de entrada
textarea.jsx: Áreas de texto
checkbox.jsx: Caixas de seleção
select.jsx: Menus de seleção
Componentes de layout:
card.jsx: Cards para exibição de conteúdo
dialog.jsx: Janelas de diálogo/modais
accordion.jsx: Painéis expansíveis
scroll-area.jsx: Áreas com rolagem
Componentes de feedback:
progress.jsx: Barras de progresso
toast.jsx: Notificações temporárias
skeleton.jsx: Placeholders de carregamento
Componentes de visualização de dados:
chart.jsx: Gráficos genéricos
line-chart.jsx: Gráficos de linha
pie-chart.jsx: Gráficos de pizza
table.jsx: Tabelas de dados
Componentes de Cursos:
Componentes principais:
CourseContent.jsx: Exibe o conteúdo do curso
CourseList.jsx: Lista de cursos disponíveis
CourseListItem.jsx: Item individual da lista de cursos
ModulesSidebar.jsx: Barra lateral com módulos do curso
ProgressBar.jsx: Barra de progresso do curso
Componentes de IA:
AIChat.jsx: Componente principal do chat com IA
AIChatModal.jsx: Modal do chat com IA
AIChatWrapper.jsx: Wrapper para o chat com IA
FloatingAIChat.jsx: Chat flutuante com IA
FloatingChatButton.jsx: Botão flutuante para abrir o chat
Componentes de prática:
PracticeModal.jsx: Modal para exercícios práticos
Componentes de Layout:
TopNav.jsx: Navegação superior
layouts/: Diretório com layouts base da aplicação
Componentes de Agenda e Guia de Estudos:
Diretório schedule/: Componentes relacionados ao agendamento
Diretório study-guide/: Componentes do guia de estudos
Componentes de Tema:
theme-provider.jsx: Provedor de tema da aplicação
theme-toggle.jsx: Alternador de tema (claro/escuro)
Componentes da Comunidade:
Community.jsx: Página principal da comunidade que exibe:

- Discussões Recentes
- Membros Ativos
- Eventos

## Estrutura do Banco de Dados (Supabase)

1. Tabela discussions:

   - Armazena discussões criadas pelos usuários
   - Campos: id, title, content, user_id, created_at, updated_at, likes_count, comments_count

2. Tabela discussion_comments:

   - Armazena comentários em discussões
   - Campos: id, discussion_id, user_id, content, created_at, updated_at, likes_count

3. Tabela events:

   - Armazena eventos da comunidade
   - Campos: id, title, description, start_date, end_date, location, is_online, meeting_link, created_by, created_at, updated_at, max_participants, current_participants

4. Tabela event_participants:

   - Registra participantes dos eventos
   - Campos: id, event_id, user_id, registered_at

5. Tabela user_status:
   - Controla status online dos usuários
   - Campos: user_id, is_online, last_seen, status_message

## Estrutura do Banco de Dados - Comunidade

### Tabelas da Comunidade

#### discussions

```sql
create table if not exists public.discussions (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_metadata jsonb
);

-- Habilita RLS
alter table public.discussions enable row level security;

-- Políticas
create policy "Enable read access for all users" on public.discussions
  for select using (true);

create policy "Enable insert access for authenticated users" on public.discussions
  for insert with check (auth.uid() = user_id);

create policy "Enable insert with user_metadata" on public.discussions
  for insert with check (
    auth.uid() = user_id AND
    (user_metadata->>'email')::text = auth.jwt()->>'email'
  );
```

#### discussion_comments

```sql
create table if not exists public.discussion_comments (
  id uuid default uuid_generate_v4() primary key,
  discussion_id uuid references public.discussions(id) on delete cascade not null,
  content text not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### discussion_likes

```sql
create table if not exists public.discussion_likes (
  id uuid default uuid_generate_v4() primary key,
  discussion_id uuid references public.discussions(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (discussion_id, user_id)
);
```

### Políticas de Segurança (RLS)

Todas as tabelas da comunidade têm Row Level Security (RLS) habilitado com as seguintes políticas:

#### discussions

```sql
-- Habilita RLS
alter table public.discussions enable row level security;

-- Políticas
create policy "Enable read access for all users" on public.discussions
  for select using (true);

create policy "Enable insert access for authenticated users" on public.discussions
  for insert with check (auth.uid() = user_id);

create policy "Enable insert with user_metadata" on public.discussions
  for insert with check (
    auth.uid() = user_id AND
    (user_metadata->>'email')::text = auth.jwt()->>'email'
  );
```

#### discussion_comments

```sql
-- Habilita RLS
alter table public.discussion_comments enable row level security;

-- Políticas
create policy "Enable read access for all users" on public.discussion_comments
  for select using (true);

create policy "Enable insert access for authenticated users" on public.discussion_comments
  for insert with check (auth.uid() = user_id);
```

#### discussion_likes

```sql
-- Habilita RLS
alter table public.discussion_likes enable row level security;

-- Políticas
create policy "Enable read access for all users" on public.discussion_likes
  for select using (true);

create policy "Enable insert/delete access for authenticated users" on public.discussion_likes
  for all using (auth.uid() = user_id);
```

### Stored Procedures da Comunidade

#### Contadores de Comentários

```sql
-- Função para incrementar contador de comentários
create or replace function increment_comments_count(discussion_id uuid)
returns void as $$
begin
  update discussions
  set comments_count = comments_count + 1
  where id = discussion_id;
end;
$$ language plpgsql security definer;

-- Função para decrementar contador de comentários
create or replace function decrement_comments_count(discussion_id uuid)
returns void as $$
begin
  update discussions
  set comments_count = greatest(0, comments_count - 1)
  where id = discussion_id;
end;
$$ language plpgsql security definer;
```

#### Sistema de Likes

```sql
-- Função para alternar likes em discussões
create or replace function toggle_discussion_like(p_discussion_id uuid, p_user_id uuid)
returns void as $$
declare
  like_exists boolean;
begin
  -- Verifica se o like existe
  select exists(
    select 1 from discussion_likes
    where discussion_id = p_discussion_id and user_id = p_user_id
  ) into like_exists;

  if like_exists then
    -- Remove o like
    delete from discussion_likes
    where discussion_id = p_discussion_id and user_id = p_user_id;

    -- Decrementa o contador de likes
    update discussions
    set likes_count = greatest(0, likes_count - 1)
    where id = p_discussion_id;
  else
    -- Adiciona o like
    insert into discussion_likes (discussion_id, user_id)
    values (p_discussion_id, p_user_id);

    -- Incrementa o contador de likes
    update discussions
    set likes_count = likes_count + 1
    where id = p_discussion_id;
  end if;
end;
$$ language plpgsql security definer;
```

#### Colunas Adicionais

```sql
-- Adiciona colunas de contadores se não existirem
alter table discussions
add column if not exists likes_count integer default 0,
add column if not exists comments_count integer default 0;
```

### Funcionalidades da Comunidade

A seção de comunidade do Cursivo oferece as seguintes funcionalidades:

1. **Discussões**

   - Criação de novas discussões com título e conteúdo
   - Suporte a rich text com formatação
   - Upload de imagens
   - Visualização em tempo real

2. **Comentários**

   - Adição de comentários em discussões
   - Contagem automática de comentários
   - Notificações de novos comentários

3. **Sistema de Likes**

   - Curtir/descurtir discussões
   - Contagem automática de likes
   - Atualização em tempo real

4. **Segurança**

   - Row Level Security (RLS) em todas as tabelas
   - Políticas de acesso baseadas em autenticação
   - Proteção contra injeção SQL

5. **Performance**
   - Stored procedures otimizadas
   - Índices automáticos em chaves primárias e estrangeiras
   - Cascade deletes para manter integridade referencial

Funcionalidades:

- Criação e participação em discussões
- Comentários em discussões
- Criação e inscrição em eventos
- Visualização de membros ativos
- Status online de usuários

Políticas de Segurança:

- Todas as tabelas têm Row Level Security (RLS) habilitada
- Usuários autenticados podem:
  - Ver todas as discussões, comentários e eventos
  - Criar novas discussões e comentários
  - Editar suas próprias discussões e comentários
  - Criar eventos e se inscrever em eventos
  - Atualizar seu próprio status

regras no supabase:
-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Tabela de perfis de usuário (extende auth.users)
CREATE TABLE perfis (
id uuid references auth.users on delete cascade,
nome text,
email text,
papel text default 'student',
status text default 'ativo',
status_plano text default 'ativo',
plano text default 'mensal',
data_inicio_plano timestamp with time zone default now(),
data_fim_plano timestamp with time zone,
ultimo_login timestamp with time zone,
criado_em timestamp with time zone default now(),
atualizado_em timestamp with time zone default now(),
primary key (id)
);

-- Criar tabela de chats
CREATE TABLE IF NOT EXISTS public.chats (
id text primary key,
usuario_id uuid references auth.users,
pergunta_id uuid,
mensagens jsonb,
mensagem text,
criado_em timestamp with time zone default now(),
atualizado_em timestamp with time zone default now()
);

-- Tabela de cursos
CREATE TABLE cursos (
id uuid default uuid_generate_v4(),
titulo text not null,
descricao text,
criado_em timestamp with time zone default now(),
atualizado_em timestamp with time zone default now(),
primary key (id)
);

-- Tabela de módulos
CREATE TABLE modulos (
id uuid default uuid_generate_v4(),
curso_id uuid references public.cursos on delete cascade,
titulo text not null,
descricao text,
ordem_indice integer,
criado_em timestamp with time zone default now(),
atualizado_em timestamp with time zone default now(),
primary key (id)
);

-- Tabela de vídeoaulas
CREATE TABLE videoaulas (
id uuid default uuid_generate_v4(),
modulo_id uuid references public.modulos on delete cascade,
titulo text not null,
descricao text,
url_video text,
ordem_indice integer,
criado_em timestamp with time zone default now(),
atualizado_em timestamp with time zone default now(),
curso_id uuid references public.cursos on delete cascade,
ordem integer,
recursos jsonb,
primary key (id)
);

-- Tabela de questões
CREATE TABLE questoes (
id uuid default uuid_generate_v4(),
assunto text,
topico text,
questao text not null,
url_imagem text,
opcoes jsonb,
resposta_correta integer,
video_solucao text,
banca_examinadora text,
criado_por uuid references auth.users,
criado_em timestamp with time zone default now(),
atualizado_em timestamp with time zone default now(),
primary key (id)
);

-- Tabela de histórico de simulados
CREATE TABLE historico_simulados (
id uuid default uuid_generate_v4(),
usuario_id uuid references auth.users,
simulado_id text,
titulo_simulado text,
respostas jsonb,
pontuacao numeric,
pontuacao_tri numeric,
finalizado_em timestamp with time zone default now(),
primary key (id)
);

-- Função auxiliar para verificar se é admin
CREATE OR REPLACE FUNCTION eh_admin() RETURNS boolean AS $$
BEGIN
RETURN (
auth.email() = 'admin@admin.com' OR
auth.email() = 'admin@cursivo.com' OR
auth.email() = 'cursivo@admin.com' OR
EXISTS (
SELECT 1 FROM perfis
WHERE id = auth.uid()
AND papel = 'admin'
)
);
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS em todas as tabelas
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videoaulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_simulados ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "Perfis são visíveis para usuários autenticados"
  ON perfis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Perfis podem ser atualizados pelo próprio usuário ou admin"
  ON perfis FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR eh_admin());

-- Políticas para cursos
CREATE POLICY "Cursos são visíveis para usuários autenticados"
  ON cursos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem modificar cursos"
  ON cursos FOR ALL
  TO authenticated
  USING (eh_admin());

-- Políticas para módulos (similar aos cursos)
CREATE POLICY "Módulos são visíveis para usuários autenticados"
  ON modulos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem modificar módulos"
  ON modulos FOR ALL
  TO authenticated
  USING (eh_admin());

-- Políticas para vídeoaulas
CREATE POLICY "Vídeoaulas são visíveis para usuários autenticados"
  ON videoaulas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem modificar vídeoaulas"
  ON videoaulas FOR ALL
  TO authenticated
  USING (eh_admin());

-- Políticas para questões
CREATE POLICY "Questões são visíveis para usuários autenticados"
  ON questoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem modificar questões"
  ON questoes FOR ALL
  TO authenticated
  USING (eh_admin());

-- Políticas para chats
CREATE POLICY "Usuários podem ver seus próprios chats"
  ON chats FOR SELECT
  TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar seus próprios chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seus próprios chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar seus próprios chats"
  ON chats FOR DELETE
  TO authenticated
  USING (auth.uid() = usuario_id);

-- Políticas para histórico de simulados
CREATE POLICY "Usuários podem ver seu próprio histórico"
  ON historico_simulados FOR SELECT
  TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar entradas no seu histórico"
  ON historico_simulados FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seu próprio histórico"
  ON historico_simulados FOR UPDATE
  TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar seu próprio histórico"
  ON historico_simulados FOR DELETE
  TO authenticated
  USING (auth.uid() = usuario_id);



-- Atualizar a função eh_admin para também verificar o campo papel
CREATE OR REPLACE FUNCTION eh_admin() RETURNS boolean AS
$$

BEGIN
RETURN (
auth.email() = 'admin@admin.com' OR
auth.email() = 'admin@cursivo.com' OR
auth.email() = 'cursivo@admin.com' OR
EXISTS (
SELECT 1 FROM perfis
WHERE id = auth.uid()
AND papel = 'admin'
)
);
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION eh_admin TO authenticated;

-- Adicionar política para permitir que admins vejam todos os dados
CREATE POLICY "Admins podem ver todos os dados"
  ON perfis FOR SELECT
  TO authenticated
  USING (eh_admin());

-- Adicionar política para permitir que admins modifiquem todos os dados
CREATE POLICY "Admins podem modificar todos os dados"
  ON perfis FOR ALL
  TO authenticated
  USING (eh_admin());

-- Adicionar políticas para INSERT em cursos, módulos e videoaulas
CREATE POLICY "Admins podem criar cursos"
  ON cursos FOR INSERT
  TO authenticated
  WITH CHECK (eh_admin());

CREATE POLICY "Admins podem criar módulos"
  ON modulos FOR INSERT
  TO authenticated
  WITH CHECK (eh_admin());

CREATE POLICY "Admins podem criar videoaulas"
  ON videoaulas FOR INSERT
  TO authenticated
  WITH CHECK (eh_admin());


-- Criar tabela de progresso do usuário
create table public.progresso_usuario (
    id uuid default uuid_generate_v4() primary key,
    usuario_id uuid references auth.users(id) on delete cascade,
    curso_id uuid references public.cursos(id) on delete cascade,
    progresso float default 0,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(usuario_id, curso_id)
);

-- Habilitar RLS
alter table public.progresso_usuario enable row level security;

-- Política para leitura: usuários só podem ver seu próprio progresso
create policy "Usuários podem ver seu próprio progresso"
    on public.progresso_usuario
    for select
    using (auth.uid() = usuario_id);

-- Política para inserção: usuários só podem inserir seu próprio progresso
create policy "Usuários podem inserir seu próprio progresso"
    on public.progresso_usuario
    for insert
    with check (auth.uid() = usuario_id);

-- Política para atualização: usuários só podem atualizar seu próprio progresso
create policy "Usuários podem atualizar seu próprio progresso"
    on public.progresso_usuario
    for update
    using (auth.uid() = usuario_id)
    with check (auth.uid() = usuario_id);

-- Política para deleção: usuários só podem deletar seu próprio progresso
create policy "Usuários podem deletar seu próprio progresso"
    on public.progresso_usuario
    for delete
    using (auth.uid() = usuario_id);

-- Função para confirmar usuário (auto-confirmar email)
CREATE OR REPLACE FUNCTION confirm_user(user_id UUID)
RETURNS void AS
$$

BEGIN
UPDATE auth.users
SET email_confirmed_at = NOW(),
updated_at = NOW()
WHERE id = user_id;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION confirm_user TO authenticated;

## Configuração do Supabase (SQL)

Cole o seguinte SQL no SQL Editor do Supabase:

```sql
-- Criar tabela de discussões
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar tabela de comentários
CREATE TABLE IF NOT EXISTS discussion_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar tabela de curtidas
CREATE TABLE IF NOT EXISTS discussion_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(discussion_id, user_id)
);

-- Função para incrementar contador de comentários
CREATE OR REPLACE FUNCTION increment_comments_count(discussion_id UUID)
RETURNS void AS
$$

BEGIN
-- A contagem é calculada automaticamente pelo número de registros
-- Não precisamos mais manter um contador separado
RETURN;
END;

$$
LANGUAGE plpgsql;

-- Função para decrementar contador de comentários
CREATE OR REPLACE FUNCTION decrement_comments_count(discussion_id UUID)
RETURNS void AS
$$

BEGIN
-- A contagem é calculada automaticamente pelo número de registros
-- Não precisamos mais manter um contador separado
RETURN;
END;

$$
LANGUAGE plpgsql;

-- Função para alternar curtida
CREATE OR REPLACE FUNCTION toggle_discussion_like(p_discussion_id UUID, p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  likes_count BIGINT
) AS
$$

DECLARE
v_exists BOOLEAN;
BEGIN
-- Verifica se já existe uma curtida
SELECT EXISTS (
SELECT 1
FROM discussion_likes
WHERE discussion_id = p_discussion_id AND user_id = p_user_id
) INTO v_exists;

IF v_exists THEN
-- Remove a curtida se existir
DELETE FROM discussion_likes
WHERE discussion_id = p_discussion_id AND user_id = p_user_id;

    RETURN QUERY
    SELECT
      TRUE as success,
      'Like removed successfully'::TEXT as message,
      (SELECT COUNT(*) FROM discussion_likes WHERE discussion_id = p_discussion_id) as likes_count;

ELSE
-- Adiciona a curtida se não existir
INSERT INTO discussion_likes (discussion_id, user_id)
VALUES (p_discussion_id, p_user_id);

    RETURN QUERY
    SELECT
      TRUE as success,
      'Like added successfully'::TEXT as message,
      (SELECT COUNT(*) FROM discussion_likes WHERE discussion_id = p_discussion_id) as likes_count;

END IF;
EXCEPTION
WHEN OTHERS THEN
RETURN QUERY
SELECT
FALSE as success,
SQLERRM as message,
0::BIGINT as likes_count;
END;

$$
LANGUAGE plpgsql;

-- Políticas de segurança (RLS)
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;

-- Política para discussões
CREATE POLICY "Discussões visíveis para todos os usuários autenticados"
ON discussions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem criar suas próprias discussões"
ON discussions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política para comentários
CREATE POLICY "Comentários visíveis para todos os usuários autenticados"
ON discussion_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem criar seus próprios comentários"
ON discussion_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política para curtidas
CREATE POLICY "Curtidas visíveis para todos os usuários autenticados"
ON discussion_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem gerenciar suas próprias curtidas"
ON discussion_likes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

Este SQL irá:
1. Criar as tabelas necessárias (discussions, discussion_comments, discussion_likes)
2. Criar as funções para gerenciar comentários e curtidas
3. Configurar as políticas de segurança (RLS)
4. Estabelecer as relações entre as tabelas

Execute este SQL no SQL Editor do Supabase para configurar corretamente o banco de dados.
$$
