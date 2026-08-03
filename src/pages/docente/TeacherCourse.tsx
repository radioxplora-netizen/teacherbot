import { useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarClock, ChevronLeft, FileText, Loader2, AlertCircle, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/lib/api";
import SandboxModal from "@/components/SandboxModal";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function TeacherCourse() {
  const { courseId } = useParams();
  const { data: course, loading, error } = useCourse(courseId);
  const [sandboxAssignment, setSandboxAssignment] = useState<{ id: string; title: string } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <Card>
        <CardHeader><CardTitle>Curso no encontrado</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">
          {error || "Revisa el enlace o vuelve al listado."}
        </CardContent>
      </Card>
    );
  }

  const assignments = course.assignments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{course.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {course.period} · {course.grade} · {course.teacher_name || "Sin docente"}
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/docente"><ChevronLeft className="mr-1" /> Volver</a>
        </Button>
      </div>

      {assignments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No hay tareas en este curso.</p>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2" aria-label="Tareas">
        {assignments.map((a) => {
          const subs = a.submissions || [];
          const ready = subs.filter((s: any) => s.status === "listo").length;
          const pending = subs.filter((s: any) => s.status === "pendiente" || s.status === "en_proceso").length;
          const reviewed = subs.filter((s: any) => s.status === "revisado").length;
          const total = subs.length;
          const avgScore = subs.filter((s: any) => s.ai_score != null).length > 0
            ? Math.round(subs.filter((s: any) => s.ai_score != null).reduce((acc: number, s: any) => acc + s.ai_score, 0) / subs.filter((s: any) => s.ai_score != null).length * 10) / 10
            : null;

          return (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="text-xl">{a.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-2">
                    <CalendarClock className="size-3" /> Vence: {fmtDate(a.due_at)}
                  </Badge>
                  <Badge variant="secondary" className="gap-2">
                    <FileText className="size-3" /> Entregas: {total}
                  </Badge>
                  {avgScore !== null && (
                    <Badge variant="default" className="gap-2">Promedio: {avgScore}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {pending > 0 && <Badge variant="secondary">Pendiente: {pending}</Badge>}
                  {ready > 0 && <Badge variant="default">Listo: {ready}</Badge>}
                  {reviewed > 0 && <Badge variant="default">Revisado: {reviewed}</Badge>}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/50"
                    onClick={() => setSandboxAssignment({ id: a.id, title: a.title })}
                  >
                    <FlaskConical className="size-4 mr-1.5" /> Sandbox
                  </Button>
                  <Button asChild variant="hero" size="sm">
                    <a href={`/docente/${course.id}/tareas/${a.id}`}>Configurar y revisar</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Sandbox Modal */}
      {sandboxAssignment && (
        <SandboxModal
          open={!!sandboxAssignment}
          onOpenChange={(open) => { if (!open) setSandboxAssignment(null); }}
          assignmentId={sandboxAssignment.id}
          assignmentTitle={sandboxAssignment.title}
          courseId={courseId || ""}
        />
      )}
    </div>
  );
}
