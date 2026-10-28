import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle2,
  Clock, Loader2, Target, Trophy, XCircle
} from "lucide-react";
import { attempts as api } from "../lib/api.js";

function ScoreRing({ pct }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  const tone = pct >= 70 ? "green" : pct >= 50 ? "orange" : "red";
  return (
    <svg className={`score-ring ${tone}`} viewBox="0 0 120 120" aria-label={`Score: ${pct}%`}>
      <circle cx="60" cy="60" r={r} className="ring-track" />
      <circle
        cx="60" cy="60" r={r}
        className="ring-fill"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
      />
      <text x="60" y="56" textAnchor="middle" className="ring-pct">{pct}%</text>
      <text x="60" y="72" textAnchor="middle" className="ring-label">score</text>
    </svg>
  );
}

function TopicBar({ topic, correct, total }) {
  const pct = Math.round((correct / total) * 100);
  const tone = pct >= 70 ? "green" : pct >= 50 ? "orange" : "red";
  return (
    <div className="topic-bar">
      <div className="topic-bar-head">
        <span>{topic}</span>
        <span className={`pct-badge ${tone}`}>{pct}%</span>
      </div>
      <div className="progress-track">
        <span className={tone} style={{ width: `${pct}%` }} />
      </div>
      <small>{correct}/{total} correct</small>
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("all"); // all | wrong | correct

  useEffect(() => {
    api.result(id)
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading"><Loader2 size={28} className="spin" /></div>;
  if (error)   return (
    <div className="page-error">
      <AlertCircle size={22} />
      <p>{error}</p>
      <Link className="btn btn-outline" to="/cbt">Back to CBT</Link>
    </div>
  );

  const { attempt, answers, topic_stats } = data;
  const pct     = attempt.score_percent ?? 0;
  const correct = attempt.correct_count ?? 0;
  const total   = attempt.total_questions ?? answers.length;
  const mins    = attempt.duration_seconds ? Math.floor(attempt.duration_seconds / 60) : null;
  const secs    = attempt.duration_seconds ? attempt.duration_seconds % 60 : null;

  const shown = answers.filter(a => {
    if (filter === "correct") return a.is_correct;
    if (filter === "wrong")   return !a.is_correct;
    return true;
  });

  const grade = pct >= 70 ? { label: "Pass", tone: "green" } : pct >= 50 ? { label: "Fair", tone: "orange" } : { label: "Needs work", tone: "red" };

  return (
    <section className="results-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR RESULT</span>
          <h1>Practice complete</h1>
          <p>Here is how you performed. Review each question to learn from any mistakes.</p>
        </div>
        <div className="heading-action">
          <Link className="btn btn-outline" to="/cbt">
            <ArrowLeft size={16} /> New practice
          </Link>
        </div>
      </div>

      {/* Summary card */}
      <div className="result-summary">
        <div className="result-ring-col">
          <ScoreRing pct={pct} />
          <span className={`grade-badge ${grade.tone}`}>{grade.label}</span>
        </div>
        <div className="result-stats">
          <div className="result-stat">
            <CheckCircle2 size={18} className="green" />
            <div><strong>{correct}</strong><small>Correct</small></div>
          </div>
          <div className="result-stat">
            <XCircle size={18} className="red" />
            <div><strong>{total - correct}</strong><small>Incorrect</small></div>
          </div>
          <div className="result-stat">
            <Target size={18} />
            <div><strong>{total}</strong><small>Questions</small></div>
          </div>
          {mins !== null && (
            <div className="result-stat">
              <Clock size={18} />
              <div><strong>{mins}m {secs}s</strong><small>Time taken</small></div>
            </div>
          )}
        </div>
      </div>

      {/* Topic breakdown */}
      {topic_stats?.length > 0 && (
        <div className="content-panel" style={{ marginBottom: 24 }}>
          <div className="panel-heading">
            <div>
              <h3>Topic breakdown</h3>
              <p>How you did across different areas.</p>
            </div>
          </div>
          <div className="topic-bars">
            {topic_stats.map(t => (
              <TopicBar key={t.topic} topic={t.topic} correct={t.correct} total={t.total} />
            ))}
          </div>
          {topic_stats.some(t => t.percent < 60) && (
            <div className="weak-hint">
              <AlertCircle size={14} />
              <span>Topics below 60% are worth revisiting in your study materials.</span>
            </div>
          )}
        </div>
      )}

      {/* Per-question review */}
      <div className="content-panel">
        <div className="panel-heading">
          <div>
            <h3>Question review</h3>
            <p>Read each explanation to reinforce your understanding.</p>
          </div>
          <div className="tab-row">
            {[["all", "All"], ["correct", "Correct"], ["wrong", "Incorrect"]].map(([v, l]) => (
              <button
                key={v}
                className={`tab-btn${filter === v ? " active" : ""}`}
                onClick={() => setFilter(v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="review-list">
          {shown.map((a, i) => {
            const origIdx = answers.indexOf(a);
            return (
              <div key={a.question_id} className={`review-item${a.is_correct ? " correct" : " wrong"}`}>
                <div className="review-num">
                  {a.is_correct
                    ? <CheckCircle2 size={18} className="green" aria-label="Correct" />
                    : <XCircle     size={18} className="red"   aria-label="Incorrect" />
                  }
                  <span>Q{origIdx + 1}</span>
                  {a.topic && <span className="topic-tag small">{a.topic}</span>}
                </div>
                <p className="review-q">{a.question_text}</p>
                <div className="review-options">
                  {a.options.map((opt, oi) => {
                    const isCorrect  = oi === a.correct_option;
                    const isSelected = oi === a.selected_option;
                    return (
                      <div
                        key={oi}
                        className={`review-opt${isCorrect ? " is-correct" : ""}${isSelected && !isCorrect ? " is-wrong" : ""}`}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                        <span>{opt}</span>
                        {isCorrect  && <CheckCircle2 size={14} className="green" />}
                        {isSelected && !isCorrect && <XCircle size={14} className="red" />}
                      </div>
                    );
                  })}
                </div>
                {a.explanation && (
                  <div className="review-explanation">
                    <strong>Explanation</strong>
                    <p>{a.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
          {!shown.length && (
            <p className="muted" style={{ padding: "24px 0", textAlign: "center" }}>
              No questions in this filter.
            </p>
          )}
        </div>
      </div>

      <div className="results-footer-actions">
        <Link className="btn btn-outline" to="/cbt">
          <ArrowLeft size={16} /> New practice
        </Link>
        <Link className="btn btn-outline" to="/questions">
          View question bank
        </Link>
        <Link className="btn btn-primary" to="/performance">
          View all results <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
