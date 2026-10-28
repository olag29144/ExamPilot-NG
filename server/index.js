import "dotenv/config";
import express from "express";
import session from "express-session";
import cors from "cors";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { z } from "zod";
import db from "./db.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const SQLiteStore = require("connect-sqlite3")(session);

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true
}));

const sessionStore = new SQLiteStore({ dir: "./data", db: "sessions.db" });

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "change-this-in-production-" + Math.random(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });

// ── File upload (memory, text files only) ────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ["text/plain", "text/markdown", "text/x-markdown"];
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ["txt", "md"].includes(ext)) cb(null, true);
    else cb(new Error("Only .txt and .md files are supported."));
  }
});

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: "Sign in to continue." });
  next();
}

function getUser(req) {
  return db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?").get(req.session.userId);
}

// ── Validation helpers ────────────────────────────────────────────────────────
function validationError(res, issues) {
  return res.status(422).json({ error: issues[0]?.message || "Validation failed.", issues });
}

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "ExamPilot NG API" }));

// ════════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════════
app.post("/api/auth/register", authLimiter, async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100).trim(),
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8).max(128)
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { name, email, password } = result.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with that email already exists." });

  const password_hash = await bcrypt.hash(password, 12);
  const id = uuidv4();
  db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(id, name, email, password_hash);
  req.session.userId = id;
  return res.status(201).json({ user: { id, name, email } });
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1).max(128)
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { email, password } = result.data;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Invalid email or password." });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password." });

  req.session.userId = user.id;
  return res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Session expired." });
  res.json({ user });
});

app.patch("/api/auth/profile", requireAuth, async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(128).optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { name, currentPassword, newPassword } = result.data;

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  let updates = [];
  let params = [];

  if (name) { updates.push("name = ?"); params.push(name); }

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: "Current password is required to set a new one." });
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect." });
    const hash = await bcrypt.hash(newPassword, 12);
    updates.push("password_hash = ?"); params.push(hash);
  }

  if (!updates.length) return res.status(400).json({ error: "Nothing to update." });
  updates.push("updated_at = datetime('now')");
  params.push(req.session.userId);
  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  const updated = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.session.userId);
  res.json({ user: updated });
});

// ════════════════════════════════════════════════════════════════════════════════
// COURSES
// ════════════════════════════════════════════════════════════════════════════════
const COLORS = ["blue", "teal", "orange", "purple", "pink"];

app.get("/api/courses", requireAuth, (req, res) => {
  const courses = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM study_materials m WHERE m.course_id = c.id) AS material_count,
      (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) AS question_count,
      (SELECT COUNT(*) FROM exam_attempts a WHERE a.course_id = c.id AND a.status = 'submitted') AS attempt_count
    FROM courses c WHERE c.user_id = ? ORDER BY c.created_at DESC
  `).all(req.session.userId);
  res.json({ courses });
});

app.post("/api/courses", requireAuth, (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(200).trim(),
    course_code: z.string().max(30).trim().optional().default(""),
    description: z.string().max(1000).trim().optional().default(""),
    semester: z.string().max(50).trim().optional().default(""),
    academic_level: z.string().max(50).trim().optional().default("")
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { title, course_code, description, semester, academic_level } = result.data;
  const count = db.prepare("SELECT COUNT(*) as c FROM courses WHERE user_id = ?").get(req.session.userId).c;
  const color = COLORS[count % COLORS.length];
  const id = uuidv4();
  db.prepare("INSERT INTO courses (id, user_id, title, course_code, description, semester, academic_level, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, req.session.userId, title, course_code, description, semester, academic_level, color);
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(id);
  res.status(201).json({ course: { ...course, material_count: 0, question_count: 0, attempt_count: 0 } });
});

app.get("/api/courses/:id", requireAuth, (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!course) return res.status(404).json({ error: "Course not found." });
  res.json({ course });
});

app.patch("/api/courses/:id", requireAuth, (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!course) return res.status(404).json({ error: "Course not found." });
  const schema = z.object({
    title: z.string().min(1).max(200).trim().optional(),
    course_code: z.string().max(30).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    semester: z.string().max(50).trim().optional(),
    academic_level: z.string().max(50).trim().optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const fields = result.data;
  const updates = Object.keys(fields).map(k => `${k} = ?`);
  const vals = Object.values(fields);
  if (!updates.length) return res.status(400).json({ error: "Nothing to update." });
  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE courses SET ${updates.join(", ")} WHERE id = ?`).run(...vals, req.params.id);
  res.json({ course: db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id) });
});

app.delete("/api/courses/:id", requireAuth, (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!course) return res.status(404).json({ error: "Course not found." });
  db.prepare("DELETE FROM courses WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════════════
// STUDY MATERIALS
// ════════════════════════════════════════════════════════════════════════════════
app.get("/api/materials", requireAuth, (req, res) => {
  const { course_id, q } = req.query;
  let sql = `SELECT m.*, c.title AS course_title, c.color AS course_color
    FROM study_materials m LEFT JOIN courses c ON m.course_id = c.id
    WHERE m.user_id = ?`;
  const params = [req.session.userId];
  if (course_id) { sql += " AND m.course_id = ?"; params.push(course_id); }
  if (q) { sql += " AND (m.title LIKE ? OR m.content_text LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
  sql += " ORDER BY m.updated_at DESC";
  res.json({ materials: db.prepare(sql).all(...params) });
});

app.post("/api/materials", requireAuth, (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(300).trim(),
    content_text: z.string().max(100000).default(""),
    course_id: z.string().uuid().nullable().optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { title, content_text, course_id } = result.data;
  if (course_id) {
    const c = db.prepare("SELECT id FROM courses WHERE id = ? AND user_id = ?").get(course_id, req.session.userId);
    if (!c) return res.status(400).json({ error: "Course not found." });
  }
  const id = uuidv4();
  db.prepare("INSERT INTO study_materials (id, user_id, course_id, title, content_text) VALUES (?, ?, ?, ?, ?)")
    .run(id, req.session.userId, course_id || null, title, content_text);
  const material = db.prepare(`SELECT m.*, c.title AS course_title FROM study_materials m LEFT JOIN courses c ON m.course_id = c.id WHERE m.id = ?`).get(id);
  res.status(201).json({ material });
});

app.post("/api/materials/upload", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided." });
  const content_text = req.file.buffer.toString("utf8");
  if (content_text.length > 100000) return res.status(400).json({ error: "File content is too large (max 100,000 characters)." });
  const title = req.body.title?.trim() || req.file.originalname.replace(/\.[^.]+$/, "");
  const course_id = req.body.course_id || null;
  if (course_id) {
    const c = db.prepare("SELECT id FROM courses WHERE id = ? AND user_id = ?").get(course_id, req.session.userId);
    if (!c) return res.status(400).json({ error: "Course not found." });
  }
  const id = uuidv4();
  db.prepare("INSERT INTO study_materials (id, user_id, course_id, title, content_text, source_filename) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, req.session.userId, course_id, title, content_text, req.file.originalname);
  const material = db.prepare(`SELECT m.*, c.title AS course_title FROM study_materials m LEFT JOIN courses c ON m.course_id = c.id WHERE m.id = ?`).get(id);
  res.status(201).json({ material });
});

app.get("/api/materials/:id", requireAuth, (req, res) => {
  const m = db.prepare(`SELECT m.*, c.title AS course_title FROM study_materials m LEFT JOIN courses c ON m.course_id = c.id WHERE m.id = ? AND m.user_id = ?`).get(req.params.id, req.session.userId);
  if (!m) return res.status(404).json({ error: "Material not found." });
  res.json({ material: m });
});

app.patch("/api/materials/:id", requireAuth, (req, res) => {
  const m = db.prepare("SELECT * FROM study_materials WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!m) return res.status(404).json({ error: "Material not found." });
  const schema = z.object({
    title: z.string().min(1).max(300).trim().optional(),
    content_text: z.string().max(100000).optional(),
    course_id: z.string().uuid().nullable().optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const fields = result.data;
  const updates = Object.keys(fields).map(k => `${k} = ?`);
  const vals = Object.values(fields);
  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE study_materials SET ${updates.join(", ")} WHERE id = ?`).run(...vals, req.params.id);
  const updated = db.prepare(`SELECT m.*, c.title AS course_title FROM study_materials m LEFT JOIN courses c ON m.course_id = c.id WHERE m.id = ?`).get(req.params.id);
  res.json({ material: updated });
});

app.delete("/api/materials/:id", requireAuth, (req, res) => {
  const m = db.prepare("SELECT * FROM study_materials WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!m) return res.status(404).json({ error: "Material not found." });
  db.prepare("DELETE FROM study_materials WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════════════
// AI ASSISTANT
// ════════════════════════════════════════════════════════════════════════════════
app.get("/api/conversations", requireAuth, (req, res) => {
  const convs = db.prepare(`SELECT c.*, mat.title AS material_title, cou.title AS course_title
    FROM ai_conversations c
    LEFT JOIN study_materials mat ON c.material_id = mat.id
    LEFT JOIN courses cou ON c.course_id = cou.id
    WHERE c.user_id = ? ORDER BY c.updated_at DESC LIMIT 50`).all(req.session.userId);
  res.json({ conversations: convs });
});

app.post("/api/conversations", requireAuth, (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(200).trim().optional().default("Study session"),
    material_id: z.string().uuid().nullable().optional(),
    course_id: z.string().uuid().nullable().optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { title, material_id, course_id } = result.data;
  const id = uuidv4();
  db.prepare("INSERT INTO ai_conversations (id, user_id, material_id, course_id, title) VALUES (?, ?, ?, ?, ?)")
    .run(id, req.session.userId, material_id || null, course_id || null, title);
  res.status(201).json({ conversation: db.prepare("SELECT * FROM ai_conversations WHERE id = ?").get(id) });
});

app.get("/api/conversations/:id/messages", requireAuth, (req, res) => {
  const conv = db.prepare("SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!conv) return res.status(404).json({ error: "Conversation not found." });
  const messages = db.prepare("SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json({ messages });
});

app.post("/api/conversations/:id/ask", requireAuth, aiLimiter, async (req, res) => {
  const conv = db.prepare("SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!conv) return res.status(404).json({ error: "Conversation not found." });

  const schema = z.object({ question: z.string().min(1).max(6000).trim() });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { question } = result.data;

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI is not configured. Add AI_API_KEY to the server .env file." });

  let contextText = "";
  if (conv.material_id) {
    const mat = db.prepare("SELECT title, content_text FROM study_materials WHERE id = ? AND user_id = ?").get(conv.material_id, req.session.userId);
    if (mat) contextText = `\n\nStudy material context — "${mat.title}":\n${mat.content_text.slice(0, 8000)}`;
  }

  const history = db.prepare("SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC").all(req.params.id).slice(-12);
  const userMsgId = uuidv4();
  db.prepare("INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)").run(userMsgId, req.params.id, question);

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: `You are ExamPilot NG, a patient study assistant for Nigerian university students. Explain ideas clearly and concisely. Use short headings when organising longer answers. Support exam preparation without claiming to know official questions. Encourage students to verify important facts with their lecturers.${contextText}`
          },
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: question }
        ]
      }),
      signal: AbortSignal.timeout(45000)
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = payload?.error?.message || `AI provider returned status ${upstream.status}.`;
      db.prepare("DELETE FROM ai_messages WHERE id = ?").run(userMsgId);
      return res.status(502).json({ error: message });
    }
    const answer = payload?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      db.prepare("DELETE FROM ai_messages WHERE id = ?").run(userMsgId);
      return res.status(502).json({ error: "The AI provider returned an empty response." });
    }
    const assistantId = uuidv4();
    db.prepare("INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, 'assistant', ?)").run(assistantId, req.params.id, answer.trim());
    db.prepare("UPDATE ai_conversations SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    return res.json({ answer: answer.trim(), messageId: assistantId });
  } catch (err) {
    db.prepare("DELETE FROM ai_messages WHERE id = ?").run(userMsgId);
    return res.status(502).json({ error: "Could not reach the AI provider. Please try again shortly." });
  }
});

app.patch("/api/messages/:id/save", requireAuth, (req, res) => {
  const msg = db.prepare(`SELECT m.* FROM ai_messages m JOIN ai_conversations c ON m.conversation_id = c.id WHERE m.id = ? AND c.user_id = ?`).get(req.params.id, req.session.userId);
  if (!msg) return res.status(404).json({ error: "Message not found." });
  db.prepare("UPDATE ai_messages SET is_saved = ? WHERE id = ?").run(msg.is_saved ? 0 : 1, req.params.id);
  res.json({ saved: !msg.is_saved });
});

// ════════════════════════════════════════════════════════════════════════════════
// QUESTION GENERATION + BANK
// ════════════════════════════════════════════════════════════════════════════════
app.get("/api/questions", requireAuth, (req, res) => {
  const { course_id, difficulty, q } = req.query;
  let sql = `SELECT qu.*, c.title AS course_title FROM questions qu LEFT JOIN courses c ON qu.course_id = c.id WHERE qu.user_id = ?`;
  const params = [req.session.userId];
  if (course_id) { sql += " AND qu.course_id = ?"; params.push(course_id); }
  if (difficulty) { sql += " AND qu.difficulty = ?"; params.push(difficulty); }
  if (q) { sql += " AND (qu.question_text LIKE ? OR qu.topic LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
  sql += " ORDER BY qu.created_at DESC";
  const rows = db.prepare(sql).all(...params);
  const questions = rows.map(r => ({ ...r, options: JSON.parse(r.options) }));
  res.json({ questions });
});

app.post("/api/questions/generate", requireAuth, aiLimiter, async (req, res) => {
  const schema = z.object({
    course_id: z.string().uuid().nullable().optional(),
    material_id: z.string().uuid().nullable().optional(),
    count: z.number().int().min(1).max(20).default(5),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    topic: z.string().max(200).trim().optional().default("")
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { course_id, material_id, count, difficulty, topic } = result.data;

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI is not configured. Add AI_API_KEY to your server .env file." });

  let context = "";
  if (material_id) {
    const mat = db.prepare("SELECT title, content_text FROM study_materials WHERE id = ? AND user_id = ?").get(material_id, req.session.userId);
    if (mat) context = `\n\nBase the questions on this study material titled "${mat.title}":\n${mat.content_text.slice(0, 8000)}`;
  }
  if (course_id && !context) {
    const course = db.prepare("SELECT title FROM courses WHERE id = ? AND user_id = ?").get(course_id, req.session.userId);
    if (course) context = `\n\nGenerate questions relevant to a Nigerian university course called "${course.title}".`;
  }

  const topicHint = topic ? ` Focus on the topic: ${topic}.` : "";
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const systemPrompt = `You are an exam question generator for Nigerian university students. Generate exactly ${count} multiple-choice practice questions at ${difficulty} difficulty.${topicHint}${context}

Return ONLY a valid JSON array with this exact schema, no markdown, no extra text:
[
  {
    "question_text": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "correct_option": 0,
    "explanation": "...",
    "topic": "..."
  }
]
Rules:
- correct_option is 0-indexed (0=A, 1=B, 2=C, 3=D)
- Each question has exactly 4 options
- explanation must be honest and grounded in the material
- Never claim these are official or leaked exam questions`;

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 3000,
        messages: [{ role: "user", content: systemPrompt }]
      }),
      signal: AbortSignal.timeout(60000)
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(502).json({ error: payload?.error?.message || "AI provider error." });

    const raw = payload?.choices?.[0]?.message?.content || "";
    let parsed;
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found in response.");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(502).json({ error: "AI returned malformed question data. Please try again." });
    }

    const qSchema = z.array(z.object({
      question_text: z.string().min(5),
      options: z.array(z.string()).length(4),
      correct_option: z.number().int().min(0).max(3),
      explanation: z.string(),
      topic: z.string().optional().default("")
    }));
    const validated = qSchema.safeParse(parsed);
    if (!validated.success) return res.status(502).json({ error: "AI returned invalid question schema. Please try again." });

    const saved = [];
    const insert = db.prepare("INSERT INTO questions (id, user_id, course_id, material_id, question_text, options, correct_option, explanation, topic, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const q of validated.data) {
      const id = uuidv4();
      insert.run(id, req.session.userId, course_id || null, material_id || null, q.question_text, JSON.stringify(q.options), q.correct_option, q.explanation, q.topic || "", difficulty);
      saved.push({ id, ...q, options: q.options, difficulty, course_id: course_id || null, material_id: material_id || null });
    }
    res.json({ questions: saved, count: saved.length });
  } catch (err) {
    return res.status(502).json({ error: "Could not reach the AI provider. Please try again shortly." });
  }
});

app.delete("/api/questions/:id", requireAuth, (req, res) => {
  const q = db.prepare("SELECT * FROM questions WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!q) return res.status(404).json({ error: "Question not found." });
  db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════════════
// CBT ATTEMPTS
// ════════════════════════════════════════════════════════════════════════════════
app.post("/api/attempts", requireAuth, (req, res) => {
  const schema = z.object({
    course_id: z.string().uuid().nullable().optional(),
    question_ids: z.array(z.string().uuid()).min(1).max(100),
    duration_minutes: z.number().int().min(1).max(180).default(30)
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { course_id, question_ids, duration_minutes } = result.data;

  const owned = db.prepare(`SELECT id FROM questions WHERE id IN (${question_ids.map(() => "?").join(",")}) AND user_id = ?`).all(...question_ids, req.session.userId);
  if (owned.length !== question_ids.length) return res.status(400).json({ error: "Some questions were not found or do not belong to you." });

  const existingActive = db.prepare("SELECT id FROM exam_attempts WHERE user_id = ? AND status = 'in_progress'").get(req.session.userId);
  if (existingActive) return res.status(409).json({ error: "You have an active attempt. Submit or wait for it to expire first.", attemptId: existingActive.id });

  const id = uuidv4();
  const expiresAt = new Date(Date.now() + duration_minutes * 60 * 1000).toISOString();
  db.prepare("INSERT INTO exam_attempts (id, user_id, course_id, total_questions, question_ids, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, req.session.userId, course_id || null, question_ids.length, JSON.stringify(question_ids), expiresAt);

  const initAnswer = db.prepare("INSERT INTO attempt_answers (id, attempt_id, question_id) VALUES (?, ?, ?)");
  for (const qid of question_ids) initAnswer.run(uuidv4(), id, qid);

  const questions = db.prepare(`SELECT id, question_text, options, topic, difficulty FROM questions WHERE id IN (${question_ids.map(() => "?").join(",")})`)
    .all(...question_ids)
    .map(q => ({ ...q, options: JSON.parse(q.options) }));

  const ordered = question_ids.map(qid => questions.find(q => q.id === qid)).filter(Boolean);

  res.status(201).json({
    attempt: { id, expires_at: expiresAt, total_questions: question_ids.length, status: "in_progress" },
    questions: ordered
  });
});

app.get("/api/attempts/active", requireAuth, (req, res) => {
  const attempt = db.prepare("SELECT * FROM exam_attempts WHERE user_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1").get(req.session.userId);
  if (!attempt) return res.json({ attempt: null });

  if (new Date(attempt.expires_at) < new Date()) {
    finaliseAttempt(attempt.id);
    return res.json({ attempt: null });
  }

  const question_ids = JSON.parse(attempt.question_ids);
  const answers = db.prepare("SELECT question_id, selected_option FROM attempt_answers WHERE attempt_id = ?").all(attempt.id);
  const questions = db.prepare(`SELECT id, question_text, options, topic, difficulty FROM questions WHERE id IN (${question_ids.map(() => "?").join(",")})`)
    .all(...question_ids).map(q => ({ ...q, options: JSON.parse(q.options) }));
  const ordered = question_ids.map(qid => questions.find(q => q.id === qid)).filter(Boolean);

  res.json({ attempt, questions: ordered, answers });
});

app.patch("/api/attempts/:id/answer", requireAuth, (req, res) => {
  const attempt = db.prepare("SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!attempt) return res.status(404).json({ error: "Attempt not found." });
  if (attempt.status !== "in_progress") return res.status(400).json({ error: "This attempt is no longer active." });
  if (new Date(attempt.expires_at) < new Date()) {
    finaliseAttempt(attempt.id);
    return res.status(400).json({ error: "Time expired. Attempt has been submitted." });
  }
  const schema = z.object({ question_id: z.string().uuid(), selected_option: z.number().int().min(0).max(3) });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { question_id, selected_option } = result.data;
  const aa = db.prepare("SELECT * FROM attempt_answers WHERE attempt_id = ? AND question_id = ?").get(attempt.id, question_id);
  if (!aa) return res.status(400).json({ error: "Question not part of this attempt." });
  db.prepare("UPDATE attempt_answers SET selected_option = ? WHERE attempt_id = ? AND question_id = ?").run(selected_option, attempt.id, question_id);
  res.json({ ok: true });
});

app.post("/api/attempts/:id/submit", requireAuth, (req, res) => {
  const attempt = db.prepare("SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!attempt) return res.status(404).json({ error: "Attempt not found." });
  if (attempt.status === "submitted") return res.json({ alreadySubmitted: true, attemptId: attempt.id });
  if (attempt.status !== "in_progress") return res.status(400).json({ error: "Attempt cannot be submitted." });
  const summary = finaliseAttempt(attempt.id);
  res.json(summary);
});

function finaliseAttempt(attemptId) {
  const attempt = db.prepare("SELECT * FROM exam_attempts WHERE id = ?").get(attemptId);
  if (!attempt || attempt.status !== "in_progress") return { ok: true };
  const answers = db.prepare("SELECT aa.*, q.correct_option FROM attempt_answers aa JOIN questions q ON aa.question_id = q.id WHERE aa.attempt_id = ?").all(attemptId);
  let correct = 0;
  const update = db.prepare("UPDATE attempt_answers SET is_correct = ? WHERE id = ?");
  for (const a of answers) {
    const isCorrect = a.selected_option !== null && a.selected_option === a.correct_option ? 1 : 0;
    if (isCorrect) correct++;
    update.run(isCorrect, a.id);
  }
  const scorePercent = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const started = new Date(attempt.started_at);
  const now = new Date();
  const durationSeconds = Math.round((now - started) / 1000);
  db.prepare(`UPDATE exam_attempts SET status = 'submitted', submitted_at = datetime('now'), correct_count = ?, score_percent = ?, duration_seconds = ? WHERE id = ?`)
    .run(correct, scorePercent, durationSeconds, attemptId);
  return { ok: true, score_percent: scorePercent, correct_count: correct, total: answers.length };
}

app.get("/api/attempts/:id/result", requireAuth, (req, res) => {
  const attempt = db.prepare("SELECT * FROM exam_attempts WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!attempt) return res.status(404).json({ error: "Attempt not found." });
  if (attempt.status === "in_progress") return res.status(400).json({ error: "Attempt is still in progress." });

  const question_ids = JSON.parse(attempt.question_ids);
  const answers = db.prepare(`
    SELECT aa.question_id, aa.selected_option, aa.is_correct,
           q.question_text, q.options, q.correct_option, q.explanation, q.topic, q.difficulty
    FROM attempt_answers aa JOIN questions q ON aa.question_id = q.id
    WHERE aa.attempt_id = ?`).all(attempt.id);

  const ordered = question_ids.map(qid => {
    const a = answers.find(x => x.question_id === qid);
    if (!a) return null;
    return { ...a, options: JSON.parse(a.options) };
  }).filter(Boolean);

  const topicMap = {};
  for (const a of ordered) {
    if (!a.topic) continue;
    if (!topicMap[a.topic]) topicMap[a.topic] = { correct: 0, total: 0 };
    topicMap[a.topic].total++;
    if (a.is_correct) topicMap[a.topic].correct++;
  }
  const topicStats = Object.entries(topicMap).map(([topic, s]) => ({ topic, ...s, percent: Math.round(s.correct / s.total * 100) }));

  res.json({ attempt, answers: ordered, topic_stats: topicStats });
});

app.get("/api/attempts", requireAuth, (req, res) => {
  const attempts = db.prepare(`SELECT a.*, c.title AS course_title FROM exam_attempts a LEFT JOIN courses c ON a.course_id = c.id WHERE a.user_id = ? AND a.status = 'submitted' ORDER BY a.submitted_at DESC`).all(req.session.userId);
  res.json({ attempts });
});

// ════════════════════════════════════════════════════════════════════════════════
// PLANNER
// ════════════════════════════════════════════════════════════════════════════════
app.get("/api/tasks", requireAuth, (req, res) => {
  const { filter } = req.query;
  let sql = `SELECT t.*, c.title AS course_title FROM study_tasks t LEFT JOIN courses c ON t.course_id = c.id WHERE t.user_id = ?`;
  if (filter === "upcoming") sql += " AND t.is_completed = 0";
  else if (filter === "completed") sql += " AND t.is_completed = 1";
  else if (filter === "overdue") sql += " AND t.is_completed = 0 AND t.due_date < date('now')";
  sql += " ORDER BY t.due_date ASC, t.created_at DESC";
  res.json({ tasks: db.prepare(sql).all(req.session.userId) });
});

app.post("/api/tasks", requireAuth, (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(300).trim(),
    description: z.string().max(1000).trim().optional().default(""),
    course_id: z.string().uuid().nullable().optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const { title, description, course_id, due_date } = result.data;
  const id = uuidv4();
  db.prepare("INSERT INTO study_tasks (id, user_id, course_id, title, description, due_date) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, req.session.userId, course_id || null, title, description, due_date || null);
  const task = db.prepare(`SELECT t.*, c.title AS course_title FROM study_tasks t LEFT JOIN courses c ON t.course_id = c.id WHERE t.id = ?`).get(id);
  res.status(201).json({ task });
});

app.patch("/api/tasks/:id", requireAuth, (req, res) => {
  const task = db.prepare("SELECT * FROM study_tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!task) return res.status(404).json({ error: "Task not found." });
  const schema = z.object({
    title: z.string().min(1).max(300).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    course_id: z.string().uuid().nullable().optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    is_completed: z.boolean().optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error.issues);
  const fields = result.data;
  if (typeof fields.is_completed === "boolean") fields.is_completed = fields.is_completed ? 1 : 0;
  const updates = Object.keys(fields).map(k => `${k} = ?`);
  const vals = Object.values(fields);
  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE study_tasks SET ${updates.join(", ")} WHERE id = ?`).run(...vals, req.params.id);
  const updated = db.prepare(`SELECT t.*, c.title AS course_title FROM study_tasks t LEFT JOIN courses c ON t.course_id = c.id WHERE t.id = ?`).get(req.params.id);
  res.json({ task: updated });
});

app.delete("/api/tasks/:id", requireAuth, (req, res) => {
  const task = db.prepare("SELECT * FROM study_tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.session.userId);
  if (!task) return res.status(404).json({ error: "Task not found." });
  db.prepare("DELETE FROM study_tasks WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════════════
// PERFORMANCE / DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
app.get("/api/performance", requireAuth, (req, res) => {
  const uid = req.session.userId;
  const attempts = db.prepare(`SELECT a.*, c.title AS course_title FROM exam_attempts a LEFT JOIN courses c ON a.course_id = c.id WHERE a.user_id = ? AND a.status = 'submitted' ORDER BY a.submitted_at DESC`).all(uid);
  const courseCount = db.prepare("SELECT COUNT(*) AS c FROM courses WHERE user_id = ?").get(uid).c;
  const materialCount = db.prepare("SELECT COUNT(*) AS c FROM study_materials WHERE user_id = ?").get(uid).c;
  const taskStats = db.prepare("SELECT COUNT(*) AS total, SUM(is_completed) AS completed FROM study_tasks WHERE user_id = ?").get(uid);
  const questionCount = db.prepare("SELECT COUNT(*) AS c FROM questions WHERE user_id = ?").get(uid).c;

  const average = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score_percent, 0) / attempts.length) : null;

  const weakTopics = [];
  if (attempts.length >= 2) {
    const topicRows = db.prepare(`
      SELECT q.topic, SUM(aa.is_correct) AS correct, COUNT(*) AS total
      FROM attempt_answers aa
      JOIN questions q ON aa.question_id = q.id
      JOIN exam_attempts a ON aa.attempt_id = a.id
      WHERE a.user_id = ? AND a.status = 'submitted' AND q.topic IS NOT NULL AND q.topic != ''
      GROUP BY q.topic HAVING total >= 2`).all(uid);
    for (const t of topicRows) {
      const pct = Math.round(t.correct / t.total * 100);
      if (pct < 60) weakTopics.push({ topic: t.topic, percent: pct, total: t.total });
    }
    weakTopics.sort((a, b) => a.percent - b.percent);
  }

  res.json({
    course_count: courseCount,
    material_count: materialCount,
    question_count: questionCount,
    attempt_count: attempts.length,
    average_score: average,
    task_total: taskStats.total,
    task_completed: taskStats.completed || 0,
    attempts,
    weak_topics: weakTopics.slice(0, 5)
  });
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  const uid = req.session.userId;
  const courses = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM study_materials m WHERE m.course_id = c.id) AS material_count FROM courses WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`).all(uid);
  const recentAttempts = db.prepare(`SELECT a.*, c.title AS course_title FROM exam_attempts a LEFT JOIN courses c ON a.course_id = c.id WHERE a.user_id = ? AND a.status = 'submitted' ORDER BY a.submitted_at DESC LIMIT 5`).all(uid);
  const pendingTasks = db.prepare(`SELECT t.*, c.title AS course_title FROM study_tasks t LEFT JOIN courses c ON t.course_id = c.id WHERE t.user_id = ? AND t.is_completed = 0 ORDER BY t.due_date ASC, t.created_at DESC LIMIT 5`).all(uid);
  const counts = {
    courses: db.prepare("SELECT COUNT(*) AS c FROM courses WHERE user_id = ?").get(uid).c,
    materials: db.prepare("SELECT COUNT(*) AS c FROM study_materials WHERE user_id = ?").get(uid).c,
    attempts: db.prepare("SELECT COUNT(*) AS c FROM exam_attempts WHERE user_id = ? AND status = 'submitted'").get(uid).c,
    tasks_total: db.prepare("SELECT COUNT(*) AS c FROM study_tasks WHERE user_id = ?").get(uid).c,
    tasks_done: db.prepare("SELECT COUNT(*) AS c FROM study_tasks WHERE user_id = ? AND is_completed = 1").get(uid).c
  };
  const allAttempts = db.prepare("SELECT score_percent FROM exam_attempts WHERE user_id = ? AND status = 'submitted'").all(uid);
  counts.average = allAttempts.length ? Math.round(allAttempts.reduce((s, a) => s + a.score_percent, 0) / allAttempts.length) : null;
  res.json({ courses, recent_attempts: recentAttempts, pending_tasks: pendingTasks, counts });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File is too large. Maximum size is 1 MB." });
  console.error(err?.message || err);
  res.status(500).json({ error: "An unexpected error occurred." });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, "0.0.0.0", () => console.log(`ExamPilot API listening on http://localhost:${port}`));
