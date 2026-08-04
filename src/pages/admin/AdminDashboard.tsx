import { useEffect, useState } from "react";
import { Loader2, Users, BookOpen, GraduationCap, FileText, Settings, Shield, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(url, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [url]);
  return { data, loading };
}

export default function AdminDashboard() {
  const users = useFetch<any[]>("/api/admin/users");
  const courses = useFetch<any[]>("/api/admin/courses");
  const students = useFetch<any[]>("/api/admin/students");
  const assignments = useFetch<any[]>("/api/admin/assignments");

  const cards = [
    { title: "Usuarios", value: users.data?.length, icon: Users, href: "/admin/usuarios", color: "from-blue-500 to-blue-700", desc: "Docentes, admins, sistemas" },
    { title: "Cursos", value: courses.data?.length, icon: BookOpen, href: "/admin/cursos", color: "from-emerald-500 to-emerald-700", desc: "Materias y secciones" },
    { title: "Estudiantes", value: students.data?.length, icon: GraduationCap, href: "/admin/estudiantes", color: "from-purple-500 to-purple-700", desc: "Alumnos matriculados" },
    { title: "Tareas", value: assignments.data?.length, icon: FileText, href: "/admin/tareas", color: "from-amber-500 to-amber-700", desc: "Asignaciones creadas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Panel de Administración</h1>
        <p className="mt-1 text-slate-400">Vista general del sistema y acceso a todas las secciones.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Link key={c.title} to={c.href}>
            <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-600 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">{c.title}</CardTitle>
                <div className={`flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ${c.color}`}>
                  <c.icon className="size-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                {c.loading || c.value === undefined ? (
                  <Loader2 className="size-6 animate-spin text-slate-500" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white">{c.value}</div>
                    <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Shield className="size-5 text-red-400" /> Acciones rápidas</CardTitle>
          <CardDescription className="text-slate-400">Tareas comunes de administración</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Link to="/admin/usuarios" className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 p-3 hover:bg-slate-800">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white">Gestionar usuarios</p>
                <p className="text-xs text-slate-500">Crear, editar, activar</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-slate-500" />
          </Link>
          <Link to="/admin/configuracion" className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 p-3 hover:bg-slate-800">
            <div className="flex items-center gap-3">
              <Settings className="size-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">Configuración de IA</p>
                <p className="text-xs text-slate-500">Proveedor, parámetros</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-slate-500" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
