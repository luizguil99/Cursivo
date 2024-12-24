import React from "react";
import EventsManager from "@/components/admin/EventsManager";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

function EventsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [meetConfig, setMeetConfig] = React.useState({
    title: '',
    description: '',
    meet_link: '',
    start_time: '',
    end_time: '',
  });

  // Cria uma nova aula no Google Meet
  const createMeetClass = async () => {
    try {
      // Validações básicas
      if (!meetConfig.title || !meetConfig.meet_link || !meetConfig.start_time || !meetConfig.end_time) {
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

      const { error } = await supabase
        .from('live_classes')
        .insert([{
          ...meetConfig,
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Aula Criada",
        description: "A aula do Google Meet foi criada com sucesso!",
      });

      setIsDialogOpen(false);
      setMeetConfig({
        title: '',
        description: '',
        meet_link: '',
        start_time: '',
        end_time: '',
      });
    } catch (error) {
      console.error('Erro ao criar aula:', error);
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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Criar Aula no Meet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Aula no Google Meet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Aula</Label>
                  <Input
                    id="title"
                    value={meetConfig.title}
                    onChange={(e) => setMeetConfig({ ...meetConfig, title: e.target.value })}
                    placeholder="Ex: Aula de Matemática"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    value={meetConfig.description}
                    onChange={(e) => setMeetConfig({ ...meetConfig, description: e.target.value })}
                    placeholder="Ex: Revisão para a prova"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meet_link">Link do Google Meet</Label>
                  <Input
                    id="meet_link"
                    value={meetConfig.meet_link}
                    onChange={(e) => setMeetConfig({ ...meetConfig, meet_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Início</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={meetConfig.start_time}
                      onChange={(e) => setMeetConfig({ ...meetConfig, start_time: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">Término</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={meetConfig.end_time}
                      onChange={(e) => setMeetConfig({ ...meetConfig, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={createMeetClass} className="w-full">
                  Criar Aula
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="max-w-4xl">
        <EventsManager />
      </div>
    </div>
  );
}

export default EventsPage;
