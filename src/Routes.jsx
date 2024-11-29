import React from "react";
import { Routes as RouterRoutes, Route } from "react-router-dom";
import PlanExpired from "@/pages/PlanExpired";
import AccessDenied from "@/pages/AccessDenied";
import Courses from "@/pages/Courses";
import StudyGuide from "@/components/study-guide/StudyGuide";
import Performance from "@/pages/Performance";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminStudents from "@/pages/admin/Students";
import AdminQuestions from "@/pages/admin/Questions";
import ManageCourses from "@/pages/admin/ManageCourses";

export default function Routes() {
  return (
    <RouterRoutes>
      {/* Rotas públicas */}
      <Route path="/plano-expirado" element={<PlanExpired />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Rotas de cursos */}
      <Route path="/" element={<Courses />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<Courses />} />
      <Route path="/courses/:id/module/:moduleId" element={<Courses />} />
      <Route
        path="/courses/:id/module/:moduleId/lesson/:lessonId"
        element={<Courses />}
      />
      <Route path="/study-guide" element={<StudyGuide />} />
      <Route path="/performance" element={<Performance />} />

      {/* Rotas administrativas */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/students" element={<AdminStudents />} />
      <Route path="/admin/questions" element={<AdminQuestions />} />
      <Route path="/admin/manage-courses" element={<ManageCourses />} />
    </RouterRoutes>
  );
}
