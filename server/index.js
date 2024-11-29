const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para atualizar courseLessons.js
app.post("/api/update-course-lessons", async (req, res) => {
  try {
    const { subject, lessonData } = req.body;

    if (!subject || !lessonData) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // Lê o arquivo atual
    const filePath = path.resolve(__dirname, "../src/data/courseLessons.js");
    const fileContent = await fs.promises.readFile(filePath, "utf8");

    // Converte o conteúdo do arquivo para objeto
    let courseLessons;
    try {
      const match = fileContent.match(/export const courseLessons = ({[\s\S]+});/);
      if (!match) {
        throw new Error("Formato do arquivo inválido");
      }
      courseLessons = eval("(" + match[1] + ")");
    } catch (error) {
      console.error("Erro ao parsear courseLessons:", error);
      return res.status(500).json({ error: "Erro ao processar arquivo de aulas" });
    }

    // Adiciona a nova aula
    if (!courseLessons[subject]) {
      courseLessons[subject] = {};
    }

    courseLessons[subject][lessonData.title] = {
      title: lessonData.title,
      videoUrl: lessonData.videoUrl,
      description: lessonData.description,
      resources: lessonData.resources || [],
      nextLesson: true,
    };

    // Escreve o arquivo atualizado
    const newContent = `export const courseLessons = ${JSON.stringify(
      courseLessons,
      null,
      2
    )};`;

    try {
      await fs.promises.writeFile(filePath, newContent, "utf8");
      res.json({ success: true, message: "Arquivo atualizado com sucesso" });
    } catch (writeError) {
      console.error("Erro ao escrever arquivo:", writeError);
      res.status(500).json({ error: "Erro ao salvar alterações" });
    }
  } catch (error) {
    console.error("Erro no servidor:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
