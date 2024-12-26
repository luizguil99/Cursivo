-- Criar view para publicações com dados do usuário
CREATE OR REPLACE VIEW "public"."view_publicacoes_comunidade" AS
SELECT 
    p.id,
    p.titulo,
    p.conteudo,
    p.usuario_id,
    p.curtidas,
    p.comentarios_count,
    p.criado_em,
    p.atualizado_em,
    u.nome as nome_usuario,
    u.user_metadata
FROM "public"."publicacao_comunidade" p
JOIN "public"."perfis" u ON p.usuario_id = u.id;

-- Criar view para comentários com dados do usuário
CREATE OR REPLACE VIEW "public"."view_comentarios_comunidade" AS
SELECT 
    c.id,
    c.publicacao_id,
    c.usuario_id,
    c.conteudo,
    c.curtidas,
    c.criado_em,
    c.atualizado_em,
    u.nome as nome_usuario,
    u.user_metadata
FROM "public"."comentarios_comunidade" c
JOIN "public"."perfis" u ON c.usuario_id = u.id;
