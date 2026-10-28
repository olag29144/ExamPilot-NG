import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand auth-brand">
          <span className="brand-mark"><GraduationCap size={21} /></span>
          <span>ExamPilot <b>NG</b></span>
        </Link>

        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>Start studying smarter today.</p>
        </div>

        {error && <div className="form-error-banner" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label htmlFor="reg-name">
            Full name
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
            />
          </label>

          <label htmlFor="reg-email">
            Email address
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label htmlFor="reg-password">
            Password
            <div className="pw-wrap">
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="pw-toggle"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw(v => !v)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label htmlFor="reg-confirm">
            Confirm password
            <input
              id="reg-confirm"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-large"
            disabled={loading}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Creating account…</> : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
