import { useEffect, useState } from "react";
import { Loader2, Save, Sparkles, Server, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ConfigItem { key: string; value: string; description: string | null; }
interface Provider { id: string; name: string; provider_type: string; api_url: string; api_key: string; model: string; is_default: number; enabled: number; }

export default function AdminConfig() {
  const [config, setConfig] = useState<ConfigItem[] | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [editing, setEditing] = useState<ConfigItem | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const fetchAll = async () => {
    const r = await fetch("/api/admin/config", { credentials: "include" });
    if (r.ok) {
      const d = await r.json();
      setConfig(d.config || []);
      setProviders(d.providers || []);
    }
  };
  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/config/${editing.key}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(`Configuración "${editing.key}" guardada`);
      setEditing(null);
      await fetchAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Configuración de IA</h1>
        <p className="mt-1 text-slate-400">Parámetros del sistema y proveedores de IA</p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Sparkles className="size-5 text-amber-400" /> Parámetros</CardTitle>
          <CardDescription className="text-slate-400">Variables de configuración globales</CardDescription>
        </CardHeader>
        <CardContent>
          {!config ? (
            <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-slate-500" /></div>
          ) : (
            <div className="space-y-2">
              {config.map(c => (
                <div key={c.key} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 p-3 hover:bg-slate-800/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-amber-300 font-mono">{c.key}</code>
                      {c.value && <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">activo</Badge>}
                    </div>
                    {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
                    <p className="text-sm text-white mt-1 font-mono break-all">
                      {c.value ? (c.value.length > 80 ? c.value.slice(0, 80) + "…" : c.value) : <span className="text-slate-500 italic">(vacío)</span>}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(c); setValue(c.value || ""); }} className="ml-3 border-slate-700 text-slate-300">
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Server className="size-5 text-blue-400" /> Proveedores de IA</CardTitle>
          <CardDescription className="text-slate-400">Endpoints y modelos configurados</CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No hay proveedores configurados.</p>
          ) : (
            <div className="space-y-2">
              {providers.map(p => (
                <div key={p.id} className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-blue-300 font-mono">{p.name}</code>
                      {p.is_default ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Por defecto</Badge> : null}
                      {p.enabled ? null : <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Deshabilitado</Badge>}
                    </div>
                    <span className="text-xs text-slate-500 capitalize">{p.provider_type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">URL:</span>
                      <p className="text-slate-300 font-mono break-all">{p.api_url}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Modelo:</span>
                      <p className="text-slate-300 font-mono">{p.model}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">API Key:</span>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-300 font-mono">{showKey ? p.api_key : "••••••••" + p.api_key.slice(-4)}</p>
                        <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)} className="size-6 hover:bg-slate-700">
                          {showKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Editar configuración</CardTitle>
          <CardDescription className="text-slate-400">{editing ? `Modificando: ${editing.key}` : "Selecciona un parámetro para editar"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editing ? (
            <p className="text-slate-500 text-center py-6">Ningún parámetro seleccionado.</p>
          ) : (
            <>
              <div className="grid gap-2">
                <Label>Valor para "{editing.key}"</Label>
                <textarea
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  Guardar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}