import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname ?? "/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [notice,   setNotice]   = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  const handleDemoSignIn = async () => {
    setError("");
    setNotice("");
    setEmail("demo@exampilot.ng");
    setPassword("password123");
    setLoading(true);
    try {
      await login("demo@exampilot.ng", "password123");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ep-auth-screen">
      {/* Upper Dark Navy Banner (approx top 35%) */}
      <div className="ep-auth-top-banner" />

      {/* Centered Floating Card */}
      <div className="ep-auth-card-container">
        <div className="ep-auth-card">
          {/* Brand Header */}
          <div className="ep-auth-brand-row">
            <GraduationCap size={26} className="ep-auth-brand-cap" />
            <h1 className="ep-auth-brand-name">ExamPilot NG</h1>
          </div>

          <p className="ep-auth-tagline">
            Study smarter. Practise better. Ace your exams.
          </p>

          {/* Segmented Tabs: [Log in] [Create account] */}
          <div className="ep-auth-tabs">
            <button
              type="button"
              className="ep-auth-tab active"
            >
              Log in
            </button>
            <Link
              to="/register"
              className="ep-auth-tab"
            >
              Create account
            </Link>
          </div>

          {error && <div className="ep-auth-error-msg">{error}</div>}
          {notice && <div className="ep-auth-info-msg">{notice}</div>}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="ep-auth-form" noValidate>
            <div className="ep-input-group">
              <label htmlFor="email" className="ep-input-label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="ep-form-input"
              />
            </div>

            <div className="ep-input-group">
              <label htmlFor="password" className="ep-input-label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ep-form-input"
              />
            </div>

            <div className="ep-forgot-row">
              <button
                type="button"
                className="ep-forgot-link"
                onClick={() => setNotice("For test/demo access, you can use demo@exampilot.ng with password123.")}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="ep-btn-auth-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="ep-btn-loading-flex">
                  <Loader2 size={16} className="spin" /> Signing in…
                </span>
              ) : "Log In"}
            </button>

            {/* Quick demo student login */}
            <div className="ep-demo-helper-row">
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="ep-demo-quick-btn"
                disabled={loading}
              >
                Use Demo Student Account (demo@exampilot.ng)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
