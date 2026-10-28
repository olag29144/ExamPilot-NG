import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, Loader2, Target, X
} from "lucide-react";
import { questions as qApi, courses as courseApi, attempts as attApi } from "../lib/api.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const esc = e => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

// ── Setup screen ──────────────────────────────────────────────────────────────
function Setup({ onStart }) {
  const [allQ,     setAllQ]     = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [course,   setCourse]   = useState("");
  const [diff,     setDiff]     = useState("");
  const [count,    setCount]    = useState(10);
  const [duration, setDuration] = useState(30);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([qApi.list(), courseApi.list()])
      .then(([q, c]) => { setAllQ(q.questions); setCourses(c.courses); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = allQ.filter(q =>
    (!course || q.course_id === course) &&
    (!diff   || q.difficulty === diff)
  );
  const maxCount = filtered.length;

  async function handleStart(e) {
    e.preventDefault();
    if (!filtered.length) return;
    setError("");
    setStarting(true);
    try {
      const selected = filtered.slice(0, Math.min(Number(count), filtered.length));
      const shuffled = [...selected].sort(() => Math.random() - 0.5);
      const d = await attApi.start({
        course_id:        course || null,
        question_ids:     shuffled.map(q => q.id),
        duration_minutes: Number(duration)
      });
      onStart(d);
    } catch (err) {
      if (err.message.includes("active attempt")) {
        setError("You have an active test in progress. Scroll down to resume it.");
      } else {
        setError(err.message);
      }
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <div className="page-loading"><Loader2 size={28} className="spin" /></div>;

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">COMPUTER-BASED TEST</span>
          <h1>CBT Practice</h1>
          <p>Test your knowledge with a timed, server-scored practice session.</p>
        </div>
      </div>

      {error && <div className="form-error-banner" role="alert">{error}</div>}

      <div className="cbt-setup-grid">
        <form onSubmit={handleStart} className="cbt-setup-card">
          <h2>Set up your test</h2>

          <label>
            Course filter
            <select value={course} onChange={e => { setCourse(e.target.value); setCount(Math.min(count, filtered.length || 1)); }}>
              <option value="">All courses ({allQ.length} questions)</option>
              {courses.map(c => {
                const n = allQ.filter(q => q.course_id === c.id).length;
                return <option key={c.id} value={c.id}>{c.title} ({n})</option>;
              })}
            </select>
          </label>

          <label>
            Difficulty
            <select value={diff} onChange={e => setDiff(e.target.value)}>
              <option value="">Mixed (all difficulties)</option>
              <option value="easy">Easy only</option>
              <option value="medium">Medium only</option>
              <option value="hard">Hard only</option>
            </select>
          </label>

          <label>
            Number of questions
            <input
              type="number"
              min={1}
              max={maxCount || 1}
              value={count}
              onChange={e => setCount(Math.min(Number(e.target.value), maxCount))}
              disabled={!maxCount}
            />
            <small className="field-hint">{maxCount} available with current filters</small>
          </label>

          <label>
            Duration (minutes)
            <select value={duration} onChange={e => setDuration(e.target.value)}>
              {[10, 15, 20, 30, 45, 60, 90].map(v => (
                <option key={v} value={v}>{v} minutes</option>
              ))}
            </select>
          </label>

          <div className="cbt-summary-row">
            <div><strong>{Math.min(count, maxCount)}</strong><small>Questions</small></div>
            <div><strong>{duration} min</strong><small>Duration</small></div>
            <div><strong>{maxCount ? Math.round(duration * 60 / Math.min(count, maxCount)) : "—"}s</strong><small>Per question</small></div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-large"
            disabled={starting || !maxCount}
          >
            {starting ? <><Loader2 size={16} className="spin" /> Starting…</> : <><Target size={17} /> Start practice test</>}
          </button>

          {!maxCount && (
            <p className="muted" style={{ textAlign: "center", marginTop: 8 }}>
              No questions match these filters. <a href="/questions">Generate some first →</a>
            </p>
          )}
        </form>

        <div className="cbt-info-panel">
          <h3>How CBT practice works</h3>
          <ul>
            <li><CheckCircle2 size={14} /> Questions are drawn from your own question bank.</li>
            <li><CheckCircle2 size={14} /> The timer is controlled and enforced by the server.</li>
            <li><CheckCircle2 size={14} /> Scoring happens server-side — results are reliable.</li>
            <li><CheckCircle2 size={14} /> Answers are saved as you go, so a refresh won't lose them.</li>
            <li><CheckCircle2 size={14} /> Correct answers are revealed only after submission.</li>
            <li><AlertCircle size={14} /> Questions are for practice only — not official exams.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── Active test ───────────────────────────────────────────────────────────────
function ActiveTest({ attempt, questions, initialAnswers, onFinished }) {
  const navigate = useNavigate();

  // Build answer map: { [question_id]: selected_option | null }
  const initMap = {};
  for (const q of questions) {
    const saved = initialAnswers?.find(a => a.question_id === q.id);
    initMap[q.id] = saved?.selected_option ?? null;
  }

  const [answers,   setAnswers]   = useState(initMap);
  const [current,   setCurrent]   = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(() => {
    const exp = new Date(attempt.expires_at).getTime();
    return Math.max(0, Math.floor((exp - Date.now()) / 1000));
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmSub, setConfirmSub] = useState(false);
  const [error,      setError]      = useState("");
  const timerRef = useRef(null);

  // Countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const saveAnswer = useCallback(async (qId, opt) => {
    setAnswers(prev => ({ ...prev, [qId]: opt }));
    attApi.answer(attempt.id, { question_id: qId, selected_option: opt }).catch(() => {});
  }, [attempt.id]);

  async function handleSubmit(auto = false) {
    if (submitting) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    setConfirmSub(false);
    try {
      const res = await attApi.submit(attempt.id);
      onFinished(res.alreadySubmitted ? attempt.id : attempt.id);
      navigate(`/cbt/results/${attempt.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const unanswered = questions.filter(q => answers[q.id] === null || answers[q.id] === undefined).length;
  const q = questions[current];
  const timerUrgent = timeLeft < 60;

  return (
    <div className="cbt-test">
      {/* Header bar */}
      <div className="cbt-topbar">
        <div className="cbt-title">
          <Target size={18} />
          <strong>CBT Practice</strong>
        </div>
        <div className={`cbt-timer${timerUrgent ? " urgent" : ""}`} aria-live="off" aria-label={`Time remaining: ${fmt(timeLeft)}`}>
          <Clock size={15} />
          <span>{fmt(timeLeft)}</span>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setConfirmSub(true)}
          disabled={submitting}
        >
          Submit test
        </button>
      </div>

      <div className="cbt-body">
        {/* Navigator */}
        <aside className="cbt-nav">
          <div className="cbt-nav-head">
            <strong>Questions</strong>
            <small>{questions.filter(q => answers[q.id] !== null && answers[q.id] !== undefined).length}/{questions.length} answered</small>
          </div>
          <div className="cbt-nav-grid" role="list">
            {questions.map((q, i) => {
              const ans = answers[q.id];
              const done = ans !== null && ans !== undefined;
              return (
                <button
                  key={q.id}
                  role="listitem"
                  className={`nav-bubble${i === current ? " current" : ""}${done ? " answered" : ""}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Question ${i + 1}${done ? ", answered" : ", unanswered"}${i === current ? ", current" : ""}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          {unanswered > 0 && (
            <p className="nav-hint"><AlertCircle size={12} /> {unanswered} unanswered</p>
          )}
        </aside>

        {/* Question */}
        <div className="cbt-question-panel">
          {error && <div className="form-error-banner" role="alert">{error}</div>}

          <div className="question-progress">
            <span className="eyebrow">Question {current + 1} of {questions.length}</span>
            <div className="progress-bar-thin">
              <span style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <p className="question-text">{q.question_text}</p>

          <div className="answer-options" role="radiogroup" aria-label="Answer options">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <button
                  key={i}
                  role="radio"
                  aria-checked={selected}
                  className={`answer-option${selected ? " selected" : ""}`}
                  onClick={() => saveAnswer(q.id, i)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="question-nav">
            <button
              className="btn btn-outline"
              onClick={() => setCurrent(c => c - 1)}
              disabled={current === 0}
              aria-label="Previous question"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {current < questions.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrent(c => c + 1)}
                aria-label="Next question"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setConfirmSub(true)}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="spin" /> : "Submit test"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm submit dialog */}
      {confirmSub && (
        <Modal onClose={() => setConfirmSub(false)}>
          <div className="modal-heading">
            <div><h2>Submit test?</h2></div>
            <button className="icon-button" onClick={() => setConfirmSub(false)} aria-label="Close"><X size={19} /></button>
          </div>
          {unanswered > 0 && (
            <div className="warning-banner">
              <AlertCircle size={15} /> You have <strong>{unanswered}</strong> unanswered question{unanswered !== 1 ? "s" : ""}.
            </div>
          )}
          <p style={{ fontSize: "12px", color: "#5b6578", margin: "12px 0 20px", lineHeight: 1.7 }}>
            Once submitted, your answers are locked and scored. You will be taken to your results.
          </p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setConfirmSub(false)}>Go back</button>
            <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting ? <><Loader2 size={15} className="spin" /> Submitting…</> : "Yes, submit"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────
export default function CBT() {
  const [session,  setSession]  = useState(null); // { attempt, questions, answers }
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // On mount: check for active attempt to resume
  useEffect(() => {
    attApi.active()
      .then(d => {
        if (d.attempt) {
          setSession({ attempt: d.attempt, questions: d.questions, answers: d.answers });
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  function handleStart(data) {
    setSession({ attempt: data.attempt, questions: data.questions, answers: [] });
  }

  if (checking) return <div className="page-loading"><Loader2 size={28} className="spin" /></div>;

  if (session) {
    return (
      <ActiveTest
        attempt={session.attempt}
        questions={session.questions}
        initialAnswers={session.answers}
        onFinished={() => {}}
      />
    );
  }

  return <Setup onStart={handleStart} />;
}
