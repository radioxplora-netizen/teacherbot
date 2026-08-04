import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Check, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Assignment {
  id: string; course_id: string; course_name: string; title: string;
  prompt: string; due_at: string; submissions_count: number; teacher_name: string | null;
}

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setAssignments(null);
    const [a, c] = await Promise.all([
      fetch("/api/admin/assignments", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin/courses", { credentials: "include" }).then(r => r.json()),
    ]);
    setAssignments(a);
    setCourses(c);
  };
  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (data: any) => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/assignments", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Tarea creada");
      setCreating(false);
      await fetchAll();
    } catch (e: any) { toast.error("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/assignments/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Tarea eliminada");
      setDeleting(null);
      await fetchAll();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Tareas</h1>
          <p className="mt-1 text-slate-400">{assignments?.length ?? 0} tareas en el sistema</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="mr-2 size-4" /> Nueva tarea
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          {!assignments ? (
            <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-slate-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Título</TableHead>
                  <TableHead className="text-slate-400">Curso</TableHead>
                  <TableHead className="text-slate-400">Docente</TableHead>
                  <TableHead className="text-slate-400">Vence</TableHead>
                  <TableHead className="text-slate-400 text-center">Entregas</TableHead>
                  <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-white">{a.title}</TableCell>
                    <TableCell className="text-slate-300">{a.course_name}</TableCell>
                    <TableCell className="text-slate-300">{a.teacher_name || <span className="text-slate-500 italic">—</span>}</TableCell>
                    <TableCell className="text-slate-300 text-xs">{new Date(a.due_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={a.submissions_count > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-700 text-slate-400"}>
                        {a.submissions_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:bg-slate-700">
                        <a href={`/docente/${a.course_id}/tareas/${a.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-4 text-slate-300" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(a)} className="hover:bg-slate-700">
                        <Trash2 className="size-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateAssignmentDialog
        open={creating}
        courses={courses}
        onClose={() => setCreating(false)}
        onSave={handleCreate}
        saving={saving}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar tarea</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Eliminar <strong>{deleting?.title}</strong>? Se borrarán también todas sus entregas y rúbrica.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting.id)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateAssignmentDialog({ open, courses, onClose, onSave, saving }: {
  open: boolean; courses: any[];
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}) {
  const [courseId, setCourseId] = useState(""); const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date(Date.now() + 7*24*60*60*1000);
    return d.toISOString().slice(0, 16);
  });

  useEffect(() => {
    if (open) {
      if (courses.length && !courseId) setCourseId(courses[0].id);
      setTitle(""); setPrompt("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription className="text-slate-400">Crea una asignación para un curso.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Curso</Label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white">
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
          <div className="grid gap-2">
            <Label>Fecha de entrega</Label>
            <Input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
          <div className="grid gap-2">
            <Label>Prompt (instrucciones para IA)</Label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white text-sm font-mono" placeholder="Describe las instrucciones que verá la IA al evaluar..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ course_id: courseId, title, prompt, due_at: new Date(dueAt).toISOString() })} disabled={saving || !title || !courseId}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            Crear tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}