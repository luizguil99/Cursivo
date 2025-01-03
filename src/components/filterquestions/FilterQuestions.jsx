import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Search,
  X,
  Eye,
  BookOpen,
  GraduationCap,
  School,
  CalendarDays,
  BookText,
  Filter,
  Sparkles,
  Loader2,
} from "lucide-react";
import Sidebar from "../courses/Sidebar";
import {
  fetchQuestoes,
  fetchDisciplinas,
  fetchAssuntos,
  fetchBancas,
} from "@/services/questoesService";
import QuestionList from "./QuestionList";

const TOPICS = [
  { value: "algebra", label: "Álgebra" },
  { value: "geometria", label: "Geometria" },
  { value: "trigonometria", label: "Trigonometria" },
  { value: "estatistica", label: "Estatística" },
  { value: "probabilidade", label: "Probabilidade" },
];

const INSTITUTIONS = [
  { value: "enem", label: "ENEM" },
  { value: "unicamp", label: "UNICAMP" },
  { value: "fuvest", label: "FUVEST" },
  { value: "unesp", label: "UNESP" },
];

const YEARS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});

export default function FilterQuestions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState("all");
  const [selectedAssunto, setSelectedAssunto] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para as opções de filtro
  const [disciplinas, setDisciplinas] = useState([]);
  const [assuntos, setAssuntos] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  // Carregar opções de filtro
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        console.log("Carregando disciplinas..."); // Debug
        const [disciplinasData, bancasData] = await Promise.all([
          fetchDisciplinas(),
          fetchBancas(),
        ]);
        console.log("Disciplinas carregadas:", disciplinasData); // Debug
        setDisciplinas(disciplinasData);
        setInstitutions(bancasData);
      } catch (err) {
        console.error("Erro ao carregar opções de filtro:", err);
      }
    };

    loadFilterOptions();
  }, []);

  // Carregar assuntos quando a disciplina mudar
  useEffect(() => {
    const loadAssuntos = async () => {
      if (selectedDisciplina === "all") {
        setAssuntos([]);
        return;
      }

      try {
        console.log("Carregando tópicos para disciplina:", selectedDisciplina);
        const topicosData = await fetchAssuntos(selectedDisciplina);
        console.log("Tópicos encontrados:", topicosData);
        setAssuntos(topicosData);
      } catch (err) {
        console.error("Erro ao carregar tópicos:", err);
      }
    };

    loadAssuntos();
  }, [selectedDisciplina]);

  // Buscar questões quando os filtros mudarem
  useEffect(() => {
    loadQuestions();
  }, [selectedDisciplina, selectedAssunto, selectedInstitution, searchQuery]);

  // Função para buscar questões
  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Buscando questões com filtros:", {
        disciplina: selectedDisciplina,
        topico: selectedAssunto,
        searchQuery,
        bancaExaminadora: selectedInstitution,
      });

      const data = await fetchQuestoes({
        disciplina: selectedDisciplina,
        assunto: selectedAssunto,
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

  // Limpar filtros
  const clearFilters = () => {
    setSelectedDisciplina("all");
    setSelectedAssunto("all");
    setSelectedInstitution("all");
    setSelectedYear("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <Sidebar />

        <div className="flex-1">
          <div className="w-full max-w-6xl mx-auto px-4 py-8">
            {/* Header da página */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-[#F3C92C]" />
                Banco de Questões
              </h1>
              <p className="mt-2 text-gray-600">
                Encontre questões específicas para seus estudos
              </p>
            </div>

            {/* Card de Filtros */}
            <div className="bg-white rounded-2xl border border-[#F3C92C] overflow-hidden">
              {/* Cabeçalho do Card */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#F3C92C]/5 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-[#F3C92C]" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Filtrar Questões
                    </h2>
                  </div>
                  <Badge className="bg-[#F3C92C] text-white font-medium">
                    {selectedDisciplina === "all" ? "0" : "1"} filtro ativo
                  </Badge>
                </div>
              </div>

              {/* Filtros Principais */}
              <div className="p-6 space-y-6">
                {/* Grid de Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Disciplina */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <BookText className="h-4 w-4 text-[#F3C92C]" />
                      Disciplina<span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select
                      value={selectedDisciplina}
                      onValueChange={setSelectedDisciplina}
                    >
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue
                          placeholder="Selecione a disciplina"
                          className="text-gray-600"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Todas as disciplinas
                        </SelectItem>
                        {disciplinas &&
                          disciplinas.length > 0 &&
                          disciplinas.map((disciplina) => (
                            <SelectItem
                              key={disciplina.value}
                              value={disciplina.value}
                            >
                              {disciplina.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assunto */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#F3C92C]" />
                      Assunto
                    </label>
                    <Select
                      value={selectedAssunto}
                      onValueChange={setSelectedAssunto}
                      disabled={selectedDisciplina === "all"}
                    >
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue
                          placeholder={
                            selectedDisciplina === "all"
                              ? "Selecione uma disciplina primeiro"
                              : "Todos os assuntos"
                          }
                          className="text-gray-600"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os assuntos</SelectItem>
                        {assuntos.map((assunto) => (
                          <SelectItem key={assunto.value} value={assunto.value}>
                            {assunto.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Instituição */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <School className="h-4 w-4 text-[#F3C92C]" />
                      Instituição
                    </label>
                    <Select
                      value={selectedInstitution}
                      onValueChange={setSelectedInstitution}
                    >
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue
                          placeholder="Todas Instituições"
                          className="text-gray-600"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas Instituições</SelectItem>
                        {institutions.map((inst) => (
                          <SelectItem key={inst.value} value={inst.value}>
                            {inst.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ano */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#F3C92C]" />
                      Ano
                    </label>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                      disabled={true}
                    >
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue
                          placeholder="Coluna ainda não disponível"
                          className="text-gray-600"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Anos</SelectItem>
                        {YEARS.map((year) => (
                          <SelectItem key={year.value} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Barra de Pesquisa */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">
                    Procurar por
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Digite um trecho da questão"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11 pl-11 bg-white border-2 border-gray-200 focus-visible:border-[#F4CE41] focus-visible:ring-1 focus-visible:ring-[#F4CE41] focus:border-[#F4CE41] focus:ring-1 focus:ring-[#F4CE41] focus-within:border-[#F4CE41] focus-within:ring-1 focus-within:ring-[#F4CE41] outline-none"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 text-gray-700 border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar filtros
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-9 px-6 bg-[#F3C92C] text-white font-semibold hover:bg-[#F3C92C]/90 transition-all duration-200"
                      onClick={loadQuestions}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Buscar questões
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Questões */}
            <div className="mt-6">
              <QuestionList
                questions={questions}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
