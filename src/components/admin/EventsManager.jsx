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
import { Calendar, Users, Plus, Trash2, Edit, Video, VideoOff, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase"; // Certifique-se de que este caminho está correto

function EventsManager() {
  const { toast } = useToast();
  const [showEvents, setShowEvents] = React.useState(true);
  const [events, setEvents] = React.useState([]);
  const [editingEvent, setEditingEvent] = React.useState(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState('zoom');
  const [meetConfig, setMeetConfig] = React.useState({
    title: '',
    description: '',
    meet_link: '',
    start_time: '',
    end_time: '',
  });

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

  // Função para criar aula no Google Meet
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

      // Converte as datas para UTC mantendo o horário local
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

      // Formata as datas no formato ISO com o fuso horário correto
      const formattedStartTime = startTime.toISOString();
      const formattedEndTime = endTime.toISOString();

      console.log('Criando aula com horários:', {
        start: formattedStartTime,
        end: formattedEndTime,
        localStart: startTime.toLocaleString('pt-BR'),
        localEnd: endTime.toLocaleString('pt-BR')
      });

      const { error } = await supabase
        .from('live_classes')
        .insert([{
          title: meetConfig.title,
          description: meetConfig.description,
          meet_link: meetConfig.meet_link,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
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

  // Função para alternar entre os provedores
  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    if (provider === 'meet') {
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seleção de Provedores de Videoconferência */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Provedores de Videoconferência</h2>
        <div className="flex flex-wrap gap-4">
          <Button
            variant={selectedProvider === 'zoom' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => handleProviderChange('zoom')}
          >
            <Video className="w-4 h-4" />
            Zoom
          </Button>
          
          <Button
            variant={selectedProvider === 'meet' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => handleProviderChange('meet')}
          >
            <MessageSquare className="w-4 h-4" />
            Google Meet
          </Button>
          
          <Button
            variant={selectedProvider === 'teams' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => handleProviderChange('teams')}
          >
            <Video className="w-4 h-4" />
            Microsoft Teams
          </Button>
        </div>
      </Card>

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
          <Dialog open={isDialogOpen && selectedProvider !== 'meet'} onOpenChange={setIsDialogOpen}>
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

        <Dialog open={isDialogOpen && selectedProvider === 'meet'} onOpenChange={setIsDialogOpen}>
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
