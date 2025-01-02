// Componente PandaVideo para reprodução de vídeos da plataforma Panda
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const PandaVideo = ({
  videoUrl,
  videoId,
  userId,
  width = "100%",
  height = "100%",
  onVideoEnd,
}) => {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const [videoDuration, setVideoDuration] = useState(null);

  useEffect(() => {
    // Carrega o script do Panda Player
    const script = document.createElement("script");
    script.src = "https://player.pandavideo.com.br/api.v2.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.pandascripttag = window.pandascripttag || [];
      window.pandascripttag.push(function () {
        const videoId = videoUrl.match(/v=([a-f0-9-]+)/)?.[1];
        if (!videoId) return;

        playerRef.current = new window.PandaPlayer(`panda-${videoId}`, {
          onReady: () => {
            // Quando o player estiver pronto, pegamos a duração
            const duration = playerRef.current.getDuration();
            console.log("Duração do vídeo em segundos:", duration);
            setVideoDuration(Math.round(duration)); // Arredondando para número inteiro
          },
        });
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [videoUrl]);

  useEffect(() => {
    // Função para lidar com as mensagens do player do Panda
    const handlePandaMessage = (event) => {
      const { data } = event;

      // Quando o vídeo termina
      if (data.message === "panda_ended") {
        console.log(
          "Vídeo terminou, duração total em segundos:",
          videoDuration
        );
        handleVideoEnd();
        if (onVideoEnd) onVideoEnd();
      }
    };

    // Adiciona o listener de mensagens
    window.addEventListener("message", handlePandaMessage);

    // Remove o listener quando o componente for desmontado
    return () => {
      window.removeEventListener("message", handlePandaMessage);
    };
  }, [onVideoEnd, userId, videoId, videoDuration]);

  // Função para lidar com o fim do vídeo
  const handleVideoEnd = async () => {
    if (!userId || !videoId || !videoDuration) return;

    try {
      const now = new Date().toISOString();

      console.log("Salvando vídeo com duração em segundos:", videoDuration);

      // Usando upsert para inserir ou atualizar o registro
      const { error } = await supabase.from("aulas_concluidas").upsert(
        {
          usuario_id: userId,
          videoaula_id: videoId,
          tempo_assistido: videoDuration, // Salvando apenas os segundos como integer
          concluido_em: now,
        },
        {
          onConflict: "usuario_id,videoaula_id",
          ignoreDuplicates: false,
        }
      );

      if (error) throw error;
      console.log("Tempo assistido salvo em segundos:", videoDuration);
    } catch (error) {
      console.error("Erro ao salvar tempo assistido:", error);
    }
  };

  return (
    <iframe
      ref={iframeRef}
      id={`panda-${videoUrl.match(/v=([a-f0-9-]+)/)?.[1] || ""}`}
      src={videoUrl}
      style={{
        border: "none",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
      allowFullScreen={true}
      fetchPriority="high"
    />
  );
};

export default PandaVideo;
