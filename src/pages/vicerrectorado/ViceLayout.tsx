import { Outlet, Link } from "react-router-dom";
import { ClipboardCheck, ShieldCheck, ArrowLeft, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

export default function ViceLayout() {
  return (
    <div className="min-h-screen bg-[#1a0a2e]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#1a0a2e]/90 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="shrink-0 text-purple-300 hover:text-white hover:bg-white/10">
                <ArrowLeft className="size-5" />
                <span className="sr-only">Menú Principal</span>
              </Button>
            </Link>
            <div className="group relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-xl">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <ShieldCheck className="relative size-5 text-white transition-transform duration-500 group-hover:-rotate-12" />
              <Sparkles className="absolute top-1.5 right-1.5 size-2.5 text-yellow-300 animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Portal Vicerrectorado</div>
              <div className="text-xs text-purple-300">Auditoría y aprobación</div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Navegación vicerrectorado">
            <NavLink
              to="/vicerrectorado"
              end
              className="rounded-md px-3 py-2 text-sm text-purple-200 hover:bg-white/10 hover:text-white"
              activeClassName="bg-fuchsia-500/20 text-fuchsia-400"
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck className="size-4" /> Aprobaciones
              </span>
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
