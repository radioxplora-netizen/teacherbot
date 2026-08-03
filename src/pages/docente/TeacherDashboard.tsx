import { useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Loader2, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SpotlightSurface from "@/components/SpotlightSurface";
import { useCourses, useStats } from "@/lib/api";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const { data: courses, loading, error: coursesError, refetch } = useCourses();
  const { data: stats, loading: statsLoading } = useStats();
  const [syncing, setSyncing] = useState(false);

  // Real stats from database
  const pendingCount = stats?.pending ?? 0;
  const avgHumanMin = 15;
  const avgAiMin = 0.5;
  const humanHours = Math.round((pendingCount * avgHumanMin) / 60);
  const aiHours = Math.round((pendingCount * avgAiMin) / 60);

  const handleMoodleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) throw new Error("Error al sincronizar");
      await refetch();
      toast.success("Sincronización completada", {
        description: "Datos actualizados desde Moodle.",
      });
    } catch (e: any) {
      toast.error("Error de sincronización", {
        description: e.message || "No se pudo conectar con Moodle.",
      });
    } finally {
      setSyncing(false);
    }
  };

  // Count submissions by status for a course
  function courseStats(course: any) {
    let pending = 0, inProgress = 0, ready = 0, reviewed = 0;
    if (course?.assignments) {
      for (const a of course.assignments) {
        const sc = a.status_counts || {};
        pending += sc.pendiente || 0;
        inProgress += sc.en_proceso || 0;
        ready += sc.listo || 0;
        reviewed += sc.revisado || 0;
      }
    }
    return { pending, inProgress, ready, reviewed };
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <SpotlightSurface as="section" className="relative overflow-hidden rounded-lg border bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 bg-hero" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-size:10px_10px] bg-grain" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Evaluación IA — Docente</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Configura rúbricas/prompts, revisa procesamiento y previsualiza feedback antes de aprobar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleMoodleSync}
                disabled={syncing}
                className="border-brand/30 hover:border-brand"
              >
                {syncing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
                Sincronizar Moodle
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="rounded-lg border bg-background/50 p-3 backdrop-blur min-w-[140px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="size-4" /> Tareas por revisar
              </div>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {statsLoading ? "..." : pendingCount}
              </div>
            </div>
            <div className="rounded-lg border bg-background/50 p-3 backdrop-blur min-w-[140px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" /> Est. Humano
              </div>
              <div className="mt-1 text-2xl font-bold text-foreground">~{humanHours}h</div>
              <div className="text-xs text-muted-foreground">({avgHumanMin} min/tarea)</div>
            </div>
            <div className="rounded-lg border bg-brand p-3 backdrop-blur shadow-glow min-w-[140px]">
              <div className="flex items-center gap-2 text-sm text-brand-foreground font-medium">
                <Clock3 className="size-4" /> Est. IA
              </div>
              <div className="mt-1 text-2xl font-bold text-brand-foreground">~{aiHours}h</div>
              <div className="text-xs text-brand-foreground/80">({avgAiMin} min/tarea)</div>
            </div>
          </div>
        </div>
      </SpotlightSurface>

      {/* Error state */}
      {coursesError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="size-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Error al cargar cursos</p>
              <p className="text-sm text-muted-foreground">{coursesError}. ¿Está corriendo el servidor API?</p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} className="ml-auto">Reintentar</Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && !courses && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Courses grid */}
      <section className="grid gap-4 md:grid-cols-2" aria-label="Cursos">
        {courses?.map((course) => {
          const st = courseStats(course);
          const totalSubs = st.pending + st.inProgress + st.ready + st.reviewed;
          const assignmentCount = course.assignments?.length ?? 0;

          return (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{course.name}</CardTitle>
                <CardDescription>
                  {course.period} · {course.grade} · {course.teacher_name || "Sin docente"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {st.pending > 0 && <Badge variant="secondary">Pendiente: {st.pending}</Badge>}
                  {st.inProgress > 0 && <Badge variant="secondary">En proceso: {st.inProgress}</Badge>}
                  {st.ready > 0 && <Badge variant="default">Listo: {st.ready}</Badge>}
                  {st.reviewed > 0 && <Badge variant="default">Revisado: {st.reviewed}</Badge>}
                  {totalSubs === 0 && <Badge variant="secondary">Sin entregas</Badge>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Tareas: {assignmentCount} · Entregas: {totalSubs}
                  </div>
                  <Button asChild variant="hero" size="sm">
                    <a href={`/docente/${course.id}`}>
                      Ver curso <ArrowRight className="ml-1 size-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {courses && courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No hay cursos todavía.</p>
            <p className="text-sm text-muted-foreground/60">Sincronizá con Moodle para importar tus cursos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
