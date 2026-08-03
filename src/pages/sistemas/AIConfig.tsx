import { useState, useEffect } from "react";
import { Save, Sparkles, Bot, Settings2, Thermometer, Gauge, MessageSquare, FileText, CheckCircle2, AlertCircle, Loader2, RefreshCw, Plus, Trash2, Wifi, Zap, Edit3, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────

interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  api_url: string;
  api_key: string;
  api_key_masked?: string;
  model: string;
  is_default: number;
  enabled: number;
  created_at?: string;
}

interface ProviderForm {
  name: string;
  provider_type: string;
  api_url: string;
  api_key: string;
  model: string;
  is_default: boolean;
  enabled: boolean;
}

const emptyForm: ProviderForm = {
  name: "", provider_type: "openai", api_url: "https://api.openai.com/v1/chat/completions",
  api_key: "", model: "gpt-4o-mini", is_default: false, enabled: true,
};

// ── Existing config defaults ──────────────────────────────────────────

const AI_CONFIG_DEFAULTS: Record<string, string> = {
  model: "mimo-v2.5-pro",
  temperature: "0.3",
  max_tokens: "2000",
  system_prompt: "Eres un profesor experto evaluando tareas académicas...",
  evaluation_language: "es",
  auto_approve_threshold: "7.0",
  rubric_weight_content: "40",
  rubric_weight_structure: "25",
  rubric_weight_creativity: "20",
  rubric_weight_presentation: "15",
  enable_ai_evaluation: "true",
  enable_cache: "true",
  batch_delay_ms: "2000",
};

const FIELD_META: Record<string, { label: string; desc: string; type: "text" | "number" | "textarea" | "switch" | "select"; options?: string[] }> = {
  model: { label: "Modelo de IA", desc: "Modelo usado para evaluaciones (OpenAI-compatible)", type: "text" },
  temperature: { label: "Temperatura", desc: "Creatividad del modelo (0 = determinista, 1 = creativo)", type: "number" },
  max_tokens: { label: "Max Tokens", desc: "Límite de tokens en la respuesta de la IA", type: "number" },
  system_prompt: { label: "Prompt del Sistema", desc: "Instrucción base que define el comportamiento de la IA", type: "textarea" },
  evaluation_language: { label: "Idioma", desc: "Idioma de las evaluaciones generadas", type: "select", options: ["es", "en"] },
  auto_approve_threshold: { label: "Umbral de Aprobación", desc: "Notas >= a este valor se aprueban automáticamente", type: "number" },
  rubric_weight_content: { label: "Peso: Contenido", desc: "Puntaje máximo para Contenido y Precisión", type: "number" },
  rubric_weight_structure: { label: "Peso: Estructura", desc: "Puntaje máximo para Estructura y Organización", type: "number" },
  rubric_weight_creativity: { label: "Peso: Creatividad", desc: "Puntaje máximo para Creatividad y Originalidad", type: "number" },
  rubric_weight_presentation: { label: "Peso: Presentación", desc: "Puntaje máximo para Presentación y Ortografía", type: "number" },
  enable_ai_evaluation: { label: "Evaluación IA", desc: "Activar/desactivar evaluación automática por IA", type: "switch" },
  enable_cache: { label: "Caché de Evaluaciones", desc: "Reutilizar evaluaciones previas sin llamar a la IA", type: "switch" },
  batch_delay_ms: { label: "Delay por Lote (ms)", desc: "Tiempo de espera entre evaluaciones en lote", type: "number" },
};

// ── Component ──────────────────────────────────────────────────────────

export default function AIConfig() {
  const [tab, setTab] = useState<"params" | "providers">("params");

  // Parameters tab state
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Providers tab state
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [provLoading, setProvLoading] = useState(false);
  const [editing, setEditing] = useState<AIProvider | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ProviderForm>({ ...emptyForm });
  const [provSaving, setProvSaving] = useState(false);
  const [testProvId, setTestProvId] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/config");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setConfig({ ...AI_CONFIG_DEFAULTS, ...data });
    } catch (e: any) {
      toast.error("Error al cargar configuración", { description: e.message });
      setConfig({ ...AI_CONFIG_DEFAULTS });
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    setProvLoading(true);
    try {
      const res = await fetch("/api/ai/providers");
      const data = await res.json();
      setProviders(data || []);
    } catch (e: any) {
      toast.error("Error al cargar proveedores");
    } finally {
      setProvLoading(false);
    }
  };

  useEffect(() => { loadConfig(); loadProviders(); }, []);

  // ── Params ────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const data = await res.json();
      toast.success("Configuración guardada", { description: `${data.updated?.length || 0} parámetros actualizados.` });
    } catch (e: any) {
      toast.error("Error al guardar", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/health");
      const health = await res.json();
      if (health.status === "ok") {
        setTestResult("✅ Conexión exitosa. API funcionando correctamente.");
      } else {
        setTestResult("⚠️ API responde pero con estado: " + JSON.stringify(health));
      }
    } catch (e: any) {
      setTestResult("❌ Error de conexión: " + e.message);
    } finally {
      setTesting(false);
    }
  };

  const updateField = (key: string, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [key]: String(value) }));
  };

  // ── Providers CRUD ────────────────────────────────────────────────

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsFormOpen(true);
  };

  const openEdit = (p: AIProvider) => {
    setEditing(p);
    setForm({
      name: p.name,
      provider_type: p.provider_type,
      api_url: p.api_url,
      api_key: "",
      model: p.model,
      is_default: p.is_default === 1,
      enabled: p.enabled === 1,
    });
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsFormOpen(false);
  };

  const saveProvider = async () => {
    if (!form.name || !form.api_url || !form.model) {
      toast.error("Completa nombre, URL y modelo");
      return;
    }
    setProvSaving(true);
    try {
      const body: any = { ...form, is_default: form.is_default, enabled: form.enabled };
      if (!form.api_key) delete body.api_key; // Don't overwrite with empty

      let res;
      if (editing) {
        if (!form.api_key) delete body.api_key;
        res = await fetch(`/api/ai/providers/${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        if (!form.api_key) { toast.error("API Key requerida para nuevo provider"); setProvSaving(false); return; }
        res = await fetch("/api/ai/providers", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error("Error al guardar");
      toast.success(editing ? "Proveedor actualizado" : "Proveedor creado");
      cancelEdit();
      loadProviders();
    } catch (e: any) {
      toast.error("Error", { description: e.message });
    } finally {
      setProvSaving(false);
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    try {
      const res = await fetch(`/api/ai/providers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Proveedor eliminado");
      loadProviders();
    } catch (e: any) {
      toast.error("Error", { description: e.message });
    }
  };

  const testProvider = async (id: string) => {
    setTestProvId(id);
    try {
      const res = await fetch(`/api/ai/providers/${id}/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ ${data.model} responde: "${data.response}"`);
      } else {
        toast.error(`❌ ${data.error || "Fallo"}`, { description: `HTTP ${data.status || "?"}` });
      }
    } catch (e: any) {
      toast.error("Error al probar", { description: e.message });
    } finally {
      setTestProvId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  if (loading && tab === "params") {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-purple-300" />
      </div>
    );
  }

  const categories = [
    {
      icon: Thermometer,
      title: "Comportamiento de Evaluación",
      desc: "Parámetros de comportamiento para TODOS los proveedores",
      fields: ["temperature", "max_tokens", "evaluation_language"]
    },
    { icon: MessageSquare, title: "Prompt y Comportamiento", desc: "Instrucciones para la IA evaluadora", fields: ["system_prompt"] },
    { icon: FileText, title: "Rúbrica y Pesos", desc: "Puntajes máximos por criterio de evaluación", fields: ["rubric_weight_content", "rubric_weight_structure", "rubric_weight_creativity", "rubric_weight_presentation"] },
    { icon: Settings2, title: "Control y Umbrales", desc: "Parámetros operativos de la evaluación", fields: ["enable_ai_evaluation", "enable_cache", "auto_approve_threshold", "batch_delay_ms"] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Configuración de IA</h1>
          <p className="mt-1 text-purple-300">Parametriza el comportamiento del motor de evaluación inteligente</p>
        </div>
        <div className="flex gap-2">
          {tab === "params" && (
            <>
              <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}
                className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20 hover:text-white">
                {testing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
                Probar Conexión
              </Button>
              <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white border-0">
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                Guardar Configuración
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("params")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "params" ? "bg-white/10 text-white" : "text-purple-300 hover:text-white"}`}>
          <Settings2 className="size-4 inline mr-1.5" /> Parámetros
        </button>
        <button onClick={() => setTab("providers")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "providers" ? "bg-white/10 text-white" : "text-purple-300 hover:text-white"}`}>
          <Zap className="size-4 inline mr-1.5" /> Proveedores IA
        </button>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`rounded-lg border p-4 ${testResult.startsWith("✅") ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
          <p className="text-sm flex items-center gap-2">
            {testResult.startsWith("✅") ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            {testResult}
          </p>
        </div>
      )}

      {/* === PARAMS TAB === */}
      {tab === "params" && (
        <div className="grid gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.title} className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/20">
                      <Icon className="size-4 text-orange-400" />
                    </div>
                    {cat.title}
                  </CardTitle>
                  <CardDescription className="text-purple-300">{cat.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {cat.fields.map((key) => {
                      const meta = FIELD_META[key];
                      if (!meta) return null;
                      const value = config[key] ?? AI_CONFIG_DEFAULTS[key] ?? "";
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={key} className="text-purple-100 text-sm font-medium">{meta.label}</Label>
                            {meta.type === "switch" ? (
                              <Switch id={key} checked={value === "true"} onCheckedChange={(v) => updateField(key, v)} />
                            ) : (
                              <Badge variant="secondary" className="text-[10px] bg-purple-900/50 text-purple-300 border-purple-500/20">{key}</Badge>
                            )}
                          </div>
                          {meta.type === "textarea" ? (
                            <Textarea id={key} value={value} onChange={(e) => updateField(key, e.target.value)}
                              className="min-h-24 text-sm bg-[#1a0a2e] border-white/10 text-white placeholder:text-purple-500"
                              placeholder={AI_CONFIG_DEFAULTS[key]} />
                          ) : meta.type === "select" ? (
                            <select id={key} value={value} onChange={(e) => updateField(key, e.target.value)}
                              className="w-full rounded-md border border-white/10 bg-[#1a0a2e] px-3 py-2 text-sm text-white">
                              {(meta.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <Input id={key} type={meta.type === "number" ? "number" : "text"} value={value}
                              onChange={(e) => updateField(key, e.target.value)}
                              step={meta.type === "number" ? "0.1" : undefined}
                              className="bg-[#1a0a2e] border-white/10 text-white placeholder:text-purple-500"
                              placeholder={AI_CONFIG_DEFAULTS[key]} />
                          )}
                          <p className="text-xs text-purple-400">{meta.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* === PROVIDERS TAB === */}
      {tab === "providers" && (
        <div className="space-y-4">
          {/* Add button */}
          {!isFormOpen && (
            <Button onClick={openNew} variant="hero" size="sm"
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
              <Plus className="size-4 mr-2" /> Nuevo Proveedor
            </Button>
          )}

          {/* Edit Form */}
          {isFormOpen && (
            <Card className="border-violet-500/30 bg-violet-500/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="size-5 text-violet-400" />
                  {editing ? "Editar Proveedor" : "Nuevo Proveedor"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-purple-200 text-xs">Nombre</Label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Ej: MiMo, OpenAI, Groq..."
                      className="bg-[#1a0a2e] border-white/10 text-white text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-purple-200 text-xs">Tipo</Label>
                    <select value={form.provider_type} onChange={e => setForm({...form, provider_type: e.target.value})}
                      className="w-full rounded-md border border-white/10 bg-[#1a0a2e] px-3 py-2 text-sm text-white">
                      <option value="openai">OpenAI-compatible</option>
                      <option value="xiaomi">Xiaomi MiMo</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-purple-200 text-xs">API URL</Label>
                    <Input value={form.api_url} onChange={e => setForm({...form, api_url: e.target.value})}
                      placeholder="https://api.openai.com/v1/chat/completions"
                      className="bg-[#1a0a2e] border-white/10 text-white text-sm font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-purple-200 text-xs">API Key {editing && <span className="text-purple-500">(dejar vacío = no cambiar)</span>}</Label>
                    <Input value={form.api_key} onChange={e => setForm({...form, api_key: e.target.value})}
                      type="password" placeholder={editing ? "••••••••" : "sk-..."}
                      className="bg-[#1a0a2e] border-white/10 text-white text-sm font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-purple-200 text-xs">Modelo</Label>
                    <Input value={form.model} onChange={e => setForm({...form, model: e.target.value})}
                      placeholder="gpt-4o-mini"
                      className="bg-[#1a0a2e] border-white/10 text-white text-sm" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_default} onCheckedChange={v => setForm({...form, is_default: v})} />
                      <Label className="text-purple-200 text-xs">Predeterminado</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={form.enabled} onCheckedChange={v => setForm({...form, enabled: v})} />
                      <Label className="text-purple-200 text-xs">Habilitado</Label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 justify-end">
                  <Button variant="ghost" onClick={cancelEdit} className="text-purple-300 hover:text-white">Cancelar</Button>
                  <Button onClick={saveProvider} disabled={provSaving}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0">
                    {provSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                    {editing ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Providers list */}
          {provLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-purple-300" /></div>
          ) : providers.length === 0 ? (
            <Card className="border-white/10 bg-white/5">
              <CardContent className="py-12 text-center">
                <Zap className="size-10 mx-auto text-purple-600 mb-2" />
                <p className="text-purple-300">No hay proveedores configurados.</p>
                <p className="text-xs text-purple-500 mt-1">Agrega uno para habilitar la evaluación con IA.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {providers.map(p => (
                <Card key={p.id} className={`border-white/10 bg-white/5 backdrop-blur-xl hover:border-purple-500/30 transition-colors ${p.enabled === 0 ? 'opacity-50' : ''}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-9 items-center justify-center rounded-lg ${p.is_default ? 'bg-violet-500/20' : 'bg-slate-500/10'}`}>
                          <Zap className={`size-4 ${p.is_default ? 'text-violet-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-purple-400">
                            {p.model} · {p.provider_type}
                            {p.is_default === 1 && <Badge className="ml-2 text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30">predeterminado</Badge>}
                            {p.enabled === 0 && <Badge className="ml-2 text-[10px] bg-red-500/20 text-red-300 border-red-500/30">deshabilitado</Badge>}
                          </p>
                          {p.api_key_masked && <p className="text-[10px] text-purple-600 font-mono mt-0.5">🔑 {p.api_key_masked}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => testProvider(p.id)} disabled={testProvId === p.id}
                          className="text-purple-300 hover:text-white hover:bg-purple-500/20 h-8 w-8 p-0">
                          {testProvId === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <Wifi className="size-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}
                          className="text-purple-300 hover:text-white hover:bg-purple-500/20 h-8 w-8 p-0">
                          <Edit3 className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteProvider(p.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom save */}
      {tab === "params" && (
        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={loadConfig} className="text-purple-300 hover:text-white hover:bg-white/10">
            <RefreshCw className="size-4 mr-2" /> Recargar
          </Button>
          <Button variant="hero" onClick={handleSave} disabled={saving}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white border-0">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            Guardar Configuración
          </Button>
        </div>
      )}
    </div>
  );
}
