import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, XCircle, BrainCircuit, BarChart3, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";

type ProgressEvent = {
  step: string;
  message: string;
  detail?: any;
  ts?: number;
  criterio?: string;
  puntos_obtenidos?: number;
  puntos_max?: number;
  porcentaje?: number;
  comentario?: string;
  score?: number;
};

type CompleteEvent = {
  id: string;
  ai_score: number;
  ai_feedback: string;
  status: string;
  graded_at: string;
  from_cache?: boolean;
  evaluation_raw?: any;
};

type LogEntry = {
  id: number;
  message: string;
  step: string;
  time: Date;
  icon: "pending" | "done" | "error" | "info";
  detail?: any;
};

type EvalStatus = "connecting" | "running" | "complete" | "error";

const STEP_ICONS: Record<string, string> = {
  inicio: "🚀", cache_hit: "💾", cargando_entrega: "📋", entrega_encontrada: "✅",
  extrayendo_texto: "📄", texto_extraido: "📊", rubrica_cargada: "📐",
  enviando_ia: "🧠", respuesta_recibida: "📨", criterio_evaluado: "🔍",
  nota_calculada: "🎯", guardando: "💿", completado: "🏁",
};

// Global registry to prevent duplicate SSE connections
const completedSubmissions = new Set<string>();

export default function LiveEvaluationModal({
  open,
  onOpenChange,
  submissionId,
  studentName,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  studentName: string;
  onComplete?: (result: CompleteEvent) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<EvalStatus>("connecting");
  const [result, setResult] = useState<CompleteEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const esRef = useRef<EventSource | null>(null);

  // ONE-SHOT: only run the SSE effect once per submissionId
  const hasRunRef = useRef(false);

  // Sync internalOpen with parent's open prop
  useEffect(() => {
    if (open && !internalOpen) {
      setInternalOpen(true);
      setLogs([]);
      setStatus("connecting");
      setResult(null);
      setErrorMsg(null);
      setProgress(0);
      idCounter.current = 0;
    }
  }, [open, submissionId]);

  // SSE effect — ONE SHOT per submissionId
  useEffect(() => {
    if (!internalOpen || !submissionId) return;

    // CRITICAL: if already completed globally for this submission, NEVER restart
    if (completedSubmissions.has(submissionId)) return;

    // If we already ran for this mount, don't restart
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    // Clean up any stale EventSource
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const addLog = (message: string, step: string, icon: LogEntry["icon"] = "info", detail?: any) => {
      idCounter.current += 1;
      setLogs(prev => [...prev, { id: idCounter.current, message, step, time: new Date(), icon, detail }]);
    };

    const progressSteps = ["inicio", "entrega_encontrada", "texto_extraido", "rubrica_cargada", "respuesta_recibida", "nota_calculada", "completado"];
    const seenSteps = new Set<string>();

    addLog("Conectando al motor de evaluación IA...", "inicio", "info");
    setStatus("connecting");
    setProgress(0);

    const streamUrl = `/api/ai/evaluate-stream/${submissionId}`;
    const es = new EventSource(streamUrl);
    esRef.current = es;

    let done = false;

    es.addEventListener("progress", (e) => {
      if (done) return;
      try {
        const data: ProgressEvent = JSON.parse(e.data);
        addLog(data.message, data.step, "info", data.detail);
        if (progressSteps.includes(data.step) && !seenSteps.has(data.step)) {
          seenSteps.add(data.step);
          setProgress(Math.round((seenSteps.size / progressSteps.length) * 90));
        }
        if (data.step === "enviando_ia") {
          setStatus("running");
          addLog("⏳ Aguardando respuesta del modelo...", "enviando_ia", "pending");
        }
        if (data.step === "criterio_evaluado") {
          addLog(
            `  ↳ ${data.criterio || ""}: ${data.puntos_obtenidos ?? "?"}/${data.puntos_max ?? "?"} pts (${data.porcentaje ?? "?"}%)`,
            "criterio_evaluado", "done", data
          );
        }
      } catch {}
    });

    es.addEventListener("complete", (e) => {
      if (done) return;
      done = true;
      // Mark as completed GLOBALLY so it NEVER runs again
      completedSubmissions.add(submissionId);
      try {
        const data: CompleteEvent = JSON.parse(e.data);
        setResult(data);
        setStatus("complete");
        setProgress(100);
        addLog(`✨ Evaluación completada — Nota: ${data.ai_score.toFixed(1)}/10`, "completado", "done", data);
        es.close();
        esRef.current = null;
        // Call onComplete exactly once
        setTimeout(() => {
          if (onComplete) onComplete(data);
        }, 0);
      } catch {}
    });

    es.addEventListener("error", () => {
      if (done) { es.close(); esRef.current = null; return; }
      if (es.readyState === EventSource.CLOSED) {
        setErrorMsg("Conexión cerrada inesperadamente");
        addLog("⚠️ Conexión cerrada inesperadamente", "error", "error");
        setStatus("error");
        es.close();
        esRef.current = null;
      }
    });

    return () => {
      done = true;
      if (es.readyState !== EventSource.CLOSED) es.close();
      esRef.current = null;
    };
  }, [internalOpen, submissionId]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const isRunning = status === "connecting" || status === "running";
  const isDone = status === "complete" || status === "error";

  const handleOpenChange = (shouldOpen: boolean) => {
    if (!shouldOpen && isRunning) return; // Block close while running
    if (!shouldOpen) {
      setInternalOpen(false);
      onOpenChange(false);
      return;
    }
    setInternalOpen(true);
  };

  return (
    <DialogPrimitive.Root open={internalOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl max-h-[85vh] translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-800 bg-[#0d1117] p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg text-slate-200 overflow-hidden flex flex-col"
          onPointerDownOutside={(e) => isRunning && e.preventDefault()}
          onEscapeKeyDown={(e) => isRunning && e.preventDefault()}
          onInteractOutside={(e) => isRunning && e.preventDefault()}
        >
          {/* Close button — only when done */}
          {isDone && (
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}

          <div className="flex flex-col space-y-1.5 text-center sm:text-left border-b border-slate-800 pb-3 shrink-0">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2 text-slate-100">
              <BrainCircuit className="size-5 text-purple-400" />
              Análisis IA en Vivo
              {status === "running" && <Loader2 className="size-4 animate-spin text-blue-400 ml-2" />}
              {status === "complete" && <CheckCircle2 className="size-4 text-green-400 ml-2" />}
              {status === "error" && <XCircle className="size-4 text-red-400 ml-2" />}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-slate-400 flex items-center gap-2">
              <span>{studentName}</span>
              {result && (
                <Badge variant="secondary" className={result.from_cache ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}>
                  {result.from_cache ? "Desde caché" : "Nueva evaluación"}
                </Badge>
              )}
            </DialogPrimitive.Description>
          </div>

          <div className="px-1 shrink-0">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ease-out rounded-full ${status === "error" ? "bg-red-500" : status === "complete" ? "bg-green-500" : "bg-gradient-to-r from-purple-500 to-blue-500"}`}
                style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-1">
              <span>{isRunning ? (status === "connecting" ? "Conectando..." : "Procesando...") : status === "complete" ? "Completado" : "Error"}</span>
              <span>{progress}%</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed p-4 space-y-1 bg-[#0a0e14] rounded-md border border-slate-800/50">
            {logs.map((log) => (
              <div key={log.id} className={`flex gap-2 ${log.icon === "error" ? "text-red-400" : log.icon === "done" ? "text-green-300" : "text-slate-400"}`}>
                <span className="shrink-0 text-slate-600 w-16 text-right">{formatTime(log.time)}</span>
                <span className="shrink-0">{STEP_ICONS[log.step] || "•"}</span>
                <span className="break-words">{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {result && (
            <div className="shrink-0 border-t border-slate-800 pt-3 mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Nota IA</span>
                  <p className="text-3xl font-bold text-yellow-400">{result.ai_score.toFixed(1)}<span className="text-lg text-slate-500">/10</span></p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Estado</span>
                  <p className="text-sm text-green-400 font-medium">Listo</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3 text-xs text-slate-400 max-h-32 overflow-y-auto">
                <p className="whitespace-pre-wrap">{result.ai_feedback?.substring(0, 500) || "Sin feedback"}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="shrink-0 bg-red-950/50 border border-red-800 rounded p-3 flex items-start gap-2">
              <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">Error en la evaluación</p>
                <p className="text-xs text-red-400/80 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {isDone && (
            <div className="shrink-0 flex justify-end pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => { setInternalOpen(false); onOpenChange(false); }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <X className="size-4 mr-1" /> Cerrar
              </Button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
