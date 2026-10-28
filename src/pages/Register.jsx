import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [email,    setEmail]    = useState("");
  const [name,     setName]     = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please provide your display name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

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
            <Link
              to="/login"
              className="ep-auth-tab"
            >
              Log in
            </Link>
            <button
              type="button"
              className="ep-auth-tab active"
            >
              Create account
            </button>
          </div>

          {error && <div className="ep-auth-error-msg">{error}</div>}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="ep-auth-form" noValidate>
            <div className="ep-input-group">
              <label htmlFor="reg-email" className="ep-input-label">Email</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-name" className="ep-input-label">Display Name</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name"
                className="ep-form-input"
              />
              <span className="ep-input-helper">
                Spaces, emojis, and special characters are all allowed
              </span>
            </div>

            <div className="ep-input-group">
              <label htmlFor="reg-password" className="ep-input-label">Password</label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ep-form-input"
              />
              <span className="ep-input-helper">
                At least 8 characters with uppercase, lowercase, and number
              </span>
            </div>

            <button
              type="submit"
              className="ep-btn-auth-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="ep-btn-loading-flex">
                  <Loader2 size={16} className="spin" /> Creating Account…
                </span>
              ) : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
