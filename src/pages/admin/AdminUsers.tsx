import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Search, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface User {
  id: string; name: string; email: string; role: string; active: number;
  avatar_url: string | null; created_at: string; last_login: string | null;
}

const ROLES = ["admin", "vicerrector", "docente", "estudiante", "sistemas"];
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  vicerrector: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  docente: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  estudiante: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  sistemas: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setUsers(null);
    const r = await fetch("/api/admin/users", { credentials: "include" });
    if (r.ok) setUsers(await r.json());
  };
  useEffect(() => { fetchUsers(); }, []);

  const filtered = users?.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase())
  );

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const url = data.id ? `/api/admin/users/${data.id}` : "/api/admin/users";
      const method = data.id ? "PUT" : "POST";
      const r = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(data.id ? "Usuario actualizado" : "Usuario creado");
      setEditing(null); setCreating(false);
      await fetchUsers();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Usuario eliminado");
      setDeleting(null);
      await fetchUsers();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Usuarios</h1>
          <p className="mt-1 text-slate-400">{users?.length ?? 0} usuarios en el sistema</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="mr-2 size-4" /> Nuevo usuario
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="size-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, email o rol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white"
            />
          </div>
        </CardHeader>
        <CardContent>
          {!users ? (
            <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-slate-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Nombre</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Rol</TableHead>
                  <TableHead className="text-slate-400">Estado</TableHead>
                  <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered && filtered.map(u => (
                  <TableRow key={u.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-white">{u.name}</TableCell>
                    <TableCell className="text-slate-300">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ROLE_COLORS[u.role] || ""}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-700 text-slate-400"}>
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(u)} className="hover:bg-slate-700">
                        <Pencil className="size-4 text-slate-300" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(u)} className="hover:bg-slate-700">
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

      <UserDialog
        open={!!editing || creating}
        user={editing}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={handleSave}
        saving={saving}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Eliminar a <strong>{deleting?.name}</strong>? Esta acción no se puede deshacer.
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

function UserDialog({ open, user, onClose, onSave, saving }: {
  open: boolean; user: User | null;
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("docente"); const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); setRole(user.role); setActive(!!user.active); }
    else { setName(""); setEmail(""); setRole("docente"); setActive(true); }
    setPassword("");
  }, [user, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{user ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {user ? "Modifica los datos del usuario." : "Crea un usuario nuevo en el sistema."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
          <div className="grid gap-2">
            <Label>Rol</Label>
            <select value={role} onChange={e => setRole(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>{user ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-slate-950 border-slate-700" placeholder="Mínimo 6 caracteres" />
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="size-4" />
              <Label>Usuario activo</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ id: user && user.id, name, email, role, password: password || undefined, active })} disabled={saving || !name || !email}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}