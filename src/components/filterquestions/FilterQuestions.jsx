import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookText, Search, X } from "lucide-react";
import { TopicFilter } from "./filters/TopicFilter";
import { ExamBoardFilter } from "./filters/ExamBoardFilter";
import { DifficultyFilter } from "./filters/DifficultyFilter";
import { FilterTags } from "./FilterTags";
import { QuestionCard } from "./QuestionCard";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  fetchQuestoes,
  fetchDisciplinas,
  fetchAssuntos,
  fetchBancas,
} from "@/services/questoesService";

export function FilterQuestions() {
  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState("all");
  const [selectedTopico, setSelectedTopico] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para as opções de filtro
  const [disciplinas, setDisciplinas] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // Carregar opções de filtro
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        console.log("Carregando disciplinas e bancas...");
        const [disciplinasData, bancasData] = await Promise.all([
          fetchDisciplinas(),
          fetchBancas(),
        ]);
        console.log("Disciplinas carregadas:", disciplinasData);
        console.log("Bancas carregadas:", bancasData);
        setDisciplinas(disciplinasData);
        setInstitutions(bancasData);
      } catch (err) {
        console.error("Erro ao carregar opções de filtro:", err);
      }
    };

    loadFilterOptions();
  }, []);

  // Carregar tópicos quando a disciplina mudar
  useEffect(() => {
    const loadTopicos = async () => {
      if (selectedDisciplina === "all") {
        console.log("Disciplina 'all' selecionada, limpando tópicos");
        setTopicos([]);
        return;
      }

      try {
        console.log("Carregando tópicos para disciplina:", selectedDisciplina);
        const topicosData = await fetchAssuntos(selectedDisciplina);
        console.log("Tópicos encontrados:", topicosData);
        setTopicos(topicosData);
      } catch (err) {
        console.error("Erro ao carregar tópicos:", err);
      }
    };

    loadTopicos();
  }, [selectedDisciplina]);

  // Função para buscar questões
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Buscando questões com filtros:", {
        disciplina: selectedDisciplina,
        topico: selectedTopico,
        searchQuery,
        bancaExaminadora: selectedInstitution
      });

      const data = await fetchQuestoes({
        disciplina: selectedDisciplina,
        assunto: selectedTopico,
        searchQuery,
        bancaExaminadora: selectedInstitution,
      });

      console.log("Questões encontradas:", data);
      setQuestions(data);
    } catch (err) {
      console.error("Erro ao buscar questões:", err);
      setError("Erro ao buscar questões. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Buscar questões quando os filtros mudarem
  useEffect(() => {
    loadQuestions();
  }, [selectedDisciplina, selectedTopico, selectedInstitution, searchQuery]);

  // Limpar filtros
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDisciplina("all");
    setSelectedTopico("all");
    setSelectedInstitution("all");
    setSelectedYear("all");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <div className="container mx-auto p-8">
            <div className="space-y-8">
              {/* Barra de pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar questões..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* Filtros */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-6">
                  {/* Disciplina */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <BookText className="h-4 w-4 text-[#F3C92C]" />
                      Disciplina<span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select
                      value={selectedDisciplina}
                      onValueChange={(value) => {
                        console.log("Disciplina selecionada:", value);
                        setSelectedDisciplina(value);
                        setSelectedTopico("all"); // Resetar tópico ao mudar disciplina
                      }}
                    >
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue placeholder="Selecione uma disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as disciplinas</SelectItem>
                        {disciplinas.map((disciplina) => (
                          <SelectItem key={disciplina.value} value={disciplina.value}>
                            {disciplina.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tópico */}
                  <TopicFilter
                    selectedSubject={selectedDisciplina}
                    selectedTopic={selectedTopico}
                    onTopicChange={setSelectedTopico}
                  />

                  {/* Banca Examinadora */}
                  <ExamBoardFilter
                    value={selectedInstitution}
                    onChange={setSelectedInstitution}
                    options={institutions}
                  />

                  {/* Botão Limpar Filtros */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tags de Filtro */}
              <FilterTags
                searchQuery={searchQuery}
                selectedDisciplina={selectedDisciplina}
                selectedTopico={selectedTopico}
                selectedInstitution={selectedInstitution}
                selectedYear={selectedYear}
                disciplinas={disciplinas}
                topicos={topicos}
                institutions={institutions}
                onClearFilter={(filter) => {
                  switch (filter) {
                    case "search":
                      setSearchQuery("");
                      break;
                    case "disciplina":
                      setSelectedDisciplina("all");
                      setSelectedTopico("all");
                      break;
                    case "topico":
                      setSelectedTopico("all");
                      break;
                    case "institution":
                      setSelectedInstitution("all");
                      break;
                    case "year":
                      setSelectedYear("all");
                      break;
                    default:
                      break;
                  }
                }}
              />

              {/* Lista de Questões */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Questões Encontradas
                  </h2>
                  <span className="text-sm text-gray-500">
                    {questions.length} questões
                  </span>
                </div>

                {loading ? (
                  <div>Carregando questões...</div>
                ) : error ? (
                  <div className="text-red-500">{error}</div>
                ) : questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <QuestionCard key={question.id} question={question} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Nenhuma questão encontrada com os filtros selecionados.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
