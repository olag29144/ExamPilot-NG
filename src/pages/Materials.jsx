import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { courses as coursesApi, materials as api } from "../lib/api.js";

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
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-heading">
          <div><span className="eyebrow">YOUR KNOWLEDGE BASE</span><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BLANK = { title: "", content_text: "", course_id: "" };

export default function Materials() {
  const [searchParams]          = useSearchParams();
  const [list,    setList]      = useState([]);
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState("");
  const [toast,   setToast]     = useState("");
  const [query,   setQuery]     = useState("");
  const [filter,  setFilter]    = useState(searchParams.get("course_id") ?? "");
  const [modal,   setModal]     = useState(null);
  const [editing, setEditing]   = useState(null);
  const [form,    setForm]      = useState(BLANK);
  const [saving,  setSaving]    = useState(false);
  const [tab,     setTab]       = useState("paste"); // "paste" | "upload"
  const [file,    setFile]      = useState(null);
  const [viewing, setViewing]   = useState(null);
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.list({ course_id: filter || undefined, q: query || undefined }),
        coursesApi.list()
      ]);
      setList(mRes.materials);
      setCourses(cRes.courses);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter, query]);

  function openAdd()   { setForm(BLANK); setEditing(null); setFile(null); setTab("paste"); setModal("add"); }
  function openEdit(m) { setForm({ title: m.title, content_text: m.content_text ?? "", course_id: m.course_id ?? "" }); setEditing(m); setModal("edit"); }
  function openDel(m)  { setEditing(m); setModal("delete"); }
  function openView(m) { setViewing(m); setModal("view"); }
  function closeModal(){ setModal(null); setEditing(null); setViewing(null); setSaving(false); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "add") {
        let saved;
        if (tab === "upload" && file) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("title", form.title || file.name.replace(/\.[^.]+$/, ""));
          if (form.course_id) fd.append("course_id", form.course_id);
          const d = await api.upload(fd);
          saved = d.material;
        } else {
          const d = await api.create({ title: form.title, content_text: form.content_text, course_id: form.course_id || null });
          saved = d.material;
        }
        setList(prev => [saved, ...prev]);
        setToast("Material saved");
      } else {
        const d = await api.update(editing.id, { title: form.title, content_text: form.content_text, course_id: form.course_id || null });
        setList(prev => prev.map(m => m.id === editing.id ? d.material : m));
        setToast("Material updated");
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
      setList(prev => prev.filter(m => m.id !== editing.id));
      setToast("Material deleted");
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR KNOWLEDGE BASE</span>
          <h1>Study materials</h1>
          <p>Your notes, summaries, and learning resources in one place.</p>
        </div>
        <div className="heading-action">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={17} /> Add material</button>
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="filter-row">
        <div className="search-box wide">
          <Search size={16} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search titles or content…"
            aria-label="Search materials"
          />
        </div>
        <select
          className="filter-select"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Filter by course"
        >
          <option value="">All courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <span className="muted">{list.length} material{list.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="page-loading"><Loader2 size={24} className="spin" /></div>
      ) : (
        <div className="materials-list">
          {list.map(m => (
            <article className="material-row" key={m.id}>
              <div className={`material-icon${m.course_color ? " " + m.course_color : ""}`}><FileText size={21} /></div>
              <div className="material-info">
                <strong>{m.title}</strong>
                <p>
                  {m.course_title ?? "No course"}
                  {m.source_filename && <><span> · </span>{m.source_filename}</>}
                </p>
              </div>
              <time dateTime={m.updated_at}>
                {new Date(m.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </time>
              <div className="row-actions">
                <button className="icon-button" aria-label="View" onClick={() => openView(m)}><FileText size={15} /></button>
                <button className="icon-button" aria-label="Edit" onClick={() => openEdit(m)}><Pencil size={15} /></button>
                <button className="icon-button" aria-label="Delete" onClick={() => openDel(m)}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
          {!list.length && (
            <div className="empty-state" style={{ padding: "48px 0" }}>
              <span><FileText size={23} /></span>
              <strong>No materials found</strong>
              <p>Try a different search, or add your first study note.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add study material" : "Edit material"} onClose={closeModal}>
          {modal === "add" && (
            <div className="tab-row">
              <button className={`tab-btn${tab === "paste" ? " active" : ""}`} onClick={() => setTab("paste")}>Paste notes</button>
              <button className={`tab-btn${tab === "upload" ? " active" : ""}`} onClick={() => setTab("upload")}><Upload size={14} /> Upload file</button>
            </div>
          )}
          <form onSubmit={handleSave} className="modal-form">
            <label>
              Title {tab !== "upload" || !file ? "*" : "(auto from filename)"}
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Week 3 lecture notes"
                required={tab !== "upload"}
                autoFocus
              />
            </label>
            <label>
              Course
              <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}>
                <option value="">No course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            {(modal === "edit" || tab === "paste") && (
              <label>
                Notes / content
                <textarea
                  rows={8}
                  value={form.content_text}
                  onChange={e => setForm(f => ({ ...f, content_text: e.target.value }))}
                  placeholder="Paste your lecture notes or a summary here…"
                />
              </label>
            )}
            {modal === "add" && tab === "upload" && (
              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md"
                  style={{ display: "none" }}
                  onChange={e => setFile(e.target.files[0] ?? null)}
                />
                {file ? (
                  <p><FileText size={18} /> {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                ) : (
                  <p><Upload size={18} /> Click to select a <strong>.txt</strong> or <strong>.md</strong> file (max 1 MB)</p>
                )}
              </div>
            )}
            <button className="btn btn-primary btn-full" disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : modal === "add" ? "Save material" : "Update material"}
            </button>
          </form>
        </Modal>
      )}

      {/* View */}
      {modal === "view" && viewing && (
        <Modal title={viewing.title} onClose={closeModal}>
          <p style={{ fontSize: "10px", color: "#8c97a5", marginBottom: "12px" }}>
            {viewing.course_title ?? "No course"} · Updated {new Date(viewing.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <div className="material-content">{viewing.content_text || <em>No content saved.</em>}</div>
        </Modal>
      )}

      {/* Delete */}
      {modal === "delete" && (
        <Modal title="Delete material?" onClose={closeModal}>
          <p style={{ fontSize: "12px", color: "#5b6578", marginBottom: "20px", lineHeight: 1.7 }}>
            Are you sure you want to delete <strong>{editing?.title}</strong>? This cannot be undone.
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
