import React, { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Loader2, Plus, Send, Sparkles } from "lucide-react";
import { conversations as api, materials as matApi, courses as courseApi } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function Assistant() {
  const { user } = useAuth();
  const initial = user?.name?.[0]?.toUpperCase() ?? "S";

  const [convs,       setConvs]       = useState([]);
  const [activeConv,  setActiveConv]  = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [initing,     setIniting]     = useState(true);
  const [materials,   setMaterials]   = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [selMaterial, setSelMaterial] = useState("");
  const [selCourse,   setSelCourse]   = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([api.list(), matApi.list(), courseApi.list()])
      .then(([c, m, co]) => {
        setConvs(c.conversations);
        setMaterials(m.materials);
        setCourses(co.courses);
        if (c.conversations.length) loadConv(c.conversations[0]);
      })
      .catch(() => {})
      .finally(() => setIniting(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConv(conv) {
    setActiveConv(conv);
    setSelMaterial(conv.material_id ?? "");
    setSelCourse(conv.course_id ?? "");
    const d = await api.messages(conv.id).catch(() => ({ messages: [] }));
    setMessages(d.messages);
  }

  async function newConv() {
    const mat = selMaterial || null;
    const cou = selCourse || null;
    const title = mat
      ? materials.find(m => m.id === mat)?.title ?? "Study session"
      : cou
      ? courses.find(c => c.id === cou)?.title ?? "Study session"
      : "Study session";
    const d = await api.create({ title, material_id: mat, course_id: cou });
    setConvs(prev => [d.conversation, ...prev]);
    setActiveConv(d.conversation);
    setMessages([]);
  }

  async function send(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    if (!activeConv) { await newConv(); }

    setInput("");
    const convId = activeConv?.id ?? (await api.create({ title: question.slice(0, 60) })).conversation.id;
    setMessages(prev => [...prev, { id: `tmp-${Date.now()}`, role: "user", content: question }]);
    setLoading(true);

    try {
      const d = await api.ask(typeof convId === "string" ? convId : activeConv.id, { question });
      setMessages(prev => [...prev, { id: d.messageId, role: "assistant", content: d.answer, is_saved: 0 }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: err.message.includes("not configured")
            ? "AI is not configured. The server needs an AI_API_KEY in its .env file. You can still use all other features."
            : `Sorry, I couldn't get a response: ${err.message}`,
          is_saved: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSave(msg) {
    if (!msg.id || msg.id.startsWith("tmp") || msg.id.startsWith("err")) return;
    try {
      const d = await api.saveMsg(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_saved: d.saved ? 1 : 0 } : m));
    } catch {}
  }

  const chips = ["Explain this simply", "Give me an example", "Summarise this topic", "Create a revision plan"];

  if (initing) return <div className="page-loading"><Loader2 size={28} className="spin" /></div>;

  return (
    <section className="assistant-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LEARN WITH AI</span>
          <h1>Your study buddy</h1>
          <p>Ask questions grounded in your own notes. Get clear, honest explanations.</p>
        </div>
      </div>

      <div className="assistant-layout">
        {/* Sidebar: conversations */}
        <aside className="conv-list">
          <div className="conv-list-header">
            <strong>Conversations</strong>
            <button className="icon-button" aria-label="New conversation" onClick={newConv}><Plus size={17} /></button>
          </div>

          <div className="context-selectors">
            <label>
              Study material context
              <select value={selMaterial} onChange={e => { setSelMaterial(e.target.value); setSelCourse(""); }}>
                <option value="">None (general chat)</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </label>
            <label>
              Or link to course
              <select value={selCourse} onChange={e => { setSelCourse(e.target.value); setSelMaterial(""); }}>
                <option value="">None</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
          </div>

          <div className="conv-items">
            {convs.map(c => (
              <button
                key={c.id}
                className={`conv-item${activeConv?.id === c.id ? " active" : ""}`}
                onClick={() => loadConv(c)}
              >
                <strong>{c.title}</strong>
                <small>{new Date(c.updated_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</small>
              </button>
            ))}
            {!convs.length && <p className="muted" style={{ padding: "8px 12px", fontSize: "10px" }}>No conversations yet. Ask something below.</p>}
          </div>
        </aside>

        {/* Chat panel */}
        <div className="chat-panel">
          <div className="chat-head">
            <div className="ai-avatar"><Sparkles size={21} /></div>
            <div>
              <strong>ExamPilot AI</strong>
              <small><span className="online-dot" /> Study assistant · Nigerian curriculum friendly</small>
            </div>
            <span className="powered-tag">AI ASSISTANT</span>
          </div>

          <div className="chat-messages" role="log" aria-live="polite" aria-label="Conversation">
            {!messages.length && (
              <div className="chat-empty">
                <Sparkles size={26} />
                <p>Start a conversation. Select a study material above for context-grounded answers.</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`chat-message ${m.role}`}>
                <div className="message-avatar">
                  {m.role === "assistant" ? <Sparkles size={16} /> : <span>{initial}</span>}
                </div>
                <div className="message-bubble">
                  <div className="message-text">{m.content}</div>
                  {m.role === "assistant" && !m.id?.startsWith("tmp") && !m.id?.startsWith("err") && (
                    <button
                      className={`save-msg-btn${m.is_saved ? " saved" : ""}`}
                      aria-label={m.is_saved ? "Unsave response" : "Save response"}
                      onClick={() => toggleSave(m)}
                    >
                      {m.is_saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                      {m.is_saved ? "Saved" : "Save"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="message-avatar"><Sparkles size={16} /></div>
                <div className="message-bubble typing"><i /><i /><i /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="prompt-chips">
            {chips.map(t => (
              <button key={t} onClick={() => setInput(t)}>{t}</button>
            ))}
          </div>

          <form className="chat-form" onSubmit={send}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about your studies…"
              aria-label="Ask your study buddy"
            />
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              {loading ? <Loader2 size={16} className="spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="ai-disclaimer">
            Use AI as a study aid. Always verify important details with your lecture notes and lecturers.
          </p>
        </div>
      </div>
    </section>
  );
}
