import { useState, useEffect, useRef } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Loader2, Plus, RefreshCw, AlertCircle, X, FileText, Users, GraduationCap, BookMarked } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SpotlightSurface from "@/components/SpotlightSurface";
import { Progress } from "@/components/ui/progress";
import { useCourses, useStats } from "@/lib/api";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const { data: courses, loading, error: coursesError, refetch } = useCourses();
  const { data: stats, loading: statsLoading } = useStats();
  const [syncing, setSyncing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const pollRef = useRef<any>(null);

  // Real stats from database
  const pendingCount = stats?.pending ?? 0;
  const avgHumanMin = 15;
  const avgAiMin = 0.5;
  const humanHours = Math.round((pendingCount * avgHumanMin) / 60);
  const aiHours = Math.round((pendingCount * avgAiMin) / 60);

  const handleMoodleSync = async () => {
    setSyncing(true);
    setSyncModalOpen(true);
    setSyncResult(null);
    setSyncProgress(10);
    
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      setSyncProgress(50);
      if (!res.ok) throw new Error("Error al sincronizar");
      
      // Poll for result
      let attempts = 0;
      const maxAttempts = 30;
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/sync/status");
          const status = await statusRes.json();
          attempts++;
          setSyncProgress(50 + Math.min(attempts * 2, 45));
          
          if (status.last_sync && status.last_sync.status !== 'running') {
            clearInterval(pollRef.current);
            setSyncProgress(100);
            setSyncResult(status.last_sync);
            setSyncing(false);
            await refetch();
          }
          if (attempts >= maxAttempts) {
            clearInterval(pollRef.current);
            setSyncProgress(100);
            setSyncResult(status.last_sync || { status: 'completed' });
            setSyncing(false);
            await refetch();
          }
        } catch(e) {}
      }, 800);
    } catch (e: any) {
      if (pollRef.current) clearInterval(pollRef.current);
      setSyncResult({ status: 'failed', errors_count: 1, errors: [{ message: e.message }] });
      setSyncProgress(100);
      setSyncing(false);
    }
  };
  
  const closeSyncModal = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setSyncModalOpen(false);
    setSyncResult(null);
    setSyncProgress(0);
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

      {/* ─── Sync Monitor Modal ─── */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
             onClick={(e) => e.target === e.currentTarget && closeSyncModal()}>
          <div className="bg-white rounded-2xl max-w-xl w-[95%] max-h-[85vh] overflow-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <RefreshCw className={`size-5 text-brand ${syncing ? 'animate-spin' : ''}`} />
                Sincronización Moodle → TeacherBot
              </h2>
              <button onClick={closeSyncModal} className="p-1 rounded hover:bg-gray-100">
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{syncing ? 'Sincronizando...' : syncResult?.status === 'failed' ? 'Error' : 'Completado'}</span>
                  <span>{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>

              {/* Success result */}
              {syncResult && syncResult.status === 'completed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">¡Sincronización exitosa! — {syncResult.duration_ms}ms</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: GraduationCap, label: 'Cursos', value: syncResult.courses_processed, total: syncResult.courses_total },
                      { icon: BookMarked, label: 'Tareas', value: syncResult.assignments_created, total: syncResult.assignments_total },
                      { icon: Users, label: 'Estudiantes', value: syncResult.students_created, total: syncResult.students_total },
                      { icon: FileText, label: 'Entregas', value: syncResult.submissions_created, total: syncResult.submissions_total },
                      { icon: FileText, label: 'PDFs descargados', value: syncResult.pdfs_downloaded, total: null },
                      { icon: AlertCircle, label: 'Errores', value: syncResult.errors_count, total: null, danger: syncResult.errors_count > 0 },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                          <Icon className="size-4 text-muted-foreground" />
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</div>
                            <div className={`text-lg font-bold ${item.danger ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.value}{item.total != null ? ` / ${item.total}` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error result */}
              {syncResult && syncResult.status === 'failed' && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="size-5 text-red-600" />
                    <span className="font-semibold text-red-700">Error en la sincronización</span>
                  </div>
                  {syncResult.errors?.map((e: any, i: number) => (
                    <p key={i} className="text-sm text-red-600 ml-7">{e.message}</p>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {syncResult && !syncing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleMoodleSync} variant="outline" className="flex-1">
                    <RefreshCw className="size-4 mr-2" /> Sincronizar de nuevo
                  </Button>
                  <Button onClick={closeSyncModal} className="flex-1 bg-brand hover:bg-brand/90 text-white">
                    <CheckCircle2 className="size-4 mr-2" /> Cerrar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
