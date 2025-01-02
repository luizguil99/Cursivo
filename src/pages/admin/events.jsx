import React from "react";
import EventsManager from "@/components/admin/EventsManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

function EventsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [meetConfig, setMeetConfig] = React.useState({
    title: "",
    description: "",
    meet_link: "",
    start_time: "",
    end_time: "",
  });

  // Cria uma nova aula no Google Meet
  const createMeetClass = async () => {
    try {
      // Validações básicas
      if (
        !meetConfig.title ||
        !meetConfig.meet_link ||
        !meetConfig.start_time ||
        !meetConfig.end_time
      ) {
        toast({
          title: "Campos Obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      const startTime = new Date(meetConfig.start_time);
      const endTime = new Date(meetConfig.end_time);

      if (endTime <= startTime) {
        toast({
          title: "Horário Inválido",
          description: "O horário de término deve ser posterior ao início.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("live_classes").insert([
        {
          ...meetConfig,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast({
        title: "Aula Criada",
        description: "A aula do Google Meet foi criada com sucesso!",
      });

      setIsDialogOpen(false);
      setMeetConfig({
        title: "",
        description: "",
        meet_link: "",
        start_time: "",
        end_time: "",
      });
    } catch (error) {
      console.error("Erro ao criar aula:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a aula.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Eventos</h1>
            <p className="text-muted-foreground mt-2">
              Adicione, remova e gerencie os eventos da plataforma
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl">
        <EventsManager />
      </div>
    </div>
  );
}

export default EventsPage;
