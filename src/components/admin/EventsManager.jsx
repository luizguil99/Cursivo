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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Users, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase"; // Certifique-se de que este caminho está correto

function EventsManager() {
  const { toast } = useToast();
  const [showEvents, setShowEvents] = React.useState(true);
  const [events, setEvents] = React.useState([]);
  const [editingEvent, setEditingEvent] = React.useState(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Carregar eventos e configuração ao montar o componente
  React.useEffect(() => {
    fetchEvents();
    fetchEventsVisibility();
  }, []);

  // Buscar configuração de visibilidade
  const fetchEventsVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_globais')
        .select('valor')
        .eq('chave', 'mostrar_eventos')
        .single();

      if (error) throw error;
      setShowEvents(data?.valor ?? true);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
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
      const { data, error } = await supabase
        .from('eventos_aovivo')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: "Erro ao carregar eventos",
        description: "Não foi possível carregar a lista de eventos.",
        variant: "destructive",
      });
    }
  };

  const handleToggleEvents = async (checked) => {
    try {
      // Atualizar no Supabase
      const { error } = await supabase
        .from('configuracoes_globais')
        .update({ valor: checked })
        .eq('chave', 'mostrar_eventos');

      if (error) throw error;

      // Atualizar estado local
      setShowEvents(checked);
      
      toast({
        title: checked ? "Eventos ativados" : "Eventos desativados",
        description: checked 
          ? "O componente de eventos está visível para todos os usuários" 
          : "O componente de eventos está oculto para todos os usuários",
      });
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a visibilidade dos eventos.",
        variant: "destructive",
      });
      // Reverter o estado em caso de erro
      setShowEvents(!checked);
    }
  };

  // Função para criar ou atualizar um evento
  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const eventData = {
      title: formData.get('title'),
      time: formData.get('time'),
      max_participants: parseInt(formData.get('maxParticipants')),
      event_link: formData.get('eventLink') || null,
      current_participants: editingEvent ? editingEvent.current_participants : 0,
      is_active: true,
    };

    try {
      if (editingEvent) {
        // Atualizar evento existente
        const { error } = await supabase
          .from('eventos_aovivo')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;

        toast({
          title: "Evento atualizado",
          description: "As alterações foram salvas com sucesso",
        });
      } else {
        // Criar novo evento
        const { error } = await supabase
          .from('eventos_aovivo')
          .insert([eventData]);

        if (error) throw error;

        toast({
          title: "Evento criado",
          description: "O novo evento foi adicionado com sucesso",
        });
      }

      // Recarregar eventos e resetar estado
      fetchEvents();
      setEditingEvent(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o evento.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const { error } = await supabase
        .from('eventos_aovivo')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Evento removido",
        description: "O evento foi removido com sucesso",
      });

      fetchEvents();
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: "Erro ao remover",
        description: "Ocorreu um erro ao remover o evento.",
        variant: "destructive",
      });
    }
  };

  // Função para formatar a hora para exibição
  const formatTimeForDisplay = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (error) {
      return timeString;
    }
  };

  // Função para formatar a hora para o input
  const formatTimeForInput = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (error) {
      return timeString;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="space-y-0.5">
            <Label htmlFor="show-events">Mostrar Eventos</Label>
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
          <h3 className="text-lg font-medium">Eventos Ativos</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
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
                  <Label htmlFor="title">Título do Evento</Label>
                  <Input 
                    id="title" 
                    name="title"
                    placeholder="Ex: Encontro de Estudos"
                    defaultValue={editingEvent?.title}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input 
                      id="time" 
                      name="time"
                      type="time"
                      defaultValue={editingEvent ? formatTimeForInput(editingEvent.time) : ''}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Participantes</Label>
                    <Input 
                      id="maxParticipants" 
                      name="maxParticipants"
                      type="number"
                      min="1"
                      defaultValue={editingEvent?.max_participants}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventLink">Link do Evento (opcional)</Label>
                  <Input 
                    id="eventLink" 
                    name="eventLink"
                    placeholder="Ex: https://meet.google.com/seu-link"
                    defaultValue={editingEvent?.event_link}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingEvent(null);
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600">
                    {editingEvent ? "Salvar Alterações" : "Criar Evento"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{formatTimeForDisplay(event.time)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {event.max_participants}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.event_link ? (
                      <a 
                        href={event.event_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {event.event_link}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem link</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEvent(event);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default EventsManager;
