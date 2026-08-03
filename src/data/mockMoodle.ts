export type ProcessingStatus = "pendiente" | "en_proceso" | "listo" | "revisado";

export type StudentSubmission = {
  id: string;
  studentName: string;
  submittedAt: string; // ISO
  status: ProcessingStatus;
  aiScoreSuggested?: number; // 0..10
  aiFeedbackPreview?: string;
};

export type Assignment = {
  id: string;
  title: string;
  dueAt: string; // ISO
  prompt: string;
  rubric: {
    criterion: string;
    points: number;
    description: string;
  }[];
  submissions: StudentSubmission[];
};

export type Course = {
  id: string;
  name: string;
  period: string;
  assignments: Assignment[];
};

export const mockCourses: Course[] = [
  {
    id: "1",
    name: "Lengua y Literatura · 2do BGU",
    period: "Q2 2025-2026",
    assignments: [
      {
        id: "ensayo1",
        title: "Ensayo 1 — Argumentación",
        dueAt: "2026-02-07T23:59:00.000Z",
        prompt:
          "Evalúa el ensayo según la rúbrica. Entrega: (1) nota 0–10, (2) feedback por criterio, (3) 3 recomendaciones accionables. Mantén tono respetuoso y académico.",
        rubric: [
          {
            criterion: "Tesis y coherencia",
            points: 3,
            description: "La tesis es clara y se sostiene con coherencia en todo el texto.",
          },
          {
            criterion: "Evidencia y citas",
            points: 3,
            description: "Usa evidencias pertinentes y referencias/citas adecuadas.",
          },
          {
            criterion: "Estructura y redacción",
            points: 2,
            description: "Introducción, desarrollo y conclusión bien articulados; redacción correcta.",
          },
          {
            criterion: "Ortografía y estilo",
            points: 2,
            description: "Ortografía, puntuación y estilo apropiados para el nivel.",
          },
        ],
        submissions: [
          {
            id: "sub-001",
            studentName: "María Gómez",
            submittedAt: "2026-02-05T14:22:00.000Z",
            status: "listo",
            aiScoreSuggested: 8.7,
            aiFeedbackPreview:
              "Tesis bien definida y consistente. Buen uso de evidencias, aunque faltan citas formales en dos párrafos. Redacción fluida; revisar signos de puntuación en la conclusión.",
          },
          {
            id: "sub-002",
            studentName: "Diego Rivera",
            submittedAt: "2026-02-06T09:08:00.000Z",
            status: "en_proceso",
          },
          {
            id: "sub-003",
            studentName: "Sofía Andrade",
            submittedAt: "2026-02-06T18:41:00.000Z",
            status: "pendiente",
          },
          {
            id: "sub-004",
            studentName: "Juan Pérez",
            submittedAt: "2026-02-04T21:05:00.000Z",
            status: "revisado",
            aiScoreSuggested: 9.3,
            aiFeedbackPreview:
              "Estructura sólida y evidencia pertinente. Excelente coherencia entre tesis y argumentos. Ajustar dos errores de acentuación; mantener el mismo tiempo verbal en el segundo apartado.",
          },
        ],
      },
      {
        id: "resumen1",
        title: "Resumen crítico — Capítulo 3",
        dueAt: "2026-02-12T23:59:00.000Z",
        prompt:
          "Califica el resumen por claridad, fidelidad al texto y capacidad crítica. Entrega feedback breve y una pregunta para profundizar.",
        rubric: [
          { criterion: "Claridad", points: 4, description: "Ideas expresadas con claridad y orden." },
          { criterion: "Fidelidad", points: 3, description: "Respeta las ideas principales del texto." },
          { criterion: "Crítica", points: 3, description: "Aporta reflexión propia y preguntas relevantes." },
        ],
        submissions: [
          {
            id: "sub-101",
            studentName: "Valentina Ruiz",
            submittedAt: "2026-02-10T11:12:00.000Z",
            status: "listo",
            aiScoreSuggested: 7.9,
            aiFeedbackPreview:
              "Buen resumen, pero falta conectar mejor la crítica con ejemplos del capítulo. Revisa la fidelidad en el segundo apartado.",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Historia · 1ro BGU",
    period: "Q2 2025-2026",
    assignments: [
      {
        id: "investigacion1",
        title: "Investigación — Revolución Industrial",
        dueAt: "2026-02-15T23:59:00.000Z",
        prompt:
          "Evalúa el trabajo por fuentes, análisis y presentación. Devuelve nota 0–10 y feedback por sección.",
        rubric: [
          { criterion: "Fuentes", points: 3, description: "Fuentes diversas y confiables." },
          { criterion: "Análisis", points: 5, description: "Interpretación correcta con argumentos." },
          { criterion: "Presentación", points: 2, description: "Orden, formato y claridad visual." },
        ],
        submissions: [
          {
            id: "sub-201",
            studentName: "Mateo Cedeño",
            submittedAt: "2026-02-13T16:52:00.000Z",
            status: "en_proceso",
          },
        ],
      },
    ],
  },
];

export function findCourse(courseId: string): Course | undefined {
  return mockCourses.find((c) => c.id === courseId);
}

export function findAssignment(courseId: string, assignmentId: string): Assignment | undefined {
  const course = findCourse(courseId);
  return course?.assignments.find((a) => a.id === assignmentId);
}
