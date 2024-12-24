import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
import Courses from "./pages/Courses";
import StudyGuide from "./components/study-guide/StudyGuide";
import Performance from "./pages/Performance";
import Simulations from "./pages/Simulations";
import SimulationExam from "./pages/SimulationExam";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import { ThemeProvider } from "./components/theme-provider";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminQuestions from "./pages/admin/Questions";
import AdminNotifications from "./pages/admin/Notifications";
import ManageCourses from "./pages/admin/ManageCourses";
import AdminEvents from "./pages/admin/events";
import { AccessProvider } from "./contexts/AccessContext";
import AccessDenied from "./pages/AccessDenied";
import ResetPassword from "./pages/ResetPassword";
import Community from "./pages/Community";
import Discussions from "./pages/community/Discussions";
import { CommunityProvider } from "@/contexts/CommunityContext";
import DiscussionDetails from "./pages/DiscussionDetails";
import FilterQuestions from "./components/filterquestions/FilterQuestions";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="cursivo-theme">
      <AuthProvider>
        <AccessProvider>
          <BrowserRouter>
            <CommunityProvider>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/courses"
                  element={
                    <PrivateRoute>
                      <Courses />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/courses/:id"
                  element={
                    <PrivateRoute>
                      <Courses />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/courses/:id/module/:moduleId"
                  element={
                    <PrivateRoute>
                      <Courses />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/courses/:id/module/:moduleId/lesson/:lessonId"
                  element={
                    <PrivateRoute>
                      <Courses />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/simulations"
                  element={
                    <PrivateRoute>
                      <Simulations />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/simulations/:simulationId"
                  element={
                    <PrivateRoute>
                      <SimulationExam />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/study-guide"
                  element={
                    <PrivateRoute>
                      <StudyGuide />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/performance"
                  element={
                    <PrivateRoute>
                      <Performance />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/community"
                  element={
                    <PrivateRoute>
                      <Community />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/community/discussions"
                  element={
                    <PrivateRoute>
                      <Discussions />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/filterquestions"
                  element={
                    <PrivateRoute>
                      <FilterQuestions />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/community/discussions/:id"
                  element={
                    <PrivateRoute>
                      <DiscussionDetails />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/manage-courses"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <ManageCourses />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/students"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <AdminStudents />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/questions"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <AdminQuestions />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <PrivateRoute>
                      <AdminRoute>
                        <AdminNotifications />
                      </AdminRoute>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/events"
                  element={
                    <AdminRoute>
                      <AdminEvents />
                    </AdminRoute>
                  }
                />
              </Routes>
            </CommunityProvider>
          </BrowserRouter>
        </AccessProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
