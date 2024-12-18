import React, { useEffect, useRef } from "react";
import Player from "@vimeo/player";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";

const VimeoPlayer = ({ videoId, onVideoEnd }) => {
  const playerRef = useRef(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Criar o player do Vimeo
    const player = new Player(playerRef.current, {
      id: videoId,
      width: "100%",
      height: "100%",
    });

    // Detectar quando o vídeo termina
    player.on("ended", async () => {
      if (!currentUser) return;

      try {
        // Salvar no banco que o usuário concluiu a aula
        const { error } = await supabase.from("aulas_concluidas").upsert(
          {
            usuario_id: currentUser.id,
            videoaula_id: videoId,
            concluido_em: new Date().toISOString(),
          },
          {
            onConflict: "usuario_id,videoaula_id",
          }
        );

        if (error) throw error;

        // Notificar o componente pai que o vídeo terminou
        if (onVideoEnd) onVideoEnd(videoId);
      } catch (error) {
        console.error("Erro ao salvar conclusão da aula:", error);
      }
    });

    return () => {
      player.destroy();
    };
  }, [videoId, currentUser, onVideoEnd]);

  return (
    <div className="w-full aspect-video">
      <div ref={playerRef} />
    </div>
  );
};

export default VimeoPlayer;
