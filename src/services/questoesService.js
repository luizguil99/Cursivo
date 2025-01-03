import { supabase } from "@/lib/supabase";

// Buscar questões com filtros
export async function fetchQuestoes({
  disciplina,
  assunto,
  searchQuery,
  bancaExaminadora,
}) {
  try {
    let query = supabase.from("questoes").select("*");

    // Filtrar por disciplina (usando o campo assunto)
    if (disciplina && disciplina !== "all") {
      query = query.eq("assunto", disciplina);
    }

    // Filtrar por assunto (campo topico)
    if (assunto && assunto !== "all") {
      query = query.eq("topico", assunto);
    }

    // Filtrar por banca examinadora
    if (bancaExaminadora && bancaExaminadora !== "all") {
      query = query.eq("banca_examinadora", bancaExaminadora);
    }

    // Busca textual
    if (searchQuery) {
      query = query.ilike("questao", `%${searchQuery}%`);
    }

    query = query.order("criado_em", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar questões:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Erro ao buscar questões:", error);
    throw error;
  }
}

// Buscar disciplinas únicas (usando o campo assunto)
export async function fetchDisciplinas() {
  try {
    console.log("Buscando disciplinas...");
    const { data, error } = await supabase
      .from("questoes")
      .select("assunto")
      .not("assunto", "is", null)
      .neq("assunto", "");

    if (error) throw error;

    const uniqueDisciplinas = [
      ...new Set(
        data
          .map((item) => item.assunto)
          .filter((assunto) => assunto && assunto.trim() !== "")
      ),
    ];

    const formattedDisciplinas = uniqueDisciplinas
      .map((assunto) => ({
        value: assunto.trim(),
        label: assunto.charAt(0).toUpperCase() + assunto.slice(1),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    console.log("Disciplinas encontradas:", formattedDisciplinas);
    return formattedDisciplinas;
  } catch (error) {
    console.error("Erro ao buscar disciplinas:", error);
    throw error;
  }
}

// Buscar tópicos únicos por disciplina
export async function fetchAssuntos(disciplina) {
  try {
    console.log("Buscando tópicos para disciplina:", disciplina);

    if (!disciplina || disciplina === "all") {
      console.log("Nenhuma disciplina selecionada, retornando lista vazia");
      return [];
    }

    const { data, error } = await supabase
      .from("questoes")
      .select("topico")
      .eq("assunto", disciplina)
      .not("topico", "is", null)
      .neq("topico", "");

    if (error) {
      console.error("Erro ao buscar tópicos:", error);
      throw error;
    }

    console.log("Dados brutos dos tópicos:", data);

    // Remover duplicatas e formatar
    const uniqueTopicos = [
      ...new Set(
        data
          .map((item) => item.topico)
          .filter((topico) => topico && topico.trim() !== "")
      ),
    ];

    const formattedTopicos = uniqueTopicos
      .map((topico) => ({
        value: topico.trim(),
        label: topico.charAt(0).toUpperCase() + topico.slice(1),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    console.log(
      "Tópicos formatados para a disciplina",
      disciplina,
      ":",
      formattedTopicos
    );
    return formattedTopicos;
  } catch (error) {
    console.error("Erro ao buscar tópicos:", error);
    throw error;
  }
}

// Buscar bancas únicas
export async function fetchBancas() {
  try {
    console.log("Buscando bancas...");
    const { data, error } = await supabase
      .from("questoes")
      .select("banca_examinadora")
      .not("banca_examinadora", "is", null)
      .neq("banca_examinadora", "");

    if (error) throw error;

    const uniqueBancas = [
      ...new Set(
        data
          .map((item) => item.banca_examinadora)
          .filter((banca) => banca && banca.trim() !== "")
      ),
    ];

    const formattedBancas = uniqueBancas
      .map((banca) => ({
        value: banca.trim(),
        label: banca.toUpperCase(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    console.log("Bancas encontradas:", formattedBancas);
    return formattedBancas;
  } catch (error) {
    console.error("Erro ao buscar bancas:", error);
    throw error;
  }
}
