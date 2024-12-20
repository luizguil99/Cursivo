// Componente PandaVideo para reprodução de vídeos da plataforma Panda
// Este componente encapsula o iframe do PandaVideo mantendo as configurações originais da plataforma

const PandaVideo = ({ 
  videoUrl, // URL completa do iframe do Panda Video
  width = "720", 
  height = "360"
}) => {
  return (
    <iframe
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
