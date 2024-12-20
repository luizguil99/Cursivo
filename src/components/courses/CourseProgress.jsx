import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from './ProgressBar';

export function CourseProgress({ courseId }) {
  const [progress, setProgress] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    const calculateProgress = async () => {
      if (!currentUser?.id || !courseId) return;

      try {
        // Buscar total de vídeos do curso
        const { data: modules, error: modulesError } = await supabase
          .from('modulos')
          .select('id')
          .eq('curso_id', courseId);

        if (modulesError) throw modulesError;

        const moduleIds = modules.map(m => m.id);

        const { data: totalVideos, error: videosError } = await supabase
          .from('videoaulas')
          .select('id')
          .in('modulo_id', moduleIds);

        if (videosError) throw videosError;

        // Buscar aulas concluídas do usuário para este curso
        const { data: completedLessons, error: completedError } = await supabase
          .from('aulas_concluidas')
          .select('videoaula_id')
          .eq('usuario_id', currentUser.id)
          .in('videoaula_id', totalVideos.map(v => v.id));

        if (completedError) throw completedError;

        // Calcular progresso
        const totalLessons = totalVideos.length;
        const completedCount = completedLessons.length;
        const calculatedProgress = totalLessons > 0 
          ? Math.round((completedCount / totalLessons) * 100)
          : 0;

        setProgress(calculatedProgress);
      } catch (error) {
        console.error('Erro ao calcular progresso:', error);
      }
    };

    calculateProgress();
  }, [courseId, currentUser?.id]);

  return <ProgressBar progress={progress} />;
}
