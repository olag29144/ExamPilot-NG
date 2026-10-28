import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import {
  Activity, BookOpen, BrainCircuit, CalendarDays, ChevronRight, FileText,
  GraduationCap, LayoutDashboard, ListChecks, LogOut, Menu, MoreHorizontal,
  Settings, Sparkles, Target, TrendingUp, X, Flame, Check
} from "lucide-react";

import { AuthProvider, ProtectedRoute, PublicOnlyRoute, useAuth } from "./lib/auth.jsx";

import Landing   from "./pages/Landing.jsx";
import Login     from "./pages/Login.jsx";
import Register  from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Courses   from "./pages/Courses.jsx";
import Materials from "./pages/Materials.jsx";
import Assistant from "./pages/Assistant.jsx";
import Questions from "./pages/Questions.jsx";
import CBT       from "./pages/CBT.jsx";
import Results   from "./pages/Results.jsx";
import Performance from "./pages/Performance.jsx";
import Planner   from "./pages/Planner.jsx";
import SettingsPage from "./pages/Settings.jsx";

import "./styles.css";

const NAV = [
  { to: "/dashboard",   label: "Dashboard",         icon: LayoutDashboard, group: "STUDY SPACE" },
  { to: "/courses",     label: "My courses",         icon: BookOpen,        group: "STUDY SPACE" },
  { to: "/materials",   label: "Study materials",    icon: FileText,        group: "STUDY SPACE" },
  { to: "/assistant",   label: "AI study buddy",     icon: BrainCircuit,    group: "LEARN & PRACTISE" },
  { to: "/questions",   label: "Question bank",      icon: ListChecks,      group: "LEARN & PRACTISE" },
  { to: "/cbt",         label: "CBT practice",       icon: Target,          group: "LEARN & PRACTISE" },
  { to: "/planner",     label: "Revision planner",   icon: CalendarDays,    group: "LEARN & PRACTISE" },
  { to: "/performance", label: "Progress",           icon: TrendingUp,      group: "YOUR JOURNEY" },
];

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = [...new Set(NAV.map(n => n.group))];
  const initial = user?.name?.[0]?.toUpperCase() ?? "S";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <>
      {open && (
        <button className="mobile-scrim" aria-label="Close navigation" onClick={onClose} />
      )}
      <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
        <NavLink to="/dashboard" className="brand" onClick={onClose}>
          <span className="brand-mark"><GraduationCap size={23} /></span>
          <span>ExamPilot <b>NG</b><small>YOUR STUDY COMPANION</small></span>
        </NavLink>

        <div className="workspace">
          <div className="workspace-icon">{initial}</div>
          <div>
            <strong>{user?.name ?? "My workspace"}</strong>
            <small>Personal learning space</small>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {groups.map(group => (
            <div className="nav-group" key={group}>
              <div className="nav-caption">{group}</div>
              {NAV.filter(n => n.group === group).map(n => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  onClick={onClose}
                >
                  <n.icon size={18} />
                  <span>{n.label}</span>
                  {n.to === "/cbt" && <span className="nav-new">GO</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="streak-card">
            <div className="streak-icon"><Flame size={19} /></div>
            <div>
              <strong>Keep your streak going!</strong>
              <p>A little revision every day adds up.</p>
              <div className="streak-days">
                {["M","T","W","T","F","S","S"].map((d,i) => (
                  <span className={i < 3 ? "day-done" : ""} key={i}>
                    {i < 3 ? <Check size={11} /> : d}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`} onClick={onClose}>
            <Settings size={18} /><span>Settings</span>
          </NavLink>
          <div className="profile-mini">
            <div className="avatar">{initial}</div>
            <div>
              <strong>{user?.name ?? "Student"}</strong>
              <small>{user?.email ?? "Keep learning"}</small>
            </div>
            <button className="icon-button" aria-label="Log out" onClick={handleLogout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const initial = user?.name?.[0]?.toUpperCase() ?? "S";

  return (
    <div className="app">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="main">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{user?.name ?? "Dashboard"}</strong>
          </div>
          <div className="top-actions">
            <div className="top-avatar" aria-hidden="true">{initial}</div>
          </div>
        </header>
        <div className="page-content">
          <Routes>
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/courses"     element={<Courses />} />
            <Route path="/materials"   element={<Materials />} />
            <Route path="/assistant"   element={<Assistant />} />
            <Route path="/questions"   element={<Questions />} />
            <Route path="/cbt"         element={<CBT />} />
            <Route path="/cbt/results/:id" element={<Results />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/planner"     element={<Planner />} />
            <Route path="/settings"    element={<SettingsPage />} />
            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
          <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<App />);
