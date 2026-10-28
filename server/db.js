import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, "exampilot.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course_code TEXT,
    description TEXT,
    semester TEXT,
    academic_level TEXT,
    color TEXT NOT NULL DEFAULT 'blue',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS study_materials (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content_text TEXT NOT NULL DEFAULT '',
    source_filename TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    material_id TEXT REFERENCES study_materials(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_option INTEGER NOT NULL,
    explanation TEXT NOT NULL DEFAULT '',
    topic TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    source_type TEXT NOT NULL DEFAULT 'generated',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exam_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    submitted_at TEXT,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER,
    score_percent REAL,
    duration_seconds INTEGER,
    question_ids TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attempt_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option INTEGER,
    is_correct INTEGER,
    UNIQUE(attempt_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS study_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    material_id TEXT REFERENCES study_materials(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Study session',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    is_saved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
  CREATE INDEX IF NOT EXISTS idx_materials_user ON study_materials(user_id);
  CREATE INDEX IF NOT EXISTS idx_materials_course ON study_materials(course_id);
  CREATE INDEX IF NOT EXISTS idx_questions_user ON questions(user_id);
  CREATE INDEX IF NOT EXISTS idx_questions_course ON questions(course_id);
  CREATE INDEX IF NOT EXISTS idx_attempts_user ON exam_attempts(user_id);
  CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_user ON study_tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_user ON ai_conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON ai_messages(conversation_id);
`);

// ── Initial Seed Data ────────────────────────────────────────────────────────
try {
  const userCheck = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (userCheck && userCheck.count === 0) {
    const importBcrypt = await import("bcryptjs");
    const bcrypt = importBcrypt.default || importBcrypt;
    const demoUserId = "demo-user-100";
    const demoPasswordHash = bcrypt.hashSync("password123", 10);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(demoUserId, "Chidi Okonkwo", "demo@exampilot.ng", demoPasswordHash);

    const c1Id = "course-csc201";
    const c2Id = "course-gst111";

    db.prepare(`
      INSERT INTO courses (id, user_id, title, course_code, description, semester, academic_level, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c1Id, demoUserId, "Data Structures and Algorithms", "CSC 201", "Core concepts in arrays, linked lists, trees, graphs, and algorithm time complexities.", "First Semester", "200 Level", "blue");

    db.prepare(`
      INSERT INTO courses (id, user_id, title, course_code, description, semester, academic_level, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c2Id, demoUserId, "Nigerian Peoples and Culture", "GST 111", "Survey of Nigerian ethnic nationalities, indigenous political systems, and cultural heritage.", "First Semester", "100 Level", "emerald");

    const m1Id = "mat-csc201-stacks";
    db.prepare(`
      INSERT INTO study_materials (id, user_id, course_id, title, content_text)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      m1Id,
      demoUserId,
      c1Id,
      "Lecture 3: Stacks and Queues Summary",
      `A stack is a linear data structure following LIFO (Last In First Out). Major operations are push(), pop(), and peek(), all operating in O(1) time complexity. Real-world applications include call stacks in function recursion, undo mechanisms in editors, and syntax parsing for balanced parentheses.\n\nA queue is a FIFO (First In First Out) structure. Enqueue adds to rear; dequeue removes from front. Breadth-first search (BFS) on graphs relies heavily on queues.`
    );

    const qInsert = db.prepare(`
      INSERT INTO questions (id, user_id, course_id, material_id, question_text, options, correct_option, explanation, topic, difficulty, source_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    qInsert.run(
      "q-1",
      demoUserId,
      c1Id,
      m1Id,
      "What is the average time complexity for push and pop operations on a standard array-backed stack?",
      JSON.stringify(["O(1)", "O(n)", "O(log n)", "O(n^2)"]),
      0,
      "Push and pop operate exclusively on the top index of the stack, giving constant time O(1) complexity.",
      "Stacks & Queues",
      "easy",
      "curated"
    );

    qInsert.run(
      "q-2",
      demoUserId,
      c1Id,
      m1Id,
      "Which data structure is primarily used to implement Breadth-First Search (BFS) graph traversal?",
      JSON.stringify(["Stack", "Queue", "Priority Queue", "Hash Table"]),
      1,
      "BFS visits vertices level by level, maintaining unvisited adjacent nodes in FIFO order using a Queue.",
      "Graph Algorithms",
      "medium",
      "curated"
    );

    qInsert.run(
      "q-3",
      demoUserId,
      c1Id,
      m1Id,
      "What happens when pop() is called on an empty stack?",
      JSON.stringify(["Stack Overflow", "Stack Underflow", "Memory Allocation Error", "Segmentation Fault"]),
      1,
      "Attempting to remove an item from an already empty data structure causes Stack Underflow.",
      "Stacks & Queues",
      "easy",
      "curated"
    );

    qInsert.run(
      "q-4",
      demoUserId,
      c2Id,
      null,
      "In the pre-colonial Hausa political structure, who was the supreme administrative and judicial ruler of the city-state?",
      JSON.stringify(["The Emir (Sarki)", "The Oba", "The Alaafin", "The Obi"]),
      0,
      "In Hausa-Fulani traditional kingdoms, the Sarki (Emir) served as chief executive and judicial leader.",
      "Pre-colonial Governance",
      "easy",
      "curated"
    );

    const taskInsert = db.prepare(`
      INSERT INTO study_tasks (id, user_id, course_id, title, description, due_date, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    taskInsert.run("t-1", demoUserId, c1Id, "Review Stack/Queue past questions", "Solve 15 practice CBT questions before next Monday", "2026-11-05", 0);
    taskInsert.run("t-2", demoUserId, c2Id, "Read GST 111 Module 2 on Niger Delta cultures", "Summarize key cultural practices and trade alliances", "2026-11-10", 0);
    taskInsert.run("t-3", demoUserId, c1Id, "Prepare for Mid-Semester CBT Mock Exam", "Simulate 30-minute test in the CBT simulator", "2026-11-12", 0);
  }
} catch (err) {
  console.warn("Seed skipped or table error:", err.message);
}

export default db;
