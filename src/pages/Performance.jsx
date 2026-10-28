import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertCircle, ArrowRight, BarChart2,
  CheckCircle2, Clock, Loader2, Target, TrendingUp, Trophy
} from "lucide-react";
import { performance as api } from "../lib/api.js";

// Minimal SVG sparkline — no external charting lib needed
function Sparkline({ values }) {
  if (!values.length) return null;
  const W = 300, H = 80, PAD = 8;
  const min = 0, max = 100;
  const pts = values.map((v, i) => {
    const x = PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / (max - min)) * (H - PAD * 2);
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${H - PAD} L${pts[0][0]},${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" aria-label="Score trend chart" role="img">
      <title>Score trend over recent attempts</title>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="var(--primary)" aria-hidden="true" />
      ))}
    </svg>
  );
}

function fmt(sec) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2,"0")}s`;
}

export default function Performance() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get()
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><Loader2 size={28} className="spin" /></div>;
  if (error)   return (
    <div className="page-error">
      <AlertCircle size={22} /><p>{error}</p>
      <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const {
    attempts = [], weak_topics = [],
    average_score, attempt_count,
    course_count, material_count, question_count
  } = data;

  const sparkValues = [...attempts].reverse().map(a => a.score_percent ?? 0);
  const best  = attempts.length ? Math.max(...attempts.map(a => a.score_percent ?? 0)) : null;

  return (
    <section className="performance-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR JOURNEY</span>
          <h1>Progress &amp; performance</h1>
          <p>All your scores, trends, and areas to improve — drawn from real practice data.</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Trophy size={20} /></div>
          <span>Average score</span>
          <strong>{average_score != null ? `${average_score}%` : "—"}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Target size={20} /></div>
          <span>Attempts</span>
          <strong>{attempt_count}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><TrendingUp size={20} /></div>
          <span>Best score</span>
          <strong>{best != null ? `${best}%` : "—"}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><BarChart2 size={20} /></div>
          <span>Questions</span>
          <strong>{question_count}</strong>
        </div>
      </div>

      {/* Score trend */}
      {sparkValues.length >= 2 && (
        <div className="content-panel" style={{ marginBottom: 24 }}>
          <div className="panel-heading">
            <div>
              <h3>Score trend</h3>
              <p>Your last {sparkValues.length} attempt{sparkValues.length !== 1 ? "s" : ""}.</p>
            </div>
          </div>
          <div className="chart-wrap">
            <Sparkline values={sparkValues} />
            <div className="chart-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          {sparkValues.length < 3 && (
            <p className="muted chart-note">Take more practice tests to see a meaningful trend.</p>
          )}
        </div>
      )}

      {/* Weak topics */}
      {weak_topics.length > 0 && (
        <div className="content-panel" style={{ marginBottom: 24 }}>
          <div className="panel-heading">
            <div>
              <h3>Topics to revise</h3>
              <p>Based on your actual answers — topics where you scored below 60%.</p>
            </div>
          </div>
          <div className="weak-topics">
            {weak_topics.map(t => (
              <div className="weak-topic-row" key={t.topic}>
                <div className="weak-topic-info">
                  <AlertCircle size={14} className="orange" />
                  <strong>{t.topic}</strong>
                  <small>{t.total} question{t.total !== 1 ? "s" : ""} attempted</small>
                </div>
                <div className="weak-topic-bar">
                  <div className="progress-track">
                    <span className="red" style={{ width: `${t.percent}%` }} />
                  </div>
                  <span className="pct-badge red">{t.percent}%</span>
                </div>
              </div>
            ))}
          </div>
          <p className="weak-note">
            Rule-based recommendation — revisit these topics in your study materials or ask your AI buddy.
          </p>
        </div>
      )}

      {/* Attempt history */}
      <div className="content-panel">
        <div className="panel-heading">
          <div>
            <h3>Attempt history</h3>
            <p>Every submitted practice session.</p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="empty-state">
            <span><Activity size={23} /></span>
            <strong>No attempts yet</strong>
            <p>Your completed practice test scores will appear here.</p>
            <Link className="btn btn-primary" style={{ marginTop: 12 }} to="/cbt">
              Start a practice test <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="history-list">
            <div className="history-header">
              <span>Course / session</span>
              <span>Date</span>
              <span>Score</span>
              <span>Questions</span>
              <span>Time</span>
              <span></span>
            </div>
            {attempts.map(a => {
              const pct   = a.score_percent ?? 0;
              const tone  = pct >= 70 ? "green" : pct >= 50 ? "orange" : "red";
              return (
                <div className="history-row" key={a.id}>
                  <span>{a.course_title ?? "Practice session"}</span>
                  <span>{a.submitted_at
                    ? new Date(a.submitted_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                    : "—"
                  }</span>
                  <span className={`pct-badge ${tone}`}>{pct}%</span>
                  <span>{a.correct_count ?? "—"}/{a.total_questions}</span>
                  <span>{fmt(a.duration_seconds)}</span>
                  <span>
                    <Link className="text-button" to={`/cbt/results/${a.id}`}>
                      Review <ArrowRight size={13} />
                    </Link>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
