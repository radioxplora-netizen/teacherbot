-- ============================================================
-- TeacherBot — Seed Data
-- ============================================================

-- ── Usuarios ────────────────────────────────────────────────
INSERT INTO users (id, name, email, role, avatar_url) VALUES
('u1', 'Lic. María González',      'mgonzalez@teacherbot.edu.ec',  'docente',      NULL),
('u2', 'Prof. Carlos Ruiz',        'cruiz@teacherbot.edu.ec',      'docente',      NULL),
('u3', 'Lic. Ana Torres',          'atorres@teacherbot.edu.ec',    'docente',      NULL),
('u4', 'Ing. Pedro Méndez',        'pmendez@teacherbot.edu.ec',    'docente',      NULL),
('u5', 'Lic. Sofia Paz',           'spaz@teacherbot.edu.ec',       'docente',      NULL),
('u6', 'Prof. Luis Vega',          'lvega@teacherbot.edu.ec',      'docente',      NULL),
('u7', 'Dr. Roberto Andrade',      'randrade@teacherbot.edu.ec',   'vicerrector',  NULL),
('u8', 'Ing. Sandra López',        'slopez@teacherbot.edu.ec',     'sistemas',     NULL),
('u9', 'admin',                    'admin@teacherbot.edu.ec',      'admin',        NULL);

-- ── Cursos ──────────────────────────────────────────────────
INSERT INTO courses (id, name, period, level, grade, subject, teacher_id) VALUES
('c1', 'Lengua y Literatura · 2do BGU',          'Q2 2025-2026', 'bachillerato', '2do BGU', 'Lengua y Literatura',  'u2'),
('c2', 'Historia · 1ro BGU',                     'Q2 2025-2026', 'bachillerato', '1ro BGU', 'Historia',             'u5'),
('c3', 'Matemáticas · 7mo EGB',                  'Q2 2025-2026', 'primaria',     '7mo EGB', 'Matemáticas',          'u1'),
('c4', 'Ciencias Naturales · 9no EGB',           'Q2 2025-2026', 'secundaria',   '9no EGB', 'Ciencias Naturales',   'u3'),
('c5', 'Física · 10mo EGB',                      'Q2 2025-2026', 'secundaria',   '10mo EGB','Física',               'u4');

-- ── Tareas ──────────────────────────────────────────────────
INSERT INTO assignments (id, course_id, title, prompt, due_at) VALUES
('a1', 'c1', 'Ensayo 1 — Argumentación',
 'Evalúa el ensayo según la rúbrica. Entrega: (1) nota 0–10, (2) feedback por criterio, (3) 3 recomendaciones accionables. Mantén tono respetuoso y académico.',
 '2026-02-07T23:59:00.000Z'),
('a2', 'c1', 'Resumen crítico — Capítulo 3',
 'Califica el resumen por claridad, fidelidad al texto y capacidad crítica. Entrega feedback breve y una pregunta para profundizar.',
 '2026-02-12T23:59:00.000Z'),
('a3', 'c2', 'Investigación — Revolución Industrial',
 'Evalúa el trabajo por fuentes, análisis y presentación. Devuelve nota 0–10 y feedback por sección.',
 '2026-02-15T23:59:00.000Z'),
('a4', 'c3', 'Ejercicios de Álgebra — Unidad 3',
 'Evalúa la resolución de los 10 ejercicios de álgebra. Califica 0-10 con feedback por cada ejercicio.',
 '2026-02-10T23:59:00.000Z'),
('a5', 'c4', 'Informe de Laboratorio — Células',
 'Evalúa el informe por metodología, observaciones, conclusiones y presentación.',
 '2026-02-14T23:59:00.000Z');

-- ── Rúbricas ────────────────────────────────────────────────
INSERT INTO rubric_items (assignment_id, criterion, points, description, sort_order) VALUES
-- Ensayo
('a1', 'Tesis y coherencia',     3, 'La tesis es clara y se sostiene con coherencia en todo el texto.', 1),
('a1', 'Evidencia y citas',      3, 'Usa evidencias pertinentes y referencias/citas adecuadas.', 2),
('a1', 'Estructura y redacción', 2, 'Introducción, desarrollo y conclusión bien articulados; redacción correcta.', 3),
('a1', 'Ortografía y estilo',    2, 'Ortografía, puntuación y estilo apropiados para el nivel.', 4),
-- Resumen crítico
('a2', 'Claridad',   4, 'Ideas expresadas con claridad y orden.', 1),
('a2', 'Fidelidad',  3, 'Respeta las ideas principales del texto.', 2),
('a2', 'Crítica',    3, 'Aporta reflexión propia y preguntas relevantes.', 3),
-- Investigación
('a3', 'Fuentes',      3, 'Fuentes diversas y confiables.', 1),
('a3', 'Análisis',     5, 'Interpretación correcta con argumentos.', 2),
('a3', 'Presentación', 2, 'Orden, formato y claridad visual.', 3),
-- Álgebra
('a4', 'Procedimiento', 4, 'Muestra el desarrollo paso a paso.', 1),
('a4', 'Resultado',     4, 'Resultados correctos y verificados.', 2),
('a4', 'Presentación',  2, 'Orden y legibilidad.', 3),
-- Laboratorio
('a5', 'Metodología',    3, 'Procedimiento descrito correctamente.', 1),
('a5', 'Observaciones',  3, 'Registro detallado y preciso.', 2),
('a5', 'Conclusiones',   2, 'Análisis y conclusiones fundamentadas.', 3),
('a5', 'Presentación',   2, 'Formato, gráficos y referencias.', 4);

-- ── Estudiantes ─────────────────────────────────────────────
INSERT INTO students (id, name, email, grade, level) VALUES
('s1',  'María Gómez',      'mgomez@estudiante.edu.ec',     '2do BGU', 'bachillerato'),
('s2',  'Diego Rivera',     'drivera@estudiante.edu.ec',    '2do BGU', 'bachillerato'),
('s3',  'Sofía Andrade',    'sandrade@estudiante.edu.ec',   '2do BGU', 'bachillerato'),
('s4',  'Juan Pérez',       'jperez@estudiante.edu.ec',     '2do BGU', 'bachillerato'),
('s5',  'Valentina Ruiz',   'vruiz@estudiante.edu.ec',      '2do BGU', 'bachillerato'),
('s6',  'Mateo Cedeño',     'mcedeno@estudiante.edu.ec',    '1ro BGU', 'bachillerato'),
('s7',  'Camila Vera',      'cvera@estudiante.edu.ec',      '7mo EGB', 'primaria'),
('s8',  'Lucas Paredes',    'lparedes@estudiante.edu.ec',   '7mo EGB', 'primaria'),
('s9',  'Emma Salazar',     'esalazar@estudiante.edu.ec',   '9no EGB', 'secundaria'),
('s10', 'Daniel Rojas',     'drojas@estudiante.edu.ec',     '9no EGB', 'secundaria'),
('s11', 'Isabella Franco',  'ifranco@estudiante.edu.ec',    '10mo EGB','secundaria'),
('s12', 'Samuel Ortega',    'sortega@estudiante.edu.ec',    '10mo EGB','secundaria');

-- ── Matrículas ──────────────────────────────────────────────
INSERT INTO enrollments (student_id, course_id) VALUES
('s1','c1'), ('s2','c1'), ('s3','c1'), ('s4','c1'), ('s5','c1'),
('s6','c2'),
('s7','c3'), ('s8','c3'),
('s9','c4'), ('s10','c4'),
('s11','c5'), ('s12','c5');

-- ── Entregas ────────────────────────────────────────────────
INSERT INTO submissions (id, assignment_id, student_id, submitted_at, ai_score, ai_feedback, status) VALUES
('sub-001', 'a1', 's1', '2026-02-05T14:22:00.000Z', 8.7,
 'Tesis bien definida y consistente. Buen uso de evidencias, aunque faltan citas formales en dos párrafos. Redacción fluida; revisar signos de puntuación en la conclusión.',
 'listo'),
('sub-002', 'a1', 's2', '2026-02-06T09:08:00.000Z', NULL, NULL, 'en_proceso'),
('sub-003', 'a1', 's3', '2026-02-06T18:41:00.000Z', NULL, NULL, 'pendiente'),
('sub-004', 'a1', 's4', '2026-02-04T21:05:00.000Z', 9.3,
 'Estructura sólida y evidencia pertinente. Excelente coherencia entre tesis y argumentos. Ajustar dos errores de acentuación; mantener el mismo tiempo verbal en el segundo apartado.',
 'revisado'),
('sub-101', 'a2', 's5', '2026-02-10T11:12:00.000Z', 7.9,
 'Buen resumen, pero falta conectar mejor la crítica con ejemplos del capítulo. Revisa la fidelidad en el segundo apartado.',
 'listo'),
('sub-201', 'a3', 's6', '2026-02-13T16:52:00.000Z', NULL, NULL, 'en_proceso'),
('sub-301', 'a4', 's7', '2026-02-08T14:10:00.000Z', 9.1,
 'Excelente dominio de factorización. Todos los ejercicios correctos. Mejorar la notación en el ejercicio 7.',
 'listo'),
('sub-302', 'a4', 's8', '2026-02-09T10:30:00.000Z', 7.5,
 'Bien el procedimiento pero error en ejercicios 4 y 8. Repasar factor común.',
 'listo'),
('sub-401', 'a5', 's9', '2026-02-12T09:15:00.000Z', 8.8,
 'Buenas observaciones microscópicas. Las conclusiones necesitan más relación con la teoría.',
 'listo'),
('sub-402', 'a5', 's10','2026-02-13T11:45:00.000Z', NULL, NULL, 'pendiente'),
('sub-501', 'a5', 's11','2026-02-14T08:20:00.000Z', 6.2,
 'Metodología incompleta. Faltan datos cuantitativos en las observaciones.',
 'listo');

-- ── KPIs ────────────────────────────────────────────────────
INSERT INTO kpis (id, title, value, trend, category, analysis, ai_action) VALUES
('sent',     'Tareas Enviadas',    '1,245', '+12% vs mes anterior',    'produccion',
 'El volumen de tareas ha aumentado consistentemente, indicando una mayor adopción de la plataforma.',
 'Analizar distribución de carga por grado para evitar saturación.'),
('delivery', 'Tasa de Entrega',    '94.8%', '1,180 entregadas',        'calidad',
 'La tasa de cumplimiento es excelente, superando el objetivo del 90%.',
 'Generar reporte de incentivos para los cursos con mejor cumplimiento.'),
('avg_score','Promedio General',   '8.2',   '+0.3 vs trimestre anterior', 'calidad',
 'Promedio general en tendencia positiva. Ciencias Naturales lidera con 8.8.',
 'Identificar patrones de bajo rendimiento en Física (promedio 7.1).'),
('pending',  'Pendientes de Revisión', '28', '+5 desde ayer',          'operaciones',
 'Aumento de tareas pendientes por corregir, principalmente en Secundaria.',
 'Notificar a docentes con mayor backlog y sugerir redistribución.');

INSERT INTO kpi_details (kpi_id, type, description) VALUES
('sent',     'cause', 'Implementación del nuevo reglamento de evaluación continua.'),
('sent',     'cause', 'Capacitación docente en herramientas digitales (módulo 2).'),
('sent',     'effect','Mayor carga de trabajo para los estudiantes (posible saturación).'),
('sent',     'effect','Incremento en la generación de datos para análisis de aprendizaje.'),
('delivery', 'cause', 'Alta motivación en niveles inferiores.'),
('delivery', 'cause', 'Facilidad de uso de la app móvil para entregas.'),
('delivery', 'effect','Mejores promedios generales y reducción de alertas a padres.');

-- ── Logs del sistema ────────────────────────────────────────
INSERT INTO system_logs (id, at, level, source, message, meta_json) VALUES
('log-001', '2026-02-06T08:12:11.000Z', 'info',  'procesamiento', 'Job iniciado: curso=c1 tarea=a1 entregas=4',
 '{"courseId":"c1","assignmentId":"a1","submissions":4}'),
('log-002', '2026-02-06T08:12:18.000Z', 'warn',  'integracion',   'Retry programado: timeout al obtener archivo de entrega sub-002',
 '{"submissionId":"sub-002","attempt":2}'),
('log-003', '2026-02-06T08:13:02.000Z', 'info',  'procesamiento', 'Entrega procesada: sub-001 score=8.7',
 '{"submissionId":"sub-001","aiScore":8.7}'),
('log-004', '2026-02-06T08:14:37.000Z', 'error', 'procesamiento', 'Error de normalización: rúbrica vacía en tarea=a2',
 '{"courseId":"c1","assignmentId":"a2"}'),
('log-005', '2026-02-06T08:15:04.000Z', 'info',  'ui',            'Acceso a panel Sistemas (demo)', NULL),
('log-006', '2026-02-07T09:00:00.000Z', 'info',  'procesamiento', 'Job completado: 4/4 entregas procesadas para a1',
 '{"assignmentId":"a1","processed":4,"errors":0}'),
('log-007', '2026-02-08T11:30:00.000Z', 'warn',  'integracion',   'Lentitud detectada en API de Moodle: 3.2s avg response',
 '{"avgMs":3200,"threshold":1000}'),
('log-008', '2026-02-09T15:00:00.000Z', 'info',  'ui',            'Docente u1 calificó 5 entregas manualmente', NULL);
