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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
RETURNS void AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION confirm_user TO authenticated;
