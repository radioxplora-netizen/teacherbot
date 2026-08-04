import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  GraduationCap,
  Heart,
  LineChart,
  MessageSquare,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  LogOut
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

// Floating particle component
function FloatingParticle({ delay, size, left, top }: { delay: number; size: number; left: string; top: string }) {
  return (
    <div
      className="absolute rounded-full bg-orange-500/30 animate-pulse pointer-events-none"
      style={{
        width: size,
        height: size,
        left,
        top,
        animationDelay: `${delay}s`,
        animationDuration: '3s'
      }}
    />
  );
}

// Benefit card component
function BenefitCard({
  icon: Icon,
  title,
  benefits,
  color,
  delay
}: {
  icon: React.ElementType;
  title: string;
  benefits: string[];
  color: string;
  delay: number;
}) {
  return (
    <Card
      className={`group relative overflow-hidden border-0 bg-gradient-to-br ${color} shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl" />
      <CardContent className="relative p-6 text-white">
        <div className="mb-4 inline-flex rounded-xl bg-white/20 p-3 backdrop-blur-sm">
          <Icon className="size-7" />
        </div>
        <h3 className="mb-3 text-xl font-bold">{title}</h3>
        <ul className="space-y-2">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/90">
              <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Stat card component
function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-orange-500/40">
      <div className="absolute -right-4 -top-4 size-20 rounded-full bg-orange-500/10 blur-xl group-hover:bg-orange-500/20 transition-colors" />
      <Icon className="relative mb-3 size-8 text-orange-400" />
      <div className="relative text-3xl font-bold text-white">{value}</div>
      <div className="relative text-sm text-purple-200">{label}</div>
    </div>
  );
}

/** Botón de acceso único — solo login o Mi Panel según sesión */
function RoleButtons() {
  const { user, isAuthenticated, logout } = useAuth();
  const panelHref = user?.role === 'admin' ? '/admin'
    : user?.role === 'vicerrector' ? '/vicerrectorado'
    : user?.role === 'sistemas' ? '/sistemas'
    : '/docente';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Button asChild size="lg" className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg shadow-orange-500/40 hover:shadow-xl hover:shadow-orange-500/50 transition-all">
        <a href={isAuthenticated ? panelHref : "/login"} className="flex items-center gap-2">
          <GraduationCap className="size-5" />
          {isAuthenticated ? 'Mi Panel' : 'Acceder'}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </Button>
      {isAuthenticated && (
        <Button size="lg" onClick={logout} className="bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:border-red-500">
          <LogOut className="size-5 mr-2" />
          Salir
        </Button>
      )}
    </div>
  );
}

/** Header con botón de acceso sensible al rol */
function HeaderBar() {
  const { user, isAuthenticated } = useAuth();
  const accessHref = isAuthenticated
    ? (user?.role === 'admin' ? '/admin' : user?.role === 'vicerrector' ? '/vicerrectorado' : user?.role === 'sistemas' ? '/sistemas' : '/docente')
    : '/login';
  const accessLabel = isAuthenticated ? 'Mi Panel' : 'Acceder';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1a0a2e]/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
            <Brain className="size-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">Oxford IA</span>
            <span className="ml-2 text-sm text-purple-300">Educación Inteligente</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#beneficios" className="text-sm text-purple-200 hover:text-white transition-colors">Beneficios</a>
          <a href="#estadisticas" className="text-sm text-purple-200 hover:text-white transition-colors">Impacto</a>
          {isAuthenticated && (
            <span className="text-sm text-orange-400 font-medium">{user?.name}</span>
          )}
          <Button asChild size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/30">
            <a href={accessHref}>{accessLabel}</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}

const Index = () => {
  const [stats, setStats] = useState({ submissions: 0, pending: 0, avgScore: 0, students: 0 });
  
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setStats({ submissions: 21, pending: 1, avgScore: 7.6, students: 17 }));
  }, []);
  
  const evaluated = stats.submissions - (stats.pending || 0);
  const tasksProcessed = useCounter(evaluated || 20);
  const hoursSaved = useCounter(Math.round((evaluated || 20) * 0.17));
  const satisfaction = useCounter(Math.round((stats.avgScore || 7.6) * 10));

  return (
    <div className="min-h-screen overflow-hidden bg-[#1a0a2e] text-white">
      {/* Animated Background - Purple/Orange Theme */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-600/10 via-transparent to-transparent" />
        {/* Floating particles */}
        <FloatingParticle delay={0} size={6} left="10%" top="20%" />
        <FloatingParticle delay={0.5} size={4} left="80%" top="15%" />
        <FloatingParticle delay={1} size={8} left="70%" top="60%" />
        <FloatingParticle delay={1.5} size={5} left="20%" top="70%" />
        <FloatingParticle delay={2} size={6} left="90%" top="80%" />
        <FloatingParticle delay={0.3} size={4} left="40%" top="30%" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <HeaderBar />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm text-orange-300 backdrop-blur-sm">
                <Sparkles className="size-4" />
                <span>Potenciado por Inteligencia Artificial</span>
                <Sparkles className="size-4" />
              </div>

              {/* Mascota IA Animada */}
              <div className="mb-8 flex justify-center">
                <video
                  src="/mascota_ia.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-48 w-auto object-contain drop-shadow-2xl rounded-2xl"
                />
              </div>

              {/* Title */}
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                <span className="text-white">
                  El Futuro de la
                </span>
                <br />
                <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Educación Oxford
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mb-10 max-w-2xl text-lg text-purple-200 md:text-xl">
                Transformamos la experiencia educativa con IA avanzada. Evaluaciones más rápidas,
                feedback personalizado y decisiones basadas en datos para toda la comunidad educativa.
              </p>

              {/* CTA Buttons — role-aware */}
              <RoleButtons />
            </div>
          </div>

          {/* Decorative gradient orbs */}
          <div className="absolute left-1/4 top-1/3 -z-10 size-96 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 -z-10 size-64 rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div className="absolute left-1/2 bottom-1/3 -z-10 size-48 rounded-full bg-purple-600/20 blur-3xl" />
        </section>

        {/* Stats Section */}
        <section id="estadisticas" className="py-16 border-y border-white/10 bg-[#2d1b4e]/50">
          <div className="container">
            <div className="grid gap-6 md:grid-cols-4">
              <StatCard
                value={`${tasksProcessed.toLocaleString()}+`}
                label="Tareas Evaluadas por IA"
                icon={Zap}
              />
              <StatCard
                value={`${hoursSaved}h`}
                label="Horas Ahorradas a Docentes"
                icon={Clock}
              />
              <StatCard
                value={`${satisfaction}%`}
                label="Satisfacción de la Comunidad"
                icon={Heart}
              />
              <StatCard
                value="< 2 min"
                label="Tiempo Promedio por Evaluación"
                icon={Rocket}
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-20 md:py-28">
          <div className="container">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl text-white">
                IA al Servicio de <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">Toda la Comunidad</span>
              </h2>
              <p className="mx-auto max-w-2xl text-purple-200">
                Nuestra plataforma de IA está diseñada para potenciar cada rol dentro de la Unidad Educativa Oxford.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <BenefitCard
                icon={GraduationCap}
                title="Para Docentes"
                color="from-orange-500 to-orange-600"
                delay={0}
                benefits={[
                  "Evaluación automática de tareas y ensayos",
                  "Feedback personalizado generado por IA",
                  "Ahorro de 80% del tiempo de corrección",
                  "Rúbricas inteligentes adaptables"
                ]}
              />
              <BenefitCard
                icon={Users}
                title="Para Padres"
                color="from-fuchsia-500 to-purple-600"
                delay={100}
                benefits={[
                  "Reportes de progreso en tiempo real",
                  "Alertas automáticas de rendimiento",
                  "Comunicación directa con docentes",
                  "Recomendaciones de apoyo en casa"
                ]}
              />
              <BenefitCard
                icon={Target}
                title="Para Estudiantes"
                color="from-amber-500 to-orange-500"
                delay={200}
                benefits={[
                  "Retroalimentación instantánea y detallada",
                  "Identificación de áreas de mejora",
                  "Seguimiento de su propio progreso",
                  "Recomendaciones de estudio personalizadas"
                ]}
              />
              <BenefitCard
                icon={LineChart}
                title="Para Directivos"
                color="from-purple-600 to-indigo-600"
                delay={300}
                benefits={[
                  "Dashboard con KPIs en tiempo real",
                  "Análisis de cumplimiento docente",
                  "Pareto de rendimiento académico",
                  "Toma de decisiones basada en datos"
                ]}
              />
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="py-20 bg-gradient-to-b from-orange-500/5 to-transparent">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <h2 className="mb-6 text-3xl font-bold md:text-4xl text-white">
                  Tecnología de <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">Última Generación</span>
                </h2>
                <p className="mb-8 text-purple-200">
                  Utilizamos los modelos de lenguaje más avanzados del mundo para garantizar
                  evaluaciones precisas, justas y consistentes.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: Brain, text: "Modelos GPT-4o y Claude 3 para análisis profundo" },
                    { icon: Shield, text: "Datos 100% seguros y privados" },
                    { icon: TrendingUp, text: "Mejora continua basada en feedback real" },
                    { icon: MessageSquare, text: "Integración directa con Moodle" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/20">
                        <item.icon className="size-5 text-orange-400" />
                      </div>
                      <span className="font-medium text-white">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/25 to-fuchsia-600/25 rounded-3xl blur-3xl" />
                <div className="relative rounded-2xl border border-white/10 bg-[#2d1b4e]/80 p-8 backdrop-blur-xl shadow-2xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
                      <Bot className="size-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Oxford AI Assistant</div>
                      <div className="text-sm text-purple-300">Evaluando tarea...</div>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-sm">
                    <div className="rounded-lg bg-purple-900/50 p-3 text-purple-100">
                      <span className="text-orange-400">►</span> Analizando estructura del ensayo...
                    </div>
                    <div className="rounded-lg bg-purple-900/50 p-3 text-purple-100">
                      <span className="text-green-400">✓</span> Tesis identificada y coherente
                    </div>
                    <div className="rounded-lg bg-purple-900/50 p-3 text-purple-100">
                      <span className="text-green-400">✓</span> 4 argumentos de soporte encontrados
                    </div>
                    <div className="rounded-lg bg-orange-500/15 p-3 border border-orange-500/30">
                      <span className="text-orange-400 font-bold">Nota sugerida: 8.7/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-fuchsia-600 p-12 text-center text-white shadow-2xl">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              <div className="relative">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl text-white">
                  ¿Listo para Transformar la Educación?
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-white/90">
                  Únete a la revolución educativa de Oxford. Experimenta el poder de la IA
                  para potenciar el aprendizaje y la enseñanza.
                </p>
                <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-white/90 shadow-xl font-bold">
                  <a href="/login" className="flex items-center gap-2">
                    Comenzar Ahora <ArrowRight className="size-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#2d1b4e]/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-purple-200">
            <img src="/logo_solo.png" alt="Oxford" className="h-8 w-auto opacity-80" />
            <span>© 2026 Unidad Educativa Oxford · Todos los derechos reservados</span>
          </div>
          <div className="text-sm text-purple-200">
            Potenciado por <span className="text-orange-400 font-medium">TeacherIA</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
