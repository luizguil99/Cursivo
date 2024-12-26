-- Adiciona restrição única para evitar likes duplicados
ALTER TABLE IF EXISTS "public"."discussion_likes"
ADD CONSTRAINT "unique_discussion_like" UNIQUE ("discussion_id", "user_id");
