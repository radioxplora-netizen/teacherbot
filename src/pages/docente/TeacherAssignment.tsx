import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, Eye, FileText, Loader2, MessageSquare, Save, Sparkles, RefreshCw, ExternalLink, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAssignment, evaluateSubmission } from "@/lib/api";
import { toast } from "sonner";

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pendiente: "Pendiente", en_proceso: "En proceso", listo: "Listo", revisado: "Revisado"
  };
  return map[status] || status;
}

function statusVariant(status: string): "secondary" | "default" | "destructive" | "outline" {
  if (status === "listo" || status === "revisado") return "default";
  if (status === "en_proceso") return "outline";
  return "secondary";
}

interface RubricItem { id?: string; criterion: string; description: string; points: number; }

export default function TeacherAssignment() {
  const { courseId, assignmentId } = useParams();
  const { data: assignment, loading, error, refetch } = useAssignment(assignmentId);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [evaluating, setEvaluating] = useState<string | null>(null);

  // Editable: prompt, título, fecha
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [promptDraft, setPromptDraft] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  // Editable: rúbrica
  const [editingRubric, setEditingRubric] = useState(false);
  const [rubricDraft, setRubricDraft] = useState<RubricItem[]>([]);
  const [savingRubric, setSavingRubric] = useState(false);

  useEffect(() => {
    if (assignment) {
      setTitleDraft(assignment.title || "");
      setPromptDraft(assignment.prompt || "");
    }
  }, [assignment?.id]);

  const submissions = assignment?.submissions || [];
  const rubric: RubricItem[] = assignment?.rubric || [];

  const startEditRubric = () => {
    setRubricDraft(rubric.map(r => ({ id: r.id, criterion: r.criterion, description: r.description || "", points: r.points })));
    setEditingRubric(true);
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      const r = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleDraft, prompt: promptDraft }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Tarea actualizada");
      setEditing(false);
      refetch();
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    } finally {
      setSavingMeta(false);
    }
  };

  const saveRubric = async () => {
    setSavingRubric(true);
    try {
      const r = await fetch(`/api/assignments/${assignmentId}/rubric`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: rubricDraft.filter(it => it.criterion.trim()) }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Rúbrica actualizada");
      setEditingRubric(false);
      refetch();
    } catch (e: any) {
      toast.error("Error al guardar rúbrica: " + e.message);
    } finally {
      setSavingRubric(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <Card>
        <CardHeader><CardTitle>Tarea no encontrada</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">{error || "Revisa el enlace."}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          {editing ? (
            <Input
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              className="text-2xl font-semibold h-12 max-w-2xl"
              placeholder="Título de la tarea"
            />
          ) : (
            <h1 className="text-3xl font-semibold tracking-tight">{assignment.title}</h1>
          )}
          <p className="mt-1 text-muted-foreground">{assignment.course_name}</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setTitleDraft(assignment.title); setPromptDraft(assignment.prompt); }}>
                <X className="mr-1 size-4" /> Cancelar
              </Button>
              <Button onClick={saveMeta} disabled={savingMeta}>
                {savingMeta ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Check className="mr-1 size-4" />}
                Guardar
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 size-4" /> Editar
            </Button>
          )}
          <Button asChild variant="outline">
            <a href={`/docente/${courseId}`}><ChevronLeft className="mr-1" /> Volver al curso</a>
          </Button>
        </div>
      </div>

      {/* Config + Rubric */}
      <section className="grid gap-4 lg:grid-cols-2" aria-label="Configuración">
        {/* Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" /> Prompt / Instrucciones</CardTitle>
            <CardDescription>Instrucciones para la evaluación con IA</CardDescription>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                value={promptDraft}
                onChange={e => setPromptDraft(e.target.value)}
                className="min-h-40 text-sm"
                placeholder="Describe las instrucciones de la tarea..."
              />
            ) : (
              <Textarea value={assignment.prompt || ""} readOnly className="min-h-32 text-sm bg-muted/30" />
            )}
          </CardContent>
        </Card>

        {/* Rubric */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2"><FileText className="size-4" /> Rúbrica</CardTitle>
              <CardDescription>{(editingRubric ? rubricDraft : rubric).length} criterios de evaluación</CardDescription>
            </div>
            {editingRubric ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingRubric(false)}>
                  <X className="mr-1 size-4" /> Cancelar
                </Button>
                <Button size="sm" onClick={saveRubric} disabled={savingRubric}>
                  {savingRubric ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Check className="mr-1 size-4" />}
                  Guardar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={startEditRubric}>
                <Pencil className="mr-1 size-4" /> Editar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingRubric ? (
              <div className="space-y-3">
                {rubricDraft.map((it, idx) => (
                  <div key={idx} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={it.criterion}
                        onChange={e => setRubricDraft(prev => prev.map((p, i) => i === idx ? { ...p, criterion: e.target.value } : p))}
                        placeholder="Criterio"
                        className="flex-1"
                      />
                      <Input
                        type="number" min="0" step="0.5"
                        value={it.points}
                        onChange={e => setRubricDraft(prev => prev.map((p, i) => i === idx ? { ...p, points: Number(e.target.value) } : p))}
                        className="w-20"
                      />
                      <Button size="icon" variant="ghost" onClick={() => setRubricDraft(prev => prev.filter((_, i) => i !== idx))}>
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </div>
                    <Textarea
                      value={it.description}
                      onChange={e => setRubricDraft(prev => prev.map((p, i) => i === idx ? { ...p, description: e.target.value } : p))}
                      placeholder="Descripción (opcional)"
                      rows={2}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setRubricDraft(prev => [...prev, { criterion: "", description: "", points: 0 }])}>
                  <Plus className="mr-1 size-4" /> Agregar criterio
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {rubric.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin criterios definidos.</p>
                ) : rubric.map((r: any) => (
                  <div key={r.id} className="flex items-start justify-between gap-2 rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{r.criterion}</p>
                      {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                    </div>
                    <Badge variant="secondary" className="shrink-0">{r.points} pts</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Submissions table */}
      <Card>
        <CardHeader>
          <CardTitle>Entregas ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay entregas todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Nota IA</TableHead>
                  <TableHead className="text-right">Feedback</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s: any, idx: number) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{s.student_name}</TableCell>
                    <TableCell><Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge></TableCell>
                    <TableCell className="text-right font-mono">
                      {s.ai_score != null ? s.ai_score.toFixed(1) : "—"}
                    </TableCell>
                    <TableCell className="text-right max-w-[200px] truncate text-muted-foreground text-xs">
                      {s.ai_feedback ? s.ai_feedback.substring(0, 60) + "…" : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { setSelectedSub(s); setGradeInput(s.teacher_score?.toString() || s.ai_score?.toString() || ""); setFeedbackInput(s.teacher_feedback || ""); }}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedSub} onOpenChange={(o) => !o && setSelectedSub(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisión: {selectedSub?.student_name}</DialogTitle>
            <DialogDescription>
              {assignment.title} · Entregado: {selectedSub?.submitted_at ? new Date(selectedSub.submitted_at).toLocaleString() : "—"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Top action buttons */}
            <div className="flex flex-wrap gap-2">
              {selectedSub?.file_url && !selectedSub.file_url.startsWith('online_text:') && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={selectedSub.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 mr-1" /> {selectedSub.file_url.endsWith('.pdf') ? 'Ver PDF' : 'Ver entrega'}
                  </a>
                </Button>
              )}
              </div>

            {/* AI Analysis */}
            <div className="rounded-lg border bg-brand/5 p-4">
              <h4 className="font-medium flex items-center gap-2 mb-3"><Sparkles className="size-4" /> Análisis IA</h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-background rounded p-3 border">
                  <span className="text-xs text-muted-foreground">Nota sugerida</span>
                  <p className="text-2xl font-bold text-brand">{selectedSub?.ai_score?.toFixed(1) || "—"}</p>
                </div>
                <div className="bg-background rounded p-3 border">
                  <span className="text-xs text-muted-foreground">Estado</span>
                  <p className="text-lg font-medium">{selectedSub?.status ? statusLabel(selectedSub.status) : "—"}</p>
                </div>
              </div>
              <div className="bg-background rounded p-3 border">
                <p className="text-sm font-medium mb-1">Feedback IA:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedSub?.ai_feedback || (evaluating === selectedSub?.id ? "⏳ La IA está evaluando el PDF..." : "Sin feedback de IA disponible.")}
                </p>
              </div>
            </div>

            {/* Teacher Grading */}
            <div className="space-y-4 pt-2 border-t">
              <div className="grid gap-2">
                <Label htmlFor="grade">Nota Docente (0-10)</Label>
                <Input id="grade" type="number" min="0" max="10" step="0.1" value={gradeInput} onChange={e => setGradeInput(e.target.value)} placeholder="Ej: 9.5" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback">Comentarios</Label>
                <Textarea id="feedback" value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} placeholder="Escribe tus observaciones..." className="min-h-[100px]" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSub(null)}>Cancelar</Button>
            <Button variant="default" onClick={() => {
              toast.success("Calificación guardada", { description: `Has calificado a ${selectedSub?.student_name} con ${gradeInput}` });
              setSelectedSub(null);
            }}>
              <Save className="mr-2 size-4" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
