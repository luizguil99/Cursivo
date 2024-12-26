-- Criar nova tabela de publicações da comunidade
CREATE TABLE IF NOT EXISTS "public"."publicacao_comunidade" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    "titulo" text NOT NULL,
    "conteudo" text NOT NULL,
    "usuario_id" uuid NOT NULL REFERENCES "public"."perfis"("id") ON DELETE CASCADE,
    "curtidas" integer DEFAULT 0,
    "comentarios_count" integer DEFAULT 0,
    "criado_em" timestamp with time zone DEFAULT now(),
    "atualizado_em" timestamp with time zone DEFAULT now()
);

-- Criar nova tabela de comentários da comunidade
CREATE TABLE IF NOT EXISTS "public"."comentarios_comunidade" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    "publicacao_id" uuid NOT NULL REFERENCES "public"."publicacao_comunidade"("id") ON DELETE CASCADE,
    "usuario_id" uuid NOT NULL REFERENCES "public"."perfis"("id") ON DELETE CASCADE,
    "conteudo" text NOT NULL,
    "curtidas" integer DEFAULT 0,
    "criado_em" timestamp with time zone DEFAULT now(),
    "atualizado_em" timestamp with time zone DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "idx_publicacao_usuario" ON "public"."publicacao_comunidade"("usuario_id");
CREATE INDEX IF NOT EXISTS "idx_comentario_publicacao" ON "public"."comentarios_comunidade"("publicacao_id");
CREATE INDEX IF NOT EXISTS "idx_comentario_usuario" ON "public"."comentarios_comunidade"("usuario_id");

-- Habilitar RLS
ALTER TABLE "public"."publicacao_comunidade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."comentarios_comunidade" ENABLE ROW LEVEL SECURITY;

-- Políticas para publicações
CREATE POLICY "Todos podem ver publicações"
    ON "public"."publicacao_comunidade"
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários podem criar publicações"
    ON "public"."publicacao_comunidade"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem editar suas próprias publicações"
    ON "public"."publicacao_comunidade"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar suas próprias publicações"
    ON "public"."publicacao_comunidade"
    FOR DELETE
    TO authenticated
    USING (auth.uid() = usuario_id);

-- Políticas para comentários
CREATE POLICY "Todos podem ver comentários"
    ON "public"."comentarios_comunidade"
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários podem criar comentários"
    ON "public"."comentarios_comunidade"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem editar seus próprios comentários"
    ON "public"."comentarios_comunidade"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários"
    ON "public"."comentarios_comunidade"
    FOR DELETE
    TO authenticated
    USING (auth.uid() = usuario_id);
