import React from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, Download, BookOpen, Brain, Trophy } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import FloatingChatButton from "./FloatingChatButton";

function CourseContent({ lesson }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Se não houver lição ou se showExplore for true, mostra a página de exploração
  if (!lesson || location.state?.showExplore) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <h1
            className="text-2xl font-bold text-center"
            style={{ color: "#F3C92C" }}
          >
            Explore Nossos Cursos
          </h1>

          <div className="border-2 border-[#F3C92C] rounded-lg p-6 bg-white/50 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                {
                  id: 1,
                  name: "Artes",
                  icon: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500",
                },
                {
                  id: 2,
                  name: "Biologia",
                  icon: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500",
                },
                {
                  id: 3,
                  name: "Educação Física",
                  icon: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=500",
                },
                {
                  id: 4,
                  name: "Filosofia",
                  icon: "https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?w=500",
                },
                {
                  id: 5,
                  name: "Física",
                  icon: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500",
                },
                {
                  id: 6,
                  name: "Geografia",
                  icon: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500",
                },
                {
                  id: 7,
                  name: "História",
                  icon: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=500",
                },
                {
                  id: 8,
                  name: "Língua Estrangeira",
                  icon: "https://images.unsplash.com/photo-1518169998863-07b9ca9294ea?w=500",
                },
                {
                  id: 9,
                  name: "Língua Portuguesa",
                  icon: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500",
                },
                {
                  id: 10,
                  name: "Literatura",
                  icon: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=500",
                },
                {
                  id: 11,
                  name: "Matemática",
                  icon: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500",
                },
                {
                  id: 12,
                  name: "Química",
                  icon: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=500",
                },
                {
                  id: 13,
                  name: "Redação",
                  icon: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500",
                },
                {
                  id: 14,
                  name: "Sociologia",
                  icon: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500",
                },
              ].map((course) => (
                <div
                  key={course.id}
                  className="group flex flex-col items-center text-center hover:scale-105 transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    const courseData = {
                      id: course.id,
                      name: course.name,
                      icon: course.icon,
                      progress: 0,
                      modules: [
                        {
                          id: 1,
                          name: "Módulo 1",
                          lessons: [
                            "Introdução",
                            "Conceitos Básicos",
                            "Exercícios",
                          ],
                        },
                        {
                          id: 2,
                          name: "Módulo 2",
                          lessons: ["Teoria Avançada", "Aplicações", "Prática"],
                        },
                      ],
                    };
                    navigate(`/courses/${course.id}`, {
                      state: { course: courseData },
                    });
                  }}
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-[#F3C92C] shadow-lg">
                    <img
                      src={course.icon}
                      alt={course.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <h4 className="font-medium text-sm">{course.name}</h4>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <BookOpen className="h-5 w-5 mb-2 text-[#F3C92C]" />
              <h4 className="font-semibold text-sm mb-1">Material Completo</h4>
              <p className="text-xs text-muted-foreground">
                Videoaulas, textos e exercícios para fixação
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <Brain className="h-5 w-5 mb-2 text-[#F3C92C]" />
              <h4 className="font-semibold text-sm mb-1">
                Exercícios Práticos
              </h4>
              <p className="text-xs text-muted-foreground">
                Questões e simulados para testar seu conhecimento
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <Trophy className="h-5 w-5 mb-2 text-[#F3C92C]" />
              <h4 className="font-semibold text-sm mb-1">Acompanhamento</h4>
              <p className="text-xs text-muted-foreground">
                Monitore seu progresso em cada matéria
              </p>
            </div>
          </div>
        </div>
        <FloatingChatButton />
      </div>
    );
  }

  // Função para converter URL do YouTube em URL de embed
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return "";

    // Se já for uma URL de embed, retorna ela mesma
    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    // Extrair o ID do vídeo da URL do YouTube
    const videoId = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/))([^&?]+)/
    )?.[1];

    if (!videoId) return url;
    return `https://www.youtube.com/embed/${videoId}`;
  };

  // Converter a URL do vídeo para URL de embed
  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
  console.log("Dados da aula:", {
    title: lesson.title,
    description: lesson.description,
    videoUrl: lesson.videoUrl,
    embedUrl,
    resources: lesson.resources,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-start-2 col-span-8 p-6 space-y-6"
          style={{ marginLeft: "-2rem" }}
        >
          <h1 className="text-2xl font-bold">{lesson.title}</h1>

          <div
            className="relative rounded-lg overflow-hidden bg-black w-full max-w-2xl mx-auto"
            style={{ boxShadow: "0 4px 20px rgba(243, 201, 44, 0.2)" }}
          >
            <div className="aspect-video">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={embedUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="prose max-w-none">
            <p className="text-muted-foreground whitespace-pre-line">
              {lesson.description}
            </p>
          </div>

          {Array.isArray(lesson.resources) && lesson.resources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Material Complementar</h3>
              <div className="grid gap-2 max-w-[160px]">
                {lesson.resources.map((resource, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-12"
                    onClick={() => window.open(resource.url, "_blank")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {resource.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {lesson.nextLesson && (
            <div className="pt-4">
              <Button
                className="w-full sm:w-auto flex items-center gap-2"
                style={{
                  background:
                    "linear-gradient(90deg, #B4902A -158.27%, #F3C92C 108.81%)",
                  border: "none",
                }}
                onClick={() => lesson.onNextLesson()}
              >
                <PlayCircle className="h-4 w-4" />
                Próxima Aula
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}

export default CourseContent;
