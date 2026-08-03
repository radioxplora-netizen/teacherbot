import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TeacherLayout from "./pages/docente/TeacherLayout";
import TeacherDashboard from "./pages/docente/TeacherDashboard";
import TeacherCourse from "./pages/docente/TeacherCourse";
import TeacherAssignment from "./pages/docente/TeacherAssignment";
import ViceLayout from "./pages/vicerrectorado/ViceLayout";
import ViceDashboard from "./pages/vicerrectorado/ViceDashboard";
import SystemLayout from "./pages/sistemas/SystemLayout";
import SystemLogs from "./pages/sistemas/SystemLogs";
import AIConfig from "./pages/sistemas/AIConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          <Route path="/docente" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path=":courseId" element={<TeacherCourse />} />
            <Route path=":courseId/tareas/:assignmentId" element={<TeacherAssignment />} />
          </Route>

          <Route path="/vicerrectorado" element={<ViceLayout />}>
            <Route index element={<ViceDashboard />} />
          </Route>

          <Route path="/sistemas" element={<SystemLayout />}>
            <Route index element={<SystemLogs />} />
            <Route path="ia" element={<AIConfig />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
