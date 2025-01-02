import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Sparkles, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import cn from "classnames";

function DailyEvents({ className, noMargin }) {
  const { toast } = useToast();
  const [showEvents, setShowEvents] = useState(true);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para formatar data e hora
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Gerar número aleatório de participantes (entre 5 e 100)
  const getRandomParticipants = () => {
    return Math.floor(Math.random() * (100 - 5 + 1)) + 5;
  };

  // Carregar eventos e configuração ao montar o componente
  useEffect(() => {
    fetchEventsVisibility();
  }, []);

  // Buscar configuração de visibilidade e eventos
  const fetchEventsVisibility = async () => {
    try {
      // Buscar configuração de visibilidade
      const { data: configData, error: configError } = await supabase
        .from("configuracoes_globais")
        .select("valor")
        .eq("chave", "mostrar_eventos")
        .single();

      if (configError) throw configError;

      const shouldShow = configData?.valor ?? true;
      setShowEvents(shouldShow);

      // Se eventos estiverem visíveis, carregar a lista
      if (shouldShow) {
        await fetchEvents();
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      toast({
        title: "Erro ao carregar configuração",
        description: "Não foi possível verificar a visibilidade dos eventos.",
        variant: "destructive",
      });
    }
  };

  // Buscar eventos do Supabase
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("live_classes")
        .select("*")
        .gte("end_time", new Date().toISOString()) // Filtra apenas eventos que ainda não terminaram
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Adiciona número aleatório de participantes para cada evento
      const eventsWithParticipants = (data || []).map((event) => ({
        ...event,
        participants: getRandomParticipants(),
      }));

      setEvents(eventsWithParticipants);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      toast({
        title: "Erro ao carregar eventos",
        description: "Não foi possível carregar a lista de eventos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para participar do evento
  const handleJoinEvent = async (eventId) => {
    try {
      // Buscar o evento atual
      const { data: event, error: fetchError } = await supabase
        .from("live_classes")
        .select("current_participants, max_participants")
        .eq("id", eventId)
        .single();

      if (fetchError) throw fetchError;

      // Verificar se há vagas disponíveis
      if (event.current_participants >= event.max_participants) {
        toast({
          title: "Evento lotado",
          description:
            "Desculpe, o evento já atingiu o número máximo de participantes.",
          variant: "destructive",
        });
        return;
      }

      // Incrementar o número de participantes
      const { error: updateError } = await supabase
        .from("live_classes")
        .update({
          current_participants: event.current_participants + 1,
        })
        .eq("id", eventId);

      if (updateError) throw updateError;

      // Atualizar a lista de eventos
      fetchEvents();

      toast({
        title: "Sucesso!",
        description: "Você foi adicionado ao evento.",
      });
    } catch (error) {
      console.error("Erro ao participar do evento:", error);
      toast({
        title: "Erro ao participar",
        description: "Não foi possível participar do evento.",
        variant: "destructive",
      });
    }
  };

  if (!showEvents) return null;

  return (
    <Card className={cn(
      "mt-4 mx-4 mb-4",
      noMargin && "!m-0 w-full",
      className
    )}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <h3 className="font-medium text-sm">Eventos de Hoje</h3>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center">
            Carregando eventos...
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            Nenhum evento disponível hoje
          </p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{event.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(event.start_time)}
                  <span>•</span>
                  <Users className="h-3 w-3" />
                  {event.participants}
                </div>
              </div>
              {event.meet_link && (
                <a
                  href={event.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 flex items-center gap-1"
                  >
                    Entrar
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export default DailyEvents;
