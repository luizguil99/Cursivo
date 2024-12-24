import React from 'react';
import { Card } from "@/components/ui/card";
import GoogleMeetProvider from '@/components/providers/GoogleMeetProvider';
import { useToast } from "@/components/ui/use-toast";
import { Video, Wifi, Mic, Sun } from "lucide-react";

function LivePage() {
  const { toast } = useToast();
  const [selectedProvider] = React.useState('meet');

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50/50 to-white">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#F3C92C] to-yellow-500 bg-clip-text text-transparent">
            Aulas ao Vivo
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Participe de aulas ao vivo usando sua plataforma preferida
          </p>
        </div>

        {/* Container para o provedor selecionado */}
        <div className="space-y-6">
          {selectedProvider === 'meet' && (
            <GoogleMeetProvider onJoinMeeting={() => {}} />
          )}
        </div>

        {/* Informações adicionais */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-[#F3C92C]" />
              Dicas para uma boa conexão
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F3C92C]" />
                Verifique sua conexão com a internet antes de começar
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F3C92C]" />
                Use uma conexão estável, preferencialmente via cabo
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F3C92C]" />
                Feche programas que possam consumir muita internet
              </li>
            </ul>
          </Card>

          <Card className="p-6 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-[#F3C92C]" />
              Preparação para a Aula
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F3C92C]" />
                Use fones de ouvido para melhor qualidade de áudio
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F3C92C]" />
                Escolha um ambiente silencioso e bem iluminado
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F3C92C]" />
                Teste sua câmera e microfone antes da aula
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LivePage;
