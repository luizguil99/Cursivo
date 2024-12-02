import { courseLessons } from "../data/courseLessons";
import { supabase } from "../lib/supabase";

export async function initializeSubjects() {
  try {
    // Verificar quais matérias já existem
    const { data: existingCourses, error: fetchError } = await supabase
      .from("cursos")
      .select("*");

    if (fetchError) throw fetchError;

    // Pegar as matérias do courseLessons
    const subjects = Object.keys(courseLessons).map((title) => ({
      titulo: title,
      descricao: `Curso de ${title}`,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    }));

    // Adicionar matérias que não existem
    for (const subject of subjects) {
      const existingCourse = existingCourses.find(
        (course) => course.titulo === subject.titulo
      );

      if (!existingCourse) {
        try {
          const { error } = await supabase.from("cursos").insert([subject]);

          if (error) throw error;

          console.log(`Matéria ${subject.titulo} adicionada com sucesso!`);
        } catch (error) {
          console.error(`Erro ao adicionar matéria ${subject.titulo}:`, error);
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Erro ao inicializar matérias:", error);
    return false;
  }
}
