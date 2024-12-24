import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Users,
  Plus,
  Trash2,
  Edit,
  Video,
  VideoOff,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { DateTimePicker } from "@/components/ui/date-time-picker";

function EventsManager() {
  const { toast } = useToast();
  const [showEvents, setShowEvents] = React.useState(true);
  const [events, setEvents] = React.useState([]);
  const [editingEvent, setEditingEvent] = React.useState(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState("zoom");

  const [meetConfig, setMeetConfig] = React.useState({
    title: "",
    description: "",
    meet_link: "",
    start_time: new Date(),
    end_time: new Date(Date.now() + 60 * 60 * 1000), // Define o fim para 1 hora após o início
  });

  const resetMeetConfig = () => {
    setMeetConfig({
      title: "",
      description: "",
      meet_link: "",
      start_time: new Date(),
      end_time: new Date(Date.now() + 60 * 60 * 1000), // Define o fim para 1 hora após o início
    });
    setEditingEvent(null);
  };
  // Carregar eventos e configuração ao montar o componente
  React.useEffect(() => {
    fetchEvents();
    fetchEventsVisibility();
  }, []);

  // Buscar configuração de visibilidade
  const fetchEventsVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from("configuracoes_globais")
        .select("valor")
        .eq("chave", "mostrar_eventos")
        .single();

      if (error) throw error;
      setShowEvents(data?.valor ?? true);
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
      // Busca eventos da tabela live_classes
      const { data, error } = await supabase
        .from("live_classes")
        .select("*")
        .gte("end_time", new Date().toISOString()) // Filtra apenas eventos que ainda não terminaram
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Atualiza o estado com os eventos obtidos
      setEvents(data || []);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      toast({
        title: "Erro ao carregar eventos",
        description: "Não foi possível carregar a lista de eventos ao vivo.",
        variant: "destructive",
      });
    }
  };

  const handleToggleEvents = async (checked) => {
    try {
      const { error } = await supabase
        .from("configuracoes_globais")
        .update({ valor: checked })
        .eq("chave", "mostrar_eventos");

      if (error) throw error;

      setShowEvents(checked);
      toast({
        title: checked ? "Eventos ativados" : "Eventos desativados",
        description: checked
          ? "O componente de eventos está visível para todos os usuários"
          : "O componente de eventos está oculto para todos os usuários",
      });
    } catch (error) {
      console.error("Erro ao atualizar visibilidade:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a visibilidade dos eventos.",
        variant: "destructive",
      });
      setShowEvents(!checked);
    }
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();

    // Prepara os dados do evento
    const eventData = {
      title: meetConfig.title,
      description: meetConfig.description,
      meet_link: meetConfig.meet_link,
      start_time: meetConfig.start_time.toISOString(),
      end_time: meetConfig.end_time.toISOString(),
    };

    try {
      if (editingEvent) {
        // Atualiza um evento existente
        const { error } = await supabase
          .from("live_classes")
          .update(eventData)
          .eq("id", editingEvent.id);

        if (error) throw error;

        toast({
          title: "Evento atualizado",
          description: "As alterações foram salvas com sucesso",
        });
      } else {
        // Cria um novo evento
        const { error } = await supabase
          .from("live_classes")
          .insert([eventData]);

        if (error) throw error;

        toast({
          title: "Evento criado",
          description: "O novo evento foi adicionado com sucesso",
        });
      }

      // Atualiza a lista de eventos e reseta o formulário
      fetchEvents();
      resetMeetConfig();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o evento.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      // Confirma com o usuário antes de deletar
      if (!window.confirm("Tem certeza que deseja excluir esta aula?")) {
        return;
      }

      const { error } = await supabase
        .from("live_classes")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Aula excluída",
        description: "A aula foi removida com sucesso",
      });

      // Atualiza a lista de eventos
      fetchEvents();
    } catch (error) {
      console.error("Erro ao excluir aula:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a aula.",
        variant: "destructive",
      });
    }
  };

  // Função para formatar data e hora
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    if (provider === "meet") {
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Provedores de Videoconferência
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button
            variant={selectedProvider === "zoom" ? "default" : "outline"}
            className="flex items-center gap-2"
            onClick={() => handleProviderChange("zoom")}
          >
            <Video className="w-4 h-4" />
            Zoom
          </Button>
          <Button
            variant={selectedProvider === "meet" ? "default" : "outline"}
            className="flex items-center gap-2"
            onClick={() => handleProviderChange("meet")}
          >
            <MessageSquare className="w-4 h-4" />
            Google Meet
          </Button>
          <Button
            variant={selectedProvider === "teams" ? "default" : "outline"}
            className="flex items-center gap-2"
            onClick={() => handleProviderChange("teams")}
          >
            <Video className="w-4 h-4" />
            Microsoft Teams
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="space-y-0.5">
            <Label htmlFor="show-events">
              Mostrar Notificação de Eventos em Comunidade
            </Label>
            <p className="text-sm text-muted-foreground">
              Ativar/desativar o componente de eventos do dia
            </p>
          </div>
          <Switch
            id="show-events"
            checked={showEvents}
            onCheckedChange={handleToggleEvents}
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Próximos Eventos</h3>
          <Dialog
            open={isDialogOpen && selectedProvider !== "meet"}
            onOpenChange={setIsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Editar Evento" : "Adicionar Novo Evento"}
                </DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmitEvent}>
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Aula</Label>
                  <Input
                    id="title"
                    value={meetConfig.title}
                    onChange={(e) =>
                      setMeetConfig({ ...meetConfig, title: e.target.value })
                    }
                    placeholder="Ex: Aula de Matemática"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={meetConfig.description}
                    onChange={(e) =>
                      setMeetConfig({
                        ...meetConfig,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ex: Aula sobre equações do segundo grau"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meet_link">Link da Aula</Label>
                  <Input
                    id="meet_link"
                    value={meetConfig.meet_link}
                    onChange={(e) =>
                      setMeetConfig({
                        ...meetConfig,
                        meet_link: e.target.value,
                      })
                    }
                    placeholder="Ex: https://meet.google.com/..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Início</Label>
                    <DateTimePicker
                      value={meetConfig.start_time}
                      onChange={(date) =>
                        setMeetConfig({ ...meetConfig, start_time: date })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Término</Label>
                    <DateTimePicker
                      value={meetConfig.end_time}
                      onChange={(date) =>
                        setMeetConfig({ ...meetConfig, end_time: date })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetMeetConfig();
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEvent ? "Atualizar" : "Criar"} Aula
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Dialog
          open={isDialogOpen && selectedProvider === "meet"}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetMeetConfig();
            }
          }}
          modal={true}
        >
          <DialogContent
            className="max-w-xl overflow-visible"
            onPointerDownOutside={(e) => {
              const target = e.target;
              if (
                target.closest(".rdp") ||
                target.closest('[role="listbox"]')
              ) {
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              const activeElement = document.activeElement;
              if (
                activeElement?.closest(".rdp") ||
                activeElement?.closest('[role="listbox"]')
              ) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Nova Aula</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para agendar uma nova aula.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <form onSubmit={handleSubmitEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Aula *</Label>
                  <Input
                    id="title"
                    value={meetConfig.title}
                    onChange={(e) =>
                      setMeetConfig({ ...meetConfig, title: e.target.value })
                    }
                    placeholder="Ex: Aula de Matemática"
                    required
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={meetConfig.description}
                    onChange={(e) =>
                      setMeetConfig({
                        ...meetConfig,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ex: Revisão para a prova"
                    aria-label="Descrição da aula"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meet_link">Link do Google Meet *</Label>
                  <Input
                    id="meet_link"
                    value={meetConfig.meet_link}
                    onChange={(e) =>
                      setMeetConfig({
                        ...meetConfig,
                        meet_link: e.target.value,
                      })
                    }
                    placeholder="https://meet.google.com/..."
                    required
                    aria-required="true"
                  />
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <DateTimePicker
                      label="Início da Aula *"
                      date={meetConfig.start_time}
                      setDate={(date) =>
                        setMeetConfig({ ...meetConfig, start_time: date })
                      }
                    />
                  </div>

                  <div className="relative">
                    <DateTimePicker
                      label="Término da Aula *"
                      date={meetConfig.end_time}
                      setDate={(date) =>
                        setMeetConfig({ ...meetConfig, end_time: date })
                      }
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#F3C92C] hover:bg-[#E3B91C] text-black"
                >
                  Criar Aula
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Calendar className="h-8 w-8" />
                      <p>Nenhuma aula agendada</p>
                      <p className="text-sm">
                        Clique em "Nova Aula" para agendar uma aula
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell>{formatDateTime(event.start_time)}</TableCell>
                    <TableCell>{formatDateTime(event.end_time)}</TableCell>
                    <TableCell>
                      <a
                        href={event.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Acessar
                      </a>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMeetConfig({
                            title: event.title,
                            description: event.description,
                            meet_link: event.meet_link,
                            start_time: new Date(event.start_time),
                            end_time: new Date(event.end_time),
                          });
                          setEditingEvent(event);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default EventsManager;
