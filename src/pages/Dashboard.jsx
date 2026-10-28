import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Activity, BookOpen, BrainCircuit, CalendarDays,
  CheckCircle2, FileText, GraduationCap, Plus, Sparkles, Target, TrendingUp,
  Trophy, Zap, ChevronRight, Loader2
} from "lucide-react";
import { dashboard as dashApi } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}

function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      <span><Icon size={23} /></span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    dashApi.get()
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const initial = user?.name?.[0]?.toUpperCase() ?? "S";
  const counts  = data?.counts ?? {};
  const taskPct = counts.tasks_total
    ? Math.round((counts.tasks_done / counts.tasks_total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={28} className="spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <p>Could not load dashboard: {error}</p>
        <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <section className="dashboard">
      {/* Welcome */}
      <div className="welcome-row">
        <div>
          <div className="welcome-date">
            <span className="live-dot" />
            YOUR STUDY SPACE &nbsp;·&nbsp;
            {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1>Small steps, <em>big results.</em></h1>
          <p>Every focused session gets you closer to your goals. Let&apos;s make today count.</p>
        </div>
        <div className="welcome-graphic" aria-hidden="true">
          <div className="graphic-ring ring-one" />
          <div className="graphic-ring ring-two" />
          <div className="graphic-book"><GraduationCap size={45} /></div>
          <span className="graphic-star star-a">✳</span>
          <span className="graphic-star star-b">✦</span>
        </div>
      </div>

      {/* Hero strip */}
      <div className="hero-quick">
        <div className="quick-copy">
          <span className="hero-kicker"><Sparkles size={14} /> YOUR NEXT STEP</span>
          <h2>Turn your notes into knowledge.</h2>
          <p>Save your lecture notes, practise what you&apos;ve learnt, and discover where to focus next.</p>
          <Link className="btn btn-light" to="/materials">
            Open study materials <ArrowRight size={16} />
          </Link>
        </div>
        <div className="quick-art" aria-hidden="true">
          <div className="paper paper-back" />
          <div className="paper paper-front">
            <span>STUDY SESSION</span><i /><i /><i /><b>✓</b>
          </div>
          <div className="floating-badge"><Zap size={14} /> Focus time</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Stat icon={BookOpen}     label="My courses"        value={counts.courses}   tone="blue" />
        <Stat icon={FileText}     label="Study materials"   value={counts.materials} tone="purple" />
        <Stat icon={Target}       label="Practice attempts" value={counts.attempts}  tone="orange" />
        <Stat icon={TrendingUp}   label="Average score"     value={counts.average != null ? `${counts.average}%` : "—"} tone="green" />
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* Courses */}
        <div className="content-panel courses-panel">
          <div className="panel-heading">
            <div>
              <h3>Pick up where you left off</h3>
              <p>Your courses, ready when you are.</p>
            </div>
            <Link className="text-button" to="/courses">All courses <ArrowRight size={15} /></Link>
          </div>
          <div className="mini-course-list">
            {(data?.courses ?? []).map(c => (
              <Link className="mini-course" key={c.id} to="/courses">
                <div className={`mini-course-icon ${c.color}`}><BookOpen size={19} /></div>
                <div className="mini-course-main">
                  <strong>{c.title}</strong>
                  <small>{c.course_code || "No code"} · {c.material_count} material{c.material_count !== 1 ? "s" : ""}</small>
                  <div className="progress-track"><span style={{ width: "0%" }} /></div>
                </div>
                <ChevronRight size={16} />
              </Link>
            ))}
            {!data?.courses?.length && (
              <Empty icon={BookOpen} title="Add your first course" text="Create a course to organise your study materials." />
            )}
          </div>
          <Link className="add-inline" to="/courses">
            <Plus size={16} /> Add a course
          </Link>
        </div>

        {/* Tasks */}
        <div className="content-panel tasks-panel">
          <div className="panel-heading">
            <div>
              <h3>Revision plan</h3>
              <p>A little progress every day.</p>
            </div>
            <Link className="icon-button" aria-label="View planner" to="/planner">
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="task-progress-summary">
            <div
              className="task-progress-ring"
              style={{ "--progress": `${taskPct}%` }}
            >
              <div>
                <strong>{taskPct}%</strong>
                <small>done</small>
              </div>
            </div>
            <div>
              <strong>{(counts.tasks_total ?? 0) - (counts.tasks_done ?? 0)} tasks left</strong>
              <p>Keep your study streak alive.</p>
            </div>
          </div>
          <div className="mini-task-list">
            {(data?.pending_tasks ?? []).slice(0, 3).map(t => (
              <div className="mini-task" key={t.id}>
                <div className="task-check" aria-hidden="true" />
                <span>
                  <strong>{t.title}</strong>
                  <small>{t.due_date ?? "No date"} · {t.course_title ?? "General"}</small>
                </span>
              </div>
            ))}
            {!data?.pending_tasks?.length && (
              <p className="muted" style={{ padding: "8px 0" }}>You&apos;re all caught up. Nice work!</p>
            )}
          </div>
          <Link className="text-button" to="/planner">View full planner <ArrowRight size={15} /></Link>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="bottom-grid">
        <div className="content-panel">
          <div className="panel-heading">
            <div><h3>Quick actions</h3><p>Make your next study session count.</p></div>
          </div>
          <div className="quick-actions">
            <Link to="/assistant">
              <span className="action-icon violet"><BrainCircuit size={19} /></span>
              <strong>Ask AI buddy</strong>
              <small>Understand tricky topics</small>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/cbt">
              <span className="action-icon coral"><Target size={19} /></span>
              <strong>Start a practice</strong>
              <small>Test what you know</small>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/planner">
              <span className="action-icon mint"><CalendarDays size={19} /></span>
              <strong>Plan revision</strong>
              <small>Stay on track</small>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div className="content-panel recent-panel">
          <div className="panel-heading">
            <div><h3>Recent practice</h3><p>Your latest results.</p></div>
            <Link className="text-button" to="/performance">View all <ArrowRight size={15} /></Link>
          </div>
          {(data?.recent_attempts ?? []).map(a => (
            <div className="recent-row" key={a.id}>
              <div className="recent-score-icon"><Trophy size={17} /></div>
              <div>
                <strong>{a.course_title ?? "Practice session"}</strong>
                <small>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : ""}</small>
              </div>
              <b>{a.score_percent}%</b>
            </div>
          ))}
          {!data?.recent_attempts?.length && (
            <div className="empty-small">
              <span><Activity size={19} /></span>
              <p>Your completed practice scores will appear here.</p>
              <Link className="text-button" to="/cbt">Try a practice quiz <ArrowRight size={14} /></Link>
            </div>
          )}
        </div>
      </div>

      <footer className="app-footer">
        <span>ExamPilot NG</span>
        <span>Made for your next breakthrough.</span>
        <Link to="/settings">Settings <ArrowRight size={13} /></Link>
      </footer>
    </section>
  );
}
