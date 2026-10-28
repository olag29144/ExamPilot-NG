import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  FileText,
  Sparkles,
  CheckSquare,
  Clock,
  Target,
  Calendar,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="landing-page-exact">
      {/* ── Top Navbar ── */}
      <header className="ep-navbar">
        <div className="ep-navbar-inner">
          <Link to="/" className="ep-brand">
            <GraduationCap size={22} className="ep-brand-icon" />
            <span className="ep-brand-text">ExamPilot NG</span>
          </Link>
          <nav className="ep-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#benefits">Benefits</a>
            <Link to="/login" className="ep-nav-login">Log in</Link>
            <Link to="/register" className="ep-btn-signup">Sign up</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="ep-hero">
        <div className="ep-hero-inner">
          <span className="ep-hero-kicker">EXAM PREPARATION FOR NIGERIAN UNIVERSITY STUDENTS</span>
          <h1 className="ep-hero-title">
            Study smarter. Practise better.<br />
            Ace your exams.
          </h1>
          <p className="ep-hero-description">
            Reading notes is not the same as being ready for the exam hall. ExamPilot NG connects your lecture notes, AI explanations, practice questions, timed CBT tests and your results in one place, so you can see what you know and what to revise next.
          </p>
          <div className="ep-hero-actions">
            <Link to="/register" className="ep-btn-hero-primary">Create a free account</Link>
            <Link to="/login" className="ep-btn-hero-secondary">Log in</Link>
          </div>
        </div>
      </section>

      {/* ── Main Content Area on Ivory Background ── */}
      <div className="ep-body-container">
        {/* ── One Connected Study System Section ── */}
        <section className="ep-section" id="features">
          <div className="ep-section-inner">
            <h2 className="ep-section-heading">One connected study system</h2>
            <p className="ep-section-subheading">
              Not another chatbot. Every feature feeds the next: your notes lead to questions, questions to tests, tests to revision.
            </p>

            <div className="ep-cards-grid-3">
              {/* Card 1 */}
              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <FileText size={20} />
                </div>
                <h3 className="ep-card-title">Your own notes</h3>
                <p className="ep-card-text">
                  Paste or upload your lecture notes and keep them organised by course, semester and level.
                </p>
              </div>

              {/* Card 2 */}
              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <Sparkles size={20} />
                </div>
                <h3 className="ep-card-title">Explanations from your notes</h3>
                <p className="ep-card-text">
                  Ask for summaries, simple explanations, examples and step-by-step breakdowns grounded in what you saved. If your notes don't cover it, the AI says so.
                </p>
              </div>

              {/* Card 3 */}
              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <CheckSquare size={20} />
                </div>
                <h3 className="ep-card-title">Practice questions</h3>
                <p className="ep-card-text">
                  Generate multiple-choice questions from a chosen material, with explanations and topic labels.
                </p>
              </div>

              {/* Card 4 */}
              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <Clock size={20} />
                </div>
                <h3 className="ep-card-title">Timed CBT practice</h3>
                <p className="ep-card-text">
                  Sit a computer-based test with a countdown timer. Scoring and timing are handled on the server.
                </p>
              </div>

              {/* Card 5 */}
              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <Target size={20} />
                </div>
                <h3 className="ep-card-title">Weak-topic tracking</h3>
                <p className="ep-card-text">
                  Weak topics come from your actual answers across tests. With too little data, nothing is guessed.
                </p>
              </div>

              {/* Card 6 */}
              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <Calendar size={20} />
                </div>
                <h3 className="ep-card-title">Revision planner</h3>
                <p className="ep-card-text">
                  Plan tasks with due dates and get transparent, rule-based suggestions on what to revise next.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works Section ── */}
        <section className="ep-section ep-section-how" id="how-it-works">
          <div className="ep-section-inner">
            <h2 className="ep-section-heading">How it works</h2>

            <div className="ep-steps-row">
              <div className="ep-step-item">
                <div className="ep-step-number">1</div>
                <h4 className="ep-step-title">Study</h4>
                <p className="ep-step-text">Add a course and save your notes.</p>
              </div>

              <div className="ep-step-item">
                <div className="ep-step-number">2</div>
                <h4 className="ep-step-title">Understand</h4>
                <p className="ep-step-text">Ask the AI to explain or summarise them.</p>
              </div>

              <div className="ep-step-item">
                <div className="ep-step-number">3</div>
                <h4 className="ep-step-title">Practise</h4>
                <p className="ep-step-text">Generate questions and take a timed test.</p>
              </div>

              <div className="ep-step-item">
                <div className="ep-step-number">4</div>
                <h4 className="ep-step-title">Measure</h4>
                <p className="ep-step-text">See your score, answers and explanations.</p>
              </div>

              <div className="ep-step-item">
                <div className="ep-step-number">5</div>
                <h4 className="ep-step-title">Revise</h4>
                <p className="ep-step-text">Follow the revision suggestions, then test again.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Built for How Students Actually Prepare Section ── */}
        <section className="ep-section" id="benefits">
          <div className="ep-section-inner">
            <h2 className="ep-section-heading">Built for how students actually prepare</h2>

            <div className="ep-cards-grid-3">
              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <BookOpen size={20} />
                </div>
                <h3 className="ep-card-title">Your syllabus, your rules</h3>
                <p className="ep-card-text">
                  Universities differ. You organise your own courses and materials; nothing assumes one syllabus.
                </p>
              </div>

              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <Clock size={20} />
                </div>
                <h3 className="ep-card-title">Practise the CBT way</h3>
                <p className="ep-card-text">
                  Get used to one-question-at-a-time screens and a running clock before the real test.
                </p>
              </div>

              <div className="ep-feature-card">
                <div className="ep-icon-box">
                  <TrendingUp size={20} />
                </div>
                <h3 className="ep-card-title">Honest progress</h3>
                <p className="ep-card-text">
                  Scores and weak topics come only from your recorded results, so the numbers mean something.
                </p>
              </div>
            </div>

            {/* Disclaimer Callout Box */}
            <div className="ep-disclaimer-box">
              <p>
                AI answers and generated questions can contain mistakes and are not official exam questions. Always check important points against your lecture notes and lecturers' instructions.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="ep-footer">
        <div className="ep-footer-inner">
          <div className="ep-footer-left">
            <GraduationCap size={18} className="ep-footer-icon" />
            <span className="ep-footer-brand">ExamPilot NG</span>
          </div>

          <div className="ep-footer-center">
            Built for the OPEN//BUILD 2026 Hackathon
          </div>

          <div className="ep-footer-right">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/login">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
