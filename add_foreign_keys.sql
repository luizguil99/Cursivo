-- Adicionar chave estrangeira na tabela discussions
ALTER TABLE "public"."discussions"
ADD CONSTRAINT "fk_discussions_user"
FOREIGN KEY ("user_id") REFERENCES "public"."perfis"("id")
ON DELETE CASCADE;

-- Adicionar chave estrangeira na tabela discussion_comments
ALTER TABLE "public"."discussion_comments"
ADD CONSTRAINT "fk_comments_user"
FOREIGN KEY ("user_id") REFERENCES "public"."perfis"("id")
ON DELETE CASCADE;

-- Adicionar chave estrangeira para relacionar comentários com discussões
ALTER TABLE "public"."discussion_comments"
ADD CONSTRAINT "fk_comments_discussion"
FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id")
ON DELETE CASCADE;
