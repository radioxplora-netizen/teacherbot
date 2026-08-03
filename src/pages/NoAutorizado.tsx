import { Link } from "react-router-dom";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NoAutorizado = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#1a0a2e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a0a2e]/90 backdrop-blur-xl">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-lg font-bold text-white">Oxford IA</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30">
              <ShieldX className="size-12 text-red-400" />
            </div>
          </div>
          <h1 className="mb-3 text-3xl font-bold text-white">Acceso Restringido</h1>
          <p className="mb-2 text-lg text-red-300">No tienes autorización para acceder a este portal.</p>
          <p className="mb-8 text-sm text-purple-300">
            Tu rol actual no tiene permisos para ver esta sección. Si crees que esto es un error, contacta al administrador del sistema.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
              <Link to="/" className="flex items-center gap-2">
                <Home className="size-4" />
                Ir al Inicio
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link to="/login" className="flex items-center gap-2">
                <ArrowLeft className="size-4" />
                Cambiar de Cuenta
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-sm text-purple-300">
        © 2026 Unidad Educativa Oxford · TeacherIA
      </footer>
    </div>
  );
};

export default NoAutorizado;
