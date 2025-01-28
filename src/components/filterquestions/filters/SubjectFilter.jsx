import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";

// Componente de filtro por matéria
export default function SubjectFilter({ value, onChange }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        // Buscar disciplinas únicas da coluna assunto
        const { data, error } = await supabase
          .from("questoes")
          .select("assunto")
          .not("assunto", "is", null);

        if (error) throw error;

        // Remover duplicatas e formatar
        const uniqueSubjects = [...new Set(data.map(item => item.assunto))];
        const formattedSubjects = uniqueSubjects.map(subject => ({
          id: subject,
          label: subject.charAt(0).toUpperCase() + subject.slice(1)
        }));

        console.log('Disciplinas carregadas:', formattedSubjects); // Debug
        setSubjects(formattedSubjects);
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  if (loading) {
    return <div>Carregando disciplinas...</div>;
  }

  if (error) {
    return <div>Erro ao carregar disciplinas: {error}</div>;
  }

  return (
    <div className="space-y-3">
      <Label className="text-base">Matéria</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-2 gap-4"
      >
        {subjects.map((subject) => (
          <div key={subject.id} className="flex items-center space-x-2">
            <RadioGroupItem value={subject.id} id={subject.id} />
            <Label htmlFor={subject.id} className="font-normal">
              {subject.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
