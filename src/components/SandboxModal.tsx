"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play, FlaskConical, Terminal, CheckCircle2, AlertTriangle, Loader2, ChevronDown, User, FileText, Clock } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────

interface LogEntry {
  id: number;
  type: "info" | "success" | "warning" | "error" | "progress" | "criterio" | "system";
  message: string;
  detail?: string;
  ts: number;
}

interface SubmissionOption {
  id: string;
  student_name: string;
  status: string;
  ai_score?: number | null;
  submitted_at: string;
}

interface CriteriaDetail {
  criterio: string;
  puntos_obtenidos: number;
  puntos_max: number;
  porcentaje: number;
  comentario: string;
}

interface ParsedDetail {
  score: number;
  feedbackGeneral: string;
  criterios: CriteriaDetail[];
  fortalezas: string[];
  areasMejora: string[];
  recomendacion: string;
}

interface SandboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
}

interface AIProvider {
  id: string;
  name: string;
  model: string;
  provider_type: string;
  is_default: number;
  enabled: number;
}

// ── Sandbox: siempre permite re-evaluar sin restricciones ────────────

export default function SandboxModal({ open, onOpenChange, assignmentId, assignmentTitle, courseId }: SandboxModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionOption[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [parsedDetail, setParsedDetail] = useState<ParsedDetail | null>(null);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [fileData, setFileData] = useState<{content: string; file_name: string} | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'resultados'>('terminal');

  const logIdRef = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const hasRunRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDoneRef = useRef(false);
  const criteriosAcc = useRef<CriteriaDetail[]>([]);

  // Sync external open → internal (only open, never force-close internally)
  useEffect(() => {
    if (open && !internalOpen) {
      setInternalOpen(true);
      hasRunRef.current = false;
      isDoneRef.current = false;
      setRunning(false);
      setLogs([]);
      setResult(null);
      setShowDetail(false);
      setParsedDetail(null);
      criteriosAcc.current = [];
      setSelectedSubId("");
      // Fetch submissions
      setLoadingSubs(true);
      fetch(`/api/assignments/${assignmentId}`)
        .then(r => r.json())
        .then(data => {
          const subs: SubmissionOption[] = (data.submissions || []).map((s: any) => ({
            id: s.id,
            student_name: s.student_name || s.student_id,
            status: s.status,
            ai_score: s.ai_score,
            submitted_at: s.submitted_at,
          }));
          setSubmissions(subs);
          if (subs.length > 0) setSelectedSubId(subs[0].id);
          setLoadingSubs(false);
        })
        .catch(() => setLoadingSubs(false));
      // Fetch AI providers
      fetch("/api/ai/providers")
        .then(r => r.json())
        .then(data => {
          const enabled = (data || []).filter((p: AIProvider) => p.enabled === 1);
          setProviders(enabled);
          const def = enabled.find((p: AIProvider) => p.is_default === 1);
          setSelectedProvider(def?.id || (enabled[0]?.id || ""));
        })
        .catch(() => {});
    }
  }, [open, internalOpen]);

  // Handle close
  function handleClose() {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setInternalOpen(false);
    onOpenChange(false);
  }

  // Auto-scroll logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

  function addLog(type: LogEntry["type"], message: string, detail?: string) {
    logIdRef.current += 1;
    setLogs(prev => [...prev, { id: logIdRef.current, type, message, detail, ts: Date.now() }]);
  }

  // Parse ai_feedback markdown into structured detail
  function parseFeedback(aiFeedback: string, aiScore: number): ParsedDetail {
    const criterios: CriteriaDetail[] = [];
    const fortalezas: string[] = [];
    const areasMejora: string[] = [];
    let feedbackGeneral = "";
    let recomendacion = "";

    const lines = aiFeedback.split("\n");
    let section: "none" | "criterios" | "fortalezas" | "areas" | "recomendacion" = "none";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip score header line
      if (line.startsWith("📊")) continue;

      // Section headers
      if (line.includes("### 📋 Evaluación por Criterios")) { section = "criterios"; continue; }
      if (line.includes("### ✅ Fortalezas")) { section = "fortalezas"; continue; }
      if (line.includes("### 📈 Áreas de Mejora")) { section = "areas"; continue; }
      if (line.includes("### 💡 Recomendación Final")) { section = "recomendacion"; continue; }

      // Parse by section
      if (section === "criterios" && line.startsWith("- **")) {
        const m = line.match(/- \*\*(.+?)\*\*:\s*([\d.]+)\/([\d.]+)\s*pts?\s*(—\s*(.*))?$/);
        if (m) {
          const obtained = parseFloat(m[2]);
          const max = parseFloat(m[3]);
          criterios.push({
            criterio: m[1],
            puntos_obtenidos: obtained,
            puntos_max: max,
            porcentaje: max > 0 ? Math.round((obtained / max) * 100) : 0,
            comentario: (m[5] || "").trim(),
          });
        }
      } else if (section === "fortalezas" && line.startsWith("- ")) {
        fortalezas.push(line.slice(2));
      } else if (section === "areas" && line.startsWith("- ")) {
        areasMejora.push(line.slice(2));
      } else if (section === "recomendacion") {
        recomendacion += (recomendacion ? " " : "") + line;
      } else if (section === "none" && !line.startsWith("#") && !line.startsWith("📊")) {
        feedbackGeneral += (feedbackGeneral ? " " : "") + line;
      }
    }

    return {
      score: aiScore,
      feedbackGeneral: feedbackGeneral.trim(),
      criterios: criterios.length > 0 ? criterios : criteriosAcc.current,
      fortalezas,
      areasMejora,
      recomendacion: recomendacion.trim(),
    };
  }

  async function fetchFileContent() {
    if (!selectedSubId) return;
    setLoadingFile(true);
    setShowFileViewer(true);
    setFileData(null);
    try {
      const res = await fetch('/api/submissions/' + selectedSubId + '/file');
      const data = await res.json();
      setFileData(data);
    } catch(e) {
      setFileData({ content: 'Error al cargar el archivo', file_name: 'error' });
    }
    setLoadingFile(false);
  }

  function startSandbox() {
    if (!selectedSubId || running) return;

    setRunning(true);
    setLogs([]);
    setResult(null);
    setShowDetail(false);
    setParsedDetail(null);
    criteriosAcc.current = [];
    isDoneRef.current = false;
    setActiveTab('terminal');

    const sub = submissions.find(s => s.id === selectedSubId);
    addLog("system", "🧪 Sandbox iniciado");
    addLog("info", `Tarea: ${assignmentTitle}`);
    addLog("info", `Estudiante: ${sub?.student_name || selectedSubId}`);

    const es = new EventSource(`/api/ai/evaluate-stream/${selectedSubId}${selectedProvider ? `?provider=${selectedProvider}` : ''}`);
    esRef.current = es;

    es.addEventListener("progress", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const step = data.step || "";
        const msg = data.message || "";

        if (step === "cache_hit") {
          addLog("system", "📦 " + msg);
        } else if (step === "inicio") {
          addLog("info", "🚀 " + msg);
        } else if (step === "entrega_encontrada") {
          addLog("info", "📄 " + msg);
        } else if (step === "rubrica_cargada") {
          addLog("info", "📋 " + msg);
        } else if (step === "texto_extraido") {
          addLog("success", "📖 " + msg);
        } else if (step === "enviando_ia") {
          addLog("progress", "🤖 " + msg);
        } else if (step === "criterio_evaluado") {
          const d = data.detail || {};
          addLog("criterio", `  ▸ ${d.criterio || data.criterio || "?"}: ${d.puntos_obtenidos ?? data.puntos_obtenidos ?? "?"}/${d.puntos_max ?? data.puntos_max ?? "?"} pts`);
          // Accumulate for detail table
          criteriosAcc.current.push({
            criterio: d.criterio || data.criterio || "",
            puntos_obtenidos: d.puntos_obtenidos ?? data.puntos_obtenidos ?? 0,
            puntos_max: d.puntos_max ?? data.puntos_max ?? 0,
            porcentaje: d.porcentaje || data.porcentaje || Math.round((((d.puntos_obtenidos ?? data.puntos_obtenidos ?? 0)) / ((d.puntos_max ?? data.puntos_max ?? 1))) * 100),
            comentario: d.comentario || data.comentario || "",
          });
        } else if (step === "nota_calculada") {
          addLog("success", `🎯 ${msg}`);
        } else if (step === "respuesta_recibida") {
          if (msg.startsWith("⚠️")) {
            addLog("warning", "⚠️ " + msg.replace("⚠️ ", ""));
          } else {
            addLog("info", "📥 " + msg);
          }
        } else {
          addLog("info", msg);
        }
      } catch {}
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        isDoneRef.current = true;
        setRunning(false);
        setResult({ score: data.ai_score, feedback: data.ai_feedback });
        // Parse structured detail from feedback
        const detail = parseFeedback(data.ai_feedback || "", data.ai_score || 0);
        setParsedDetail(detail);
        setShowDetail(true); // Auto-open detail panel
        setActiveTab('resultados'); // Switch to results tab
        addLog("success", `✅ Evaluación completada — Nota: ${data.ai_score?.toFixed(1)}/10`);
        if (data.from_cache) {
          addLog("system", "💾 Resultado recuperado de caché");
        }
      } catch {}
      es.close();
      esRef.current = null;
    });

    // Handler for server-sent "error" SSE events (e.g. "No hay PDF")
    function handleSSEError(e: MessageEvent) {
      try {
        const data = JSON.parse(e.data);
        isDoneRef.current = true;
        setRunning(false);
        addLog("error", "❌ " + (data.message || "Error desconocido del servidor"));
        if (data.detail) addLog("error", "   " + data.detail);
      } catch {
        addLog("error", "❌ Error del servidor");
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    }

    // Handler for connection-level errors (network issues)
    function handleConnectionError() {
      if (!isDoneRef.current) {
        addLog("error", "❌ Error de conexión con el servidor");
        setRunning(false);
        isDoneRef.current = true;
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    }

    // Register both: named SSE "error" event + connection error
    es.addEventListener("error", (e: Event) => {
      // If it's a MessageEvent with data, it's a server-sent error event
      if ("data" in e && (e as MessageEvent).data) {
        handleSSEError(e as MessageEvent);
      } else {
        handleConnectionError();
      }
    });
  }

  const logColors: Record<LogEntry["type"], string> = {
    system: "text-cyan-400",
    info: "text-blue-300",
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
    progress: "text-violet-400",
    criterio: "text-yellow-300",
  };

  return (
    <DialogPrimitive.Root open={internalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-[1100px] max-h-[90vh] bg-[#0a0f1e] border border-slate-700/50 rounded-xl shadow-2xl flex flex-col"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { if (!running) handleClose(); else e.preventDefault(); }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <FlaskConical className="size-5 text-violet-400" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold text-white">
                  Sandbox de Calificación IA
                </DialogPrimitive.Title>
                <p className="text-xs text-slate-400 mt-0.5">
                  Observa cómo la IA califica en tiempo real
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={running}
              className="text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Controls */}
            {!hasRunRef.current && (
              <div className="px-6 py-4 border-b border-slate-700/30 shrink-0 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Selecciona una entrega para evaluar:</label>
                  {loadingSubs ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Loader2 className="size-4 animate-spin" /> Cargando entregas...
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedSubId}
                        onChange={(e) => setSelectedSubId(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                      >
                        {submissions.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.student_name} — {s.status} {s.ai_score != null ? `(Nota IA: ${s.ai_score})` : "(Sin evaluar)"}
                          </option>
                        ))}
                        {submissions.length === 0 && (
                          <option value="" disabled>No hay entregas disponibles</option>
                        )}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                </div>
                {providers.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Motor de IA a utilizar:</label>
                    <div className="relative">
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                      >
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.model} {p.is_default === 1 ? '(predeterminado)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
                <Button
                  onClick={startSandbox}
                  disabled={!selectedSubId || running || loadingSubs || submissions.length === 0}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0"
                >
                  <Play className="size-4 mr-2" /> Iniciar Sandbox
                </Button>

                {/* View file button */}
                <Button
                  onClick={fetchFileContent}
                  disabled={!selectedSubId || running}
                  variant="outline"
                  className="w-full border-slate-600/50 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/50"
                >
                  <FileText className="size-4 mr-2" /> Ver archivo de la entrega
                </Button>
              </div>
            )}

            {/* File content viewer */}
            {showFileViewer && (
              <div className="mx-6 mb-2 border border-slate-700/50 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between bg-slate-800/80 px-4 py-2">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
                    <FileText className="size-3.5" />
                    {loadingFile ? 'Cargando...' : fileData?.file_name || 'Archivo de la entrega'}
                  </span>
                  <button
                    onClick={() => setShowFileViewer(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto bg-slate-950/80 p-4">
                  {loadingFile ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-5 animate-spin text-slate-500" />
                    </div>
                  ) : fileData ? (
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {fileData.content}
                    </pre>
                  ) : (
                    <p className="text-xs text-slate-500">Selecciona una entrega y haz clic en "Ver archivo"</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab Content ── */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {/* Terminal Tab */}
              {activeTab === 'terminal' && (
                <div
                  ref={containerRef}
                  className="flex-1 overflow-y-auto px-6 py-4 font-mono text-sm space-y-1"
                  style={{ background: "linear-gradient(180deg, #0a0f1e 0%, #0d1529 100%)" }}
                >
                  {logs.length === 0 && !running && !hasRunRef.current && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                      <Terminal className="size-10 opacity-30" />
                      <p className="text-xs">Selecciona una entrega y presiona "Iniciar Sandbox"</p>
                    </div>
                  )}
                  {logs.map(log => (
                    <div key={log.id} className={`${logColors[log.type]} leading-relaxed`}>
                      {log.type === "criterio" ? (
                        <span>{log.message}</span>
                      ) : (
                        <span>
                          <span className="text-slate-600 mr-2 select-none">
                            {new Date(log.ts).toLocaleTimeString("es-EC", { hour12: false })}
                          </span>
                          {log.message}
                        </span>
                      )}
                      {log.detail && (
                        <div className="text-xs text-slate-500 ml-16 mt-0.5">{log.detail}</div>
                      )}
                    </div>
                  ))}
                  {running && (
                    <div className="flex items-center gap-2 text-violet-400 animate-pulse">
                      <span className="text-slate-600 select-none">
                        {new Date().toLocaleTimeString("es-EC", { hour12: false })}
                      </span>
                      <Loader2 className="size-3 animate-spin" />
                      <span>Procesando...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Resultados Tab */}
              {activeTab === 'resultados' && (
                <div className="flex-1 overflow-y-auto">
                  {parsedDetail ? (
                    <div className="p-6 space-y-5">
                      {/* Score header */}
                      <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <span className="text-2xl font-bold text-emerald-400">{parsedDetail.score.toFixed(1)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">Nota Final — {parsedDetail.score.toFixed(1)}/10</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{parsedDetail.feedbackGeneral}</p>
                        </div>
                      </div>

                      {/* Criteria Table */}
                      {parsedDetail.criterios.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                            <span className="w-1 h-4 bg-violet-500 rounded-full inline-block"></span>
                            Evaluación por Criterios
                          </h4>
                          <div className="overflow-hidden rounded-lg border border-slate-700/50">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-800/80 text-slate-400">
                                  <th className="text-left px-3 py-2 font-medium">Criterio</th>
                                  <th className="text-center px-3 py-2 font-medium w-16">Pts</th>
                                  <th className="text-center px-3 py-2 font-medium w-12">%</th>
                                  <th className="text-left px-3 py-2 font-medium">Justificación</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700/30">
                                {parsedDetail.criterios.map((c, i) => (
                                  <tr key={i} className="even:bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                                    <td className="px-3 py-2.5 text-white font-medium">{c.criterio}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="text-emerald-400 font-mono">{c.puntos_obtenidos}</span>
                                      <span className="text-slate-500">/{c.puntos_max}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`font-mono font-medium ${c.porcentaje >= 70 ? 'text-emerald-400' : c.porcentaje >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {c.porcentaje}%
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-400 leading-relaxed">{c.comentario || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-violet-500/10 border-t border-violet-500/30">
                                  <td className="px-3 py-2.5 font-semibold text-white">Total</td>
                                  <td className="px-3 py-2.5 text-center font-mono font-bold text-violet-400">
                                    {parsedDetail.criterios.reduce((s, c) => s + c.puntos_obtenidos, 0)}
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-mono font-bold text-violet-400">
                                    {Math.round((parsedDetail.criterios.reduce((s, c) => s + c.puntos_obtenidos, 0) / parsedDetail.criterios.reduce((s, c) => s + c.puntos_max, 1)) * 100)}%
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-400">Nota: {parsedDetail.score.toFixed(1)}/10</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Strengths & Areas */}
                      <div className="grid grid-cols-2 gap-4">
                        {parsedDetail.fortalezas.length > 0 && (
                          <div className="bg-emerald-500/5 rounded-lg border border-emerald-500/20 p-3">
                            <h4 className="text-xs font-semibold text-emerald-400 mb-2">✅ Fortalezas</h4>
                            <ul className="space-y-1">
                              {parsedDetail.fortalezas.map((f, i) => (
                                <li key={i} className="text-xs text-slate-300 flex gap-2">
                                  <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {parsedDetail.areasMejora.length > 0 && (
                          <div className="bg-amber-500/5 rounded-lg border border-amber-500/20 p-3">
                            <h4 className="text-xs font-semibold text-amber-400 mb-2">📈 Áreas de Mejora</h4>
                            <ul className="space-y-1">
                              {parsedDetail.areasMejora.map((a, i) => (
                                <li key={i} className="text-xs text-slate-300 flex gap-2">
                                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Recommendation */}
                      {parsedDetail.recomendacion && (
                        <div className="bg-violet-500/5 rounded-lg border border-violet-500/20 p-3">
                          <h4 className="text-xs font-semibold text-violet-400 mb-1">💡 Recomendación Final</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{parsedDetail.recomendacion}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                      <CheckCircle2 className="size-10 opacity-30" />
                      <p className="text-xs">Inicia el sandbox para ver los resultados aquí</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Tab Bar ── */}
            <div className="shrink-0 border-t border-slate-700/50 bg-slate-900/80 flex">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'terminal'
                    ? 'text-violet-400 border-t-2 border-violet-500 bg-slate-800/50'
                    : 'text-slate-500 hover:text-slate-300 border-t-2 border-transparent'
                }`}
              >
                <Terminal className="size-3.5" />
                Terminal
              </button>
              <button
                onClick={() => setActiveTab('resultados')}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'resultados'
                    ? 'text-violet-400 border-t-2 border-violet-500 bg-slate-800/50'
                    : 'text-slate-500 hover:text-slate-300 border-t-2 border-transparent'
                } ${!parsedDetail ? 'opacity-50' : ''}`}
                disabled={!parsedDetail && !running}
              >
                <CheckCircle2 className="size-3.5" />
                Resultados
                {parsedDetail && (
                  <span className="bg-violet-500/20 text-violet-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {parsedDetail.score.toFixed(1)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
