import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, BrainCircuit,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Command, FileText, Flame, GraduationCap, LayoutDashboard,
  ListChecks, LogOut, Menu, MessageCircle, MoreHorizontal, Plus, Search, Send,
  Settings, Sparkles, Target, TrendingUp, Trophy, Upload, X, Zap
} from "lucide-react";
import "./styles.css";

const starterCourses = [
  { id: "c1", name: "Computer Science", code: "CSC 301", color: "blue", progress: 72, materials: 8 },
  { id: "c2", name: "Mathematics", code: "MTH 203", color: "teal", progress: 54, materials: 5 },
  { id: "c3", name: "Physics", code: "PHY 201", color: "orange", progress: 38, materials: 4 }
];
const starterTasks = [
  { id: "t1", title: "Revise data structures", course: "Computer Science", date: "Today", done: false },
  { id: "t2", title: "Practise integration problems", course: "Mathematics", date: "Today", done: false },
  { id: "t3", title: "Review wave motion notes", course: "Physics", date: "Tomorrow", done: true }
];
const questions = [
  { topic: "Data Structures", q: "Which data structure follows the Last In, First Out (LIFO) principle?", options: ["Queue", "Stack", "Linked list", "Tree"], answer: 1, explanation: "A stack removes the most recently added item first, following LIFO." },
  { topic: "Programming", q: "Which of these is commonly used to check a condition in JavaScript?", options: ["if statement", "import statement", "return type", "package lock"], answer: 0, explanation: "An if statement runs a block of code when its condition evaluates to true." },
  { topic: "Algorithms", q: "What is the average time complexity of binary search on a sorted array?", options: ["O(n)", "O(n²)", "O(log n)", "O(1)"], answer: 2, explanation: "Binary search halves the remaining search interval each step, giving logarithmic time." },
  { topic: "Databases", q: "What does SQL primarily help you do?", options: ["Style a webpage", "Query and manage relational data", "Compile C++", "Compress images"], answer: 1, explanation: "SQL is used to define, query, and manipulate data in relational database systems." }
];
const initialMaterials = [
  { id: "m1", title: "Introduction to Data Structures", course: "Computer Science", kind: "Lecture notes", date: "Oct 24" },
  { id: "m2", title: "Integration Techniques", course: "Mathematics", kind: "Personal summary", date: "Oct 22" },
  { id: "m3", title: "Wave Motion — Week 4", course: "Physics", kind: "Lecture notes", date: "Oct 20" }
];
const readStore = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

function App() {
  const [page, setPage] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [courses, setCourses] = useState(() => readStore("ep-courses", starterCourses));
  const [tasks, setTasks] = useState(() => readStore("ep-tasks", starterTasks));
  const [materials, setMaterials] = useState(() => readStore("ep-materials", initialMaterials));
  const [history, setHistory] = useState(() => readStore("ep-history", []));
  const [query, setQuery] = useState("");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [toast, setToast] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialCourse, setMaterialCourse] = useState("Computer Science");
  const [materialText, setMaterialText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCourse, setTaskCourse] = useState("Computer Science");
  const [taskDate, setTaskDate] = useState("Today");
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [seconds, setSeconds] = useState(180);
  const [chat, setChat] = useState([{ role: "assistant", content: "Hi! I’m your study partner. Ask me to explain a topic, simplify your notes, or help you plan a revision session." }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => { localStorage.setItem("ep-courses", JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem("ep-tasks", JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem("ep-materials", JSON.stringify(materials)); }, [materials]);
  useEffect(() => { localStorage.setItem("ep-history", JSON.stringify(history)); }, [history]);
  useEffect(() => {
    if (!quizStarted || quizFinished) return;
    if (seconds <= 0) { finishQuiz(); return; }
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [quizStarted, quizFinished, seconds]);

  const notify = (message) => { setToast(message); setTimeout(() => setToast(""), 2600); };
  const go = (next) => { setPage(next); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const completedTasks = tasks.filter(t => t.done).length;
  const average = history.length ? Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length) : null;
  const filteredMaterials = materials.filter(m => `${m.title} ${m.course}`.toLowerCase().includes(query.toLowerCase()));
  const timeLabel = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  function addCourse(e) {
    e.preventDefault();
    if (!courseName.trim()) return;
    setCourses(prev => [...prev, { id: crypto.randomUUID(), name: courseName.trim(), code: courseCode.trim() || "NEW 101", color: ["blue", "teal", "orange"][prev.length % 3], progress: 0, materials: 0 }]);
    setCourseName(""); setCourseCode(""); setShowCourseForm(false); notify("Course added");
  }
  function addMaterial(e) {
    e.preventDefault();
    if (!materialTitle.trim()) return;
    setMaterials(prev => [{ id: crypto.randomUUID(), title: materialTitle.trim(), course: materialCourse, kind: "My notes", date: "Just now", content: materialText }, ...prev]);
    setMaterialTitle(""); setMaterialText(""); setShowMaterialForm(false); notify("Study material saved");
  }
  function addTask(e) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setTasks(prev => [{ id: crypto.randomUUID(), title: taskTitle.trim(), course: taskCourse, date: taskDate, done: false }, ...prev]);
    setTaskTitle(""); setShowTaskForm(false); notify("Revision task added");
  }
  function finishQuiz() {
    if (quizFinished) return;
    const score = Math.round(questions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0) / questions.length * 100);
    setHistory(prev => [{ id: crypto.randomUUID(), title: "Quick practice", score, date: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short" }), total: questions.length }, ...prev]);
    setQuizFinished(true); setQuizStarted(false);
  }
  function resetQuiz() { setQuizIndex(0); setAnswers({}); setQuizStarted(false); setQuizFinished(false); setSeconds(180); }
  async function sendChat(e) {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || chatLoading) return;
    setChat(prev => [...prev, { role: "user", content: prompt }]); setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("/api/ai/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI service is not configured yet.");
      setChat(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setChat(prev => [...prev, { role: "assistant", content: `${err.message || "The AI service is unavailable."} You can still use courses, notes, practice, and planner offline. For AI replies, configure the server key in the README.` }]);
    } finally { setChatLoading(false); }
  }

  const nav = [
    { label: "Dashboard", icon: LayoutDashboard, group: "STUDY SPACE" },
    { label: "My courses", icon: BookOpen, group: "STUDY SPACE" },
    { label: "Study materials", icon: FileText, group: "STUDY SPACE" },
    { label: "AI study buddy", icon: BrainCircuit, group: "LEARN & PRACTISE" },
    { label: "CBT practice", icon: Target, group: "LEARN & PRACTISE" },
    { label: "Revision planner", icon: CalendarDays, group: "LEARN & PRACTISE" },
    { label: "Progress", icon: TrendingUp, group: "YOUR JOURNEY" }
  ];
  const groups = [...new Set(nav.map(n => n.group))];

  return <div className="app">
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <button className="brand" onClick={() => go("Dashboard")}><span className="brand-mark"><GraduationCap size={23}/></span><span>ExamPilot <b>NG</b><small>YOUR STUDY COMPANION</small></span></button>
      <div className="workspace"><div className="workspace-icon">U</div><div><strong>My workspace</strong><small>Personal learning space</small></div><ChevronDown size={15}/></div>
      <nav className="side-nav">
        {groups.map(group => <div className="nav-group" key={group}><div className="nav-caption">{group}</div>{nav.filter(n => n.group === group).map(n => <button key={n.label} className={`nav-item ${page === n.label ? "active" : ""}`} onClick={() => go(n.label)}><n.icon size={18}/><span>{n.label}</span>{n.label === "CBT practice" && <span className="nav-new">GO</span>}</button>)}</div>)}
      </nav>
      <div className="sidebar-bottom"><div className="streak-card"><div className="streak-icon"><Flame size={19}/></div><div><strong>Keep your streak going!</strong><p>A little revision every day adds up.</p><div className="streak-days">{["M","T","W","T","F","S","S"].map((d,i)=><span className={i<3?"day-done":""} key={i}>{i<3?<Check size={11}/>:d}</span>)}</div></div></div><button className="nav-item" onClick={() => go("Settings")}><Settings size={18}/><span>Settings</span></button><div className="profile-mini"><div className="avatar">S</div><div><strong>Student account</strong><small>Keep learning</small></div><MoreHorizontal size={18}/></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><button className="icon-button menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{page}</strong></div><div className="top-actions"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your materials..." aria-label="Search materials"/><kbd>⌘ K</kbd></div><button className="icon-button notification" aria-label="Notifications" onClick={()=>notify("You're all caught up!")}><Activity size={19}/><i/></button><div className="top-avatar">S</div></div></header>
      <div className="page-content">
        {page === "Dashboard" && <Dashboard courses={courses} tasks={tasks} history={history} average={average} completedTasks={completedTasks} go={go} toggleTask={id=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t))} />}
        {page === "My courses" && <section><PageHeading eyebrow="YOUR LEARNING LIBRARY" title="My courses" subtitle="Keep your semester organised, one course at a time." action={<button className="btn btn-primary" onClick={()=>setShowCourseForm(true)}><Plus size={17}/> Add course</button>}/><div className="course-grid">{courses.map(c=><article className="course-card" key={c.id}><div className={`course-art ${c.color}`}><BookOpen size={28}/><span>{c.code}</span></div><div className="course-card-body"><span className="eyebrow">{c.code}</span><h3>{c.name}</h3><p>{materials.filter(m=>m.course===c.name).length} study materials · Self-paced</p><div className="progress-label"><span>Study progress</span><strong>{c.progress}%</strong></div><div className="progress-track"><span style={{width:`${c.progress}%`}}/></div><button className="text-button" onClick={()=>{setMaterialCourse(c.name);setShowMaterialForm(true);}}>Add study material <ArrowRight size={15}/></button></div></article>)}
        <button className="add-course-card" onClick={()=>setShowCourseForm(true)}><span><Plus size={23}/></span><strong>Add another course</strong><small>Build your personal study library</small></button></div></section>}
        {page === "Study materials" && <section><PageHeading eyebrow="YOUR KNOWLEDGE BASE" title="Study materials" subtitle="Your notes, summaries, and learning resources in one place." action={<button className="btn btn-primary" onClick={()=>setShowMaterialForm(true)}><Plus size={17}/> Add material</button>}/><div className="filter-row"><div className="search-box wide"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles or courses..."/></div><span className="muted">{filteredMaterials.length} materials</span></div><div className="materials-list">{filteredMaterials.map(m=><article className="material-row" key={m.id}><div className="material-icon"><FileText size={21}/></div><div className="material-info"><strong>{m.title}</strong><p>{m.course} <span>·</span> {m.kind}</p></div><time>{m.date}</time><button className="icon-button" aria-label="Delete material" onClick={()=>{setMaterials(p=>p.filter(x=>x.id!==m.id));notify("Material removed");}}><X size={17}/></button></article>)}{!filteredMaterials.length&&<Empty icon={FileText} title="No materials found" text="Try a different search or add your first study note."/>}</div></section>}
        {page === "AI study buddy" && <section className="assistant-page"><PageHeading eyebrow="LEARN WITH AI" title="Your study buddy" subtitle="Ask questions, get simple explanations, and learn at your own pace."/><div className="chat-panel"><div className="chat-head"><div className="ai-avatar"><Sparkles size={21}/></div><div><strong>ExamPilot AI</strong><small><span className="online-dot"/> Study assistant · Nigerian curriculum friendly</small></div><span className="powered-tag">AI ASSISTANT</span></div><div className="chat-messages">{chat.map((m,i)=><div key={i} className={`chat-message ${m.role}`}><div className="message-avatar">{m.role==="assistant"?<Sparkles size={16}/>:<span>S</span>}</div><div className="message-bubble">{m.content}</div></div>)}{chatLoading&&<div className="chat-message assistant"><div className="message-avatar"><Sparkles size={16}/></div><div className="message-bubble typing"><i/><i/><i/></div></div>}</div><div className="prompt-chips">{["Explain this simply","Give me an example","Create a revision plan"].map(t=><button key={t} onClick={()=>setChatInput(t)}>{t}</button>)}</div><form className="chat-form" onSubmit={sendChat}><input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask anything about your studies..." aria-label="Ask your study buddy"/><button className="send-button" disabled={!chatInput.trim()||chatLoading} aria-label="Send message"><Send size={18}/></button></form><p className="ai-disclaimer">Use AI as a study aid. Always verify important details with your lecture notes and lecturers.</p></div></section>}
        {page === "CBT practice" && <section><PageHeading eyebrow="TEST YOUR KNOWLEDGE" title="CBT practice" subtitle="Build confidence with a timed practice session."/><div className="cbt-layout"><div className="cbt-main">{!quizStarted&&!quizFinished?<div className="practice-intro"><div className="practice-illustration"><Target size={36}/></div><span className="eyebrow">QUICK PRACTICE</span><h2>Ready to test yourself?</h2><p>Try a short sample quiz to practise answering under pressure. These are sample practice questions, not official exam questions.</p><div className="practice-details"><span><ListChecks size={17}/> {questions.length} questions</span><span><Clock3 size={17}/> 3 minutes</span><span><Zap size={17}/> Mixed topics</span></div><button className="btn btn-primary btn-large" onClick={()=>{resetQuiz();setQuizStarted(true);}}>Start practice <ArrowRight size={17}/></button></div>:quizFinished?<div className="result-card"><div className="result-medal"><Trophy size={34}/></div><span className="eyebrow">PRACTICE COMPLETE</span><h2>{Math.round(questions.reduce((s,q,i)=>s+(answers[i]===q.answer?1:0),0)/questions.length*100)}% score</h2><p>You answered {questions.reduce((s,q,i)=>s+(answers[i]===q.answer?1:0),0)} out of {questions.length} questions correctly.</p><div className="review-answers">{questions.map((q,i)=><div key={q.q} className="review-item"><span className={answers[i]===q.answer?"review-correct":"review-wrong"}>{answers[i]===q.answer?<CheckCircle2 size={17}/>:<X size={17}/>}</span><div><strong>{q.q}</strong><p>Correct answer: {q.options[q.answer]}</p><small>{q.explanation}</small></div></div>)}</div><button className="btn btn-primary" onClick={resetQuiz}>Practise again <ArrowRight size={16}/></button></div>:<div className="question-card"><div className="question-top"><span className="eyebrow">QUESTION {quizIndex+1} OF {questions.length}</span><span className={`timer ${seconds<30?"timer-low":""}`}><Clock3 size={15}/>{timeLabel}</span></div><div className="progress-track quiz-progress"><span style={{width:`${(quizIndex+1)/questions.length*100}%`}}/></div><span className="topic-tag">{questions[quizIndex].topic}</span><h2>{questions[quizIndex].q}</h2><div className="answer-options">{questions[quizIndex].options.map((o,i)=><button key={o} className={`answer-option ${answers[quizIndex]===i?"selected":""}`} onClick={()=>setAnswers(p=>({...p,[quizIndex]:i}))}><span className="option-letter">{String.fromCharCode(65+i)}</span>{o}{answers[quizIndex]===i&&<Check size={17}/>}</button>)}</div><div className="question-footer"><button className="btn btn-outline" disabled={quizIndex===0} onClick={()=>setQuizIndex(i=>i-1)}><ChevronLeft size={16}/> Previous</button><span>{Object.keys(answers).length} of {questions.length} answered</span>{quizIndex<questions.length-1?<button className="btn btn-primary" onClick={()=>setQuizIndex(i=>i+1)}>Next <ChevronRight size={16}/></button>:<button className="btn btn-primary" onClick={finishQuiz}>Submit quiz <Check size={16}/></button>}</div></div>}</div><aside className="cbt-side"><div className="side-info-card"><div className="side-info-icon"><BrainCircuit size={20}/></div><h3>Practice makes progress</h3><p>Short, consistent practice helps you identify what you know and what needs more revision.</p></div><div className="side-info-card"><h3>Recent attempts</h3>{history.slice(0,4).map(h=><div className="attempt-row" key={h.id}><div><strong>{h.title}</strong><small>{h.date}</small></div><b>{h.score}%</b></div>)}{!history.length&&<p className="muted">Your completed practice sessions will appear here.</p>}</div></aside></div></section>}
        {page === "Revision planner" && <section><PageHeading eyebrow="MAKE TIME TO LEARN" title="Revision planner" subtitle="Small, focused sessions can make a big difference." action={<button className="btn btn-primary" onClick={()=>setShowTaskForm(true)}><Plus size={17}/> Add task</button>}/><div className="planner-summary"><div><span className="summary-icon"><CalendarDays size={19}/></span><small>Total tasks</small><strong>{tasks.length}</strong></div><div><span className="summary-icon green"><CheckCircle2 size={19}/></span><small>Completed</small><strong>{completedTasks}</strong></div><div><span className="summary-icon amber"><Target size={19}/></span><small>Remaining</small><strong>{tasks.length-completedTasks}</strong></div></div><div className="task-panel"><div className="panel-heading"><div><h3>Your revision tasks</h3><p>Check tasks off as you finish them.</p></div><span className="muted">{tasks.length?Math.round(completedTasks/tasks.length*100):0}% complete</span></div><div className="progress-track"><span style={{width:`${tasks.length?completedTasks/tasks.length*100:0}%`}}/></div>{tasks.map(t=><div className={`task-row ${t.done?"task-done":""}`} key={t.id}><button className={`task-check ${t.done?"checked":""}`} aria-label={t.done?"Mark incomplete":"Mark complete"} onClick={()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,done:!x.done}:x))}>{t.done&&<Check size={14}/>}</button><div className="task-text"><strong>{t.title}</strong><small>{t.course}</small></div><span className={`task-date ${t.date==="Today"?"today":""}`}>{t.date}</span><button className="icon-button" aria-label="Delete task" onClick={()=>setTasks(p=>p.filter(x=>x.id!==t.id))}><X size={16}/></button></div>)}{!tasks.length&&<Empty icon={CalendarDays} title="Your plan is clear" text="Add a revision task to get started."/>}</div></section>}
        {page === "Progress" && <section><PageHeading eyebrow="YOUR LEARNING JOURNEY" title="Progress overview" subtitle="Use your practice history to guide what you revise next."/><div className="stats-grid"><Stat icon={Target} label="Practice attempts" value={history.length} tone="blue"/><Stat icon={TrendingUp} label="Average score" value={average===null?"—":`${average}%`} tone="green"/><Stat icon={BookOpen} label="Courses" value={courses.length} tone="purple"/><Stat icon={CheckCircle2} label="Tasks completed" value={completedTasks} tone="orange"/></div><div className="task-panel history-panel"><div className="panel-heading"><div><h3>Practice history</h3><p>Your recorded practice scores.</p></div></div>{history.map(h=><div className="history-row" key={h.id}><div className="history-icon"><Activity size={18}/></div><div><strong>{h.title}</strong><small>{h.date} · {h.total} questions</small></div><div className="history-score"><strong>{h.score}%</strong><span className="progress-track"><span style={{width:`${h.score}%`}}/></span></div></div>)}{!history.length&&<Empty icon={TrendingUp} title="Your progress starts here" text="Complete a CBT practice session and your score will show up here."/>}</div></section>}
        {page === "Settings" && <section><PageHeading eyebrow="PREFERENCES" title="Settings" subtitle="A few details to make your study space feel like yours."/><div className="task-panel settings-panel"><div className="settings-profile"><div className="profile-large">S</div><div><h3>Student account</h3><p>Your personal ExamPilot NG workspace</p></div></div><div className="setting-row"><div><strong>Study reminders</strong><p>Keep your revision plan moving with regular check-ins.</p></div><span className="setting-pill">Planner enabled</span></div><div className="setting-row"><div><strong>Local data</strong><p>Your demo courses, tasks, and scores are stored in this browser.</p></div><button className="btn btn-outline" onClick={()=>{if(confirm("Clear all locally saved ExamPilot demo data?")){["ep-courses","ep-tasks","ep-materials","ep-history"].forEach(k=>localStorage.removeItem(k));location.reload();}}}>Clear data</button></div></div></section>}
      </div>
    </main>

    {(showCourseForm||showMaterialForm||showTaskForm)&&<div className="modal-backdrop" onClick={()=>{setShowCourseForm(false);setShowMaterialForm(false);setShowTaskForm(false);}}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>{showCourseForm?"Add a course":showMaterialForm?"Add study material":"Add revision task"}</h2></div><button className="icon-button" onClick={()=>{setShowCourseForm(false);setShowMaterialForm(false);setShowTaskForm(false);}}><X size={19}/></button></div>{showCourseForm&&<form onSubmit={addCourse} className="modal-form"><label>Course name<input required autoFocus value={courseName} onChange={e=>setCourseName(e.target.value)} placeholder="e.g. Introduction to Biology"/></label><label>Course code<input value={courseCode} onChange={e=>setCourseCode(e.target.value)} placeholder="e.g. BIO 101"/></label><button className="btn btn-primary btn-full">Save course</button></form>}{showMaterialForm&&<form onSubmit={addMaterial} className="modal-form"><label>Material title<input required autoFocus value={materialTitle} onChange={e=>setMaterialTitle(e.target.value)} placeholder="e.g. Week 2 lecture notes"/></label><label>Course<select value={materialCourse} onChange={e=>setMaterialCourse(e.target.value)}>{courses.map(c=><option key={c.id}>{c.name}</option>)}</select></label><label>Paste your notes<textarea value={materialText} onChange={e=>setMaterialText(e.target.value)} placeholder="Paste lecture notes or a short summary here..." rows={5}/></label><button className="btn btn-primary btn-full"><Upload size={16}/> Save material</button></form>}{showTaskForm&&<form onSubmit={addTask} className="modal-form"><label>Task description<input required autoFocus value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="e.g. Revise past questions"/></label><label>Course<select value={taskCourse} onChange={e=>setTaskCourse(e.target.value)}>{courses.map(c=><option key={c.id}>{c.name}</option>)}</select></label><label>When<select value={taskDate} onChange={e=>setTaskDate(e.target.value)}><option>Today</option><option>Tomorrow</option><option>This week</option><option>Next week</option></select></label><button className="btn btn-primary btn-full">Add to planner</button></form>}</div></div>}
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}

function PageHeading({eyebrow,title,subtitle,action}) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action&&<div className="heading-action">{action}</div>}</div>; }
function Stat({icon:Icon,label,value,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><span>{label}</span><strong>{value}</strong></div>; }
function Empty({icon:Icon,title,text}) { return <div className="empty-state"><span><Icon size={23}/></span><strong>{title}</strong><p>{text}</p></div>; }

function Dashboard({courses,tasks,history,average,completedTasks,go,toggleTask}) {
  const pending=tasks.filter(t=>!t.done).slice(0,3);
  return <section className="dashboard"><div className="welcome-row"><div><div className="welcome-date"><span className="live-dot"/> YOUR STUDY SPACE <span>·</span> {new Date().toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long"})}</div><h1>Small steps, <em>big results.</em></h1><p>Every focused session gets you closer to your goals. Let’s make today count.</p></div><div className="welcome-graphic"><div className="graphic-ring ring-one"/><div className="graphic-ring ring-two"/><div className="graphic-book"><GraduationCap size={45}/></div><span className="graphic-star star-a">✳</span><span className="graphic-star star-b">✦</span></div></div>
    <div className="hero-quick"><div className="quick-copy"><span className="hero-kicker"><Sparkles size={14}/> YOUR NEXT STEP</span><h2>Turn your notes into knowledge.</h2><p>Save your lecture notes, practise what you’ve learnt, and discover where to focus next.</p><button className="btn btn-light" onClick={()=>go("Study materials")}>Open study materials <ArrowRight size={16}/></button></div><div className="quick-art"><div className="paper paper-back"/><div className="paper paper-front"><span>STUDY SESSION</span><i/><i/><i/><b>✓</b></div><div className="floating-badge"><Zap size={14}/> Focus time</div></div></div>
    <div className="stats-grid"><Stat icon={BookOpen} label="My courses" value={courses.length} tone="blue"/><Stat icon={FileText} label="Study materials" value={readStore("ep-materials",initialMaterials).length} tone="purple"/><Stat icon={Target} label="Practice attempts" value={history.length} tone="orange"/><Stat icon={TrendingUp} label="Average score" value={average===null?"—":`${average}%`} tone="green"/></div>
    <div className="dashboard-grid"><div className="content-panel courses-panel"><div className="panel-heading"><div><h3>Pick up where you left off</h3><p>Your courses, ready when you are.</p></div><button className="text-button" onClick={()=>go("My courses")}>All courses <ArrowRight size={15}/></button></div><div className="mini-course-list">{courses.slice(0,3).map(c=><button className="mini-course" key={c.id} onClick={()=>go("Study materials")}><div className={`mini-course-icon ${c.color}`}><BookOpen size={19}/></div><div className="mini-course-main"><strong>{c.name}</strong><small>{c.code} · {readStore("ep-materials",initialMaterials).filter(m=>m.course===c.name).length} materials</small><div className="progress-track"><span style={{width:`${c.progress}%`}}/></div></div><span className="mini-percent">{c.progress}%</span><ChevronRight size={16}/></button>)}{!courses.length&&<Empty icon={BookOpen} title="Add your first course" text="Create a course to organise your study materials."/>}</div><button className="add-inline" onClick={()=>go("My courses")}><Plus size={16}/> Add a course</button></div>
      <div className="content-panel tasks-panel"><div className="panel-heading"><div><h3>Revision plan</h3><p>A little progress every day.</p></div><button className="icon-button" aria-label="View planner" onClick={()=>go("Revision planner")}><ArrowUpRight size={18}/></button></div><div className="task-progress-summary"><div className="task-progress-ring" style={{"--progress":`${tasks.length?completedTasks/tasks.length*100:0}%`}}><div><strong>{tasks.length?Math.round(completedTasks/tasks.length*100):0}%</strong><small>done</small></div></div><div><strong>{tasks.length-completedTasks} tasks left</strong><p>Keep your study streak alive.</p></div></div><div className="mini-task-list">{pending.map(t=><label className="mini-task" key={t.id}><button className="task-check" onClick={()=>toggleTask(t.id)} aria-label="Mark task complete"/><span><strong>{t.title}</strong><small>{t.date} · {t.course}</small></span></label>)}{!pending.length&&<p className="muted">You’re all caught up. Nice work!</p>}</div><button className="text-button" onClick={()=>go("Revision planner")}>View full planner <ArrowRight size={15}/></button></div>
    </div>
    <div className="bottom-grid"><div className="content-panel"><div className="panel-heading"><div><h3>Quick actions</h3><p>Make your next study session count.</p></div></div><div className="quick-actions"><button onClick={()=>go("AI study buddy")}><span className="action-icon violet"><BrainCircuit size={19}/></span><strong>Ask AI buddy</strong><small>Understand tricky topics</small><ArrowUpRight size={16}/></button><button onClick={()=>go("CBT practice")}><span className="action-icon coral"><Target size={19}/></span><strong>Start a practice</strong><small>Test what you know</small><ArrowUpRight size={16}/></button><button onClick={()=>go("Revision planner")}><span className="action-icon mint"><CalendarDays size={19}/></span><strong>Plan revision</strong><small>Stay on track</small><ArrowUpRight size={16}/></button></div></div><div className="content-panel recent-panel"><div className="panel-heading"><div><h3>Recent practice</h3><p>Your latest results.</p></div><button className="text-button" onClick={()=>go("Progress")}>View all <ArrowRight size={15}/></button></div>{history.slice(0,3).map(h=><div className="recent-row" key={h.id}><div className="recent-score-icon"><Trophy size={17}/></div><div><strong>{h.title}</strong><small>{h.date}</small></div><b>{h.score}%</b></div>)}{!history.length&&<div className="empty-small"><span><Activity size={19}/></span><p>Your completed practice scores will appear here.</p><button className="text-button" onClick={()=>go("CBT practice")}>Try a practice quiz <ArrowRight size={14}/></button></div>}</div></div>
    <footer className="app-footer"><span>ExamPilot NG</span><span>Made for your next breakthrough.</span><button onClick={()=>go("Settings")}>Settings <ArrowRight size={13}/></button></footer>
  </section>;
}

createRoot(document.getElementById("root")).render(<App/>);
