import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown, ChevronUp, Loader2, Plus, Search, Sparkles, Trash2, X, ListChecks
} from "lucide-react";
import { questions as api, courses as courseApi, materials as matApi } from "../lib/api.js";

function Toast({ msg, onDone }) {
  useEffect(() => { if (msg) { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const esc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-heading">
          <div><span className="eyebrow">QUESTION BANK</span><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const DIFF_LABELS = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFF_COLORS = { easy: "green", medium: "orange", hard: "red" };

function QuestionCard({ q, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="qbank-card">
      <div className="qbank-top">
        <div className="qbank-meta">
          {q.topic && <span className="topic-tag">{q.topic}</span>}
          <span className={`diff-badge ${DIFF_COLORS[q.difficulty]}`}>{DIFF_LABELS[q.difficulty]}</span>
          {q.course_title && <span className="course-badge">{q.course_title}</span>}
        </div>
        <div className="qbank-actions">
          <button className="icon-button" aria-label="Expand" onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button className="icon-button" aria-label="Delete question" onClick={() => onDelete(q.id)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <p className="qbank-text">{q.question_text}</p>
      {expanded && (
        <div className="qbank-detail">
          <ol className="qbank-options">
            {q.options.map((o, i) => (
              <li key={i} className={i === q.correct_option ? "correct-opt" : ""}>{o}</li>
            ))}
          </ol>
          {q.explanation && <p className="qbank-explanation"><strong>Explanation:</strong> {q.explanation}</p>}
        </div>
      )}
    </div>
  );
}

export default function Questions() {
  const [list,      setList]      = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [toast,     setToast]     = useState("");
  const [query,     setQuery]     = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterDiff,   setFilterDiff]   = useState("");
  const [modal,     setModal]     = useState(false);
  const [genForm,   setGenForm]   = useState({ course_id: "", material_id: "", count: 5, difficulty: "medium", topic: "" });
  const [generating, setGenerating] = useState(false);
  const [genError,  setGenError]  = useState("");

  async function load() {
    setLoading(true);
    try {
      const [qRes, cRes, mRes] = await Promise.all([
        api.list({ course_id: filterCourse || undefined, difficulty: filterDiff || undefined, q: query || undefined }),
        courseApi.list(),
        matApi.list()
      ]);
      setList(qRes.questions);
      setCourses(cRes.courses);
      setMaterials(mRes.materials);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterCourse, filterDiff, query]);

  async function handleDelete(id) {
    if (!confirm("Delete this question?")) return;
    try {
      await api.remove(id);
      setList(prev => prev.filter(q => q.id !== id));
      setToast("Question deleted");
    } catch (e) { setError(e.message); }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setGenError("");
    setGenerating(true);
    try {
      const d = await api.generate({
        course_id:   genForm.course_id   || null,
        material_id: genForm.material_id || null,
        count:       Number(genForm.count),
        difficulty:  genForm.difficulty,
        topic:       genForm.topic || ""
      });
      setList(prev => [...d.questions, ...prev]);
      setToast(`Generated ${d.count} question${d.count !== 1 ? "s" : ""}`);
      setModal(false);
      setGenForm({ course_id: "", material_id: "", count: 5, difficulty: "medium", topic: "" });
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR QUESTION BANK</span>
          <h1>Questions</h1>
          <p>Generate and manage practice questions from your study materials.</p>
        </div>
        <div className="heading-action">
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Sparkles size={17} /> Generate questions
          </button>
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="filter-row">
        <div className="search-box wide">
          <Search size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search questions or topics…" aria-label="Search questions" />
        </div>
        <select className="filter-select" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} aria-label="Filter by course">
          <option value="">All courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select className="filter-select" value={filterDiff} onChange={e => setFilterDiff(e.target.value)} aria-label="Filter by difficulty">
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <span className="muted">{list.length} question{list.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="page-loading"><Loader2 size={24} className="spin" /></div>
      ) : list.length ? (
        <div className="qbank-list">
          {list.map(q => <QuestionCard key={q.id} q={q} onDelete={handleDelete} />)}
        </div>
      ) : (
        <div className="empty-state" style={{ paddingTop: "60px" }}>
          <span><ListChecks size={23} /></span>
          <strong>No questions yet</strong>
          <p>Generate practice questions from your study materials using AI.</p>
          <button className="btn btn-primary" style={{ marginTop: "12px" }} onClick={() => setModal(true)}>
            <Sparkles size={16} /> Generate questions
          </button>
        </div>
      )}

      {/* CBT link */}
      {list.length > 0 && (
        <div className="qbank-cbt-prompt">
          <ListChecks size={17} />
          <span>You have {list.length} question{list.length !== 1 ? "s" : ""} ready for practice.</span>
          <Link className="btn btn-primary btn-sm" to="/cbt">Start CBT practice →</Link>
        </div>
      )}

      {/* Generate modal */}
      {modal && (
        <Modal title="Generate practice questions" onClose={() => { setModal(false); setGenError(""); }}>
          {genError && <div className="form-error-banner">{genError}</div>}
          <form onSubmit={handleGenerate} className="modal-form">
            <label>
              Course (optional)
              <select value={genForm.course_id} onChange={e => setGenForm(f => ({ ...f, course_id: e.target.value, material_id: "" }))}>
                <option value="">No specific course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label>
              Study material (optional, recommended)
              <select value={genForm.material_id} onChange={e => setGenForm(f => ({ ...f, material_id: e.target.value }))}>
                <option value="">No material (general topic)</option>
                {materials
                  .filter(m => !genForm.course_id || m.course_id === genForm.course_id)
                  .map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </label>
            <div className="form-row">
              <label>
                Number of questions
                <input
                  type="number"
                  min={1} max={20}
                  value={genForm.count}
                  onChange={e => setGenForm(f => ({ ...f, count: e.target.value }))}
                />
              </label>
              <label>
                Difficulty
                <select value={genForm.difficulty} onChange={e => setGenForm(f => ({ ...f, difficulty: e.target.value }))}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>
            <label>
              Topic / focus area (optional)
              <input
                value={genForm.topic}
                onChange={e => setGenForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="e.g. Data structures, Integration by parts…"
              />
            </label>
            <p style={{ fontSize: "10px", color: "#8c97a5", lineHeight: 1.7 }}>
              Generated questions are saved to your question bank and can be used in CBT practice.
              They are practice questions only — not official or leaked exam questions.
            </p>
            <button className="btn btn-primary btn-full" disabled={generating}>
              {generating ? <><Loader2 size={15} className="spin" /> Generating…</> : <><Sparkles size={15} /> Generate questions</>}
            </button>
          </form>
        </Modal>
      )}

      <Toast msg={toast} onDone={() => setToast("")} />
    </section>
  );
}
