import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Sparkles } from "lucide-react";

export function TopicFilter({ selectedSubject, onTopicChange, selectedTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTopics() {
      try {
        setLoading(true);
        setError(null);

        // Se não houver disciplina selecionada, não buscar tópicos
        if (!selectedSubject || selectedSubject === "all") {
          setTopics([]);
          return;
        }

        // Construir a query base
        let query = supabase
          .from("questoes")
          .select("topico")
          .not("topico", "is", null)
          .neq("topico", "")
          .eq("assunto", selectedSubject); // Sempre filtrar por disciplina

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        // Processar os dados: remover duplicatas e formatar
        const uniqueTopics = [
          ...new Set(
            data
              .map((item) => item.topico)
              .filter((topic) => topic && topic.trim() !== "")
          ),
        ];

        const formattedTopics = uniqueTopics
          .map((topic) => ({
            value: topic.trim(),
            label: topic.charAt(0).toUpperCase() + topic.slice(1),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        console.log(
          "TopicFilter - Tópicos encontrados para",
          selectedSubject,
          ":",
          formattedTopics
        );
        setTopics(formattedTopics);
      } catch (err) {
        console.error("Erro ao buscar tópicos:", err);
        setError("Erro ao carregar os tópicos");
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [selectedSubject]);

  // Monitorar mudanças importantes
  useEffect(() => {
    console.log("TopicFilter - Estado:", {
      selectedSubject,
      selectedTopic,
      topicsCount: topics.length,
      isDisabled: !selectedSubject || selectedSubject === "all",
    });
  }, [selectedSubject, selectedTopic, topics]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#F3C92C]" />
        Tópico
      </label>
      <Select
        value={selectedTopic}
        onValueChange={(value) => {
          console.log("TopicFilter - Tópico selecionado:", value);
          onTopicChange(value);
        }}
        disabled={!selectedSubject || selectedSubject === "all"} // Removido loading e error do disabled
      >
        <SelectTrigger className="h-11 bg-white border-2 border-gray-200 hover:border-[#F3C92C] focus:border-[#F3C92C] focus:ring-2 focus:ring-[#F3C92C]/20 transition-all duration-200">
          <SelectValue
            placeholder={
              !selectedSubject || selectedSubject === "all"
                ? "Selecione uma disciplina primeiro"
                : loading
                ? "Carregando tópicos..."
                : error
                ? "Erro ao carregar tópicos"
                : "Todos os tópicos"
            }
            className="text-gray-600"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tópicos</SelectItem>
          {topics.map((topic) => (
            <SelectItem key={topic.value} value={topic.value}>
              {topic.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
