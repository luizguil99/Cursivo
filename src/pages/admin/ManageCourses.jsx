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
  writeBatch,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlusCircle,
  Trash2,
  VideoIcon,
  GraduationCap,
  ListVideo,
  ListChecks,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export default function ManageCourses() {
  const { currentUser, signOut } = useAuth();
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState({});
  const [videos, setVideos] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [isAddModuleDialogOpen, setIsAddModuleDialogOpen] = useState(false);
  const [isAddVideoDialogOpen, setIsAddVideoDialogOpen] = useState(false);
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    videoUrl: "",
  });
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
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [moduleInput, setModuleInput] = useState("");
  const [isNewModule, setIsNewModule] = useState(false);
  const [uploadType, setUploadType] = useState("url");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([{ name: "", url: "" }]);
  const [courseLessons, setCourseLessons] = useState({});
  const [expandedModules, setExpandedModules] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [isEditVideoDialogOpen, setIsEditVideoDialogOpen] = useState(false);
  const [existingTopics, setExistingTopics] = useState([]);
  const [isNewTopic, setIsNewTopic] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState({});

  const toggleCourseExpansion = (courseId) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!newQuestion.subject) return;

      try {
        const questionsRef = collection(db, "questions");
        const q = query(
          questionsRef,
          where("subject", "==", newQuestion.subject)
        );
        const querySnapshot = await getDocs(q);

        const topics = new Set();
        querySnapshot.docs.forEach((doc) => {
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
      // Buscar cursos
      const coursesRef = collection(db, "courses");
      const coursesSnapshot = await getDocs(coursesRef);
      const coursesData = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(coursesData);

      // Buscar módulos para cada curso
      const modulesData = {};
      for (const course of coursesData) {
        const moduleQuery = query(
          collection(db, "modules"),
          where("courseId", "==", course.id)
        );
        const moduleSnapshot = await getDocs(moduleQuery);
        modulesData[course.id] = moduleSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
      setModules(modulesData);

      // Buscar vídeos para cada módulo
      const videosData = {};
      for (const course of coursesData) {
        const videoQuery = query(
          collection(db, "videos"),
          where("courseId", "==", course.id)
        );
        const videoSnapshot = await getDocs(videoQuery);
        videosData[course.id] = videoSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
      setVideos(videosData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "courses"), {
        ...newCourse,
        createdAt: new Date().toISOString(),
      });
      setIsAddCourseDialogOpen(false);
      setNewCourse({ title: "", description: "" });
      fetchCourses();
    } catch (error) {
      console.error("Erro ao adicionar curso:", error);
      alert("Erro ao adicionar curso: " + error.message);
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      alert("Por favor, selecione um curso primeiro.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "modules"), {
        ...newModule,
        courseId: selectedCourse,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email,
        order: modules[selectedCourse]?.length || 0,
      });
      setIsAddModuleDialogOpen(false);
      setNewModule({ title: "", description: "" });
      fetchCourses();
    } catch (error) {
      console.error("Erro ao adicionar módulo:", error);
      alert("Erro ao adicionar módulo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    try {
      // Filtrar recursos vazios
      const validResources = resources.filter((r) => r.name && r.url);

      await addDoc(collection(db, "videos"), {
        ...newVideo,
        courseId: selectedCourse,
        moduleId: selectedModule,
        resources: validResources, // Adicionar recursos ao documento
        createdAt: new Date().toISOString(),
      });
      setIsAddVideoDialogOpen(false);
      setNewVideo({ title: "", description: "", videoUrl: "" });
      setResources([{ name: "", url: "" }]); // Resetar recursos
      fetchCourses();
    } catch (error) {
      console.error("Erro ao adicionar vídeo:", error);
      alert("Erro ao adicionar vídeo: " + error.message);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addDoc(collection(db, "questions"), {
        ...newQuestion,
        courseId: selectedCourse,
        createdAt: new Date().toISOString(),
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
    } catch (error) {
      console.error("Erro ao adicionar questão:", error);
      alert("Erro ao adicionar questão: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    setCourseToDelete(course);
    setDeleteConfirmation("");
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    const confirmationWord = courseToDelete.title.toUpperCase();
    if (deleteConfirmation !== confirmationWord) {
      toast({
        title: "Confirmação inválida",
        description: `Digite "${courseToDelete.title.toUpperCase()}" para confirmar a exclusão.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteDoc(doc(db, "courses", courseToDelete.id));
      toast({
        title: "Curso excluído",
        description: "O curso foi excluído com sucesso.",
      });
      fetchCourses();
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
      setDeleteConfirmation("");
    } catch (error) {
      console.error("Erro ao excluir curso:", error);
      toast({
        title: "Erro ao excluir curso",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (window.confirm("Tem certeza que deseja excluir este módulo?")) {
      try {
        await deleteDoc(doc(db, "modules", moduleId));
        fetchCourses();
      } catch (error) {
        console.error("Erro ao excluir módulo:", error);
        alert("Erro ao excluir módulo: " + error.message);
      }
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm("Tem certeza que deseja excluir este vídeo?")) {
      try {
        await deleteDoc(doc(db, "videos", videoId));
        fetchCourses();
      } catch (error) {
        console.error("Erro ao excluir vídeo:", error);
        alert("Erro ao excluir vídeo: " + error.message);
      }
    }
  };

  const handleEditVideo = async (e) => {
    e.preventDefault();

    if (!editingVideo?.id) {
      toast({
        title: "Erro ao atualizar aula",
        description: "Dados da aula inválidos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const validResources =
        editingVideo.resources?.filter((r) => r.name && r.url) || [];

      // Atualizar o documento na coleção videos
      const videoRef = doc(db, "videos", editingVideo.id);

      const updateData = {
        title: editingVideo.title || "",
        description: editingVideo.description || "",
        resources: validResources,
        updatedAt: serverTimestamp(),
      };

      // Só atualiza a URL se ela foi modificada
      if (editingVideo.url !== undefined) {
        updateData.videoUrl = editingVideo.url;
      }

      await updateDoc(videoRef, updateData);

      // Atualizar o estado local
      setVideos((prev) => {
        const moduleId = Object.keys(prev).find((key) =>
          prev[key].some((video) => video.id === editingVideo.id)
        );

        if (!moduleId) {
          console.error("Módulo não encontrado para o vídeo:", editingVideo.id);
          return prev;
        }

        return {
          ...prev,
          [moduleId]: prev[moduleId].map((video) =>
            video.id === editingVideo.id
              ? {
                  ...video,
                  title: editingVideo.title || "",
                  description: editingVideo.description || "",
                  videoUrl: editingVideo.url, // Usar videoUrl aqui também
                  resources: validResources,
                }
              : video
          ),
        };
      });

      toast({
        title: "Aula atualizada com sucesso!",
        description: "As alterações foram salvas.",
      });

      setIsEditVideoDialogOpen(false);
      setEditingVideo(null);
    } catch (error) {
      console.error("Erro ao atualizar aula:", error);
      toast({
        title: "Erro ao atualizar aula",
        description:
          error.message || "Verifique se você tem permissão de administrador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = () => {
    setEditingVideo((prev) => ({
      ...prev,
      resources: [...(prev.resources || []), { name: "", url: "" }],
    }));
  };

  const handleRemoveResource = (index) => {
    setEditingVideo((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index),
    }));
  };

  const handleResourceChange = (index, field, value) => {
    setEditingVideo((prev) => ({
      ...prev,
      resources: prev.resources.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource
      ),
    }));
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Se for um módulo
      if (active.id.startsWith("module-") && over?.id.startsWith("module-")) {
        const courseId = Object.keys(modules).find((courseId) =>
          modules[courseId].find(
            (m) => m.id === active.id.replace("module-", "")
          )
        );

        const oldIndex = modules[courseId].findIndex(
          (m) => m.id === active.id.replace("module-", "")
        );
        const newIndex = modules[courseId].findIndex(
          (m) => m.id === over.id.replace("module-", "")
        );

        const newModules = arrayMove(modules[courseId], oldIndex, newIndex);

        try {
          const batch = writeBatch(db);
          newModules.forEach((module, index) => {
            const moduleRef = doc(db, "modules", module.id);
            batch.update(moduleRef, { order: index });
          });
          await batch.commit();

          setModules((prev) => ({
            ...prev,
            [courseId]: newModules,
          }));

          toast({
            title: "Módulos reordenados",
            description: "A ordem dos módulos foi atualizada com sucesso.",
          });
        } catch (error) {
          console.error("Erro ao reordenar módulos:", error);
          toast({
            title: "Erro ao reordenar módulos",
            description: "Tente novamente mais tarde.",
            variant: "destructive",
          });
        }
      }
      // Se for um vídeo
      else if (
        active.id.startsWith("video-") &&
        over?.id.startsWith("video-")
      ) {
        const currentModule = Object.entries(videos).find(
          ([moduleId, moduleVideos]) =>
            moduleVideos.some((v) => `video-${v.id}` === active.id)
        );

        if (currentModule) {
          const moduleId = currentModule[0];
          const oldIndex = videos[moduleId].findIndex(
            (v) => `video-${v.id}` === active.id
          );
          const newIndex = videos[moduleId].findIndex(
            (v) => `video-${v.id}` === over.id
          );

          if (oldIndex !== -1 && newIndex !== -1) {
            const newVideos = arrayMove(videos[moduleId], oldIndex, newIndex);

            try {
              const batch = writeBatch(db);
              newVideos.forEach((video, index) => {
                const videoRef = doc(db, "videos", video.id);
                batch.update(videoRef, { order: index });
              });
              await batch.commit();

              setVideos((prev) => ({
                ...prev,
                [moduleId]: newVideos,
              }));

              toast({
                title: "Aulas reordenadas",
                description: "A ordem das aulas foi atualizada com sucesso.",
              });
            } catch (error) {
              console.error("Erro ao reordenar aulas:", error);
              toast({
                title: "Erro ao reordenar aulas",
                description: "Tente novamente mais tarde.",
                variant: "destructive",
              });
            }
          }
        }
      }
    }
  };

  const handleOpenAddVideoDialog = (courseId, moduleId) => {
    const course = courses.find((c) => c.id === courseId);
    setSelectedCourse(courseId);
    setSelectedModule(moduleId);
    setSelectedSubject(course?.title || "");
    setIsNewModule(false);
    setNewVideo({
      title: "",
      description: "",
      videoUrl: "",
    });
    setIsAddVideoDialogOpen(true);
  };

  const SortableModule = ({
    module,
    course,
    videos,
    isExpanded,
    onToggle,
    onAddVideo,
    onDeleteModule,
    onDeleteVideo,
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: `module-${module.id}` });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn(
          "rounded-lg border bg-[#FFD700]/5 hover:bg-[#FFD700]/10 transition-colors",
          isDragging && "opacity-50"
        )}
      >
        <div
          className="flex items-center justify-between p-2 cursor-pointer dark:bg-[#FFD700]/10 bg-[#FBFBFB] dark:hover:bg-[#FFD700]/20 hover:bg-[#F8F8F8] border dark:border-[#FFD700]/20 border-gray-100 text-foreground rounded-t-md transition-colors duration-200"
          onClick={onToggle}
        >
          <div className="flex items-center gap-4">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div
              className={cn(
                "transform transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
            <span className="font-medium">{module.title}</span>
            <span className="text-sm text-muted-foreground">
              ({videos?.filter((v) => v.moduleId === module.id).length || 0}{" "}
              aulas)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddVideoDialog(course.id, module.id);
              }}
              className="hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors"
            >
              <VideoIcon className="h-4 w-4 mr-2" />
              Adicionar Aula
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteModule(module.id);
              }}
              className="hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
        {isExpanded ? (
          <div className="p-2 bg-background border border-[#FFD700]/10 border-t-0 rounded-b-md transition-all duration-500 ease-in-out transform-gpu opacity-100">
            <div className="animate-fadeIn">
              {videos?.filter((v) => v.moduleId === module.id).length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={videos
                      ?.filter((v) => v.moduleId === module.id)
                      .map((v) => `video-${v.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {videos
                        ?.filter((v) => v.moduleId === module.id)
                        .map((video) => (
                          <SortableVideo
                            key={`video-${video.id}`}
                            video={video}
                            moduleId={module.id}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma aula cadastrada
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const SortableVideo = ({ video, moduleId }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: `video-${video.id}` });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      position: "relative",
      cursor: "grab",
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between py-2 px-4 bg-background border rounded-lg mb-2 hover:bg-accent"
      >
        <div className="flex items-center space-x-2">
          <div {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <VideoIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{video.title}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingVideo(video);
              setIsEditVideoDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteVideo(video.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const handleOpenAddQuestionDialog = () => {
    const selectedCourseData = courses.find((c) => c.id === selectedCourse);
    setNewQuestion({
      topic: "",
      question: "",
      image: "",
      options: ["", "", "", "", ""],
      correctAnswer: 0,
      solutionVideo: "",
      subject: selectedCourseData?.title || "",
      examBoard: "", // Nova propriedade para a banca
    });
    setSelectedCourse(selectedCourse);
    setIsAddQuestionDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gerenciar Cursos
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os cursos, módulos e exercícios da plataforma
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsAddCourseDialogOpen(true)}
            className="dark:bg-white dark:text-black dark:hover:bg-white/90 bg-black hover:bg-black/90 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Curso
          </Button>
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="rounded-lg border bg-card">
            {/* Course Header */}
            <div
              className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleCourseExpansion(course.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "transform transition-transform duration-200",
                        expandedCourses[course.id] && "rotate-90"
                      )}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    Criado em {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{modules[course.id]?.length || 0} módulos</span>
                  <span>•</span>
                  <span>{videos[course.id]?.length || 0} aulas</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourse(course.id);
                    setIsAddModuleDialogOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Novo Módulo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const selectedCourseData = courses.find(
                      (c) => c.id === course.id
                    );
                    setNewQuestion({
                      topic: "",
                      question: "",
                      image: "",
                      options: ["", "", "", "", ""],
                      correctAnswer: 0,
                      solutionVideo: "",
                      subject: selectedCourseData?.title || "",
                      examBoard: "", // Nova propriedade para a banca
                    });
                    setSelectedCourse(course.id);
                    setIsAddQuestionDialogOpen(true);
                  }}
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Novo Exercício
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Course Content */}
            <div
              className={cn(
                "transition-all duration-200 overflow-hidden",
                expandedCourses[course.id]
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="p-4">
                <div className="space-y-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={
                        modules[course.id]?.map((m) => `module-${m.id}`) || []
                      }
                      strategy={verticalListSortingStrategy}
                    >
                      {modules[course.id]?.map((module) => (
                        <SortableModule
                          key={`module-${module.id}`}
                          module={module}
                          course={course}
                          videos={videos[course.id]}
                          isExpanded={expandedModules[module.id]}
                          onToggle={() => toggleModule(module.id)}
                          onAddVideo={(courseId, moduleId) =>
                            handleOpenAddVideoDialog(courseId, moduleId)
                          }
                          onDeleteModule={handleDeleteModule}
                          onDeleteVideo={handleDeleteVideo}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Course Dialog */}
      <Dialog
        open={isAddCourseDialogOpen}
        onOpenChange={setIsAddCourseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Curso</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nome do Curso</Label>
              <Input
                id="title"
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
                placeholder="Ex: História"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={newCourse.description}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, description: e.target.value })
                }
                placeholder="Breve descrição do curso"
              />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCourseDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Adicionar Curso</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Module Dialog */}
      <Dialog
        open={isAddModuleDialogOpen}
        onOpenChange={setIsAddModuleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Módulo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddModule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moduleTitle">Nome do Módulo</Label>
              <Input
                id="moduleTitle"
                value={newModule.title}
                onChange={(e) =>
                  setNewModule({ ...newModule, title: e.target.value })
                }
                placeholder="Ex: Idade Média"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moduleDescription">Descrição</Label>
              <Input
                id="moduleDescription"
                value={newModule.description}
                onChange={(e) =>
                  setNewModule({ ...newModule, description: e.target.value })
                }
                placeholder="Breve descrição do módulo"
              />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModuleDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Adicionar Módulo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Video Dialog */}
      <Dialog
        open={isAddVideoDialogOpen}
        onOpenChange={(open) => {
          setIsAddVideoDialogOpen(open);
          if (!open) {
            setNewVideo({
              title: "",
              description: "",
              videoUrl: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Aula</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da aula que você deseja adicionar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddVideo} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Título da Aula</Label>
                <Input
                  id="title"
                  value={newVideo.title}
                  onChange={(e) =>
                    setNewVideo({
                      ...newVideo,
                      title: e.target.value,
                    })
                  }
                  placeholder="Digite o título da aula"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={newVideo.description}
                  onChange={(e) =>
                    setNewVideo({
                      ...newVideo,
                      description: e.target.value,
                    })
                  }
                  placeholder="Digite a descrição da aula"
                />
              </div>
              <div>
                <Label>Curso</Label>
                <Input
                  value={selectedSubject}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Módulo</Label>
                <Input
                  value={modules[selectedCourse]?.find(m => m.id === selectedModule)?.title || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Tipo de Upload</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    type="button"
                    variant={uploadType === "url" ? "default" : "outline"}
                    onClick={() => setUploadType("url")}
                  >
                    URL do Vídeo
                  </Button>
                  <Button
                    type="button"
                    variant={uploadType === "file" ? "default" : "outline"}
                    onClick={() => setUploadType("file")}
                  >
                    Upload de Arquivo
                  </Button>
                </div>
              </div>
              {uploadType === "url" ? (
                <div>
                  <Label htmlFor="videoUrl">URL do Vídeo</Label>
                  <Input
                    id="videoUrl"
                    value={newVideo.videoUrl}
                    onChange={(e) =>
                      setNewVideo({
                        ...newVideo,
                        videoUrl: e.target.value,
                      })
                    }
                    placeholder="Cole a URL do vídeo"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="videoFile">Arquivo de Vídeo</Label>
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </div>
              )}
              <div>
                <Label>Recursos Adicionais</Label>
                {resources.map((resource, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      placeholder="Nome do recurso"
                      value={resource.name}
                      onChange={(e) =>
                        setResources((prev) => {
                          const newResources = [...prev];
                          newResources[index] = {
                            ...newResources[index],
                            name: e.target.value,
                          };
                          return newResources;
                        })
                      }
                    />
                    <Input
                      placeholder="URL do recurso"
                      value={resource.url}
                      onChange={(e) =>
                        setResources((prev) => {
                          const newResources = [...prev];
                          newResources[index] = {
                            ...newResources[index],
                            url: e.target.value,
                          };
                          return newResources;
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setResources((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setResources((prev) => [...prev, { name: "", url: "" }])
                  }
                  className="mt-2"
                >
                  Adicionar Recurso
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddVideoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adicionando..." : "Adicionar Vídeo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Question Dialog */}
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
                    setNewQuestion({
                      ...newQuestion,
                      subject: value,
                    })
                  }
                  disabled={true}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.title}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
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
                      variant={
                        newQuestion.correctAnswer === index
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setNewQuestion({
                          ...newQuestion,
                          correctAnswer: index,
                        })
                      }
                      className={
                        newQuestion.correctAnswer === index
                          ? "bg-green-200 hover:bg-green-300 text-black border-green-300"
                          : ""
                      }
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
                    variant={
                      newQuestion.correctAnswer === 4 ? "default" : "outline"
                    }
                    onClick={() =>
                      setNewQuestion({
                        ...newQuestion,
                        correctAnswer: 4,
                      })
                    }
                    className={
                      newQuestion.correctAnswer === 4
                        ? "bg-green-200 hover:bg-green-300 text-black border-green-300"
                        : ""
                    }
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
              <div>
                <Label htmlFor="examBoard" className="flex items-center gap-2">
                  Banca
                  <span className="text-sm text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="examBoard"
                  value={newQuestion.examBoard}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      examBoard: e.target.value,
                    })
                  }
                  placeholder="Ex: FUVEST, UNICAMP, ENEM"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
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
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog
        open={isEditVideoDialogOpen}
        onOpenChange={(open) => {
          setIsEditVideoDialogOpen(open);
          if (!open) setEditingVideo(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na aula selecionada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditVideo} className="space-y-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editingVideo?.title || ""}
                  onChange={(e) =>
                    setEditingVideo((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Digite o título da aula"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Input
                  id="edit-description"
                  value={editingVideo?.description || ""}
                  onChange={(e) =>
                    setEditingVideo((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Digite a descrição da aula"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-url">URL do Vídeo</Label>
                <Input
                  id="edit-url"
                  value={editingVideo?.videoUrl || ""}
                  onChange={(e) =>
                    setEditingVideo((prev) => ({
                      ...prev,
                      url: e.target.value,
                      videoUrl: e.target.value,
                    }))
                  }
                  placeholder="Cole a URL do vídeo"
                />
              </div>

              {/* Recursos Adicionais */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Recursos Adicionais</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddResource}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Recurso
                  </Button>
                </div>
                {editingVideo?.resources?.map((resource, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="grid gap-2 flex-1">
                      <Input
                        placeholder="Nome do recurso"
                        value={resource.name}
                        onChange={(e) =>
                          handleResourceChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-2 flex-1">
                      <Input
                        placeholder="URL do recurso"
                        value={resource.url}
                        onChange={(e) =>
                          handleResourceChange(index, "url", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleRemoveResource(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCourseToDelete(null);
            setDeleteConfirmation("");
          }
          setIsDeleteDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Para confirmar a exclusão do curso{" "}
              <strong className="text-foreground">
                {courseToDelete?.title}
              </strong>
              , digite o nome do curso em maiúsculas:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={courseToDelete?.title.toUpperCase()}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCourseToDelete(null);
                setDeleteConfirmation("");
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCourse}>
              Excluir Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
