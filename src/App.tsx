import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NoAutorizado from "./pages/NoAutorizado";
import Login from "./pages/Login";
import { AuthProvider, useTokenRefresh } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import TeacherLayout from "./pages/docente/TeacherLayout";
import TeacherDashboard from "./pages/docente/TeacherDashboard";
import TeacherCourse from "./pages/docente/TeacherCourse";
import TeacherAssignment from "./pages/docente/TeacherAssignment";
import ViceLayout from "./pages/vicerrectorado/ViceLayout";
import ViceDashboard from "./pages/vicerrectorado/ViceDashboard";
import SystemLayout from "./pages/sistemas/SystemLayout";
import SystemLogs from "./pages/sistemas/SystemLogs";
import AIConfig from "./pages/sistemas/AIConfig";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAssignments from "./pages/admin/AdminAssignments";
import AdminConfig from "./pages/admin/AdminConfig";


const queryClient = new QueryClient();

function AppRoutes() {
  useTokenRefresh();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      {/* Docente */}
      <Route path="/docente" element={<ProtectedRoute roles={["docente","admin"]}><TeacherLayout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path=":courseId" element={<TeacherCourse />} />
        <Route path=":courseId/tareas/:assignmentId" element={<TeacherAssignment />} />
      </Route>


      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<AdminUsers />} />
        <Route path="cursos" element={<AdminCourses />} />
        <Route path="estudiantes" element={<AdminStudents />} />
        <Route path="tareas" element={<AdminAssignments />} />
        <Route path="configuracion" element={<AdminConfig />} />
      </Route>

      {/* Vicerrector */}
      <Route path="/vicerrectorado" element={<ProtectedRoute roles={["vicerrector","admin"]}><ViceLayout /></ProtectedRoute>}>
        <Route index element={<ViceDashboard />} />
      </Route>

      {/* Sistemas */}
      <Route path="/sistemas" element={<ProtectedRoute roles={["sistemas","admin"]}><SystemLayout /></ProtectedRoute>}>
        <Route index element={<SystemLogs />} />
        <Route path="ia" element={<AIConfig />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
