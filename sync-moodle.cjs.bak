#!/usr/bin/env node
/**
 * TeacherBot — Moodle Sync Engine
 * =================================
 * Parametrized sync from Moodle (any version, any DB) → TeacherBot SQLite.
 *
 * Usage:
 *   node sync-moodle.js [--config moodle-config.json]
 *
 * Config file defines Moodle connection, mapping, and sync options.
 */

const { Client: PgClient } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ── CLI args ──────────────────────────────────────────────────────────────
const configPath = process.argv.includes('--config')
  ? process.argv[process.argv.indexOf('--config') + 1]
  : path.join(__dirname, 'moodle-config.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const { moodle, teacherbot, sync, mapping } = config;

// Parse Moodle version
const moodleVer = moodle.version || '5.0';
const moodleMajor = parseInt(moodleVer.split('.')[0], 10);

// ── DB Connections ────────────────────────────────────────────────────────
const tdb = new Database(teacherbot.db);
tdb.pragma('journal_mode = WAL');
tdb.pragma('foreign_keys = ON');

const pg = new PgClient({
  host: moodle.db.host,
  port: moodle.db.port,
  user: moodle.db.user,
  password: moodle.db.password || undefined,
  database: moodle.db.database,
});
const prefix = moodle.db.prefix || 'mdl_';

// ── Helpers ───────────────────────────────────────────────────────────────
function moodleTable(name) { return `"${prefix}${name}"`; }

function roleMap(moodleRole) {
  return mapping?.roles?.[moodleRole] || 'estudiante';
}

function scaleGrade(grade100) {
  // Moodle grade is 0-100, TeacherBot uses 0-10
  return config.sync?.mapGradesTo10Scale !== false
    ? Math.round((parseFloat(grade100) / 100) * 10 * 10) / 10
    : parseFloat(grade100);
}

function statusMap(moodleStatus) {
  const map = {
    'draft': 'pendiente',
    'submitted': 'pendiente',
    'graded': 'listo',
    'reopened': 'en_proceso',
  };
  return map[moodleStatus] || 'pendiente';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// ── ID mapping (Moodle ID → TeacherBot ID) ──────────────────────────────
const idMap = { users: {}, courses: {}, assignments: {}, submissions: {} };

// ═══════════════════════════════════════════════════════════════════════════
// SYNC: Users (Teachers & Students)
// ═══════════════════════════════════════════════════════════════════════════
async function syncUsers() {
  console.log('\n👤 Sincronizando usuarios...');

  const sql = `
    SELECT u.id, u.username, u.firstname, u.lastname, u.email, r.shortname as role
    FROM ${moodleTable('user')} u
    JOIN ${moodleTable('role_assignments')} ra ON ra.userid = u.id
    JOIN ${moodleTable('context')} ctx ON ra.contextid = ctx.id AND ctx.contextlevel = 50
    JOIN ${moodleTable('role')} r ON ra.roleid = r.id
    WHERE u.deleted = 0 AND u.confirmed = 1 AND u.id > 1
    GROUP BY u.id, u.username, u.firstname, u.lastname, u.email, r.shortname
  `;

  const { rows } = await pg.query(sql);

  const insertUser = tdb.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, role, active, created_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'))
  `);

  for (const u of rows) {
    const tbRole = roleMap(u.role);
    if (tbRole === 'estudiante' && !sync.importStudents) continue;
    if (tbRole === 'docente' && !sync.importTeachers) continue;

    const name = `${u.firstname} ${u.lastname}`.trim();
    const email = u.email && u.email.includes('@') ? u.email : `${u.username}@teacherbot.local`;
    const tbId = tbRole === 'docente' ? `u-m-${u.id}` : `s-m-${u.id}`;

    insertUser.run(tbId, name, email, tbRole);
    idMap.users[u.id] = { id: tbId, role: tbRole, name };

    // Also insert into students table if role is student
    if (tbRole === 'estudiante') {
      tdb.prepare(`
        INSERT OR REPLACE INTO students (id, name, email, grade, level, active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
      `).run(tbId, name, email, moodle.courses.grade || 'Desconocido', moodle.courses.level || 'secundaria');
    }
  }

  console.log(`   ✅ ${rows.length} usuarios sincronizados`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC: Courses
// ═══════════════════════════════════════════════════════════════════════════
async function syncCourses() {
  if (!sync.importCourses) return;
  console.log('\n📚 Sincronizando cursos...');

  const sql = `
    SELECT c.id, c.fullname, c.shortname, c.startdate,
           (SELECT ra.userid FROM ${moodleTable('role_assignments')} ra
            JOIN ${moodleTable('context')} ctx ON ra.contextid = ctx.id
            JOIN ${moodleTable('role')} r ON ra.roleid = r.id
            WHERE ctx.instanceid = c.id AND ctx.contextlevel = 50 AND r.shortname = 'editingteacher'
            LIMIT 1) as teacher_moodle_id
    FROM ${moodleTable('course')} c
    WHERE c.id != 1
  `;

  const { rows } = await pg.query(sql);

  const insertCourse = tdb.prepare(`
    INSERT OR REPLACE INTO courses (id, name, period, level, grade, subject, teacher_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  for (const c of rows) {
    const tbId = `c-m-${c.id}`;
    const teacherInfo = idMap.users[c.teacher_moodle_id];
    const startYear = c.startdate ? new Date(c.startdate * 1000).getFullYear() : 2026;
    const period = moodle.courses.defaultPeriod || `Q2 ${startYear}`;

    // Extract grade/subject info from course name or use defaults
    const subject = c.fullname;
    const grade = moodle.courses.grade || '1ro BGU';
    const level = moodle.courses.level || 'bachillerato';

    insertCourse.run(tbId, c.fullname, period, level, grade, subject, teacherInfo?.id || null);
    idMap.courses[c.id] = tbId;
  }

  console.log(`   ✅ ${rows.length} cursos sincronizados`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC: Enrollments (students → courses)
// ═══════════════════════════════════════════════════════════════════════════
async function syncEnrollments() {
  if (!sync.importStudents) return;
  console.log('\n📋 Sincronizando matrículas...');

  const sql = `
    SELECT DISTINCT ra.userid, ctx.instanceid as course_id
    FROM ${moodleTable('role_assignments')} ra
    JOIN ${moodleTable('context')} ctx ON ra.contextid = ctx.id AND ctx.contextlevel = 50
    JOIN ${moodleTable('role')} r ON ra.roleid = r.id
    WHERE r.shortname = 'student' AND ctx.instanceid != 1
  `;

  const { rows } = await pg.query(sql);

  const insertEnrollment = tdb.prepare(`
    INSERT OR IGNORE INTO enrollments (student_id, course_id, enrolled_at)
    VALUES (?, ?, datetime('now'))
  `);

  let count = 0;
  for (const e of rows) {
    const studentTbId = idMap.users[e.userid]?.id;
    const courseTbId = idMap.courses[e.course_id];
    if (studentTbId && courseTbId && studentTbId.startsWith('s-')) {
      insertEnrollment.run(studentTbId, courseTbId);
      count++;
    }
  }

  console.log(`   ✅ ${count} matrículas sincronizadas`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC: Assignments
// ═══════════════════════════════════════════════════════════════════════════
async function syncAssignments() {
  if (!sync.importAssignments) return;
  console.log('\n📝 Sincronizando tareas...');

  const sql = `
    SELECT a.id, a.course, a.name, a.intro, a.duedate, a.grade
    FROM ${moodleTable('assign')} a
  `;

  const { rows } = await pg.query(sql);

  const insertAssignment = tdb.prepare(`
    INSERT OR REPLACE INTO assignments (id, course_id, title, prompt, due_at, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertRubric = tdb.prepare(`
    INSERT INTO rubric_items (assignment_id, criterion, points, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const a of rows) {
    const tbId = `a-m-${a.id}`;
    const courseTbId = idMap.courses[a.course];

    if (!courseTbId) { console.log(`   ⚠️  Tarea ${a.id}: curso no encontrado`); continue; }

    // Clean intro text (strip HTML but preserve content)
    const prompt = a.intro
      ? a.intro.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 500)
      : `Tarea: ${a.name}`;

    const dueAt = a.duedate
      ? new Date(a.duedate * 1000).toISOString()
      : new Date(Date.now() + 7 * 86400000).toISOString();

    insertAssignment.run(tbId, courseTbId, a.name, prompt, dueAt);
    idMap.assignments[a.id] = tbId;

    // Auto-generate rubric if enabled
    if (sync.autoGenerateRubric) {
      // Delete old rubric items for this assignment
      tdb.prepare('DELETE FROM rubric_items WHERE assignment_id = ?').run(tbId);

      // Generate a basic rubric based on total points
      const totalPoints = parseFloat(a.grade) || 100;
      const criteria = [
        { criterion: 'Contenido y Precisión', points: Math.round(totalPoints * 0.4 * 10) / 10, description: 'Calidad, corrección y profundidad del contenido presentado.', sort_order: 1 },
        { criterion: 'Estructura y Organización', points: Math.round(totalPoints * 0.25 * 10) / 10, description: 'Claridad en la estructura, orden lógico y formato.', sort_order: 2 },
        { criterion: 'Creatividad y Originalidad', points: Math.round(totalPoints * 0.2 * 10) / 10, description: 'Aporte personal, ideas originales y creatividad.', sort_order: 3 },
        { criterion: 'Presentación y Ortografía', points: Math.round(totalPoints * 0.15 * 10) / 10, description: 'Limpieza, ortografía, gramática y referencias.', sort_order: 4 },
      ];

      for (const cr of criteria) {
        insertRubric.run(tbId, cr.criterion, cr.points, cr.description, cr.sort_order);
      }
    }
  }

  console.log(`   ✅ ${rows.length} tareas sincronizadas`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC: Submissions + Grades
// ═══════════════════════════════════════════════════════════════════════════
async function syncSubmissions() {
  if (!sync.importSubmissions && !sync.importGrades) return;
  console.log('\n📬 Sincronizando entregas y calificaciones...');

  // Get submissions
  const subSql = `
    SELECT s.id, s.assignment, s.userid, s.status, s.timemodified
    FROM ${moodleTable('assign_submission')} s
    WHERE s.status = 'submitted'
    ORDER BY s.id
  `;

  const { rows: submissions } = await pg.query(subSql);

  // Get grades
  const gradeSql = `
    SELECT g.id, g.assignment, g.userid, g.grader, g.grade, g.timemodified
    FROM ${moodleTable('assign_grades')} g
    ORDER BY g.id
  `;

  const { rows: grades } = await pg.query(gradeSql);

  // Get feedback comments
  const fbSql = `
    SELECT fc.assignment, fc.grade as grade_id, fc.commenttext
    FROM ${moodleTable('assignfeedback_comments')} fc
    WHERE fc.commenttext IS NOT NULL AND fc.commenttext != ''
  `;
  const { rows: feedbacks } = await pg.query(fbSql);

  // Build feedback map
  const fbMap = {};
  for (const fb of feedbacks) {
    fbMap[`${fb.assignment}_${fb.grade_id}`] = fb.commenttext;
  }

  // Build grade map by (assignment, userid)
  const gradeMap = {};
  const gradeMeta = {};
  for (const g of grades) {
    gradeMap[`${g.assignment}_${g.userid}`] = g.grade;
    gradeMeta[`${g.assignment}_${g.userid}`] = { grader: g.grader, gradedAt: g.timemodified };
  }

  const insertSub = tdb.prepare(`
    INSERT OR REPLACE INTO submissions
      (id, assignment_id, student_id, submitted_at, ai_score, ai_feedback, status, graded_at, graded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const s of submissions) {
    const tbAssignmentId = idMap.assignments[s.assignment];
    const studentInfo = idMap.users[s.userid];
    const studentTbId = studentInfo?.id;

    if (!tbAssignmentId || !studentTbId) continue;

    const tbId = `sub-m-${s.id}`;
    const submittedAt = new Date(s.timemodified * 1000).toISOString();
    const grade100 = gradeMap[`${s.assignment}_${s.userid}`];
    const meta = gradeMeta[`${s.assignment}_${s.userid}`] || {};

    // Map grade from 0-100 to 0-10
    const aiScore = grade100 !== undefined && grade100 !== null
      ? scaleGrade(grade100)
      : null;

    const fbKey = `${s.assignment}_${s.id}`;
    const aiFeedback = fbMap[fbKey] || null;

    // Determine status
    let status = statusMap(s.status);
    if (aiScore !== null) status = 'listo';

    const gradedAt = meta.gradedAt
      ? new Date(meta.gradedAt * 1000).toISOString()
      : null;

    const gradedBy = meta.grader ? idMap.users[meta.grader]?.id || null : null;

    insertSub.run(tbId, tbAssignmentId, studentTbId, submittedAt, aiScore, aiFeedback, status, gradedAt, gradedBy);
    count++;
  }

  console.log(`   ✅ ${count} entregas sincronizadas (${Object.keys(gradeMap).length} con calificación)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC: Files from Moodle submissions → TeacherBot data dir
// ═══════════════════════════════════════════════════════════════════════════
async function syncFiles() {
  const fs = require('fs');
  const path = require('path');
  const DATA_DIR = path.resolve(teacherbot.db, '..', 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  console.log('\n📁 Sincronizando archivos de entregas...');

  // Get dataroot from Moodle config — hardcoded for this install
  const dataroot = '/var/www/moodledata';

  const { rows: files } = await pg.query(`
    SELECT 
      s.id as sub_id,
      f.filename,
      f.contenthash
    FROM ${moodleTable('assign_submission')} s
    JOIN ${moodleTable('files')} f ON f.itemid = s.id 
      AND f.component = 'assignsubmission_file' 
      AND f.filearea = 'submission_files'
      AND f.filename != '.'
    WHERE s.status = 'submitted'
    ORDER BY s.id
  `);

  if (files.length === 0) {
    console.log('   ℹ️  No hay archivos para sincronizar');
    return;
  }

  const updateStmt = tdb.prepare('UPDATE submissions SET file_url = ? WHERE id = ?');
  let copied = 0;

  for (const f of files) {
    const tbSubId = 'sub-m-' + f.sub_id;
    const existing = tdb.prepare('SELECT file_url FROM submissions WHERE id = ?').get(tbSubId);
    if (existing && existing.file_url) continue;

    const moodlePath = path.join(dataroot, 'filedir', f.contenthash.substring(0, 2), f.contenthash.substring(2, 4), f.contenthash);
    if (!fs.existsSync(moodlePath)) continue;

    const ext = path.extname(f.filename) || '.pdf';
    const safeName = f.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const destName = 'moodle_sub_' + f.sub_id + '_' + safeName;
    const destPath = path.join(DATA_DIR, destName);

    try {
      fs.copyFileSync(moodlePath, destPath);
      updateStmt.run('/data/' + destName, tbSubId);
      copied++;
    } catch (e) {
      // skip files that can't be copied
    }
  }

  console.log('   ✅ ' + copied + ' archivos importados de Moodle');
}
function printStats() {
  const tables = ['users','courses','assignments','rubric_items','students','enrollments','submissions'];
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 TeacherBot Database Summary');
  console.log('═══════════════════════════════════════════════');
  for (const t of tables) {
    const row = tdb.prepare(`SELECT count(*) as c FROM "${t}"`).get();
    console.log(`  ${t.padEnd(18)} ${row.c} registros`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   TeacherBot ← Moodle Sync Engine       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n🔗 Moodle ${moodleVer} → ${moodle.db.host}/${moodle.db.database}`);
  console.log(`📁 TeacherBot DB: ${teacherbot.db}`);

  try {
    await pg.connect();
    console.log('✅ PostgreSQL conectado\n');

    await syncUsers();
    await syncCourses();
    await syncEnrollments();
    await syncAssignments();
    await syncSubmissions();
    await syncFiles();

    printStats();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pg.end();
    tdb.close();
  }

  console.log('\n✨ Sincronización completada.');
}

main();
