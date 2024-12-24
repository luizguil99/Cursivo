import React from 'react';
import { Card } from "@/components/ui/card";
import GoogleMeetProvider from '@/components/providers/GoogleMeetProvider';
import { useToast } from "@/components/ui/use-toast";

function LivePage() {
  const { toast } = useToast();
  const [selectedProvider] = React.useState('meet'); // Por enquanto, fixo no Google Meet

  // Função chamada quando o usuário entrar em uma reunião
  const handleJoinMeeting = (url) => {
    toast({
      title: "Entrando na reunião",
      description: "Abrindo o Google Meet em uma nova aba...",
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Aulas ao Vivo</h1>
        <p className="text-muted-foreground mt-2">
          Participe de aulas ao vivo usando sua plataforma preferida
        </p>
      </div>

      {/* Container para o provedor selecionado */}
      <div className="space-y-6">
        {selectedProvider === 'meet' && (
          <GoogleMeetProvider onJoinMeeting={handleJoinMeeting} />
        )}
      </div>

      {/* Informações adicionais */}
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold mb-2">Dicas para uma boa aula</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• Verifique sua conexão com a internet antes de começar</li>
          <li>• Use fones de ouvido para melhor qualidade de áudio</li>
          <li>• Escolha um ambiente silencioso e bem iluminado</li>
          <li>• Teste sua câmera e microfone antes da aula</li>
        </ul>
      </Card>
    </div>
  );
}

export default LivePage;
