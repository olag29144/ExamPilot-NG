import React, { useEffect, useState } from "react";
import {
  AlertCircle, CalendarDays, Check, CheckCircle2,
  Loader2, Pencil, Plus, Trash2, X
} from "lucide-react";
import { tasks as api, courses as courseApi } from "../lib/api.js";

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
          <div><span className="eyebrow">REVISION PLANNER</span><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BLANK = { title: "", description: "", course_id: "", due_date: "" };
const FILTERS = [
  { key: "all",      label: "All tasks" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue",  label: "Overdue" },
  { key: "completed",label: "Completed" },
];

function isOverdue(task) {
  return !task.is_completed && task.due_date && task.due_date < new Date().toISOString().slice(0, 10);
}

export default function Planner() {
  const [list,    setList]    = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [toast,   setToast]   = useState("");
  const [filter,  setFilter]  = useState("all");
  const [modal,   setModal]   = useState(null);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);

  async function load(f = filter) {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([api.list(f), courseApi.list()]);
      setList(tRes.tasks);
      setCourses(cRes.courses);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter]);

  function openAdd()   { setForm(BLANK); setEditing(null); setModal("add"); }
  function openEdit(t) { setForm({ title: t.title, description: t.description ?? "", course_id: t.course_id ?? "", due_date: t.due_date ?? "" }); setEditing(t); setModal("edit"); }
  function openDel(t)  { setEditing(t); setModal("delete"); }
  function closeModal(){ setModal(null); setEditing(null); setSaving(false); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, course_id: form.course_id || null, due_date: form.due_date || null };
      if (modal === "add") {
        const d = await api.create(payload);
        setList(prev => [d.task, ...prev]);
        setToast("Task added");
      } else {
        const d = await api.update(editing.id, payload);
        setList(prev => prev.map(t => t.id === editing.id ? d.task : t));
        setToast("Task updated");
      }
      closeModal();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function toggleComplete(task) {
    try {
      const d = await api.update(task.id, { is_completed: !task.is_completed });
      setList(prev => prev.map(t => t.id === task.id ? d.task : t));
      setToast(task.is_completed ? "Task marked incomplete" : "Task completed!");
    } catch (e) { setError(e.message); }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.remove(editing.id);
      setList(prev => prev.filter(t => t.id !== editing.id));
      setToast("Task deleted");
      closeModal();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const done  = list.filter(t => t.is_completed).length;
  const total = list.length;

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STAY ORGANISED</span>
          <h1>Revision planner</h1>
          <p>Plan your study sessions, set due dates, and track your progress.</p>
        </div>
        <div className="heading-action">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={17} /> Add task</button>
        </div>
      </div>

      {error && <div className="form-error-banner" role="alert">{error}</div>}

      {/* Summary */}
      <div className="planner-summary">
        <div className="planner-sum-stat">
          <strong>{total}</strong><small>Total tasks</small>
        </div>
        <div className="planner-progress">
          <div className="progress-track">
            <span style={{ width: total ? `${Math.round(done / total * 100)}%` : "0%" }} />
          </div>
        </div>
        <div className="planner-sum-stat">
          <strong>{done}</strong><small>Completed</small>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tab-row" role="tablist">
        {FILTERS.map(f => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            className={`tab-btn${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === "overdue" && list.filter(isOverdue).length > 0 && (
              <span className="badge red" style={{ marginLeft: 6 }}>
                {list.filter(isOverdue).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading"><Loader2 size={24} className="spin" /></div>
      ) : list.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 48 }}>
          <span><CalendarDays size={24} /></span>
          <strong>No tasks here</strong>
          <p>Add a revision task to stay on top of your study plan.</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={openAdd}>
            <Plus size={16} /> Add first task
          </button>
        </div>
      ) : (
        <div className="task-list">
          {list.map(t => {
            const overdue = isOverdue(t);
            return (
              <div key={t.id} className={`task-card${t.is_completed ? " completed" : ""}${overdue ? " overdue" : ""}`}>
                <button
                  className={`task-checkbox${t.is_completed ? " checked" : ""}`}
                  aria-label={t.is_completed ? "Mark incomplete" : "Mark complete"}
                  onClick={() => toggleComplete(t)}
                >
                  {t.is_completed && <Check size={13} />}
                </button>

                <div className="task-body">
                  <strong className="task-title">{t.title}</strong>
                  {t.description && <p className="task-desc">{t.description}</p>}
                  <div className="task-meta">
                    {t.course_title && <span className="course-badge">{t.course_title}</span>}
                    {t.due_date && (
                      <span className={`due-badge${overdue ? " overdue" : ""}`}>
                        {overdue && <AlertCircle size={11} />}
                        {new Date(t.due_date + "T00:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                    {t.is_completed && (
                      <span className="due-badge green"><CheckCircle2 size={11} /> Done</span>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  <button className="icon-button" aria-label="Edit task" onClick={() => openEdit(t)}><Pencil size={15} /></button>
                  <button className="icon-button" aria-label="Delete task" onClick={() => openDel(t)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add revision task" : "Edit task"} onClose={closeModal}>
          <form onSubmit={handleSave} className="modal-form">
            <label>
              Task title *
              <input required autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Revise Week 5 notes" />
            </label>
            <label>
              Description
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
            </label>
            <div className="form-row">
              <label>
                Course
                <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}>
                  <option value="">No course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label>
                Due date
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </label>
            </div>
            <button className="btn btn-primary btn-full" disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : modal === "add" ? "Save task" : "Update task"}
            </button>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {modal === "delete" && (
        <Modal title="Delete task?" onClose={closeModal}>
          <p style={{ fontSize: "12px", color: "#5b6578", marginBottom: "20px", lineHeight: 1.7 }}>
            Delete <strong>{editing?.title}</strong>? This cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : "Yes, delete"}
            </button>
          </div>
        </Modal>
      )}

      <Toast msg={toast} onDone={() => setToast("")} />
    </section>
  );
}
