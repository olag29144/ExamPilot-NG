import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap, BookOpen, BrainCircuit, Target, TrendingUp, CalendarDays,
  ArrowRight, CheckCircle2, Sparkles, ListChecks, Clock3, BarChart2
} from "lucide-react";

const FEATURES = [
  { icon: BookOpen,     title: "Organised courses",      desc: "Keep all your courses, lecture notes, and summaries in one place." },
  { icon: BrainCircuit, title: "AI study buddy",         desc: "Ask questions grounded in your own notes and get clear, honest explanations." },
  { icon: ListChecks,   title: "Practice questions",     desc: "Generate multiple-choice questions from your materials at any difficulty." },
  { icon: Clock3,       title: "Timed CBT practice",     desc: "Simulate exam conditions with server-timed, server-scored practice tests." },
  { icon: BarChart2,    title: "Performance tracking",   desc: "Review your scores, spot weak topics, and focus your revision where it matters." },
  { icon: CalendarDays, title: "Revision planner",       desc: "Create revision tasks, set due dates, and track your daily study progress." },
];

const HOW = [
  { n: "1", title: "Save your notes",     desc: "Paste lecture notes or upload .txt / .md files, organised by course." },
  { n: "2", title: "Understand with AI",  desc: "Ask the AI to explain any concept using your own saved material as context." },
  { n: "3", title: "Generate questions",  desc: "Create targeted practice MCQs at easy, medium, or hard difficulty." },
  { n: "4", title: "Take a timed test",   desc: "Start a CBT practice session — the server controls timing and scoring." },
  { n: "5", title: "Review and improve",  desc: "Study your results, identify weak topics, and plan your next session." },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* ── Nav ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="brand">
            <span className="brand-mark"><GraduationCap size={21} /></span>
            <span>ExamPilot <b>NG</b></span>
          </Link>
          <nav className="landing-links" aria-label="Site navigation">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <Link to="/login" className="btn btn-outline btn-sm">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-content">
          <span className="landing-eyebrow"><Sparkles size={13} /> AI-POWERED EXAM PREP FOR NIGERIAN STUDENTS</span>
          <h1>Study smarter.<br /><em>Practise better.</em><br />Ace your exams.</h1>
          <p>
            ExamPilot NG combines your lecture notes, an AI study assistant, timed
            practice tests, and a revision planner into one focused study system.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Create free account <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">Sign in</Link>
          </div>
          <p className="hero-note">No exam board affiliations. AI-generated questions are practice only — never official or leaked questions.</p>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <div className="hg-ring hg-ring-a" />
          <div className="hg-ring hg-ring-b" />
          <div className="hg-card hg-card-main">
            <div className="hg-card-row"><span className="hg-dot teal" /><strong>CBT Practice</strong></div>
            <div className="hg-progress-row"><span>Score</span><b>78%</b></div>
            <div className="hg-bar"><span style={{ width: "78%" }} /></div>
            <div className="hg-qs">
              {[1,1,1,0,1,1,0,1].map((c,i) => (
                <span key={i} className={c ? "hg-q-correct" : "hg-q-wrong"} />
              ))}
            </div>
          </div>
          <div className="hg-card hg-card-sm">
            <Sparkles size={14} />
            <span>AI answered your question</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <span className="landing-eyebrow">WHAT YOU GET</span>
          <h2>Everything you need to study effectively</h2>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon"><f.icon size={22} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section landing-section-alt" id="how">
        <div className="landing-section-inner">
          <span className="landing-eyebrow">THE STUDY LOOP</span>
          <h2>How ExamPilot NG works</h2>
          <div className="how-list">
            {HOW.map((h, i) => (
              <div className="how-item" key={h.n}>
                <div className="how-num">{h.n}</div>
                <div>
                  <strong>{h.title}</strong>
                  <p>{h.desc}</p>
                </div>
                {i < HOW.length - 1 && <div className="how-arrow" aria-hidden="true"><ArrowRight size={16} /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-section-inner cta-inner">
          <h2>Ready to take control of your study sessions?</h2>
          <p>Create an account, add your first course, and start practising today.</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Get started — it&apos;s free <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-section-inner footer-inner">
          <div className="brand">
            <span className="brand-mark brand-mark-sm"><GraduationCap size={17} /></span>
            <span>ExamPilot <b>NG</b></span>
          </div>
          <nav aria-label="Footer navigation">
            <Link to="/register">Register</Link>
            <Link to="/login">Sign in</Link>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </nav>
          <p className="footer-note">
            AI-generated content is for practice only. Always verify with your lecturers and official course materials.
          </p>
        </div>
      </footer>
    </div>
  );
}
