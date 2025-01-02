-- Função para incrementar curtidas
CREATE OR REPLACE FUNCTION increment_discussion_likes(discussion_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE publicacao_comunidade
    SET curtidas = COALESCE(curtidas, 0) + 1
    WHERE id = discussion_id;
END;
$$ LANGUAGE plpgsql;

-- Função para decrementar curtidas
CREATE OR REPLACE FUNCTION decrement_discussion_likes(discussion_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE publicacao_comunidade
    SET curtidas = GREATEST(COALESCE(curtidas, 0) - 1, 0)
    WHERE id = discussion_id;
END;
$$ LANGUAGE plpgsql;
