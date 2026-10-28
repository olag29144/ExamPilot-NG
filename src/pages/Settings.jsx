import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LogOut, Save, Shield, User } from "lucide-react";
import { auth as authApi } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function Section({ icon: Icon, title, desc, children }) {
  return (
    <div className="settings-section">
      <div className="settings-section-head">
        <div className="settings-icon"><Icon size={18} /></div>
        <div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
      </div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Profile
  const [name,       setName]       = useState(user?.name ?? "");
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg,    setProfMsg]    = useState({ type: "", text: "" });

  // Password
  const [curPw,   setCurPw]   = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confPw,  setConfPw]  = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [pwSaving,setPwSaving]= useState(false);
  const [pwMsg,   setPwMsg]   = useState({ type: "", text: "" });

  async function saveProfile(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setProfSaving(true);
    setProfMsg({ type: "", text: "" });
    try {
      const d = await authApi.profile({ name: name.trim() });
      updateUser(d.user);
      setProfMsg({ type: "success", text: "Profile updated." });
    } catch (err) {
      setProfMsg({ type: "error", text: err.message });
    } finally {
      setProfSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (newPw !== confPw) { setPwMsg({ type: "error", text: "New passwords do not match." }); return; }
    if (newPw.length < 8) { setPwMsg({ type: "error", text: "New password must be at least 8 characters." }); return; }
    setPwSaving(true);
    try {
      await authApi.profile({ currentPassword: curPw, newPassword: newPw });
      setCurPw(""); setNewPw(""); setConfPw("");
      setPwMsg({ type: "success", text: "Password changed successfully." });
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1>Settings</h1>
          <p>Manage your profile and account security.</p>
        </div>
      </div>

      <div className="settings-layout">

        {/* Profile */}
        <Section icon={User} title="Profile" desc="Update your display name.">
          <form onSubmit={saveProfile} className="settings-form">
            <label>
              Display name
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
              />
            </label>
            <label>
              Email address
              <input value={user?.email ?? ""} readOnly disabled />
              <small className="field-hint">Email cannot be changed in this version.</small>
            </label>
            {profMsg.text && (
              <div className={profMsg.type === "success" ? "success-banner" : "form-error-banner"}>
                {profMsg.text}
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={profSaving}>
              {profSaving ? <Loader2 size={15} className="spin" /> : <><Save size={15} /> Save profile</>}
            </button>
          </form>
        </Section>

        {/* Password */}
        <Section icon={Shield} title="Password" desc="Change your account password. You will need your current password.">
          <form onSubmit={changePassword} className="settings-form">
            <label>
              Current password
              <div className="pw-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  value={curPw}
                  onChange={e => setCurPw(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Your current password"
                />
                <button type="button" className="pw-toggle" aria-label={showPw ? "Hide" : "Show"} onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            <label>
              New password
              <input
                type={showPw ? "text" : "password"}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </label>
            <label>
              Confirm new password
              <input
                type={showPw ? "text" : "password"}
                value={confPw}
                onChange={e => setConfPw(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
            </label>
            {pwMsg.text && (
              <div className={pwMsg.type === "success" ? "success-banner" : "form-error-banner"}>
                {pwMsg.text}
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={pwSaving}>
              {pwSaving ? <Loader2 size={15} className="spin" /> : <><Shield size={15} /> Change password</>}
            </button>
          </form>
        </Section>

        {/* Sign out */}
        <Section icon={LogOut} title="Sign out" desc="Log out of ExamPilot NG on this device.">
          <div className="settings-form">
            <p style={{ fontSize: "12px", color: "#5b6578", margin: "0 0 16px", lineHeight: 1.7 }}>
              Signing out will clear your session. Your data stays safely in the database.
            </p>
            <button className="btn btn-danger" onClick={handleLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </Section>

      </div>
    </section>
  );
}
