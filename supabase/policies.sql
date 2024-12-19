-- Políticas de Segurança do Supabase

-- Cursos
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cursos são visíveis para usuários autenticados" ON public.cursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Apenas admins podem modificar cursos" ON public.cursos TO authenticated USING (eh_admin()) WITH CHECK (eh_admin());
CREATE POLICY "Admins podem criar cursos" ON public.cursos FOR INSERT TO authenticated WITH CHECK (true);

-- Módulos
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Módulos são visíveis para usuários autenticados" ON public.modulos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Apenas admins podem modificar módulos" ON public.modulos TO authenticated USING (eh_admin()) WITH CHECK (eh_admin());
CREATE POLICY "Admins podem criar módulos" ON public.modulos FOR INSERT TO authenticated WITH CHECK (true);

-- Videoaulas
ALTER TABLE public.videoaulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vídeoaulas são visíveis para usuários autenticados" ON public.videoaulas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Apenas admins podem modificar vídeoaulas" ON public.videoaulas TO authenticated USING (eh_admin()) WITH CHECK (eh_admin());
CREATE POLICY "Admins podem criar videoaulas" ON public.videoaulas FOR INSERT TO authenticated WITH CHECK (true);

-- Aulas Concluídas
ALTER TABLE public.aulas_concluidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver suas próprias aulas concluídas" ON public.aulas_concluidas FOR SELECT TO authenticated USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem marcar suas próprias aulas como concluídas" ON public.aulas_concluidas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar suas próprias aulas concluídas" ON public.aulas_concluidas FOR UPDATE TO authenticated USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem deletar suas próprias aulas concluídas" ON public.aulas_concluidas FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

-- Perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfis são visíveis para usuários autenticados" ON public.perfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Perfis podem ser atualizados pelo próprio usuário ou admin" ON public.perfis FOR UPDATE TO authenticated USING ((auth.uid() = id) OR eh_admin());
CREATE POLICY "Admins podem ver todos os dados" ON public.perfis FOR SELECT TO authenticated USING (eh_admin());
CREATE POLICY "Admins podem modificar todos os dados" ON public.perfis TO authenticated USING (eh_admin()) WITH CHECK (eh_admin());

-- Progresso do Usuário
ALTER TABLE public.progresso_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver seu próprio progresso" ON public.progresso_usuario FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem inserir seu próprio progresso" ON public.progresso_usuario FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar seu próprio progresso" ON public.progresso_usuario FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem deletar seu próprio progresso" ON public.progresso_usuario FOR DELETE USING (auth.uid() = usuario_id);

-- Histórico de Simulados
ALTER TABLE public.historico_simulados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver seu próprio histórico" ON public.historico_simulados FOR SELECT TO authenticated USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem criar entradas no seu histórico" ON public.historico_simulados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar seu próprio histórico" ON public.historico_simulados FOR UPDATE TO authenticated USING (auth.uid() = usuario_id);
CREATE POLICY "Usuários podem deletar seu próprio histórico" ON public.historico_simulados FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

-- Discussões
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Discussões visíveis para todos os usuários autenticados" ON public.discussions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem criar discussões" ON public.discussions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem editar suas próprias discussões" ON public.discussions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Enable read access for all users" ON public.discussions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.discussions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert with user_metadata" ON public.discussions FOR INSERT WITH CHECK (true);

-- Comentários de Discussão
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comentários visíveis para todos os usuários autenticados" ON public.discussion_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem criar comentários" ON public.discussion_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem editar seus próprios comentários" ON public.discussion_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Enable read access for all users" ON public.discussion_comments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.discussion_comments FOR INSERT WITH CHECK (true);

-- Likes de Discussão
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.discussion_likes FOR SELECT USING (true);
CREATE POLICY "Enable insert/delete access for authenticated users" ON public.discussion_likes TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Eventos
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eventos visíveis para todos os usuários autenticados" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem criar eventos" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem editar seus próprios eventos" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Participantes de Eventos
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inscrições visíveis para todos os usuários autenticados" ON public.event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem se inscrever em eventos" ON public.event_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem cancelar suas próprias inscrições" ON public.event_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Status do Usuário
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Status visível para todos os usuários autenticados" ON public.user_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários podem atualizar seu próprio status" ON public.user_status FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Blocos de Agenda
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver seus próprios blocos" ON public.schedule_blocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar seus próprios blocos" ON public.schedule_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar seus próprios blocos" ON public.schedule_blocks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios blocos" ON public.schedule_blocks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Guias de Estudo
ALTER TABLE public.study_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver seus próprios guias de estudo" ON public.study_guides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seus próprios guias de estudo" ON public.study_guides FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar seus próprios guias de estudo" ON public.study_guides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios guias de estudo" ON public.study_guides FOR DELETE USING (auth.uid() = user_id);

-- Tópicos de Estudo
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver tópicos dos seus guias" ON public.study_topics FOR SELECT USING (EXISTS (SELECT 1 FROM study_guides WHERE study_guides.id = study_topics.study_guide_id AND study_guides.user_id = auth.uid()));
CREATE POLICY "Usuários podem inserir tópicos nos seus guias" ON public.study_topics FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem atualizar tópicos dos seus guias" ON public.study_topics FOR UPDATE USING (EXISTS (SELECT 1 FROM study_guides WHERE study_guides.id = study_topics.study_guide_id AND study_guides.user_id = auth.uid()));
CREATE POLICY "Usuários podem deletar tópicos dos seus guias" ON public.study_topics FOR DELETE USING (EXISTS (SELECT 1 FROM study_guides WHERE study_guides.id = study_topics.study_guide_id AND study_guides.user_id = auth.uid()));
