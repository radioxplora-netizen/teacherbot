import { useState, useEffect, useCallback } from "react";
import {
  Activity, AlertTriangle, Bot, CheckCircle2, Cpu, Info,
  Layers, Network, OctagonX, RefreshCw, Search, Wifi, Zap, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────
type KPI = {
  moodle_connection: number;
  moodle_synced_at: string | null;
  api_latency_ms: number;
  api_latency_p95_ms: number;
  disconnection_rate: number;
  tokens_used: number;
  tokens_limit: number;
  tokens_pct: number;
  evaluated_submissions: number;
  pending_submissions: number;
  total_submissions: number;
  errors_24h: number;
  last_evaluation_at: string | null;
};

type TokenPoint = { time: string; tokens: number; latency: number };
type ErrorSlice = { name: string; value: number; color: string };
type LogEntry = { id: string; at: string; level: string; source: string; message: string };

type AIConfig = Record<string, string>;

// ── Helpers ──────────────────────────────────────────────────
function fmtIso(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })
    + ", " + d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function levelIcon(level: string) {
  switch (level) {
    case "info": return <Info className="size-4" />;
    case "warn": return <AlertTriangle className="size-4" />;
    case "error": return <OctagonX className="size-4" />;
    default: return <Info className="size-4" />;
  }
}

function StatusPulse({ status }: { status: "ok" | "warn" | "error" }) {
  const color = status === "ok" ? "bg-green-500" : status === "warn" ? "bg-yellow-500" : "bg-red-500";
  return (
    <span className="relative flex size-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full size-3 ${color}`} />
    </span>
  );
}

// ── API hooks ────────────────────────────────────────────────
function useAPI<T>(url: string, refreshInterval = 0): { data: T | null; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url, tick]);

  useEffect(() => {
    if (!refreshInterval) return;
    const id = setInterval(refetch, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval]);

  return { data, loading, refetch };
}

// ── Component ────────────────────────────────────────────────
export default function SystemDashboard() {
  const { data: kpis, loading: kpisLoading, refetch: refetchKPIs } = useAPI<KPI>("/api/monitor/kpis", 15000);
  const { data: tokenData } = useAPI<TokenPoint[]>("/api/monitor/tokens");
  const { data: errorData } = useAPI<ErrorSlice[]>("/api/monitor/errors");
  const { data: logs, loading: logsLoading } = useAPI<LogEntry[]>("/api/logs");
  const { data: aiConfig } = useAPI<AIConfig>("/api/ai/config");

  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");

  // Sync model selector with real config
  useEffect(() => {
    if (aiConfig?.model) setSelectedModel(aiConfig.model);
  }, [aiConfig]);

  const handleModelChange = async (val: string) => {
    setSelectedModel(val);
    try {
      await fetch("/api/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: val }),
      });
      toast.success(`Modelo IA cambiado a: ${val}`, {
        description: "La configuración se ha guardado en la base de datos.",
      });
    } catch {
      toast.error("No se pudo guardar el modelo");
    }
  };

  // Filter logs
  const filteredLogs = (logs || []).filter(l => {
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.message.toLowerCase().includes(q) || l.source.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate time since last sync
  const syncSeconds = kpis?.moodle_synced_at
    ? Math.round((Date.now() - new Date(kpis.moodle_synced_at).getTime()) / 1000)
    : 0;
  const syncText = syncSeconds < 60 ? `hace ${syncSeconds}s`
    : syncSeconds < 3600 ? `hace ${Math.round(syncSeconds / 60)}min`
    : `hace ${Math.round(syncSeconds / 3600)}h`;

  // Error pie data
  const pieData = (errorData || []).filter(d => d.value > 0);
  const totalErrors = pieData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-brand relative overflow-hidden group">
          <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wifi className="size-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Conexión Moodle
              <StatusPulse status={(kpis?.moodle_connection ?? 0) > 90 ? "ok" : "error"} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? "..." : `${(kpis?.moodle_connection ?? 0).toFixed(2)}%`}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="size-3 text-green-500" /> Sincronizado {syncText}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 relative overflow-hidden group">
          <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bot className="size-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Entregas Evaluadas
              <StatusPulse status={(kpis?.pending_submissions ?? 0) === 0 ? "ok" : "warn"} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisLoading ? "..." : `${kpis?.evaluated_submissions ?? 0}/${kpis?.total_submissions ?? 0}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis?.pending_submissions ?? 0} pendientes por evaluar
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 relative overflow-hidden group">
          <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Network className="size-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Errores (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? "..." : kpis?.errors_24h ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa: {kpis?.disconnection_rate?.toFixed(2) ?? 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 relative overflow-hidden group">
          <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="size-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Tokens (Ciclo Actual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpisLoading ? "..." : (kpis?.tokens_used ?? 0).toLocaleString()}</div>
            <Progress value={kpis?.tokens_pct ?? 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {kpis?.tokens_pct ?? 0}% del límite diario ({kpis ? (kpis.tokens_limit / 1000).toFixed(0) + "k" : "..."})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts + AI Optimizer ──────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" /> Consumo de Tokens & Latencia
              </CardTitle>
              <CardDescription>Monitoreo en tiempo real del uso de la LLM API.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {tokenData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tokenData}>
                    <defs>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      itemStyle={{ color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="tokens" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTokens)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* AI Model Selector */}
          <Card className="border-brand/20 bg-brand/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand">
                <SparklesIcon className="size-5" /> Optimización de Modelo IA
              </CardTitle>
              <CardDescription>Seleccione el modelo según balance Costo/Velocidad.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Modelo Activo</label>
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mimo-v2.5-pro">MiMo v2.5 Pro (Balanceado)</SelectItem>
                    <SelectItem value="deepseek-v4-pro">DeepSeek v4 Pro (Alta Precisión)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku (Rápido)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md bg-background p-3 text-sm space-y-2 border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperatura:</span>
                  <span className="font-mono font-bold">{aiConfig?.temperature || "0.3"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Tokens:</span>
                  <span className="font-mono font-bold">{aiConfig?.max_tokens || "2000"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Idioma:</span>
                  <span className="font-mono font-bold">{aiConfig?.evaluation_language === "en" ? "English" : "Español"}</span>
                </div>
              </div>
              <Button className="w-full" variant="outline" size="sm" onClick={refetchKPIs}>
                <RefreshCw className="size-3 mr-2" /> Recalcular Proyección
              </Button>
            </CardContent>
          </Card>

          {/* Errors Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distribución de Errores (7d)</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] relative">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                        paddingAngle={2} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-xl font-bold">{totalErrors}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Errores</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Sin errores registrados</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Logs Table ─────────────────────────────────────── */}
      <section aria-label="Logs del Sistema">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="size-5" /> Logs de Sistema en Tiempo Real
            </CardTitle>
            <CardDescription>Registro detallado de transacciones, errores y eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {["all", "info", "warn", "error"].map(lvl => (
                  <Button key={lvl} variant={levelFilter === lvl ? "default" : "outline"}
                    size="sm" onClick={() => setLevelFilter(lvl)}>
                    {lvl === "all" ? "All" : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar logs..." className="pl-9 h-8" />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Mensaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-mono">{fmtIso(l.at)}</TableCell>
                      <TableCell>
                        <Badge variant={l.level === "error" ? "destructive" : "secondary"}
                          className={`gap-1 px-2 py-0.5 ${l.level === "warn" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/50" : ""}`}>
                          {levelIcon(l.level)} {l.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{l.source}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{l.message}</TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sin resultados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
