import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminQuestions() {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [existingTopics, setExistingTopics] = useState([]);
  const [isNewTopic, setIsNewTopic] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [newQuestion, setNewQuestion] = useState({
    topico: "",
    questao: "",
    url_imagem: "",
    opcoes: ["", "", "", "", ""],
    resposta_correta: 0,
    video_solucao: "",
    assunto: "",
    banca_examinadora: "",
  });

  useEffect(() => {
    fetchQuestions();
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!newQuestion.assunto) return;
      
      try {
        const { data: questionsData, error } = await supabase
          .from('questoes')
          .select('topico')
          .eq('assunto', newQuestion.assunto)
          .not('topico', 'is', null);
        
        if (error) throw error;
        
        const topics = new Set(questionsData.map(q => q.topico));
        setExistingTopics(Array.from(topics));
      } catch (error) {
        console.error("Erro ao buscar tópicos:", error);
      }
    };

    fetchTopics();
  }, [newQuestion.assunto]);

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('cursos')
        .select('*');
      
      if (error) throw error;
      
      setCourses(coursesData);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data: questionsData, error } = await supabase
        .from('questoes')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      
      setQuestions(questionsData);
    } catch (error) {
      console.error("Erro ao buscar questões:", error);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('questoes')
        .insert([{
          topico: newQuestion.topico,
          questao: newQuestion.questao,
          url_imagem: newQuestion.url_imagem,
          opcoes: newQuestion.opcoes,
          resposta_correta: newQuestion.resposta_correta,
          video_solucao: newQuestion.video_solucao,
          assunto: newQuestion.assunto,
          banca_examinadora: newQuestion.banca_examinadora,
          criado_por: currentUser.id,
          criado_em: new Date().toISOString(),
        }])
        .select();

      if (error) throw error;

      setIsAddQuestionDialogOpen(false);
      setNewQuestion({
        topico: "",
        questao: "",
        url_imagem: "",
        opcoes: ["", "", "", "", ""],
        resposta_correta: 0,
        video_solucao: "",
        assunto: "",
        banca_examinadora: "",
      });
      
      fetchQuestions();
      toast({
        title: "Sucesso!",
        description: "Questão adicionada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao adicionar questão:", error);
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Erro ao adicionar questão: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta questão?")) return;

    try {
      const { error } = await supabase
        .from('questoes')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
      
      fetchQuestions();
      toast({
        title: "Sucesso!",
        description: "Questão excluída com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir questão:", error);
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Erro ao excluir questão: " + error.message,
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Questões</h2>
        <Button onClick={() => setIsAddQuestionDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nova Questão
        </Button>
      </div>

      <Dialog
        open={isAddQuestionDialogOpen}
        onOpenChange={setIsAddQuestionDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Questão</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da questão que você deseja adicionar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="subject">Matéria</Label>
                <Select
                  value={newQuestion.assunto}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, assunto: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.titulo}>
                        {course.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tópico</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="existingTopic"
                      checked={!isNewTopic}
                      onChange={() => setIsNewTopic(false)}
                      className="mr-2"
                    />
                    <label htmlFor="existingTopic">Usar tópico existente</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="newTopic"
                      checked={isNewTopic}
                      onChange={() => setIsNewTopic(true)}
                      className="mr-2"
                    />
                    <label htmlFor="newTopic">Criar novo tópico</label>
                  </div>
                </div>

                {isNewTopic ? (
                  <Input
                    value={newQuestion.topico}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, topico: e.target.value })
                    }
                    placeholder="Digite o novo tópico"
                    className="mt-2"
                  />
                ) : (
                  <Select
                    value={newQuestion.topico}
                    onValueChange={(value) =>
                      setNewQuestion({ ...newQuestion, topico: value })
                    }
                    className="mt-2"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tópico" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingTopics.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="examBoard">Banca</Label>
                <Input
                  id="examBoard"
                  value={newQuestion.banca_examinadora}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, banca_examinadora: e.target.value })
                  }
                  placeholder="Digite a banca"
                />
              </div>

              <div>
                <Label htmlFor="question">Enunciado da Questão</Label>
                <Input
                  id="question"
                  value={newQuestion.questao}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, questao: e.target.value })
                  }
                  placeholder="Digite o enunciado da questão"
                />
              </div>

              <div>
                <Label htmlFor="image">URL da Imagem (opcional)</Label>
                <Input
                  id="image"
                  value={newQuestion.url_imagem}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, url_imagem: e.target.value })
                  }
                  placeholder="Cole a URL da imagem"
                />
              </div>

              <div>
                <Label>Opções de Resposta</Label>
                {newQuestion.opcoes.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.opcoes];
                        newOptions[index] = e.target.value;
                        setNewQuestion({ ...newQuestion, opcoes: newOptions });
                      }}
                      placeholder={`Opção ${index + 1}`}
                    />
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={newQuestion.resposta_correta === index}
                      onChange={() =>
                        setNewQuestion({
                          ...newQuestion,
                          resposta_correta: index,
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="solutionVideo">URL do Vídeo da Solução (opcional)</Label>
                <Input
                  id="solutionVideo"
                  value={newQuestion.video_solucao}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      video_solucao: e.target.value,
                    })
                  }
                  placeholder="Cole a URL do vídeo da solução"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Adicionando..." : "Adicionar Questão"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matéria</TableHead>
              <TableHead>Tópico</TableHead>
              <TableHead>Banca</TableHead>
              <TableHead>Questão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>{question.assunto}</TableCell>
                <TableCell>{question.topico}</TableCell>
                <TableCell>{question.banca_examinadora}</TableCell>
                <TableCell className="max-w-md truncate">
                  {question.questao}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
