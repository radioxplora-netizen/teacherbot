import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Brain, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

function getDashboardForRole(role: string): string {
  const map: Record<string, string> = { admin: '/sistemas', vicerrector: '/vicerrectorado', docente: '/docente', estudiante: '/estudiante', sistemas: '/sistemas' };
  return map[role] || '/docente';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect
  if (isAuthenticated && user) {
    const to = (location.state as any)?.from?.pathname || getDashboardForRole(user.role);
    navigate(to, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const to = (location.state as any)?.from?.pathname || getDashboardForRole(user?.role || 'docente');
      navigate(to, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl shadow-orange-500/40">
            <Brain className="size-10 text-white" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 pt-16 backdrop-blur-xl shadow-2xl">
          <h1 className="mb-2 text-center text-2xl font-bold text-white">Oxford IA</h1>
          <p className="mb-8 text-center text-sm text-purple-300">Iniciar sesión en TeacherBot</p>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-purple-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-purple-400/50 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                placeholder="admin@teacherbot.edu.ec"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-purple-200">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder-purple-400/50 outline-none transition focus:border-orange-500/50 focus:bg-white/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-400 hover:to-orange-500 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-5 animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-purple-400/60">
            Unidad Educativa Oxford &copy; 2026
          </div>
        </div>
      </div>
    </div>
  );
}
