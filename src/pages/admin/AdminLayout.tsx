import { Outlet, Link } from "react-router-dom";
import { ArrowLeft, Shield, Users, BookOpen, GraduationCap, FileText, Settings, Activity } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="shrink-0 text-slate-300 hover:text-white hover:bg-white/10">
                <ArrowLeft className="size-5" />
                <span className="sr-only">Menú Principal</span>
              </Button>
            </Link>
            <div className="group relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30 transition-all hover:scale-105">
              <Shield className="relative size-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Administración</div>
              <div className="text-xs text-slate-400">Control total del sistema</div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación admin">
            <NavLink to="/admin" end className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" activeClassName="bg-red-500/20 text-red-400">
              <span className="inline-flex items-center gap-2"><Activity className="size-4" /> Dashboard</span>
            </NavLink>
            <NavLink to="/admin/usuarios" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" activeClassName="bg-red-500/20 text-red-400">
              <span className="inline-flex items-center gap-2"><Users className="size-4" /> Usuarios</span>
            </NavLink>
            <NavLink to="/admin/cursos" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" activeClassName="bg-red-500/20 text-red-400">
              <span className="inline-flex items-center gap-2"><BookOpen className="size-4" /> Cursos</span>
            </NavLink>
            <NavLink to="/admin/estudiantes" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" activeClassName="bg-red-500/20 text-red-400">
              <span className="inline-flex items-center gap-2"><GraduationCap className="size-4" /> Estudiantes</span>
            </NavLink>
            <NavLink to="/admin/tareas" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" activeClassName="bg-red-500/20 text-red-400">
              <span className="inline-flex items-center gap-2"><FileText className="size-4" /> Tareas</span>
            </NavLink>
            <NavLink to="/admin/configuracion" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" activeClassName="bg-red-500/20 text-red-400">
              <span className="inline-flex items-center gap-2"><Settings className="size-4" /> Configuración IA</span>
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
