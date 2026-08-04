import { useEffect, useState } from "react";
import {
  Save, Sparkles, Server, Eye, EyeOff, Loader2, Plus, Trash2,
  Settings, Type, Hash, ToggleLeft, ListIcon, FileText, Key, Link as LinkIcon,
  CheckCircle2, AlertCircle, X, Pencil, GripVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Tipos ──────────────────────────────────────────────────────────────

interface ConfigCategory {
  key: string; label: string; description: string | null;
  icon: string; sort_order: number; is_active: number;
}

interface ConfigField {
  key: string; label: string; description: string | null;
  type: 'text'|'longtext'|'number'|'boolean'|'select'|'json'|'password'|'url'|'color'|'date';
  options: string[] | null;
  default_value: string | null;
  category_key: string | null;
  icon: string | null;
  sort_order: number;
  is_visible: number; is_required: number;
  min_value: number | null; max_value: number | null;
  placeholder: string | null;
}

interface ProviderField {
  key: string; label: string; description: string | null;
  type: 'text'|'longtext'|'number'|'boolean'|'select'|'password'|'url';
  options: string[] | null;
  default_value: string | null;
  is_required: number;
  sort_order: number; is_visible: number;
  placeholder: string | null;
}

interface Provider {
  id: string; name: string; provider_type: string;
  api_url: string; api_key: string; model: string;
  is_default: number; enabled: number;
}

// Mapeo de iconos por nombre (extender según necesidad)
const ICONS: Record<string, any> = {
  Thermometer: Sparkles, Settings, MessageSquare: FileText, FileText, Settings2: Settings,
  RefreshCw: Loader2, Shield: Settings, Sparkles, Bot: Sparkles, Database: Settings,
  CheckCircle: CheckCircle2, Clock: Loader2, Link: LinkIcon, Key, Globe: Sparkles,
  BookOpen: FileText, ListOrdered: FileText, Lightbulb: Sparkles, Gauge: Hash,
  Type, Hash, ToggleLeft, ListIcon,
};
const getIcon = (name: string | null | undefined) => {
  if (!name) return Settings;
  return ICONS[name] || Settings;
};

// Mapeo de iconos por type (para iconos dentro del editor de campos)
const TYPE_ICONS: Record<string, any> = {
  text: Type, longtext: FileText, number: Hash, boolean: ToggleLeft,
  select: ListIcon, password: Key, url: LinkIcon, color: Type,
  date: Type, json: FileText,
};
const TYPE_LABELS: Record<string, string> = {
  text: 'Texto corto', longtext: 'Texto largo', number: 'Número',
  boolean: 'Booleano (on/off)', select: 'Selección (opciones)',
  password: 'Contraseña (oculto)', url: 'URL', color: 'Color',
  date: 'Fecha', json: 'JSON',
};

// ── Componente principal ───────────────────────────────────────────────

export default function AdminConfig() {
  const [tab, setTab] = useState<"params" | "providers" | "schema">("params");

  // Schema cargado del backend (NADA quemado)
  const [categories, setCategories] = useState<ConfigCategory[]>([]);
  const [fields, setFields] = useState<ConfigField[]>([]);
  const [providerFields, setProviderFields] = useState<ProviderField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Field editor
  const [editingField, setEditingField] = useState<ConfigField | null>(null);
  const [creatingField, setCreatingField] = useState(false);

  // Category editor
  const [editingCategory, setEditingCategory] = useState<ConfigCategory | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Provider editor
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [creatingProvider, setCreatingProvider] = useState(false);
  const [showProviderKey, setShowProviderKey] = useState(false);
  const [providerForm, setProviderForm] = useState<Record<string, any>>({});

  const fetchSchema = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/config/schema", { credentials: "include" });
    if (r.ok) {
      const d = await r.json();
      setCategories(d.categories || []);
      setFields(d.fields || []);
      setProviderFields(d.provider_fields || []);
      setValues(d.values || {});
    }
    setLoading(false);
  };
  const fetchProviders = async () => {
    const r = await fetch("/api/ai/providers", { credentials: "include" });
    if (r.ok) setProviders(await r.json());
  };
  useEffect(() => { fetchSchema(); fetchProviders(); }, []);

  // ── Save param values ──────────────────────────────────────────────
  const handleSaveValues = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/config/values", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      toast.success("Configuración guardada", { description: `${data.updated?.length || 0} parámetros actualizados` });
      await fetchSchema();
    } catch (e: any) { toast.error("Error: " + e.message); }
    finally { setSaving(false); }
  };

  // ── Field CRUD ─────────────────────────────────────────────────────
  const saveField = async (data: Partial<ConfigField>) => {
    try {
      const url = data.key && fields.some(f => f.key === data.key)
        ? `/api/admin/config/fields/${data.key}`
        : "/api/admin/config/fields";
      const method = url.includes("/fields/") ? "PUT" : "POST";
      const r = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(url.includes("/fields/") ? "Campo actualizado" : "Campo creado");
      setEditingField(null); setCreatingField(false);
      await fetchSchema();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteField = async (key: string) => {
    if (!confirm(`¿Eliminar el campo "${key}" y todos sus valores?`)) return;
    try {
      const r = await fetch(`/api/admin/config/fields/${key}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Campo eliminado");
      await fetchSchema();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Category CRUD ──────────────────────────────────────────────────
  const saveCategory = async (data: Partial<ConfigCategory>) => {
    try {
      const url = data.key && categories.some(c => c.key === data.key)
        ? `/api/admin/config/categories/${data.key}`
        : "/api/admin/config/categories";
      const method = url.includes("/categories/") ? "PUT" : "POST";
      const r = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(url.includes("/categories/") ? "Categoría actualizada" : "Categoría creada");
      setEditingCategory(null); setCreatingCategory(false);
      await fetchSchema();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteCategory = async (key: string) => {
    if (!confirm(`¿Eliminar categoría "${key}"? Los campos quedarán sin categoría.`)) return;
    try {
      const r = await fetch(`/api/admin/config/categories/${key}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Categoría eliminada");
      await fetchSchema();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Provider CRUD ──────────────────────────────────────────────────
  const openNewProvider = () => {
    setEditingProvider(null);
    const initial: Record<string, any> = {};
    for (const pf of providerFields) {
      initial[pf.key] = pf.default_value !== null ? pf.default_value : (pf.type === 'boolean' ? 'false' : '');
    }
    setProviderForm(initial);
    setCreatingProvider(true);
  };

  const openEditProvider = (p: Provider) => {
    setEditingProvider(p);
    const form: Record<string, any> = { id: p.id };
    for (const pf of providerFields) {
      if (pf.key === 'api_key') form[pf.key] = ''; // Don't show existing
      else form[pf.key] = String((p as any)[pf.key] ?? pf.default_value ?? '');
    }
    setProviderForm(form);
    setCreatingProvider(true);
  };

  const saveProvider = async () => {
    try {
      const body: Record<string, any> = { ...providerForm };
      if (editingProvider && !body.api_key) delete body.api_key;
      else if (!editingProvider && !body.api_key) {
        toast.error("API Key requerida");
        return;
      }
      // Convert booleans
      for (const pf of providerFields) {
        if (pf.type === 'boolean') body[pf.key] = body[pf.key] === 'true' || body[pf.key] === true ? 1 : 0;
      }

      let r;
      if (editingProvider) {
        r = await fetch(`/api/ai/providers/${editingProvider.id}`, {
          method: "PUT", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        r = await fetch("/api/ai/providers", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      if (!r.ok) throw new Error(await r.text());
      toast.success(editingProvider ? "Proveedor actualizado" : "Proveedor creado");
      setCreatingProvider(false); setEditingProvider(null);
      await fetchProviders();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    try {
      const r = await fetch(`/api/ai/providers/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Proveedor eliminado");
      await fetchProviders();
    } catch (e: any) { toast.error(e.message); }
  };

  // ── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-slate-500" />
      </div>
    );
  }

  // Agrupar fields por categoría
  const fieldsByCategory: Record<string, ConfigField[]> = {};
  for (const f of fields) {
    const cat = f.category_key || "_uncategorized";
    if (!fieldsByCategory[cat]) fieldsByCategory[cat] = [];
    fieldsByCategory[cat].push(f);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Configuración Parametrizable</h1>
          <p className="mt-1 text-slate-400">{fields.length} parámetros · {categories.length} categorías · {providerFields.length} campos de proveedor</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "params" ? "default" : "outline"} onClick={() => setTab("params")} className={tab === "params" ? "bg-red-600 hover:bg-red-700" : "border-slate-700"}>
            <Sparkles className="mr-2 size-4" /> Parámetros
          </Button>
          <Button variant={tab === "providers" ? "default" : "outline"} onClick={() => setTab("providers")} className={tab === "providers" ? "bg-red-600 hover:bg-red-700" : "border-slate-700"}>
            <Server className="mr-2 size-4" /> Proveedores
          </Button>
          <Button variant={tab === "schema" ? "default" : "outline"} onClick={() => setTab("schema")} className={tab === "schema" ? "bg-red-600 hover:bg-red-700" : "border-slate-700"}>
            <Settings className="mr-2 size-4" /> Schema
          </Button>
        </div>
      </div>

      {/* ── Tab: Parámetros ──────────────────────────────────────────── */}
      {tab === "params" && (
        <>
          <div className="flex justify-end">
            <Button onClick={handleSaveValues} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Guardar todos los parámetros
            </Button>
          </div>
          {categories.map(cat => {
            const catFields = fieldsByCategory[cat.key] || [];
            if (catFields.length === 0) return null;
            const CatIcon = getIcon(cat.icon);
            return (
              <Card key={cat.key} className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CatIcon className="size-5 text-amber-400" /> {cat.label}
                    <Badge variant="outline" className="ml-2 bg-slate-800 border-slate-700 text-slate-400">{catFields.length}</Badge>
                  </CardTitle>
                  {cat.description && <CardDescription className="text-slate-400">{cat.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {catFields.map(f => (
                    <FieldRow key={f.key} field={f} value={values[f.key] ?? f.default_value ?? ""}
                      onChange={(v) => setValues(prev => ({ ...prev, [f.key]: v }))}
                      onEdit={() => setEditingField(f)}
                      onDelete={() => deleteField(f.key)}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
          {fields.filter(f => !f.category_key).length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2"><Settings className="size-5 text-slate-400" /> Sin categoría</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.filter(f => !f.category_key).map(f => (
                  <FieldRow key={f.key} field={f} value={values[f.key] ?? f.default_value ?? ""}
                    onChange={(v) => setValues(prev => ({ ...prev, [f.key]: v }))}
                    onEdit={() => setEditingField(f)}
                    onDelete={() => deleteField(f.key)}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Tab: Proveedores ─────────────────────────────────────────── */}
      {tab === "providers" && (
        <>
          <div className="flex justify-end">
            <Button onClick={openNewProvider} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 size-4" /> Nuevo proveedor
            </Button>
          </div>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6 space-y-2">
              {providers.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No hay proveedores configurados.</p>
              ) : providers.map(p => (
                <div key={p.id} className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-blue-300 font-mono">{p.name}</code>
                      {p.is_default ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Por defecto</Badge> : null}
                      {!p.enabled ? <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Deshabilitado</Badge> : null}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditProvider(p)} className="hover:bg-slate-700">
                        <Pencil className="size-4 text-slate-300" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProvider(p.id)} className="hover:bg-slate-700">
                        <Trash2 className="size-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {providerFields.filter(pf => pf.key !== 'name' && pf.key !== 'api_key' && pf.key !== 'is_default' && pf.key !== 'enabled').map(pf => (
                      <div key={pf.key}>
                        <span className="text-slate-500">{pf.label}:</span>
                        <p className="text-slate-300 font-mono break-all">{(p as any)[pf.key] || "—"}</p>
                      </div>
                    ))}
                    <div className="col-span-2">
                      <span className="text-slate-500">API Key:</span>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-300 font-mono">{showProviderKey ? p.api_key : "••••••••" + p.api_key.slice(-4)}</p>
                        <Button variant="ghost" size="icon" onClick={() => setShowProviderKey(!showProviderKey)} className="size-6 hover:bg-slate-700">
                          {showProviderKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Tab: Schema (edit categories + fields) ─────────────────── */}
      {tab === "schema" && (
        <>
          {/* Categorías */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2"><ListIcon className="size-5 text-amber-400" /> Categorías</CardTitle>
                <CardDescription className="text-slate-400">Agrupaciones de parámetros ({categories.length})</CardDescription>
              </div>
              <Button onClick={() => { setEditingCategory({ key: "", label: "", description: "", icon: "Settings", sort_order: 99, is_active: 1 } as any); setCreatingCategory(true); }} className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 size-4" /> Nueva
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(c => {
                  const Icon = getIcon(c.icon);
                  return (
                    <div key={c.key} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{c.label} <code className="text-xs text-slate-500 ml-2">({c.key})</code></p>
                          {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(c); setCreatingCategory(true); }} className="hover:bg-slate-700">
                          <Pencil className="size-4 text-slate-300" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.key)} className="hover:bg-slate-700">
                          <Trash2 className="size-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Campos */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2"><Settings className="size-5 text-amber-400" /> Campos de Parámetros</CardTitle>
                <CardDescription className="text-slate-400">Schema dinámico de la plataforma ({fields.length})</CardDescription>
              </div>
              <Button onClick={() => { setEditingField({ key: "", label: "", description: "", type: "text", options: null, default_value: "", category_key: null, icon: null, sort_order: 99, is_visible: 1, is_required: 0, min_value: null, max_value: null, placeholder: null } as any); setCreatingField(true); }} className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 size-4" /> Nuevo campo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fields.map(f => {
                  const TypeIcon = TYPE_ICONS[f.type] || Type;
                  const cat = categories.find(c => c.key === f.category_key);
                  return (
                    <div key={f.key} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="size-4 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {f.label} <code className="text-xs text-slate-500 ml-2">({f.key})</code>
                            {f.is_required ? <Badge variant="outline" className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30">requerido</Badge> : null}
                          </p>
                          <p className="text-xs text-slate-500">
                            Tipo: <span className="text-slate-400">{TYPE_LABELS[f.type] || f.type}</span>
                            {cat && <> · Categoría: <span className="text-slate-400">{cat.label}</span></>}
                            {f.description && <> · {f.description}</>}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingField(f); setCreatingField(true); }} className="hover:bg-slate-700">
                          <Pencil className="size-4 text-slate-300" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteField(f.key)} className="hover:bg-slate-700">
                          <Trash2 className="size-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────── */}
      <FieldEditorDialog
        open={creatingField}
        field={editingField}
        categories={categories}
        isNew={!editingField?.key}
        onClose={() => { setEditingField(null); setCreatingField(false); }}
        onSave={saveField}
      />

      <CategoryEditorDialog
        open={creatingCategory}
        category={editingCategory}
        isNew={!editingCategory?.key}
        onClose={() => { setEditingCategory(null); setCreatingCategory(false); }}
        onSave={saveCategory}
      />

      <Dialog open={creatingProvider} onOpenChange={(o) => !o && (setCreatingProvider(false), setEditingProvider(null))}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
            <DialogDescription className="text-slate-400">Campos definidos en provider_field_metadata</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {providerFields.map(pf => (
              <ProviderFieldRow key={pf.key} field={pf} value={providerForm[pf.key] ?? ""}
                onChange={(v) => setProviderForm(prev => ({ ...prev, [pf.key]: v }))} />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setCreatingProvider(false), setEditingProvider(null))}>Cancelar</Button>
            <Button onClick={saveProvider} className="bg-red-600 hover:bg-red-700"><Save className="mr-2 size-4" /> Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── FieldRow: renderiza un campo según su type (dinámico) ──────────────

function FieldRow({ field, value, onChange, onEdit, onDelete }: {
  field: ConfigField; value: string;
  onChange: (v: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const TypeIcon = TYPE_ICONS[field.type] || Type;
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className="size-4 text-blue-400" />
            <Label className="text-sm font-medium text-white">{field.label}</Label>
            {field.is_required ? <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">requerido</Badge> : null}
            <code className="text-xs text-slate-500">{field.key}</code>
          </div>
          {field.description && <p className="text-xs text-slate-500 mb-2">{field.description}</p>}
          {renderInput(field, value, onChange)}
        </div>
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="hover:bg-slate-700 size-7">
            <Pencil className="size-3 text-slate-300" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="hover:bg-slate-700 size-7">
            <Trash2 className="size-3 text-red-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function renderInput(field: ConfigField, value: string, onChange: (v: string) => void) {
  const baseClass = "bg-slate-950 border-slate-700 text-white";
  switch (field.type) {
    case 'boolean':
      return (
        <button
          onClick={() => onChange(value === 'true' ? 'false' : 'true')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border ${
            value === 'true'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          <ToggleLeft className="size-4" />
          {value === 'true' ? 'Activado' : 'Desactivado'}
        </button>
      );
    case 'select':
      return (
        <select value={value} onChange={e => onChange(e.target.value)} className={`${baseClass} rounded-md px-3 py-1.5 text-sm w-full max-w-xs`}>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    case 'longtext':
      return (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          placeholder={field.placeholder || ''} className={`${baseClass} rounded-md px-3 py-2 text-sm font-mono w-full`} />
      );
    case 'number':
      return (
        <div className="flex items-center gap-2">
          <Input type="number" value={value} onChange={e => onChange(e.target.value)}
            min={field.min_value ?? undefined} max={field.max_value ?? undefined}
            placeholder={field.placeholder || ''} className={`${baseClass} max-w-[200px]`} />
          {field.min_value !== null && field.max_value !== null && (
            <span className="text-xs text-slate-500">rango: {field.min_value} - {field.max_value}</span>
          )}
        </div>
      );
    case 'password':
      return <Input type="password" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || '••••••'} className={`${baseClass} max-w-md`} />;
    case 'url':
      return <Input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || 'https://...'} className={`${baseClass} max-w-md`} />;
    default:
      return <Input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} className={`${baseClass} max-w-md`} />;
  }
}

// ── Field editor dialog ────────────────────────────────────────────────

function FieldEditorDialog({ open, field, categories, isNew, onClose, onSave }: {
  open: boolean; field: ConfigField | null; categories: ConfigCategory[];
  isNew: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [optionsText, setOptionsText] = useState("");

  useEffect(() => {
    if (field) {
      setForm({ ...field });
      setOptionsText((field.options || []).join("\n"));
    }
  }, [field, open]);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const opts = optionsText.split("\n").map(s => s.trim()).filter(Boolean);
    const data = {
      ...form,
      key: form.key,
      options: form.type === 'select' ? opts : null,
      default_value: form.default_value !== null ? String(form.default_value) : null,
      is_visible: form.is_visible !== false,
      is_required: !!form.is_required,
    };
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nuevo campo" : "Editar campo"}</DialogTitle>
          <DialogDescription className="text-slate-400">Define el schema del parámetro</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label>Key (identificador único)</Label>
            <Input value={form.key || ""} onChange={e => update('key', e.target.value)} disabled={!isNew} className="bg-slate-950 border-slate-700 font-mono" placeholder="mi_parametro" />
          </div>
          <div className="grid gap-2">
            <Label>Label visible</Label>
            <Input value={form.label || ""} onChange={e => update('label', e.target.value)} className="bg-slate-950 border-slate-700" placeholder="Mi Parámetro" />
          </div>
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Input value={form.description || ""} onChange={e => update('description', e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <select value={form.type || 'text'} onChange={e => update('type', e.target.value)} className="bg-slate-950 border-slate-700 rounded-md px-3 py-2 text-white">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <select value={form.category_key || ""} onChange={e => update('category_key', e.target.value || null)} className="bg-slate-950 border-slate-700 rounded-md px-3 py-2 text-white">
                <option value="">— Sin categoría —</option>
                {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Default</Label>
              <Input value={form.default_value || ""} onChange={e => update('default_value', e.target.value)} className="bg-slate-950 border-slate-700" />
            </div>
            <div className="grid gap-2">
              <Label>Orden</Label>
              <Input type="number" value={form.sort_order || 0} onChange={e => update('sort_order', Number(e.target.value))} className="bg-slate-950 border-slate-700" />
            </div>
            <div className="grid gap-2">
              <Label>Placeholder</Label>
              <Input value={form.placeholder || ""} onChange={e => update('placeholder', e.target.value)} className="bg-slate-950 border-slate-700" />
            </div>
          </div>
          {form.type === 'select' && (
            <div className="grid gap-2">
              <Label>Opciones (una por línea)</Label>
              <textarea value={optionsText} onChange={e => setOptionsText(e.target.value)} rows={4}
                className="bg-slate-950 border-slate-700 rounded-md px-3 py-2 text-white font-mono text-sm" placeholder={"opcion1\nopcion2"} />
            </div>
          )}
          {form.type === 'number' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Valor mínimo</Label>
                <Input type="number" value={form.min_value ?? ""} onChange={e => update('min_value', e.target.value === '' ? null : Number(e.target.value))} className="bg-slate-950 border-slate-700" />
              </div>
              <div className="grid gap-2">
                <Label>Valor máximo</Label>
                <Input type="number" value={form.max_value ?? ""} onChange={e => update('max_value', e.target.value === '' ? null : Number(e.target.value))} className="bg-slate-950 border-slate-700" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.is_required} onChange={e => update('is_required', e.target.checked)} className="size-4" />
              <span className="text-sm">Requerido</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_visible !== false} onChange={e => update('is_visible', e.target.checked)} className="size-4" />
              <span className="text-sm">Visible</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700"><Save className="mr-2 size-4" /> Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Category editor dialog ─────────────────────────────────────────────

function CategoryEditorDialog({ open, category, isNew, onClose, onSave }: {
  open: boolean; category: ConfigCategory | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (category) setForm({ ...category });
  }, [category, open]);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave({ ...form, is_active: form.is_active !== false });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nueva categoría" : "Editar categoría"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label>Key</Label>
            <Input value={form.key || ""} onChange={e => update('key', e.target.value)} disabled={!isNew} className="bg-slate-950 border-slate-700 font-mono" />
          </div>
          <div className="grid gap-2">
            <Label>Label</Label>
            <Input value={form.label || ""} onChange={e => update('label', e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Input value={form.description || ""} onChange={e => update('description', e.target.value)} className="bg-slate-950 border-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Icono (Lucide)</Label>
              <Input value={form.icon || ""} onChange={e => update('icon', e.target.value)} className="bg-slate-950 border-slate-700 font-mono" placeholder="Settings" />
            </div>
            <div className="grid gap-2">
              <Label>Orden</Label>
              <Input type="number" value={form.sort_order || 0} onChange={e => update('sort_order', Number(e.target.value))} className="bg-slate-950 border-slate-700" />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active !== false} onChange={e => update('is_active', e.target.checked)} className="size-4" />
            <span className="text-sm">Activa</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700"><Save className="mr-2 size-4" /> Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Provider field row ─────────────────────────────────────────────────

function ProviderFieldRow({ field, value, onChange }: {
  field: ProviderField; value: string;
  onChange: (v: string) => void;
}) {
  const TypeIcon = TYPE_ICONS[field.type] || Type;
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <TypeIcon className="size-3 text-blue-400" />
        <Label className="text-sm">{field.label}</Label>
        {field.is_required ? <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">requerido</Badge> : null}
      </div>
      {field.description && <p className="text-xs text-slate-500">{field.description}</p>}
      {field.type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} className="bg-slate-950 border-slate-700 rounded-md px-3 py-2 text-white">
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : field.type === 'longtext' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={field.placeholder || ''} className="bg-slate-950 border-slate-700 rounded-md px-3 py-2 text-white font-mono text-sm" />
      ) : field.type === 'boolean' ? (
        <button
          onClick={() => onChange(value === 'true' ? 'false' : 'true')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border w-fit ${
            value === 'true' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          <ToggleLeft className="size-4" /> {value === 'true' ? 'Activado' : 'Desactivado'}
        </button>
      ) : (
        <Input
          type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || ''} className="bg-slate-950 border-slate-700" />
      )}
    </div>
  );
}