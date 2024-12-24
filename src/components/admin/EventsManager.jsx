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

function EventsManager() {
  const { toast } = useToast();
  const [showEvents, setShowEvents] = React.useState(true);
  const [events, setEvents] = React.useState([
    {
      id: 1,
      title: "Encontro de Estudos",
      time: "14:00",
      maxParticipants: 8,
      participants: 3,
    },
    {
      id: 2,
      title: "Tira Dúvidas",
      time: "16:30",
      maxParticipants: 12,
      participants: 5,
    },
  ]);

  const handleToggleEvents = async (checked) => {
    setShowEvents(checked);
    localStorage.setItem("showDailyEvents", checked.toString());
    
    toast({
      title: checked ? "Eventos ativados" : "Eventos desativados",
      description: checked 
        ? "O componente de eventos está visível para os usuários" 
        : "O componente de eventos está oculto para os usuários",
    });
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
    toast({
      title: "Evento removido",
      description: "O evento foi removido com sucesso",
    });
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
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Evento</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Evento</Label>
                  <Input id="title" placeholder="Ex: Encontro de Estudos" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input id="time" type="time" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="1"
                      placeholder="Ex: 10"
                    />
                  </div>
                </div>
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" type="submit">
                  Adicionar Evento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Participantes</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{event.time}</TableCell>
                <TableCell>
                  {event.participants}/{event.maxParticipants}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default EventsManager;
