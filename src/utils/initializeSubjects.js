import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { courseLessons } from '../data/courseLessons';

export async function initializeSubjects() {
  try {
    const coursesRef = collection(db, 'courses');

    // Verificar quais matérias já existem
    const existingCoursesQuery = query(coursesRef);
    const existingCoursesSnapshot = await getDocs(existingCoursesQuery);
    const existingCourses = existingCoursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Pegar as matérias do courseLessons
    const subjects = Object.keys(courseLessons).map(title => ({
      title,
      lessons: Object.keys(courseLessons[title] || {}).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Adicionar ou atualizar matérias
    for (const subject of subjects) {
      const existingCourse = existingCourses.find(course => course.title === subject.title);
      
      if (!existingCourse) {
        try {
          await addDoc(coursesRef, subject);
          console.log(`Matéria ${subject.title} adicionada com sucesso!`);
        } catch (error) {
          console.error(`Erro ao adicionar matéria ${subject.title}:`, error);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao inicializar matérias:', error);
    return false;
  }
}
