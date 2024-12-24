import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Video, Calendar, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LiveStatus } from "@/components/ui/live-status";
import { cn } from "@/lib/utils";

// Componente para integração com o Google Meet (visão do aluno)
const GoogleMeetProvider = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentClass, setCurrentClass] = React.useState(null);
  const [upcomingClasses, setUpcomingClasses] = React.useState([]);

  // Busca as aulas ao vivo disponíveis
  const fetchLiveClasses = async () => {
    try {
      const now = new Date().toISOString();
      console.log('Buscando aulas a partir de:', now);
      
      // Busca aulas que começam até 15 minutos antes do horário atual
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60000).toISOString();
      
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .gte('end_time', fifteenMinutesAgo) // Inclui aulas que ainda não terminaram
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Erro ao buscar aulas:', error);
        throw error;
      }

      console.log('Aulas encontradas:', data);

      if (!data || data.length === 0) {
        console.log('Nenhuma aula encontrada');
        setCurrentClass(null);
        setUpcomingClasses([]);
        setIsLoading(false);
        return;
      }

      // Separa a aula atual das próximas aulas
      const current = data.find(cls => {
        const start = new Date(cls.start_time);
        const end = new Date(cls.end_time);
        const nowDate = new Date();
        return start <= nowDate && end >= nowDate;
      });
      
      const upcoming = data.filter(cls => {
        const start = new Date(cls.start_time);
        const nowDate = new Date();
        return start > nowDate;
      });

      console.log('Aula atual:', current);
      console.log('Próximas aulas:', upcoming);

      setCurrentClass(current);
      setUpcomingClasses(upcoming);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as aulas disponíveis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega as aulas ao montar o componente
  React.useEffect(() => {
    fetchLiveClasses();
    
    // Atualiza a cada minuto
    const interval = setInterval(fetchLiveClasses, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6 border-yellow-200">
        <div className="flex items-center justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 w-4 bg-yellow-200 rounded-full"></div>
            <div className="h-4 w-24 bg-yellow-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {currentClass && (
        <Card className="relative overflow-hidden border-2 border-[#F3C92C]">
          {/* Fundo decorativo */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-white pointer-events-none"></div>
          
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Video className="w-6 h-6 text-[#F3C92C]" />
                <div>
                  <h2 className="text-xl font-semibold">Aula em Andamento</h2>
                  <LiveStatus className="mt-1" />
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                Até {formatDateTime(currentClass.end_time)}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">{currentClass.title}</h3>
              <p className="text-sm text-muted-foreground">{currentClass.description}</p>
            </div>

            <Button
              onClick={() => window.open(currentClass.meet_link, '_blank')}
              className="w-full bg-[#F3C92C] hover:bg-[#E3B91C] text-black flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              Entrar na Aula Agora
            </Button>
          </div>
        </Card>
      )}

      {upcomingClasses.length > 0 && (
        <Card className="border-yellow-200">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#F3C92C]" />
              <h2 className="text-xl font-semibold">Próximas Aulas</h2>
            </div>

            <div className="space-y-4">
              {upcomingClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className={cn(
                    "flex items-center justify-between py-3 px-4 rounded-lg",
                    "bg-gradient-to-r from-yellow-50 to-transparent"
                  )}
                >
                  <div>
                    <h3 className="font-medium">{cls.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(cls.start_time)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(cls.meet_link, '_blank')}
                    disabled={new Date(cls.start_time) > new Date()}
                    className="border-yellow-200 hover:bg-yellow-50"
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!currentClass && upcomingClasses.length === 0 && (
        <Card className="border-yellow-200">
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-[#F3C92C]" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">Nenhuma Aula Agendada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No momento não há aulas ao vivo disponíveis.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GoogleMeetProvider;
