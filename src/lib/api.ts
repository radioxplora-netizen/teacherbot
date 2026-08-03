import { useState, useEffect, useCallback } from "react";

const BASE = "";

export type Course = {
  id: string;
  name: string;
  period: string;
  level: string;
  grade: string;
  subject: string;
  teacher_id: string;
  teacher_name: string;
  assignments?: Assignment[];
  created_at: string;
};

export type Assignment = {
  id: string;
  course_id: string;
  course_name?: string;
  title: string;
  prompt: string;
  due_at: string;
  rubric?: RubricItem[];
  submissions?: Submission[];
  submission_count?: number;
};

export type RubricItem = {
  id: number;
  assignment_id: string;
  criterion: string;
  points: number;
  description: string;
  sort_order: number;
};

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name?: string;
  assignment_title?: string;
  file_url?: string | null;
  submitted_at: string;
  ai_score: number | null;
  ai_feedback: string | null;
  teacher_score: number | null;
  teacher_feedback: string | null;
  status: "pendiente" | "en_proceso" | "listo" | "revisado";
};

export type Stats = {
  courses: number;
  assignments: number;
  submissions: number;
  students: number;
  teachers: number;
  avgScore: number;
  pending: number;
};

type UseAPIResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

function useAPI<T>(url: string | null): UseAPIResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${BASE}${url}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [url, tick]);

  return { data, loading, error, refetch };
}

export function useCourses() { return useAPI<Course[]>("/api/courses"); }
export function useCourse(id: string | undefined) { return useAPI<Course>(id ? `/api/courses/${id}` : null); }
export function useAssignment(id: string | undefined) { return useAPI<Assignment>(id ? `/api/assignments/${id}` : null); }
export function useStats() { return useAPI<Stats>("/api/stats"); }
export function useHealth() { return useAPI<any>("/api/health"); }

// ── AI Evaluation API ──────────────────────────────────────

export type EvaluateResult = {
  id: string;
  ai_score: number;
  ai_feedback: string;
  status: string;
  graded_at: string;
};

export async function evaluateSubmission(submissionId: string): Promise<EvaluateResult> {
  const res = await fetch(`${BASE}/api/ai/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submission_id: submissionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function evaluateBatch(assignmentId: string): Promise<{ evaluated: number; errors: number; results: any[] }> {
  const res = await fetch(`${BASE}/api/ai/evaluate-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignment_id: assignmentId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
