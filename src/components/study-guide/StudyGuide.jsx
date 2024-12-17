import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { studyGuideData } from "@/data/studyGuideData";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/ui/use-toast";
import { useProgressCache } from "@/hooks/useProgressCache";

const subjects = [
  { id: "matematica", name: "Matemática" },
  {
    id: "historia",
    name: "História",
    submenu: [
      { id: "historia", name: "História Geral" },
      { id: "historia-brasil", name: "História do Brasil" },
    ],
  },
  {
    id: "geografia",
    name: "Geografia",
    submenu: [
      { id: "geografia-humana", name: "Geografia Humana" },
      { id: "geografia-fisica", name: "Geografia Física" },
    ],
  },
  { id: "biologia", name: "Biologia" },
  { id: "fisica", name: "Física" },
  { id: "literatura", name: "Literatura" },
];

function StudyGuide() {
  const [expandedSubject, setExpandedSubject] = React.useState(null);
  const [selectedSubject, setSelectedSubject] = React.useState("matematica");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [topicsProgress, setTopicsProgress] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadProgress, updateProgress } = useProgressCache();

  // Carregar progresso dos tópicos
  useEffect(() => {
    if (selectedSubject) {
      console.log("Carregando progresso para disciplina:", selectedSubject);
      loadTopicsProgress();
    }
  }, [selectedSubject]);

  const loadTopicsProgress = async () => {
    try {
      setIsLoading(true);
      setTopicsProgress({});

      const progress = await loadProgress(selectedSubject);
      if (progress) {
        setTopicsProgress(progress);
      }
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
      toast({
        title: "Erro ao carregar progresso",
        description: "Não foi possível carregar seu progresso. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = async (topicName, field) => {
    try {
      const currentProgress = topicsProgress[topicName] || {};
      const newValue = !currentProgress[field];

      // Atualiza o estado local imediatamente
      setTopicsProgress(prev => ({
        ...prev,
        [topicName]: {
          ...prev[topicName],
          [field]: newValue,
        },
      }));

      // Atualiza no banco e no cache
      await updateProgress(selectedSubject, topicName, field, newValue);
    } catch (error) {
      console.error("Erro ao atualizar checkbox:", error);
      // Reverte a mudança em caso de erro
      setTopicsProgress(prev => ({
        ...prev,
        [topicName]: {
          ...prev[topicName],
          [field]: !newValue,
        },
      }));

      let errorMessage = "Não foi possível salvar sua alteração.";
      if (error.message === "Usuário não autenticado") {
        errorMessage = "Você precisa estar logado para salvar seu progresso.";
      }
      toast({
        title: "Erro ao atualizar progresso",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRevisaoChange = async (topicName, value) => {
    try {
      const oldValue = topicsProgress[topicName]?.revisao_status || "Não revisado";

      // Atualiza o estado local imediatamente
      setTopicsProgress(prev => ({
        ...prev,
        [topicName]: {
          ...prev[topicName],
          revisao_status: value,
        },
      }));

      // Atualiza no banco e no cache
      await updateProgress(selectedSubject, topicName, "revisao_status", value);
    } catch (error) {
      console.error("Erro ao atualizar revisão:", error);
      // Reverte a mudança em caso de erro
      setTopicsProgress(prev => ({
        ...prev,
        [topicName]: {
          ...prev[topicName],
          revisao_status: oldValue,
        },
      }));

      let errorMessage = "Não foi possível salvar sua alteração.";
      if (error.message === "Usuário não autenticado") {
        errorMessage = "Você precisa estar logado para salvar seu progresso.";
      }
      toast({
        title: "Erro ao atualizar revisão",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSubjectClick = (subject) => {
    if (subject.submenu) {
      setExpandedSubject(expandedSubject === subject.id ? null : subject.id);
    } else {
      setSelectedSubject(subject.id);
      setExpandedSubject(null);
    }
  };

  const topics = studyGuideData[selectedSubject]?.topics || [];
  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentSubject =
    subjects.find((s) => {
      if (s.id === selectedSubject) return s.name;
      if (s.submenu) {
        const subItem = s.submenu.find((sub) => sub.id === selectedSubject);
        if (subItem) return subItem.name;
      }
      return false;
    })?.name ||
    subjects
      .find((s) => s.submenu?.find((sub) => sub.id === selectedSubject))
      ?.submenu?.find((sub) => sub.id === selectedSubject)?.name;

  // Componente de loading para um tópico
  const TopicSkeleton = () => (
    <div className="space-y-4 mb-6">
      <Skeleton className="h-4 w-3/4" />
      <div className="pl-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => navigate("/courses")}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <ThemeToggle />
          </div>

          <nav className="space-y-1">
            {subjects.map((subject) => (
              <div key={subject.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-left mb-1",
                    selectedSubject === subject.id ? "bg-accent" : ""
                  )}
                  onClick={() => handleSubjectClick(subject)}
                >
                  <span>{subject.name}</span>
                  {subject.submenu && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedSubject === subject.id ? "rotate-180" : ""
                      )}
                    />
                  )}
                </Button>
                {subject.submenu && expandedSubject === subject.id && (
                  <div className="ml-4 space-y-1">
                    {subject.submenu.map((submenu) => (
                      <Button
                        key={submenu.id}
                        variant="ghost"
                        className={cn(
                          "w-full text-left pl-4",
                          selectedSubject === submenu.id ? "bg-accent" : "",
                          "hover:bg-accent/50"
                        )}
                        onClick={() => setSelectedSubject(submenu.id)}
                      >
                        {submenu.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Guia de Estudos</h1>
              <h2 className="text-lg text-muted-foreground">
                {currentSubject}
              </h2>
              <p className="text-sm text-muted-foreground">
                O gráfico abaixo mostra a relevância e a probabilidade do
                conteúdo cair no ENEM.
              </p>
            </div>
            <input
              type="text"
              placeholder="Buscar tópicos..."
              className="px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[#F3C92C] dark:bg-muted"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {isLoading
              ? // Mostra 5 skeletons durante o carregamento
                Array(5)
                  .fill(0)
                  .map((_, index) => <TopicSkeleton key={index} />)
              : filteredTopics.map((topic, index) => {
                  const getRelevanceColor = (relevance) => {
                    if (relevance >= 80) return "#22c55e"; // Verde para alta relevância
                    if (relevance >= 50) return "#F3C92C"; // Amarelo para média relevância
                    return "#ef4444"; // Vermelho para baixa relevância
                  };

                  return (
                    <div key={index} className="p-4 border rounded-lg bg-card">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2 flex justify-center">
                          <div className="relative w-20 h-20">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-muted/20"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="none"
                                stroke={getRelevanceColor(topic.relevance)}
                                strokeWidth="6"
                                strokeDasharray={`${
                                  topic.relevance * 2.26
                                } 226`}
                                className="transition-all duration-300"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-base font-medium">
                                {topic.relevance}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <h3 className="text-sm text-muted-foreground mb-1">
                            Assunto
                          </h3>
                          <p className="font-medium">{topic.name}</p>
                        </div>
                        <div className="col-span-6 grid grid-cols-4 gap-4">
                          <div className="flex flex-col items-center">
                            <Checkbox
                              id={`teoria-${index}`}
                              checked={!!topicsProgress[topic.name]?.teoria}
                              onCheckedChange={() =>
                                handleCheckboxChange(topic.name, "teoria")
                              }
                            />
                            <label
                              htmlFor={`teoria-${index}`}
                              className="text-sm mt-1"
                            >
                              Teoria
                            </label>
                          </div>
                          <div className="flex flex-col items-center">
                            <Checkbox
                              id={`resumo-${index}`}
                              checked={!!topicsProgress[topic.name]?.resumo}
                              onCheckedChange={() =>
                                handleCheckboxChange(topic.name, "resumo")
                              }
                            />
                            <label
                              htmlFor={`resumo-${index}`}
                              className="text-sm mt-1"
                            >
                              Resumo
                            </label>
                          </div>
                          <div className="flex flex-col items-center">
                            <Checkbox
                              id={`exercicio-${index}`}
                              checked={!!topicsProgress[topic.name]?.exercicio}
                              onCheckedChange={() =>
                                handleCheckboxChange(topic.name, "exercicio")
                              }
                            />
                            <label
                              htmlFor={`exercicio-${index}`}
                              className="text-sm mt-1"
                            >
                              Exercício
                            </label>
                          </div>
                          <div>
                            <Select
                              value={
                                topicsProgress[topic.name]?.revisao_status ||
                                "Não revisado"
                              }
                              onValueChange={(value) =>
                                handleRevisaoChange(topic.name, value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Não revisado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Não revisado">
                                  Não revisado
                                </SelectItem>
                                <SelectItem value="1ª revisão">
                                  1ª revisão
                                </SelectItem>
                                <SelectItem value="2ª revisão">
                                  2ª revisão
                                </SelectItem>
                                <SelectItem value="3ª revisão">
                                  3ª revisão
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudyGuide;
