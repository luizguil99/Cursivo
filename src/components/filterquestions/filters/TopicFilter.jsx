import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/services/supabase";
import { Sparkles } from "lucide-react";

export function TopicFilter({ selectedSubject, onTopicChange, selectedTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTopics() {
      if (!selectedSubject || selectedSubject === "all") {
        setTopics([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("questoes")
          .select("topico")
          .eq("assunto", selectedSubject)
          .not("topico", "is", null)
          .neq("topico", "");

        if (error) throw error;

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

        console.log("Tópicos encontrados:", formattedTopics);
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

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#F3C92C]" />
        Tópico
      </label>
      <Select
        value={selectedTopic}
        onValueChange={onTopicChange}
        disabled={!selectedSubject || selectedSubject === "all"}
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
                : "Selecione um tópico"
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
