import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Course {
  id: string; name: string; code: string | null; teacher_id: string | null;
  description: string | null; teacher_name: string | null;
  assignments_count: number; students_count: number;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    setCourses(null);
    const r = await fetch("/api/admin/courses", { credentials: "include" });
    if (r.ok) setCourses(await r.json());
  };
  const fetchTeachers = async () => {
    const r = await fetch("/api/admin/users", { credentials: "include" });
    if (r.ok) {
      const all = await r.json();
      setTeachers(all.filter((u: any) => u.role === "docente"));
    }
  };
  useEffect(() => { fetchCourses(); fetchTeachers(); }, []);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const url = data.id ? `/api/admin/courses/${data.id}` : "/api/admin/courses";
      const method = data.id ? "PUT" : "POST";
      const r = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(data.id ? "Curso actualizado" : "Curso creado");
      setEditing(null); setCreating(false);
      await fetchCourses();
    } catch (e: any) { toast.error("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/courses/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Curso eliminado");
      setDeleting(null);
      await fetchCourses();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Cursos</h1>
          <p className="mt-1 text-slate-400">{courses?.length ?? 0} cursos en el sistema</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="mr-2 size-4" /> Nuevo curso
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          {!courses ? (
            <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-slate-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Nombre</TableHead>
                  <TableHead className="text-slate-400">Código</TableHead>
                  <TableHead className="text-slate-400">Docente</TableHead>
                  <TableHead className="text-slate-400 text-center">Tareas</TableHead>
                  <TableHead className="text-slate-400 text-center">Estudiantes</TableHead>
                  <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map(c => (
                  <TableRow key={c.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-white">{c.name}</TableCell>
                    <TableCell className="text-slate-300 font-mono text-xs">{c.code || "—"}</TableCell>
                    <TableCell className="text-slate-300">{c.teacher_name || <span className="text-slate-500 italic">Sin asignar</span>}</TableCell>
                    <TableCell className="text-center text-slate-300">{c.assignments_count}</TableCell>
                    <TableCell className="text-center text-slate-300">{c.students_count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(c)} className="hover:bg-slate-700">
                        <Pencil className="size-4 text-slate-300" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(c)} className="hover:bg-slate-700">
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

      <CourseDialog
        open={!!editing || creating}
        course={editing}
        teachers={teachers}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={handleSave}
        saving={saving}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar curso</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Eliminar <strong>{deleting?.name}</strong>? Se borrarán también sus tareas y matrículas.
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

function CourseDialog({ open, course, teachers, onClose, onSave, saving }: {
  open: boolean; course: Course | null; teachers: any[];
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(""); const [code, setCode] = useState("");
  const [teacherId, setTeacherId] = useState(""); const [description, setDescription] = useState("");

  useEffect(() => {
    if (course) { setName(course.name); setCode(course.code || ""); setTeacherId(course.teacher_id || ""); setDescription(course.description || ""); }
    else { setName(""); setCode(""); setTeacherId(""); setDescription(""); }
  }, [course, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{course ? "Editar curso" : "Nuevo curso"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {course ? "Modifica los datos del curso." : "Crea un curso nuevo."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
          <div className="grid gap-2">
            <Label>Código</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} className="bg-slate-950 border-slate-700" placeholder="Ej: MAT-9A" />
          </div>
          <div className="grid gap-2">
            <Label>Docente</Label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white">
              <option value="">— Sin asignar —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ id: course && course.id, name, code, teacher_id: teacherId || null, description })} disabled={saving || !name}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}