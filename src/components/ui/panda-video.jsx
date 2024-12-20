// Componente PandaVideo para reprodução de vídeos da plataforma Panda
// Este componente encapsula o iframe do PandaVideo com propriedades personalizáveis

const PandaVideo = ({ videoId, width = "720", height = "360" }) => {
  // Construindo a URL do player com o ID do vídeo
  const playerUrl = `https://player-vz-7a331dec-5f3.tv.pandavideo.com.br/embed/?v=${videoId}`;

  return (
    <iframe
      id={`panda-${videoId}`}
      src={playerUrl}
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
