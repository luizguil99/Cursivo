import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import WeekDay from "./WeekDay";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

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
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesRef = collection(db, "courses");
        const coursesSnapshot = await getDocs(coursesRef);
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().title || doc.data().name,
          color: doc.data().color || "#F3C92C",
        }));
        setSubjects(coursesData);
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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

  const handleDrop = (e, targetDay) => {
    e.preventDefault();

    if (!draggedItem) return;

    const { item, sourceDay } = draggedItem;

    if (sourceDay === targetDay) return;

    setSchedule((prev) => ({
      ...prev,
      [sourceDay]: prev[sourceDay].filter((i) => i.id !== item.id),
      [targetDay]: [
        ...prev[targetDay],
        {
          ...item,
          id: `${item.name.toLowerCase()}-${Date.now()}`,
        },
      ],
    }));
  };

  const addSubject = (dayId, subject) => {
    const newSubject = {
      id: `${subject.id}-${Date.now()}`,
      name: subject.name,
      duration: "1h",
      color: subject.color,
    };

    setSchedule((prev) => ({
      ...prev,
      [dayId]: [...prev[dayId], newSubject],
    }));
  };

  const handleEditBlock = (editedBlock) => {
    const dayId = Object.keys(schedule).find((day) =>
      schedule[day].some((item) => item.id === editedBlock.id)
    );

    if (dayId) {
      setSchedule((prev) => ({
        ...prev,
        [dayId]: prev[dayId].map((item) =>
          item.id === editedBlock.id ? editedBlock : item
        ),
      }));
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
                      onClick={() => addSubject("monday", subject)}
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
                        id: `custom-${Date.now()}`,
                        name: "Bloco Personalizado",
                        color: "#808080",
                        duration: "1h",
                      };
                      addSubject("monday", customBlock);
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
                      onDragStart={(e, item) =>
                        handleDragStart(e, item, day.id)
                      }
                      onDragEnd={handleDragEnd}
                      onDelete={(itemId) => {
                        setSchedule((prev) => ({
                          ...prev,
                          [day.id]: prev[day.id].filter(
                            (item) => item.id !== itemId
                          ),
                        }));
                      }}
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
