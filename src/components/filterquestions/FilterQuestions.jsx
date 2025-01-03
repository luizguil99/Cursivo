import { useState } from "react";
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
import { Save, Search, X, Eye, BookOpen } from "lucide-react";
import Sidebar from "../courses/Sidebar";

const SUBJECTS = [
  { value: "matematica", label: "Matemática" },
  { value: "portugues", label: "Português" },
  { value: "historia", label: "História" },
  { value: "geografia", label: "Geografia" },
  { value: "fisica", label: "Física" },
  { value: "quimica", label: "Química" },
  { value: "biologia", label: "Biologia" },
  { value: "arte", label: "Arte" },
];

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
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  // Exemplo de questões (substitua por dados reais)
  const questions = [
    {
      id: 1,
      title: "Questão de Matemática - ENEM 2023",
      subject: "matematica",
      topic: "algebra",
      institution: "enem",
      year: "2023",
      content: "Em uma progressão aritmética de 5 termos...",
    },
    // Adicione mais questões de exemplo
  ];

  // Filtra as questões com base nos critérios selecionados
  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" || question.subject === selectedSubject;
    const matchesTopic =
      selectedTopic === "all" || question.topic === selectedTopic;
    const matchesInstitution =
      selectedInstitution === "all" ||
      question.institution === selectedInstitution;
    const matchesYear =
      selectedYear === "all" || question.year === selectedYear;

    return (
      matchesSearch &&
      matchesSubject &&
      matchesTopic &&
      matchesInstitution &&
      matchesYear
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1">
          <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl border border-[#F3C92C] overflow-hidden">
              {/* Cabeçalho */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#F3C92C]/5 to-white">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Filtrar Questões
                  <Badge className="bg-[#F3C92C] text-white ml-2 font-medium">
                    {selectedSubject === "all" ? "0" : "1"} filtro ativo
                  </Badge>
                </h2>
              </div>

              {/* Filtros Principais */}
              <div className="p-6 space-y-6">
                {/* Grid de Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Disciplina */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900 flex items-center">
                      Disciplina<span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue placeholder="Selecione a disciplina" className="text-gray-600" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as disciplinas</SelectItem>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject.value} value={subject.value}>
                            {subject.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assunto */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Assunto
                    </label>
                    <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue placeholder="Todos os assuntos" className="text-gray-600" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os assuntos</SelectItem>
                        {TOPICS.map((topic) => (
                          <SelectItem key={topic.value} value={topic.value}>
                            {topic.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Instituição */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Instituição
                    </label>
                    <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue placeholder="Todas Instituições" className="text-gray-600" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas Instituições</SelectItem>
                        {INSTITUTIONS.map((inst) => (
                          <SelectItem key={inst.value} value={inst.value}>
                            {inst.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ano */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Ano
                    </label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
                        <SelectValue placeholder="Todos Anos" className="text-gray-600" />
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
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar filtro
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-9 px-6 bg-[#F3C92C] text-white font-semibold hover:bg-[#F3C92C]/90 transition-all duration-200"
                    >
                      Buscar questões
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-4 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar filtro
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Questões */}
            <div className="mt-6 space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="p-6 border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {question.title}
                        </h3>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {SUBJECTS.find((s) => s.value === question.subject)?.label}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">
                        {question.content}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {filteredQuestions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhuma questão encontrada com os filtros selecionados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
