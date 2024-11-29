import { courseLessons } from '../data/courseLessons';
import fs from 'fs';
import path from 'path';

export async function updateCourseLessons(subject, lessonData) {
  try {
    // Adiciona a nova aula ao objeto courseLessons
    if (!courseLessons[subject]) {
      courseLessons[subject] = {};
    }
    
    courseLessons[subject][lessonData.title] = {
      title: lessonData.title,
      videoUrl: lessonData.videoUrl,
      description: lessonData.description,
      resources: [
        {
          name: 'Material de Apoio',
          url: '#'
        }
      ],
      nextLesson: true
    };

    // Converte o objeto para string formatada
    const fileContent = `export const courseLessons = ${JSON.stringify(courseLessons, null, 2)};`;

    // Caminho para o arquivo courseLessons.js
    const filePath = path.resolve(__dirname, '../data/courseLessons.js');

    // Escreve no arquivo
    await fs.promises.writeFile(filePath, fileContent, 'utf8');

    return true;
  } catch (error) {
    console.error('Erro ao atualizar courseLessons:', error);
    return false;
  }
}
