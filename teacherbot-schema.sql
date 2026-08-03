-- ============================================================
-- TeacherBot — SQLite Database
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Usuarios del sistema ────────────────────────────────────
CREATE TABLE users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('admin','vicerrector','docente','estudiante','sistemas')),
    avatar_url  TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Cursos / Materias ───────────────────────────────────────
CREATE TABLE courses (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    period      TEXT NOT NULL,
    level       TEXT NOT NULL CHECK (level IN ('primaria','secundaria','bachillerato')),
    grade       TEXT NOT NULL,
    subject     TEXT NOT NULL,
    teacher_id  TEXT REFERENCES users(id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Tareas / Deberes ────────────────────────────────────────
CREATE TABLE assignments (
    id          TEXT PRIMARY KEY,
    course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    prompt      TEXT NOT NULL,
    due_at      TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Rúbricas de evaluación ──────────────────────────────────
CREATE TABLE rubric_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    criterion   TEXT NOT NULL,
    points      REAL NOT NULL,
    description TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ── Estudiantes ─────────────────────────────────────────────
CREATE TABLE students (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE,
    grade       TEXT NOT NULL,
    level       TEXT NOT NULL CHECK (level IN ('primaria','secundaria','bachillerato')),
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Matrícula estudiante ↔ curso ────────────────────────────
CREATE TABLE enrollments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(student_id, course_id)
);

-- ── Entregas de estudiantes ─────────────────────────────────
CREATE TABLE submissions (
    id                TEXT PRIMARY KEY,
    assignment_id     TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id        TEXT NOT NULL REFERENCES students(id),
    file_url          TEXT,
    submitted_at      TEXT NOT NULL,
    ai_score          REAL CHECK (ai_score >= 0 AND ai_score <= 10),
    ai_feedback       TEXT,
    teacher_score     REAL CHECK (teacher_score >= 0 AND teacher_score <= 10),
    teacher_feedback  TEXT,
    status            TEXT NOT NULL DEFAULT 'pendiente'
                      CHECK (status IN ('pendiente','en_proceso','listo','revisado')),
    graded_at         TEXT,
    graded_by         TEXT REFERENCES users(id)
);

-- ── KPIs del vicerrectorado ─────────────────────────────────
CREATE TABLE kpis (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    value       TEXT NOT NULL,
    trend       TEXT,
    category    TEXT NOT NULL,
    analysis    TEXT,
    ai_action   TEXT,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE kpi_details (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    kpi_id      TEXT NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('cause','effect')),
    description TEXT NOT NULL
);

-- ── Logs del sistema ────────────────────────────────────────
CREATE TABLE system_logs (
    id          TEXT PRIMARY KEY,
    at          TEXT NOT NULL,
    level       TEXT NOT NULL CHECK (level IN ('info','warn','error')),
    source      TEXT NOT NULL CHECK (source IN ('ui','procesamiento','integracion')),
    message     TEXT NOT NULL,
    meta_json   TEXT
);

-- ── Sesiones / Actividad ────────────────────────────────────
CREATE TABLE activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT REFERENCES users(id),
    action      TEXT NOT NULL,
    entity      TEXT,
    entity_id   TEXT,
    details_json TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Notificaciones ──────────────────────────────────────────
CREATE TABLE notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL REFERENCES users(id),
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    read        INTEGER NOT NULL DEFAULT 0,
    link        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ════════════════════════════════════════════════════════════
-- Índices
-- ════════════════════════════════════════════════════════════
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_due ON assignments(due_at);
CREATE INDEX idx_rubric_items_assignment ON rubric_items(assignment_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_at ON system_logs(at);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
