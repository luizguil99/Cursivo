import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Video, Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LiveClassManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [classes, setClasses] = React.useState([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newClass, setNewClass] = React.useState({
    title: '',
    description: '',
    meet_link: '',
    start_time: '',
    end_time: '',
  });

  // Busca todas as aulas
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      setClasses(data);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as aulas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cria uma nova aula
  const createClass = async () => {
    try {
      // Validações básicas
      if (!newClass.title || !newClass.meet_link || !newClass.start_time || !newClass.end_time) {
        toast({
          title: "Campos Obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      const startTime = new Date(newClass.start_time);
      const endTime = new Date(newClass.end_time);

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
          ...newClass,
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Aula Criada",
        description: "A aula ao vivo foi criada com sucesso!",
      });

      setIsDialogOpen(false);
      setNewClass({
        title: '',
        description: '',
        meet_link: '',
        start_time: '',
        end_time: '',
      });
      fetchClasses();
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a aula.",
        variant: "destructive",
      });
    }
  };

  // Remove uma aula
  const deleteClass = async (id) => {
    try {
      const { error } = await supabase
        .from('live_classes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Aula Removida",
        description: "A aula foi removida com sucesso.",
      });

      fetchClasses();
    } catch (error) {
      console.error('Erro ao remover aula:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a aula.",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    fetchClasses();
  }, []);

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Aulas ao Vivo</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Aula ao Vivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Aula</Label>
                <Input
                  id="title"
                  value={newClass.title}
                  onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                  placeholder="Ex: Aula de Matemática"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="Ex: Revisão para a prova"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meet_link">Link do Google Meet</Label>
                <Input
                  id="meet_link"
                  value={newClass.meet_link}
                  onChange={(e) => setNewClass({ ...newClass, meet_link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Início</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={newClass.start_time}
                    onChange={(e) => setNewClass({ ...newClass, start_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">Término</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={newClass.end_time}
                    onChange={(e) => setNewClass({ ...newClass, end_time: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={createClass} className="w-full">
                Criar Aula
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {classes.map((cls) => (
          <Card key={cls.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">{cls.title}</h3>
                </div>
                {cls.description && (
                  <p className="text-sm text-muted-foreground">{cls.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(cls.start_time)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateTime(cls.end_time)}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteClass(cls.id)}
                className="text-destructive hover:text-destructive/90"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {classes.length === 0 && (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <Calendar className="w-12 h-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Nenhuma Aula Agendada</h3>
              <p className="text-sm text-muted-foreground">
                Clique em "Nova Aula" para criar uma aula ao vivo.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveClassManager;
