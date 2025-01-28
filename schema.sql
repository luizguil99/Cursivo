SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE "public"."user_role" OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."confirm_user"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW(),
      updated_at = NOW()
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."confirm_user"("user_id" "uuid") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."decrement_comments_count"("discussion_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update discussions
  set comments_count = greatest(0, comments_count - 1)
  where id = discussion_id;
end;
$$;


ALTER FUNCTION "public"."decrement_comments_count"("discussion_id" "uuid") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."decrement_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update discussions
  set likes_count = likes_count - 1
  where id = OLD.discussion_id;
  return OLD;
end;
$$;


ALTER FUNCTION "public"."decrement_likes_count"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."eh_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."eh_admin"() OWNER TO "supabase_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."chat_messages" OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."get_user_info"("message_row" "public"."chat_messages") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'nome', raw_user_meta_data->>'nome',
    'avatar_url', raw_user_meta_data->>'avatar_url'
  )
  from auth.users u
  where u.id = message_row.user_id;
$$;


ALTER FUNCTION "public"."get_user_info"("message_row" "public"."chat_messages") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."increment_comments_count"("discussion_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update discussions
  set comments_count = comments_count + 1
  where id = discussion_id;
end;
$$;


ALTER FUNCTION "public"."increment_comments_count"("discussion_id" "uuid") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."increment_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update discussions
  set likes_count = likes_count + 1
  where id = NEW.discussion_id;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."increment_likes_count"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    auth.email() = 'admin@admin.com' OR
    auth.email() = 'admin@cursivo.com' OR
    auth.email() = 'cursivo@admin.com'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."toggle_discussion_like"("p_discussion_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from discussion_likes
    where discussion_id = p_discussion_id and user_id = p_user_id
  ) into v_exists;

  if v_exists then
    delete from discussion_likes
    where discussion_id = p_discussion_id and user_id = p_user_id;
  else
    insert into discussion_likes (discussion_id, user_id)
    values (p_discussion_id, p_user_id);
  end if;
end;
$$;


ALTER FUNCTION "public"."toggle_discussion_like"("p_discussion_id" "uuid", "p_user_id" "uuid") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."update_counters"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'discussion_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE discussions 
            SET comments_count = comments_count + 1
            WHERE id = NEW.discussion_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE discussions 
            SET comments_count = comments_count - 1
            WHERE id = OLD.discussion_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'event_participants' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE events 
            SET current_participants = current_participants + 1
            WHERE id = NEW.event_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE events 
            SET current_participants = current_participants - 1
            WHERE id = OLD.event_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_counters"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."aulas_concluidas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "videoaula_id" "uuid",
    "concluido_em" timestamp with time zone,
    "tempo_assistido" integer
);


ALTER TABLE "public"."aulas_concluidas" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" "text" NOT NULL,
    "usuario_id" "uuid",
    "pergunta_id" "uuid",
    "mensagens" "jsonb",
    "mensagem" "text",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "atualizado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chats" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."cursos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "atualizado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cursos" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."discussion_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "likes_count" integer DEFAULT 0,
    "user_metadata" "jsonb"
);


ALTER TABLE "public"."discussion_comments" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."discussion_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "discussion_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."discussion_likes" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."discussions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "user_metadata" "jsonb"
);


ALTER TABLE "public"."discussions" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."event_participants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_participants" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "location" "text",
    "is_online" boolean DEFAULT true,
    "meeting_link" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "max_participants" integer,
    "current_participants" integer DEFAULT 0
);


ALTER TABLE "public"."events" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."historico_simulados" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "simulado_id" "text",
    "titulo_simulado" "text",
    "respostas" "jsonb",
    "pontuacao" numeric,
    "pontuacao_tri" numeric,
    "finalizado_em" timestamp with time zone DEFAULT "now"(),
    "questoes_totais" integer,
    "questoes_corretas" integer,
    "tempo_gasto" interval,
    "questoes_por_assunto" "jsonb",
    "questoes_por_dificuldade" "jsonb"
);


ALTER TABLE "public"."historico_simulados" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."modulos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "curso_id" "uuid",
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "ordem_indice" integer,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "atualizado_em" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."modulos" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."notificacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "read_by" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."notificacoes" OWNER TO "supabase_admin";


COMMENT ON TABLE "public"."notificacoes" IS 'Tabela para armazenar notificações do sistema';



COMMENT ON COLUMN "public"."notificacoes"."id" IS 'Identificador único da notificação';



COMMENT ON COLUMN "public"."notificacoes"."title" IS 'Título da notificação';



COMMENT ON COLUMN "public"."notificacoes"."message" IS 'Mensagem da notificação';



COMMENT ON COLUMN "public"."notificacoes"."type" IS 'Tipo da notificação (info, warning, success, etc)';



COMMENT ON COLUMN "public"."notificacoes"."created_at" IS 'Data e hora de criação da notificação';



COMMENT ON COLUMN "public"."notificacoes"."read_by" IS 'Array de IDs dos usuários que já leram a notificação';



COMMENT ON COLUMN "public"."notificacoes"."deleted_at" IS 'Data e hora de exclusão da notificação (soft delete)';



CREATE TABLE IF NOT EXISTS "public"."perfis" (
    "id" "uuid" NOT NULL,
    "nome" "text",
    "email" "text",
    "papel" "text" DEFAULT 'student'::"text",
    "status" "text" DEFAULT 'ativo'::"text",
    "status_plano" "text" DEFAULT 'ativo'::"text",
    "plano" "text" DEFAULT 'mensal'::"text",
    "data_inicio_plano" timestamp with time zone DEFAULT "now"(),
    "data_fim_plano" timestamp with time zone,
    "ultimo_login" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "atualizado_em" timestamp with time zone DEFAULT "now"()
    "user_metadata" "jsonb"
);


ALTER TABLE "public"."perfis" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."progresso_usuario" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "curso_id" "uuid",
    "progresso" double precision DEFAULT 0,
    "criado_em" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."progresso_usuario" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."questoes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assunto" "text",
    "topico" "text",
    "questao" "text" NOT NULL,
    "url_imagem" "text",
    "opcoes" "jsonb",
    "resposta_correta" integer,
    "video_solucao" "text",
    "banca_examinadora" "text",
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "atualizado_em" timestamp with time zone DEFAULT "now"()
);

-- Tabela de questões concluídas
CREATE TABLE IF NOT EXISTS "public"."questoes_concluidas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "questao_id" "uuid",
    "resposta_usuario" integer,
    "esta_correta" boolean,
    "concluido_em" timestamp with time zone DEFAULT now(),
    CONSTRAINT "questoes_concluidas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "questoes_concluidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "questoes_concluidas_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "public"."questoes"("id") ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "questoes_concluidas_usuario_id_idx" ON "public"."questoes_concluidas" ("usuario_id");
CREATE INDEX IF NOT EXISTS "questoes_concluidas_questao_id_idx" ON "public"."questoes_concluidas" ("questao_id");
CREATE INDEX IF NOT EXISTS "questoes_concluidas_concluido_em_idx" ON "public"."questoes_concluidas" ("concluido_em");

-- Comentários para documentação
COMMENT ON TABLE "public"."questoes_concluidas" IS 'Tabela para rastrear as questões concluídas pelos usuários';
COMMENT ON COLUMN "public"."questoes_concluidas"."usuario_id" IS 'ID do usuário que respondeu a questão';
COMMENT ON COLUMN "public"."questoes_concluidas"."questao_id" IS 'ID da questão respondida';
COMMENT ON COLUMN "public"."questoes_concluidas"."resposta_usuario" IS 'Resposta escolhida pelo usuário';
COMMENT ON COLUMN "public"."questoes_concluidas"."esta_correta" IS 'Indica se a resposta do usuário está correta';
COMMENT ON COLUMN "public"."questoes_concluidas"."concluido_em" IS 'Data e hora em que a questão foi respondida';


ALTER TABLE "public"."questoes" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."schedule_blocks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "day_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "duration" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "valid_day_id" CHECK (("day_id" = ANY (ARRAY['monday'::"text", 'tuesday'::"text", 'wednesday'::"text", 'thursday'::"text", 'friday'::"text", 'saturday'::"text", 'sunday'::"text"])))
);


ALTER TABLE "public"."schedule_blocks" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."study_guides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "subject" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."study_guides" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."study_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subject_id" "text" NOT NULL,
    "topic_name" "text" NOT NULL,
    "teoria" boolean DEFAULT false,
    "resumo" boolean DEFAULT false,
    "exercicio" boolean DEFAULT false,
    "revisao_status" "text" DEFAULT 'Não revisado'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."study_progress" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."study_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "order_index" integer NOT NULL,
    "study_guide_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."study_topics" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."user_status" (
    "user_id" "uuid" NOT NULL,
    "is_online" boolean DEFAULT false,
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "status_message" "text"
);


ALTER TABLE "public"."user_status" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."videoaulas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "modulo_id" "uuid",
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "url_video" "text",
    "ordem_indice" integer,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "atualizado_em" timestamp with time zone DEFAULT "now"(),
    "curso_id" "uuid",
    "ordem" integer,
    "recursos" "jsonb"
);


ALTER TABLE "public"."videoaulas" OWNER TO "supabase_admin";


ALTER TABLE ONLY "public"."aulas_concluidas"
    ADD CONSTRAINT "aulas_concluidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."aulas_concluidas"
    ADD CONSTRAINT "aulas_concluidas_usuario_id_videoaula_id_key" UNIQUE ("usuario_id", "videoaula_id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cursos"
    ADD CONSTRAINT "cursos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussion_likes"
    ADD CONSTRAINT "discussion_likes_discussion_id_user_id_key" UNIQUE ("discussion_id", "user_id");



ALTER TABLE ONLY "public"."discussion_likes"
    ADD CONSTRAINT "discussion_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_participants"
    ADD CONSTRAINT "event_participants_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_participants"
    ADD CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historico_simulados"
    ADD CONSTRAINT "historico_simulados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modulos"
    ADD CONSTRAINT "modulos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfis"
    ADD CONSTRAINT "perfis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."progresso_usuario"
    ADD CONSTRAINT "progresso_usuario_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."progresso_usuario"
    ADD CONSTRAINT "progresso_usuario_usuario_id_curso_id_key" UNIQUE ("usuario_id", "curso_id");



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_blocks"
    ADD CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_guides"
    ADD CONSTRAINT "study_guides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_progress"
    ADD CONSTRAINT "study_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_progress"
    ADD CONSTRAINT "study_progress_user_id_subject_id_topic_name_key" UNIQUE ("user_id", "subject_id", "topic_name");



ALTER TABLE ONLY "public"."study_topics"
    ADD CONSTRAINT "study_topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_status"
    ADD CONSTRAINT "user_status_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."videoaulas"
    ADD CONSTRAINT "videoaulas_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_aulas_concluidas_usuario" ON "public"."aulas_concluidas" USING "btree" ("usuario_id");



CREATE INDEX "idx_historico_simulados_finalizado" ON "public"."historico_simulados" USING "btree" ("finalizado_em");



CREATE INDEX "idx_historico_simulados_usuario" ON "public"."historico_simulados" USING "btree" ("usuario_id");



CREATE INDEX "notificacoes_created_at_idx" ON "public"."notificacoes" USING "btree" ("created_at" DESC);



CREATE INDEX "notificacoes_deleted_at_idx" ON "public"."notificacoes" USING "btree" ("deleted_at");



CREATE OR REPLACE TRIGGER "decrement_likes_count_trigger" AFTER DELETE ON "public"."discussion_likes" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_likes_count"();



CREATE OR REPLACE TRIGGER "increment_likes_count_trigger" AFTER INSERT ON "public"."discussion_likes" FOR EACH ROW EXECUTE FUNCTION "public"."increment_likes_count"();



CREATE OR REPLACE TRIGGER "update_discussion_comments_count" AFTER INSERT OR DELETE ON "public"."discussion_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_counters"();



CREATE OR REPLACE TRIGGER "update_event_participants_count" AFTER INSERT OR DELETE ON "public"."event_participants" FOR EACH ROW EXECUTE FUNCTION "public"."update_counters"();



CREATE OR REPLACE TRIGGER "update_study_guides_updated_at" BEFORE UPDATE ON "public"."study_guides" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_study_topics_updated_at" BEFORE UPDATE ON "public"."study_topics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."aulas_concluidas"
    ADD CONSTRAINT "aulas_concluidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."aulas_concluidas"
    ADD CONSTRAINT "aulas_concluidas_videoaula_id_fkey" FOREIGN KEY ("videoaula_id") REFERENCES "public"."videoaulas"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_comments"
    ADD CONSTRAINT "discussion_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."discussion_likes"
    ADD CONSTRAINT "discussion_likes_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "public"."discussions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discussion_likes"
    ADD CONSTRAINT "discussion_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."discussions"
    ADD CONSTRAINT "discussions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_participants"
    ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_participants"
    ADD CONSTRAINT "event_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."historico_simulados"
    ADD CONSTRAINT "historico_simulados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."modulos"
    ADD CONSTRAINT "modulos_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."perfis"
    ADD CONSTRAINT "perfis_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progresso_usuario"
    ADD CONSTRAINT "progresso_usuario_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progresso_usuario"
    ADD CONSTRAINT "progresso_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."schedule_blocks"
    ADD CONSTRAINT "schedule_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."study_guides"
    ADD CONSTRAINT "study_guides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."study_progress"
    ADD CONSTRAINT "study_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."study_topics"
    ADD CONSTRAINT "study_topics_study_guide_id_fkey" FOREIGN KEY ("study_guide_id") REFERENCES "public"."study_guides"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_status"
    ADD CONSTRAINT "user_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."videoaulas"
    ADD CONSTRAINT "videoaulas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."videoaulas"
    ADD CONSTRAINT "videoaulas_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "public"."modulos"("id") ON DELETE CASCADE;



CREATE POLICY "Admins podem criar cursos" ON "public"."cursos" FOR INSERT TO "authenticated" WITH CHECK ("public"."eh_admin"());



CREATE POLICY "Admins podem criar módulos" ON "public"."modulos" FOR INSERT TO "authenticated" WITH CHECK ("public"."eh_admin"());



CREATE POLICY "Admins podem criar videoaulas" ON "public"."videoaulas" FOR INSERT TO "authenticated" WITH CHECK ("public"."eh_admin"());



CREATE POLICY "Admins podem modificar todos os dados" ON "public"."perfis" TO "authenticated" USING ("public"."eh_admin"());



CREATE POLICY "Admins podem ver todos os dados" ON "public"."perfis" FOR SELECT TO "authenticated" USING ("public"."eh_admin"());



CREATE POLICY "Apenas admins podem modificar cursos" ON "public"."cursos" TO "authenticated" USING ("public"."eh_admin"());



CREATE POLICY "Apenas admins podem modificar módulos" ON "public"."modulos" TO "authenticated" USING ("public"."eh_admin"());



CREATE POLICY "Apenas admins podem modificar questões" ON "public"."questoes" TO "authenticated" USING ("public"."eh_admin"());



CREATE POLICY "Apenas admins podem modificar vídeoaulas" ON "public"."videoaulas" TO "authenticated" USING ("public"."eh_admin"());



CREATE POLICY "Comentários visíveis para todos os usuários autenticados" ON "public"."discussion_comments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Cursos são visíveis para usuários autenticados" ON "public"."cursos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Discussões visíveis para todos os usuários autenticados" ON "public"."discussions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable insert access for authenticated users" ON "public"."discussion_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."discussions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert with user_metadata" ON "public"."discussions" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (("user_metadata" ->> 'email'::"text") = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Enable insert/delete access for authenticated users" ON "public"."discussion_likes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."discussion_comments" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."discussion_likes" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."discussions" FOR SELECT USING (true);



CREATE POLICY "Eventos visíveis para todos os usuários autenticados" ON "public"."events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Inscrições visíveis para todos os usuários autenticados" ON "public"."event_participants" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Módulos são visíveis para usuários autenticados" ON "public"."modulos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Perfis podem ser atualizados pelo próprio usuário ou admin" ON "public"."perfis" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "id") OR "public"."eh_admin"()));



CREATE POLICY "Perfis são visíveis para usuários autenticados" ON "public"."perfis" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir atualização de notificações apenas por administrad" ON "public"."notificacoes" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."perfis"
  WHERE (("perfis"."id" = "auth"."uid"()) AND ("perfis"."papel" = 'admin'::"text")))));



CREATE POLICY "Permitir exclusão de notificações apenas por administradores" ON "public"."notificacoes" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."perfis"
  WHERE (("perfis"."id" = "auth"."uid"()) AND ("perfis"."papel" = 'admin'::"text")))));



CREATE POLICY "Permitir inserção de notificações apenas por administradore" ON "public"."notificacoes" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."perfis"
  WHERE (("perfis"."id" = "auth"."uid"()) AND ("perfis"."papel" = 'admin'::"text")))));



CREATE POLICY "Permitir leitura de notificações para usuários autenticados" ON "public"."notificacoes" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "Questões são visíveis para usuários autenticados" ON "public"."questoes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Status visível para todos os usuários autenticados" ON "public"."user_status" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Todos podem ler mensagens do chat" ON "public"."chat_messages" FOR SELECT USING (true);



CREATE POLICY "Usuários autenticados podem enviar mensagens" ON "public"."chat_messages" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Usuários podem adicionar apenas seu próprio histórico" ON "public"."historico_simulados" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem atualizar seu próprio histórico" ON "public"."historico_simulados" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem atualizar seu próprio progresso" ON "public"."progresso_usuario" FOR UPDATE USING (("auth"."uid"() = "usuario_id")) WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem atualizar seu próprio progresso" ON "public"."study_progress" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem atualizar seu próprio status" ON "public"."user_status" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem atualizar seus próprios blocos" ON "public"."schedule_blocks" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem atualizar seus próprios chats" ON "public"."chats" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem atualizar seus próprios guias de estudo" ON "public"."study_guides" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem atualizar suas próprias aulas concluídas" ON "public"."aulas_concluidas" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "usuario_id")) WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem atualizar tópicos dos seus guias" ON "public"."study_topics" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."study_guides"
  WHERE (("study_guides"."id" = "study_topics"."study_guide_id") AND ("study_guides"."user_id" = "auth"."uid"())))));



CREATE POLICY "Usuários podem cancelar suas próprias inscrições" ON "public"."event_participants" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem criar comentários" ON "public"."discussion_comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem criar discussões" ON "public"."discussions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem criar entradas no seu histórico" ON "public"."historico_simulados" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem criar eventos" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Usuários podem criar seus próprios blocos" ON "public"."schedule_blocks" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem criar seus próprios chats" ON "public"."chats" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem deletar seu próprio histórico" ON "public"."historico_simulados" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem deletar seu próprio progresso" ON "public"."progresso_usuario" FOR DELETE USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem deletar seus próprios blocos" ON "public"."schedule_blocks" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem deletar seus próprios chats" ON "public"."chats" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem deletar seus próprios guias de estudo" ON "public"."study_guides" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem deletar suas próprias aulas concluídas" ON "public"."aulas_concluidas" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem deletar tópicos dos seus guias" ON "public"."study_topics" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."study_guides"
  WHERE (("study_guides"."id" = "study_topics"."study_guide_id") AND ("study_guides"."user_id" = "auth"."uid"())))));



CREATE POLICY "Usuários podem editar seus próprios comentários" ON "public"."discussion_comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem editar seus próprios eventos" ON "public"."events" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Usuários podem editar suas próprias discussões" ON "public"."discussions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem inserir seu próprio progresso" ON "public"."progresso_usuario" FOR INSERT WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem inserir seu próprio progresso" ON "public"."study_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem inserir seus próprios guias de estudo" ON "public"."study_guides" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem inserir tópicos nos seus guias" ON "public"."study_topics" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."study_guides"
  WHERE (("study_guides"."id" = "study_topics"."study_guide_id") AND ("study_guides"."user_id" = "auth"."uid"())))));



CREATE POLICY "Usuários podem marcar suas próprias aulas como concluídas" ON "public"."aulas_concluidas" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem se inscrever em eventos" ON "public"."event_participants" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem ver apenas seu próprio histórico" ON "public"."historico_simulados" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem ver seu próprio histórico" ON "public"."historico_simulados" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem ver seu próprio progresso" ON "public"."progresso_usuario" FOR SELECT USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem ver seu próprio progresso" ON "public"."study_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem ver seus próprios blocos" ON "public"."schedule_blocks" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem ver seus próprios chats" ON "public"."chats" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem ver seus próprios guias de estudo" ON "public"."study_guides" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem ver suas próprias aulas concluídas" ON "public"."aulas_concluidas" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Usuários podem ver tópicos dos seus guias" ON "public"."study_topics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."study_guides"
  WHERE (("study_guides"."id" = "study_topics"."study_guide_id") AND ("study_guides"."user_id" = "auth"."uid"())))));



CREATE POLICY "Vídeoaulas são visíveis para usuários autenticados" ON "public"."videoaulas" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."aulas_concluidas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cursos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussion_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussion_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discussions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historico_simulados" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modulos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notificacoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."perfis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."progresso_usuario" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_guides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."videoaulas" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS "public"."conquistas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" text NOT NULL,
    "descricao" text NOT NULL,
    "icone" text NOT NULL,
    "tipo" text NOT NULL,
    "quantidade_necessaria" integer NOT NULL,
    CONSTRAINT "conquistas_pkey" PRIMARY KEY ("id")
);

-- Tabela de conquistas dos usuários
CREATE TABLE IF NOT EXISTS "public"."conquistas_usuarios" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "conquista_id" "uuid",
    "desbloqueado_em" timestamp with time zone DEFAULT now(),
    CONSTRAINT "conquistas_usuarios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "conquistas_usuarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "conquistas_usuarios_conquista_id_fkey" FOREIGN KEY ("conquista_id") REFERENCES "public"."conquistas"("id") ON DELETE CASCADE
);

-- Inserir conquistas iniciais
INSERT INTO public.conquistas (nome, descricao, icone, tipo, quantidade_necessaria) VALUES
-- Conquistas de aulas
('Primeira Aula', 'Parabéns por assistir sua primeira aula!', 'graduation', 'aulas', 1),
('Aluno Dedicado', 'Você já assistiu 10 aulas!', 'book', 'aulas', 10),
('Mestre das Aulas', 'Incrível! Você assistiu 50 aulas!', 'trophy', 'aulas', 50),
('Estudante Exemplar', 'Uau! Você completou 100 aulas!', 'star', 'aulas', 100),

-- Conquistas de exercícios
('Primeira Questão', 'Você respondeu sua primeira questão!', 'target', 'exercicios', 1),
('Praticante', 'Você já respondeu 10 questões!', 'zap', 'exercicios', 10),
('Expert', 'Impressionante! 50 questões respondidas!', 'award', 'exercicios', 50),
('Mestre dos Exercícios', 'Fenomenal! 100 questões respondidas!', 'medal', 'exercicios', 100);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "conquistas_usuarios_usuario_id_idx" ON "public"."conquistas_usuarios" ("usuario_id");
CREATE INDEX IF NOT EXISTS "conquistas_usuarios_conquista_id_idx" ON "public"."conquistas_usuarios" ("conquista_id");

































































































































































































GRANT ALL ON FUNCTION "public"."confirm_user"("user_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."confirm_user"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_user"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_user"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_comments_count"("discussion_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."decrement_comments_count"("discussion_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_comments_count"("discussion_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_comments_count"("discussion_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_likes_count"() TO "postgres";
GRANT ALL ON FUNCTION "public"."decrement_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."eh_admin"() TO "postgres";
GRANT ALL ON FUNCTION "public"."eh_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."eh_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."eh_admin"() TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "postgres";
GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_info"("message_row" "public"."chat_messages") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_user_info"("message_row" "public"."chat_messages") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_info"("message_row" "public"."chat_messages") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_info"("message_row" "public"."chat_messages") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_comments_count"("discussion_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."increment_comments_count"("discussion_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_comments_count"("discussion_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_comments_count"("discussion_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_likes_count"() TO "postgres";
GRANT ALL ON FUNCTION "public"."increment_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "postgres";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_discussion_like"("p_discussion_id" "uuid", "p_user_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."toggle_discussion_like"("p_discussion_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_discussion_like"("p_discussion_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_discussion_like"("p_discussion_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_counters"() TO "postgres";
GRANT ALL ON FUNCTION "public"."update_counters"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_counters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_counters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "postgres";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";





















GRANT ALL ON TABLE "public"."aulas_concluidas" TO "postgres";
GRANT ALL ON TABLE "public"."aulas_concluidas" TO "anon";
GRANT ALL ON TABLE "public"."aulas_concluidas" TO "authenticated";
GRANT ALL ON TABLE "public"."aulas_concluidas" TO "service_role";



GRANT ALL ON TABLE "public"."chats" TO "postgres";
GRANT ALL ON TABLE "public"."chats" TO "anon";
GRANT ALL ON TABLE "public"."chats" TO "authenticated";
GRANT ALL ON TABLE "public"."chats" TO "service_role";



GRANT ALL ON TABLE "public"."cursos" TO "postgres";
GRANT ALL ON TABLE "public"."cursos" TO "anon";
GRANT ALL ON TABLE "public"."cursos" TO "authenticated";
GRANT ALL ON TABLE "public"."cursos" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_comments" TO "postgres";
GRANT ALL ON TABLE "public"."discussion_comments" TO "anon";
GRANT ALL ON TABLE "public"."discussion_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_comments" TO "service_role";



GRANT ALL ON TABLE "public"."discussion_likes" TO "postgres";
GRANT ALL ON TABLE "public"."discussion_likes" TO "anon";
GRANT ALL ON TABLE "public"."discussion_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."discussion_likes" TO "service_role";



GRANT ALL ON TABLE "public"."discussions" TO "postgres";
GRANT ALL ON TABLE "public"."discussions" TO "anon";
GRANT ALL ON TABLE "public"."discussions" TO "authenticated";
GRANT ALL ON TABLE "public"."discussions" TO "service_role";



GRANT ALL ON TABLE "public"."event_participants" TO "postgres";
GRANT ALL ON TABLE "public"."event_participants" TO "anon";
GRANT ALL ON TABLE "public"."event_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."event_participants" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "postgres";
GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."historico_simulados" TO "postgres";
GRANT ALL ON TABLE "public"."historico_simulados" TO "anon";
GRANT ALL ON TABLE "public"."historico_simulados" TO "authenticated";
GRANT ALL ON TABLE "public"."historico_simulados" TO "service_role";



GRANT ALL ON TABLE "public"."modulos" TO "postgres";
GRANT ALL ON TABLE "public"."modulos" TO "anon";
GRANT ALL ON TABLE "public"."modulos" TO "authenticated";
GRANT ALL ON TABLE "public"."modulos" TO "service_role";



GRANT ALL ON TABLE "public"."notificacoes" TO "postgres";
GRANT ALL ON TABLE "public"."notificacoes" TO "anon";
GRANT ALL ON TABLE "public"."notificacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."notificacoes" TO "service_role";



GRANT ALL ON TABLE "public"."perfis" TO "postgres";
GRANT ALL ON TABLE "public"."perfis" TO "anon";
GRANT ALL ON TABLE "public"."perfis" TO "authenticated";
GRANT ALL ON TABLE "public"."perfis" TO "service_role";



GRANT ALL ON TABLE "public"."progresso_usuario" TO "postgres";
GRANT ALL ON TABLE "public"."progresso_usuario" TO "anon";
GRANT ALL ON TABLE "public"."progresso_usuario" TO "authenticated";
GRANT ALL ON TABLE "public"."progresso_usuario" TO "service_role";



GRANT ALL ON TABLE "public"."questoes" TO "postgres";
GRANT ALL ON TABLE "public"."questoes" TO "anon";
GRANT ALL ON TABLE "public"."questoes" TO "authenticated";
GRANT ALL ON TABLE "public"."questoes" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_blocks" TO "postgres";
GRANT ALL ON TABLE "public"."schedule_blocks" TO "anon";
GRANT ALL ON TABLE "public"."schedule_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."study_guides" TO "postgres";
GRANT ALL ON TABLE "public"."study_guides" TO "anon";
GRANT ALL ON TABLE "public"."study_guides" TO "authenticated";
GRANT ALL ON TABLE "public"."study_guides" TO "service_role";



GRANT ALL ON TABLE "public"."study_progress" TO "postgres";
GRANT ALL ON TABLE "public"."study_progress" TO "anon";
GRANT ALL ON TABLE "public"."study_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."study_progress" TO "service_role";



GRANT ALL ON TABLE "public"."study_topics" TO "postgres";
GRANT ALL ON TABLE "public"."study_topics" TO "anon";
GRANT ALL ON TABLE "public"."study_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."study_topics" TO "service_role";



GRANT ALL ON TABLE "public"."user_status" TO "postgres";
GRANT ALL ON TABLE "public"."user_status" TO "anon";
GRANT ALL ON TABLE "public"."user_status" TO "authenticated";
GRANT ALL ON TABLE "public"."user_status" TO "service_role";



GRANT ALL ON TABLE "public"."videoaulas" TO "postgres";
GRANT ALL ON TABLE "public"."videoaulas" TO "anon";
GRANT ALL ON TABLE "public"."videoaulas" TO "authenticated";
GRANT ALL ON TABLE "public"."videoaulas" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

-- Tabela de aulas ao vivo
CREATE TABLE IF NOT EXISTS "public"."live_classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "meet_link" text NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "live_classes_pkey" PRIMARY KEY ("id")
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "live_classes_start_time_idx" ON "public"."live_classes" ("start_time");
CREATE INDEX IF NOT EXISTS "live_classes_end_time_idx" ON "public"."live_classes" ("end_time");

-- Habilitar RLS e adicionar políticas de segurança
ALTER TABLE "public"."live_classes" ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para live_classes
CREATE POLICY "Todos podem ver aulas ao vivo" ON "public"."live_classes"
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Apenas admins podem criar aulas ao vivo" ON "public"."live_classes"
    FOR INSERT TO authenticated
    WITH CHECK (public.eh_admin());

CREATE POLICY "Apenas admins podem atualizar aulas ao vivo" ON "public"."live_classes"
    FOR UPDATE TO authenticated
    USING (public.eh_admin())
    WITH CHECK (public.eh_admin());

CREATE POLICY "Apenas admins podem deletar aulas ao vivo" ON "public"."live_classes"
    FOR DELETE TO authenticated
    USING (public.eh_admin());

    -- Tabela de configurações globais
CREATE TABLE IF NOT EXISTS "public"."configuracoes_globais" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "chave" text NOT NULL,
    "valor" jsonb NOT NULL,
    "descricao" text,
    "criado_em" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "configuracoes_globais_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "configuracoes_globais_chave_key" UNIQUE ("chave")
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS "configuracoes_globais_chave_idx" ON "public"."configuracoes_globais" ("chave");

-- Habilitar RLS
ALTER TABLE "public"."configuracoes_globais" ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Permitir leitura para usuários autenticados" 
ON "public"."configuracoes_globais" FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir modificação apenas para admins" 
ON "public"."configuracoes_globais" 
FOR ALL 
TO authenticated 
USING (public.eh_admin());

-- Inserir configurações iniciais
INSERT INTO public.configuracoes_globais (chave, valor, descricao)
VALUES 
('mostrar_eventos', 'true'::jsonb, 'Controla a visibilidade dos eventos na plataforma'),
('horarios_aulas', jsonb_build_object(
    'segunda', ARRAY['08:00', '10:00', '14:00', '16:00'],
    'terca', ARRAY['08:00', '10:00', '14:00', '16:00'],
    'quarta', ARRAY['08:00', '10:00', '14:00', '16:00'],
    'quinta', ARRAY['08:00', '10:00', '14:00', '16:00'],
    'sexta', ARRAY['08:00', '10:00', '14:00', '16:00']
), 'Horários das aulas durante a semana'),
('dias_letivos_2024', jsonb_build_array(
    '2024-02-01', '2024-02-02', '2024-02-05', '2024-02-06', '2024-02-07'
), 'Dias letivos para o ano de 2024'),
('feriados_2024', jsonb_build_array(
    '2024-01-01', -- Ano Novo
    '2024-02-12', -- Carnaval
    '2024-02-13', -- Carnaval
    '2024-03-29', -- Sexta-feira Santa
    '2024-04-21', -- Tiradentes
    '2024-05-01'  -- Dia do Trabalho
), 'Feriados nacionais em 2024')
ON CONFLICT (chave) 
DO UPDATE SET 
    valor = EXCLUDED.valor,
    descricao = EXCLUDED.descricao,
    atualizado_em = timezone('utc'::text, now());
