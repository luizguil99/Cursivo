import React, { useEffect, useRef } from "react";
import Player from "@vimeo/player";
import { useAuth } from "@/contexts/AuthContext";

const VimeoPlayer = ({ videoId, onVideoEnd, lessonId }) => {
  const playerRef = useRef(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    let player = null;

    const initPlayer = async () => {
      if (!videoId) {
        console.log("VideoId não fornecido");
        return;
      }

      try {
        console.log("Inicializando player com ID:", videoId);

        // Criar o player do Vimeo com o ID numérico
        player = new Player(playerRef.current, {
          id: parseInt(videoId),
          width: "100%",
          height: "100%",
          controls: true,
          responsive: true,
          dnt: true,
          playsinline: true,
          autopause: false,
        });

        // Aguarda o player estar pronto
        await player.ready();
        console.log("Player pronto!");

        const duration = await player.getDuration();
        console.log("Duração do vídeo:", duration);

        // Configura os eventos apenas após o player estar pronto
        player.on("play", () => {
          console.log("Vídeo iniciou!");
        });

        player.on("ended", () => {
          console.log("Vídeo terminou!");

          if (!currentUser) {
            console.log("Usuário não está logado");
            return;
          }

          if (!lessonId) {
            console.log("ID da aula não fornecido");
            return;
          }

          if (onVideoEnd) {
            console.log("Notificando conclusão do vídeo");
            onVideoEnd();
          }
        });

        player.on("error", (error) => {
          console.error("Erro no player:", error);
        });

        // Adiciona evento para salvar o tempo quando a página é ocultada
        const handleVisibilityChange = () => {
          if (document.hidden) {
            player.getCurrentTime().then(time => {
              player.savedTime = time;
            });
          } else if (player.savedTime) {
            player.setCurrentTime(player.savedTime);
            delete player.savedTime;
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };

      } catch (error) {
        console.error("Erro ao inicializar player:", error);
      }
    };

    initPlayer();

    return () => {
      if (player) {
        console.log("Destruindo player");
        player.destroy();
      }
    };
  }, [videoId]); // Removemos as outras dependências para evitar recriação desnecessária

  return (
    <div className="w-full h-full absolute inset-0">
      <div ref={playerRef} className="w-full h-full" />
    </div>
  );
};

export default VimeoPlayer;
