-- Remover as foreign keys adicionadas
ALTER TABLE "public"."discussions"
DROP CONSTRAINT IF EXISTS "fk_discussions_user";

ALTER TABLE "public"."discussion_comments"
DROP CONSTRAINT IF EXISTS "fk_comments_user";

ALTER TABLE "public"."discussion_comments"
DROP CONSTRAINT IF EXISTS "fk_comments_discussion";
