import { useState, useCallback } from 'react';
import { studyProgressService } from "@/lib/studyProgressService";

// Tempo de expiração do cache em minutos
const CACHE_EXPIRATION = 10;
const BATCH_UPDATE_DELAY = 2000; // 2 segundos

export function useProgressCache() {
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [updateTimeout, setUpdateTimeout] = useState(null);

  const getCachedProgress = useCallback((subjectId) => {
    try {
      const cached = localStorage.getItem(`progress_${subjectId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Verifica se o cache ainda é válido
        if (Date.now() - timestamp < CACHE_EXPIRATION * 60 * 1000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao ler cache:", error);
      return null;
    }
  }, []);

  const setCachedProgress = useCallback((subjectId, data) => {
    try {
      localStorage.setItem(
        `progress_${subjectId}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Erro ao salvar cache:", error);
    }
  }, []);

  const updateProgress = useCallback(async (subjectId, topicName, field, value) => {
    try {
      const result = await studyProgressService.updateProgress(
        subjectId,
        topicName,
        field,
        value
      );

      if (result) {
        // Atualiza o cache
        const currentCache = getCachedProgress(subjectId) || {};
        const updatedCache = {
          ...currentCache,
          [topicName]: {
            ...(currentCache[topicName] || {}),
            [field]: value
          }
        };
        setCachedProgress(subjectId, updatedCache);
      }

      return result;
    } catch (error) {
      console.error("Erro ao atualizar progresso:", error);
      throw error;
    }
  }, [getCachedProgress, setCachedProgress]);

  const loadProgress = useCallback(async (subjectId) => {
    // Tenta carregar do cache primeiro
    const cachedData = getCachedProgress(subjectId);
    if (cachedData) {
      return cachedData;
    }

    // Se não tem cache, busca do banco
    const data = await studyProgressService.getAllTopicsProgress(subjectId);
    if (data) {
      setCachedProgress(subjectId, data);
    }
    return data;
  }, [getCachedProgress, setCachedProgress]);

  return {
    loadProgress,
    updateProgress,
    getCachedProgress,
    setCachedProgress,
  };
}
