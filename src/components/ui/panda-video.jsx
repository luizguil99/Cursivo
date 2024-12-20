// Componente PandaVideo para reprodução de vídeos da plataforma Panda
// Este componente encapsula o iframe do PandaVideo mantendo as configurações originais da plataforma
import { useEffect, useRef } from 'react';

const PandaVideo = ({ 
  videoUrl, // URL completa do iframe do Panda Video
  width = "720", 
  height = "360",
  onVideoEnd // Callback chamado quando o vídeo termina
}) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Função para lidar com as mensagens do player do Panda
    const handlePandaMessage = (event) => {
      const { data } = event;
      
      // Verifica se é o evento de fim do vídeo
      if (data.message === 'panda_ended') {
        console.log('Vídeo terminou');
        if (onVideoEnd) onVideoEnd();
      }
    };

    // Adiciona o listener de mensagens
    window.addEventListener('message', handlePandaMessage);

    // Remove o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('message', handlePandaMessage);
    };
  }, [onVideoEnd]);

  return (
    <iframe
      ref={iframeRef}
      id={`panda-${videoUrl.match(/v=([a-f0-9-]+)/)?.[1] || ''}`}
      src={videoUrl}
      style={{ border: "none" }}
      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
      allowFullScreen={true}
      width={width}
      height={height}
      fetchPriority="high"
    />
  );
};

export default PandaVideo;
