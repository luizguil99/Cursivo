import { supabase } from './supabase';

// Serviço para gerenciar operações do guia de estudos
export const studyGuideService = {
  // Criar um novo guia de estudos
  async createStudyGuide({ title, description, subject }) {
    const { data, error } = await supabase
      .from('study_guides')
      .insert([
        { title, description, subject }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar todos os guias de estudo do usuário
  async getStudyGuides() {
    const { data, error } = await supabase
      .from('study_guides')
      .select(`
        *,
        study_topics (
          *
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Buscar um guia de estudos específico
  async getStudyGuide(id) {
    const { data, error } = await supabase
      .from('study_guides')
      .select(`
        *,
        study_topics (
          *
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar um guia de estudos
  async updateStudyGuide(id, { title, description, subject }) {
    const { data, error } = await supabase
      .from('study_guides')
      .update({ title, description, subject })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar um guia de estudos
  async deleteStudyGuide(id) {
    const { error } = await supabase
      .from('study_guides')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Adicionar um tópico ao guia de estudos
  async addTopic(studyGuideId, { title, content, orderIndex }) {
    const { data, error } = await supabase
      .from('study_topics')
      .insert([
        { 
          study_guide_id: studyGuideId,
          title,
          content,
          order_index: orderIndex
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar um tópico
  async updateTopic(topicId, { title, content, orderIndex }) {
    const { data, error } = await supabase
      .from('study_topics')
      .update({ 
        title,
        content,
        order_index: orderIndex
      })
      .eq('id', topicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar um tópico
  async deleteTopic(topicId) {
    const { error } = await supabase
      .from('study_topics')
      .delete()
      .eq('id', topicId);

    if (error) throw error;
  },

  // Reordenar tópicos
  async reorderTopics(studyGuideId, topicIds) {
    const updates = topicIds.map((topicId, index) => ({
      id: topicId,
      order_index: index
    }));

    const { error } = await supabase
      .from('study_topics')
      .upsert(updates);

    if (error) throw error;
  }
};
