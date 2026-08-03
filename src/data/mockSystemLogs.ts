export type SystemLogLevel = "info" | "warn" | "error";

export type SystemLogEntry = {
  id: string;
  at: string; // ISO
  level: SystemLogLevel;
  source: "ui" | "procesamiento" | "integracion";
  message: string;
  meta?: Record<string, unknown>;
};

export const mockSystemLogs: SystemLogEntry[] = [
  {
    id: "log-001",
    at: "2026-02-06T08:12:11.000Z",
    level: "info",
    source: "procesamiento",
    message: "Job iniciado: curso=1 tarea=ensayo1 entregas=4",
    meta: { courseId: "1", assignmentId: "ensayo1", submissions: 4 },
  },
  {
    id: "log-002",
    at: "2026-02-06T08:12:18.000Z",
    level: "warn",
    source: "integracion",
    message: "Retry programado: timeout al obtener archivo de entrega sub-002",
    meta: { submissionId: "sub-002", attempt: 2 },
  },
  {
    id: "log-003",
    at: "2026-02-06T08:13:02.000Z",
    level: "info",
    source: "procesamiento",
    message: "Entrega procesada: sub-001 score=8.7",
    meta: { submissionId: "sub-001", aiScore: 8.7 },
  },
  {
    id: "log-004",
    at: "2026-02-06T08:14:37.000Z",
    level: "error",
    source: "procesamiento",
    message: "Error de normalización: rúbrica vacía en tarea=resumen1",
    meta: { courseId: "1", assignmentId: "resumen1" },
  },
  {
    id: "log-005",
    at: "2026-02-06T08:15:04.000Z",
    level: "info",
    source: "ui",
    message: "Acceso a panel Sistemas (demo)",
  },
];

export function fmtIso(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
