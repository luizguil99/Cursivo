import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import WeekDay from "./WeekDay";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  getScheduleBlocks,
  addScheduleBlock,
  updateScheduleBlock,
  deleteScheduleBlock,
  moveScheduleBlock,
} from "@/lib/supabase";

const weekDays = [
  { id: "monday", name: "Segunda" },
  { id: "tuesday", name: "Terça" },
  { id: "wednesday", name: "Quarta" },
  { id: "thursday", name: "Quinta" },
  { id: "friday", name: "Sexta" },
  { id: "saturday", name: "Sábado" },
  { id: "sunday", name: "Domingo" },
];

function WeeklySchedule({ onClose }) {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = React.useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  const [subjects, setSubjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [draggedItem, setDraggedItem] = React.useState(null);

  React.useEffect(() => {
    if (currentUser?.id) {
      fetchCourses();
      fetchSchedule();
    }
  }, [currentUser]);

  const fetchSchedule = async () => {
    try {
      const scheduleData = await getScheduleBlocks(currentUser.id);
      setSchedule(scheduleData);
    } catch (error) {
      console.error("Erro ao carregar cronograma:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("cursos").select("*");

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("Nenhum curso encontrado");
        return;
      }

      const coursesData = data.map((course) => ({
        id: course.id,
        name: course.titulo || course.name || "Curso sem título",
        color: course.cor || course.color || "#F3C92C",
      }));

      setSubjects(coursesData);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, item, sourceDay) => {
    setDraggedItem({ item, sourceDay });
    e.target.classList.add("opacity-50");
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove("opacity-50");
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();

    if (!draggedItem) return;

    const { item, sourceDay } = draggedItem;

    if (sourceDay === targetDay) return;

    // Primeiro atualiza a UI
    setSchedule((prev) => ({
      ...prev,
      [sourceDay]: prev[sourceDay].filter((i) => i.id !== item.id),
      [targetDay]: [...prev[targetDay], item],
    }));

    // Depois persiste no banco de dados
    try {
      await moveScheduleBlock(item.id, targetDay);
    } catch (error) {
      console.error("Erro ao mover bloco:", error);
      // Em caso de erro, reverte a UI para o estado anterior
      setSchedule((prev) => ({
        ...prev,
        [targetDay]: prev[targetDay].filter((i) => i.id !== item.id),
        [sourceDay]: [...prev[sourceDay], item],
      }));
    }
  };

  const handleAddSubject = async (dayId, subject) => {
    const newSubject = {
      name: subject.name,
      duration: "1h",
      color: subject.color,
    };

    // Cria um ID temporário para atualização otimista
    const tempId = `temp-${Date.now()}`;
    const tempBlock = { ...newSubject, id: tempId };

    // Primeiro atualiza a UI
    setSchedule((prev) => ({
      ...prev,
      [dayId]: [...prev[dayId], tempBlock],
    }));

    // Depois persiste no banco de dados
    try {
      const savedBlock = await addScheduleBlock(currentUser.id, dayId, newSubject);
      // Atualiza o bloco temporário com o bloco real do banco
      setSchedule((prev) => ({
        ...prev,
        [dayId]: prev[dayId].map((block) =>
          block.id === tempId ? savedBlock : block
        ),
      }));
    } catch (error) {
      console.error("Erro ao adicionar bloco:", error);
      // Em caso de erro, remove o bloco temporário
      setSchedule((prev) => ({
        ...prev,
        [dayId]: prev[dayId].filter((block) => block.id !== tempId),
      }));
    }
  };

  const handleEditBlock = async (editedBlock) => {
    const dayId = Object.keys(schedule).find((day) =>
      schedule[day].some((item) => item.id === editedBlock.id)
    );

    if (dayId) {
      // Primeiro atualiza a UI
      setSchedule((prev) => ({
        ...prev,
        [dayId]: prev[dayId].map((item) =>
          item.id === editedBlock.id ? editedBlock : item
        ),
      }));

      // Depois persiste no banco de dados
      try {
        await updateScheduleBlock(editedBlock.id, editedBlock);
      } catch (error) {
        console.error("Erro ao atualizar bloco:", error);
        // Em caso de erro, reverte para o bloco original
        const originalBlock = schedule[dayId].find(
          (item) => item.id === editedBlock.id
        );
        setSchedule((prev) => ({
          ...prev,
          [dayId]: prev[dayId].map((item) =>
            item.id === editedBlock.id ? originalBlock : item
          ),
        }));
      }
    }
  };

  const handleDeleteBlock = async (blockId, dayId) => {
    // Guarda o bloco que será removido para caso precise restaurar
    const blockToDelete = schedule[dayId].find((block) => block.id === blockId);

    // Primeiro atualiza a UI
    setSchedule((prev) => ({
      ...prev,
      [dayId]: prev[dayId].filter((item) => item.id !== blockId),
    }));

    // Depois persiste no banco de dados
    try {
      await deleteScheduleBlock(blockId);
    } catch (error) {
      console.error("Erro ao remover bloco:", error);
      // Em caso de erro, restaura o bloco
      if (blockToDelete) {
        setSchedule((prev) => ({
          ...prev,
          [dayId]: [...prev[dayId], blockToDelete],
        }));
      }
    }
  };

  return (
    <div className="p-4 h-full">
      <div className="h-full flex flex-col max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6 pr-16">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-[#F3C92C]" />
            <h2 className="text-xl font-bold">Cronograma Semanal</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Voltar
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-32" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => (
                <Skeleton key={day.id} className="h-[200px]" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2 flex-wrap">
              {subjects.length === 0 ? (
                <p className="text-muted-foreground">
                  Nenhuma matéria encontrada.
                </p>
              ) : (
                <>
                  {subjects.map((subject) => (
                    <Button
                      key={subject.id}
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleAddSubject("monday", subject)}
                      style={{
                        borderColor: subject.color,
                        color: subject.color,
                        borderWidth: "2px",
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      {subject.name}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-gray-500 text-gray-500 border-2"
                    onClick={() => {
                      const customBlock = {
                        name: "Bloco Personalizado",
                        color: "#808080",
                        duration: "1h",
                      };
                      handleAddSubject("monday", customBlock);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Bloco
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-7 gap-4 min-h-[500px] overflow-hidden">
              {weekDays.map((day) => (
                <div
                  key={day.id}
                  className="flex flex-col bg-card rounded-lg border"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.id)}
                >
                  <div className="p-3 border-b text-center">
                    <h3 className="font-medium text-sm">{day.name}</h3>
                  </div>
                  <div className="flex-1 p-2 min-h-[100px]">
                    <WeekDay
                      items={schedule[day.id]}
                      onDragStart={(e, item) => handleDragStart(e, item, day.id)}
                      onDragEnd={handleDragEnd}
                      onDelete={(blockId) => handleDeleteBlock(blockId, day.id)}
                      onEdit={handleEditBlock}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WeeklySchedule;
