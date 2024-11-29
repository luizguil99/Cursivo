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
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    topic: "",
    question: "",
    image: "",
    options: ["", "", "", "", ""],
    correctAnswer: 0,
    solutionVideo: "",
    subject: "",
    examBoard: "", // Nova propriedade para a banca
  });

  useEffect(() => {
    fetchQuestions();
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!newQuestion.subject) return;
      
      try {
        const questionsRef = collection(db, "questions");
        const q = query(questionsRef, where("subject", "==", newQuestion.subject));
        const querySnapshot = await getDocs(q);
        
        const topics = new Set();
        querySnapshot.docs.forEach(doc => {
          const topic = doc.data().topic;
          if (topic) topics.add(topic);
        });
        
        setExistingTopics(Array.from(topics));
      } catch (error) {
        console.error("Erro ao buscar tópicos:", error);
      }
    };

    fetchTopics();
  }, [newQuestion.subject]);

  const fetchCourses = async () => {
    try {
      const coursesRef = collection(db, "courses");
      const coursesSnapshot = await getDocs(coursesRef);
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(coursesData);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const questionsRef = collection(db, "questions");
      const questionsSnapshot = await getDocs(questionsRef);
      const questionsData = questionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestions(questionsData);
    } catch (error) {
      console.error("Erro ao buscar questões:", error);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addDoc(collection(db, "questions"), {
        ...newQuestion,
        createdAt: serverTimestamp(),
        createdBy: currentUser.email,
      });

      setIsAddQuestionDialogOpen(false);
      setNewQuestion({
        topic: "",
        question: "",
        image: "",
        options: ["", "", "", "", ""],
        correctAnswer: 0,
        solutionVideo: "",
        subject: "",
        examBoard: "", // Nova propriedade para a banca
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
      await deleteDoc(doc(db, "questions", questionId));
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
                  value={newQuestion.subject}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, subject: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="examBoard" className="flex items-center gap-2">
                  Banca
                  <span className="text-sm text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="examBoard"
                  value={newQuestion.examBoard}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, examBoard: e.target.value })
                  }
                  placeholder="Ex: FUVEST, UNICAMP, ENEM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Tópico</Label>
                <div className="flex gap-2 items-center mb-2">
                  <Button
                    type="button"
                    variant={isNewTopic ? "default" : "outline"}
                    onClick={() => setIsNewTopic(true)}
                    size="sm"
                  >
                    Novo Tópico
                  </Button>
                  <Button
                    type="button"
                    variant={!isNewTopic ? "default" : "outline"}
                    onClick={() => setIsNewTopic(false)}
                    size="sm"
                  >
                    Tópico Existente
                  </Button>
                </div>
                {isNewTopic ? (
                  <Input
                    id="topic"
                    value={newQuestion.topic}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        topic: e.target.value,
                      })
                    }
                    placeholder="Digite o novo tópico"
                  />
                ) : (
                  <Select
                    value={newQuestion.topic}
                    onValueChange={(value) =>
                      setNewQuestion({
                        ...newQuestion,
                        topic: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tópico existente" />
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
                <Label htmlFor="question">Enunciado da Questão</Label>
                <Input
                  id="question"
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      question: e.target.value,
                    })
                  }
                  placeholder="Digite o enunciado da questão"
                />
              </div>
              <div>
                <Label htmlFor="image">URL da Imagem (opcional)</Label>
                <Input
                  id="image"
                  value={newQuestion.image}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      image: e.target.value,
                    })
                  }
                  placeholder="Cole a URL da imagem"
                />
              </div>
              <div>
                <Label>Opções de Resposta</Label>
                {newQuestion.options.slice(0, 4).map((option, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({
                          ...newQuestion,
                          options: newOptions,
                        });
                      }}
                      placeholder={`Opção ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant={newQuestion.correctAnswer === index ? "default" : "outline"}
                      onClick={() =>
                        setNewQuestion({
                          ...newQuestion,
                          correctAnswer: index,
                        })
                      }
                      className={newQuestion.correctAnswer === index ? "bg-green-200 hover:bg-green-300 text-black border-green-300" : ""}
                    >
                      Correta
                    </Button>
                  </div>
                ))}
                {/* Quinta opção opcional */}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newQuestion.options[4]}
                    onChange={(e) => {
                      const newOptions = [...newQuestion.options];
                      newOptions[4] = e.target.value;
                      setNewQuestion({
                        ...newQuestion,
                        options: newOptions,
                      });
                    }}
                    placeholder="Opção 5 (opcional)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={newQuestion.correctAnswer === 4 ? "default" : "outline"}
                    onClick={() =>
                      setNewQuestion({
                        ...newQuestion,
                        correctAnswer: 4,
                      })
                    }
                    className={newQuestion.correctAnswer === 4 ? "bg-green-200 hover:bg-green-300 text-black border-green-300" : ""}
                  >
                    Correta
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="solutionVideo">
                  URL do Vídeo de Resolução (opcional)
                </Label>
                <Input
                  id="solutionVideo"
                  value={newQuestion.solutionVideo}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      solutionVideo: e.target.value,
                    })
                  }
                  placeholder="Cole a URL do vídeo de resolução"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddQuestionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
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
              <TableHead>Questão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>{question.subject}</TableCell>
                <TableCell>{question.topic}</TableCell>
                <TableCell className="max-w-md truncate">
                  {question.question}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="hover:bg-destructive/20 hover:text-destructive"
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
