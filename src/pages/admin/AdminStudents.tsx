import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Student {
  id: string; name: string; email: string | null; grade: string; level: string; active: number;
  courses_count: number; submissions_count: number;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    setStudents(null);
    const r = await fetch("/api/admin/students", { credentials: "include" });
    if (r.ok) setStudents(await r.json());
  };
  useEffect(() => { fetchStudents(); }, []);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const url = data.id ? `/api/admin/students/${data.id}` : "/api/admin/students";
      const method = data.id ? "PUT" : "POST";
      const r = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(data.id ? "Estudiante actualizado" : "Estudiante creado");
      setEditing(null); setCreating(false);
      await fetchStudents();
    } catch (e: any) { toast.error("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/students/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Estudiante eliminado");
      setDeleting(null);
      await fetchStudents();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Estudiantes</h1>
          <p className="mt-1 text-slate-400">{students?.length ?? 0} estudiantes matriculados</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="mr-2 size-4" /> Nuevo estudiante
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          {!students ? (
            <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-slate-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Nombre</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Grado</TableHead>
                  <TableHead className="text-slate-400">Nivel</TableHead>
                  <TableHead className="text-slate-400 text-center">Cursos</TableHead>
                  <TableHead className="text-slate-400 text-center">Entregas</TableHead>
                  <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-white">{s.name}</TableCell>
                    <TableCell className="text-slate-300">{s.email || "—"}</TableCell>
                    <TableCell className="text-slate-300">{s.grade}</TableCell>
                    <TableCell className="text-slate-300 capitalize">{s.level}</TableCell>
                    <TableCell className="text-center text-slate-300">{s.courses_count}</TableCell>
                    <TableCell className="text-center text-slate-300">{s.submissions_count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(s)} className="hover:bg-slate-700">
                        <Pencil className="size-4 text-slate-300" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(s)} className="hover:bg-slate-700">
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

      <StudentDialog
        open={!!editing || creating}
        student={editing}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={handleSave}
        saving={saving}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar estudiante</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Eliminar a <strong>{deleting?.name}</strong>?
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

function StudentDialog({ open, student, onClose, onSave, saving }: {
  open: boolean; student: Student | null;
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [grade, setGrade] = useState(""); const [level, setLevel] = useState("secundaria");

  useEffect(() => {
    if (student) { setName(student.name); setEmail(student.email || ""); setGrade(student.grade); setLevel(student.level); }
    else { setName(""); setEmail(""); setGrade(""); setLevel("secundaria"); }
  }, [student, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{student ? "Editar estudiante" : "Nuevo estudiante"}</DialogTitle>
          <DialogDescription className="text-slate-400">{student ? "Modifica los datos del estudiante." : "Crea un estudiante nuevo."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-slate-950 border-slate-700" /></div>
          <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-950 border-slate-700" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Grado</Label><Input value={grade} onChange={e => setGrade(e.target.value)} className="bg-slate-950 border-slate-700" placeholder="Ej: 9no A" /></div>
            <div className="grid gap-2"><Label>Nivel</Label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white">
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria</option>
                <option value="bachillerato">Bachillerato</option>
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ id: student && student.id, name, email, grade, level })} disabled={saving || !name || !grade}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}