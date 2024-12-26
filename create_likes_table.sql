-- Criar tabela de curtidas
CREATE TABLE IF NOT EXISTS "public"."publicacoes_curtidas" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "publicacao_id" uuid NOT NULL,
    "usuario_id" uuid NOT NULL,
    "criado_em" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "publicacoes_curtidas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "publicacoes_curtidas_publicacao_id_fkey" FOREIGN KEY ("publicacao_id") REFERENCES "public"."publicacao_comunidade"("id") ON DELETE CASCADE,
    CONSTRAINT "publicacoes_curtidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."perfis"("id") ON DELETE CASCADE,
    CONSTRAINT "unique_publicacao_curtida" UNIQUE ("publicacao_id", "usuario_id")
);

-- Atualizar funções de incremento/decremento
CREATE OR REPLACE FUNCTION increment_publicacao_curtidas(publicacao_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE publicacao_comunidade
    SET curtidas = COALESCE(curtidas, 0) + 1
    WHERE id = publicacao_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_publicacao_curtidas(publicacao_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE publicacao_comunidade
    SET curtidas = GREATEST(COALESCE(curtidas, 0) - 1, 0)
    WHERE id = publicacao_id;
END;
$$ LANGUAGE plpgsql;
