import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname ?? "/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
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
          <h1>Welcome back</h1>
          <p>Sign in to continue your study sessions.</p>
        </div>

        {error && <div className="form-error-banner" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label htmlFor="email">
            Email address
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-describedby={error ? "auth-error" : undefined}
            />
          </label>

          <label htmlFor="password">
            Password
            <div className="pw-wrap">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
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

          <button
            type="submit"
            className="btn btn-primary btn-full btn-large"
            disabled={loading}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
