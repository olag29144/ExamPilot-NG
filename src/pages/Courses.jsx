import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Loader2, Plus, Pencil, Trash2, X } from "lucide-react";
import { courses as api } from "../lib/api.js";

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
          <div><span className="eyebrow">YOUR WORKSPACE</span><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BLANK = { title: "", course_code: "", description: "", semester: "", academic_level: "" };

export default function Courses() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [toast,   setToast]   = useState("");
  const [modal,   setModal]   = useState(null); // "add" | "edit" | "delete"
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);

  const load = () => api.list()
    .then(d => setList(d.courses))
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  function openAdd()  { setForm(BLANK); setEditing(null); setModal("add"); }
  function openEdit(c){ setForm({ title: c.title, course_code: c.course_code ?? "", description: c.description ?? "", semester: c.semester ?? "", academic_level: c.academic_level ?? "" }); setEditing(c); setModal("edit"); }
  function openDel(c) { setEditing(c); setModal("delete"); }
  function closeModal(){ setModal(null); setEditing(null); setSaving(false); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "add") {
        const d = await api.create(form);
        setList(prev => [d.course, ...prev]);
        setToast("Course added");
      } else {
        const d = await api.update(editing.id, form);
        setList(prev => prev.map(c => c.id === editing.id ? d.course : c));
        setToast("Course updated");
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.remove(editing.id);
      setList(prev => prev.filter(c => c.id !== editing.id));
      setToast("Course deleted");
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading"><Loader2 size={28} className="spin" /></div>;

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR LEARNING LIBRARY</span>
          <h1>My courses</h1>
          <p>Keep your semester organised, one course at a time.</p>
        </div>
        <div className="heading-action">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={17} /> Add course</button>
        </div>
      </div>

      {error && <div className="form-error-banner" role="alert">{error}</div>}

      <div className="course-grid">
        {list.map(c => (
          <article className="course-card" key={c.id}>
            <div className={`course-art ${c.color}`}>
              <BookOpen size={28} />
              <span>{c.course_code || "—"}</span>
            </div>
            <div className="course-card-body">
              <span className="eyebrow">{c.course_code || "No code"}</span>
              <h3>{c.title}</h3>
              <p>
                {c.material_count} material{c.material_count !== 1 ? "s" : ""}
                &nbsp;·&nbsp;
                {c.attempt_count} attempt{c.attempt_count !== 1 ? "s" : ""}
              </p>
              {c.semester && <p style={{ margin: "0 0 8px", color: "#8c97a5", fontSize: "10px" }}>{c.semester}{c.academic_level ? ` · ${c.academic_level}` : ""}</p>}
              {c.description && <p style={{ margin: "0 0 14px", color: "#8c97a5", fontSize: "10px", lineHeight: 1.6 }}>{c.description}</p>}
              <div className="course-card-actions">
                <button className="text-button" onClick={() => openEdit(c)}><Pencil size={14} /> Edit</button>
                <button className="text-button danger" onClick={() => openDel(c)}><Trash2 size={14} /> Delete</button>
              </div>
              <Link className="text-button" to={`/materials?course_id=${c.id}`}>
                View materials <ArrowRight size={15} />
              </Link>
            </div>
          </article>
        ))}
        <button className="add-course-card" onClick={openAdd}>
          <span><Plus size={23} /></span>
          <strong>Add another course</strong>
          <small>Build your personal study library</small>
        </button>
      </div>

      {/* Add / Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add a course" : "Edit course"} onClose={closeModal}>
          <form onSubmit={handleSave} className="modal-form">
            <label>
              Course name *
              <input required autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Biology" />
            </label>
            <label>
              Course code
              <input value={form.course_code} onChange={e => setForm(f => ({ ...f, course_code: e.target.value }))} placeholder="e.g. BIO 101" />
            </label>
            <label>
              Description
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes about this course" />
            </label>
            <div className="form-row">
              <label>
                Semester
                <input value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} placeholder="e.g. First semester" />
              </label>
              <label>
                Level / Year
                <input value={form.academic_level} onChange={e => setForm(f => ({ ...f, academic_level: e.target.value }))} placeholder="e.g. 300 Level" />
              </label>
            </div>
            <button className="btn btn-primary btn-full" disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : modal === "add" ? "Save course" : "Update course"}
            </button>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {modal === "delete" && (
        <Modal title="Delete course?" onClose={closeModal}>
          <p style={{ fontSize: "12px", color: "#5b6578", marginBottom: "20px", lineHeight: 1.7 }}>
            Deleting <strong>{editing?.title}</strong> will also remove all its associated materials and
            set related questions and tasks to uncategorised. This cannot be undone.
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
