import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import Sidebar from "@/components/courses/Sidebar";
import ModulesSidebar from "@/components/courses/ModulesSidebar";
import CourseContent from "@/components/courses/CourseContent";
import WeeklySchedule from "@/components/schedule/WeeklySchedule";
import TopNav from "@/components/TopNav";
import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

function Courses() {
  const location = useLocation();
  const { id, moduleId, lessonId } = useParams();
  const [selectedCourse, setSelectedCourse] = useState(
    location.state?.course || null
  );
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    const loadCourseData = async () => {
      if (id) {
        // Carregar dados do curso
        const courseDoc = await getDoc(doc(db, "courses", id));
        if (courseDoc.exists()) {
          setSelectedCourse({
            id: courseDoc.id,
            ...courseDoc.data(),
          });

          // Se tiver moduleId, carregar o módulo
          if (moduleId) {
            const moduleDoc = await getDoc(doc(db, "modules", moduleId));
            if (moduleDoc.exists()) {
              setSelectedModule({
                id: moduleDoc.id,
                ...moduleDoc.data(),
              });

              // Se tiver lessonId, carregar a lição
              if (lessonId) {
                const lessonDoc = await getDoc(doc(db, "videos", lessonId));
                if (lessonDoc.exists()) {
                  setSelectedLesson({
                    id: lessonDoc.id,
                    ...lessonDoc.data(),
                  });
                }
              }
            }
          }
        }
      }
    };

    loadCourseData();
  }, [id, moduleId, lessonId]);

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
    setShowSchedule(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TopNav />
      <Sidebar
        onCourseSelect={setSelectedCourse}
        onScheduleClick={() => setShowSchedule(true)}
      />
      {selectedCourse && (
        <ModulesSidebar
          course={selectedCourse}
          onSelectLesson={handleLessonSelect}
          selectedModule={selectedModule}
        />
      )}
      <main className="flex-1 overflow-y-auto">
        {showSchedule ? (
          <WeeklySchedule onClose={() => setShowSchedule(false)} />
        ) : (
          <CourseContent lesson={selectedLesson} />
        )}
      </main>
    </div>
  );
}

export default Courses;
