const BASE = "/api";

function getStoredUserId() {
  try {
    return localStorage.getItem("exampilot_uid") || "";
  } catch {
    return "";
  }
}

export function setStoredUserId(id) {
  try {
    if (id) {
      localStorage.setItem("exampilot_uid", id);
    } else {
      localStorage.removeItem("exampilot_uid");
    }
  } catch {
    // Ignore storage restrictions
  }
}

async function request(path, opts = {}) {
  const uid = getStoredUserId();
  const headers = {
    "Content-Type": "application/json",
    ...(uid ? { "X-User-Id": uid } : {}),
    ...opts.headers
  };
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  me:       ()         => request("/auth/me"),
  login:    async body => {
    const data = await request("/auth/login", { method: "POST", body: JSON.stringify(body) });
    if (data?.user?.id) setStoredUserId(data.user.id);
    return data;
  },
  register: async body => {
    const data = await request("/auth/register", { method: "POST", body: JSON.stringify(body) });
    if (data?.user?.id) setStoredUserId(data.user.id);
    return data;
  },
  logout:   async ()   => {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      setStoredUserId(null);
    }
  },
  profile:  body       => request("/auth/profile",  { method: "PATCH", body: JSON.stringify(body) }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboard = {
  get: () => request("/dashboard"),
};

// ── Courses ───────────────────────────────────────────────────────────────────
export const courses = {
  list:   ()        => request("/courses"),
  get:    id        => request(`/courses/${id}`),
  create: body      => request("/courses",      { method: "POST",  body: JSON.stringify(body) }),
  update: (id, body)=> request(`/courses/${id}`,{ method: "PATCH", body: JSON.stringify(body) }),
  remove: id        => request(`/courses/${id}`,{ method: "DELETE" }),
};

// ── Materials ─────────────────────────────────────────────────────────────────
export const materials = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/materials${qs ? "?" + qs : ""}`);
  },
  get:    id        => request(`/materials/${id}`),
  create: body      => request("/materials",      { method: "POST",  body: JSON.stringify(body) }),
  update: (id, body)=> request(`/materials/${id}`,{ method: "PATCH", body: JSON.stringify(body) }),
  remove: id        => request(`/materials/${id}`,{ method: "DELETE" }),
  upload: formData  => {
    const uid = getStoredUserId();
    return fetch(`${BASE}/materials/upload`, {
      method: "POST",
      credentials: "include",
      headers: uid ? { "X-User-Id": uid } : {},
      body: formData,
    }).then(async r => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Upload failed");
      return d;
    });
  },
};

// ── AI Conversations ──────────────────────────────────────────────────────────
export const conversations = {
  list:     ()         => request("/conversations"),
  create:   body       => request("/conversations", { method: "POST", body: JSON.stringify(body) }),
  messages: id         => request(`/conversations/${id}/messages`),
  ask:      (id, body) => request(`/conversations/${id}/ask`, { method: "POST", body: JSON.stringify(body) }),
  saveMsg:  id         => request(`/messages/${id}/save`, { method: "PATCH", body: JSON.stringify({}) }),
};

// ── Questions ─────────────────────────────────────────────────────────────────
export const questions = {
  list:     (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/questions${qs ? "?" + qs : ""}`);
  },
  generate: body => request("/questions/generate", { method: "POST", body: JSON.stringify(body) }),
  remove:   id   => request(`/questions/${id}`,    { method: "DELETE" }),
};

// ── Attempts ──────────────────────────────────────────────────────────────────
export const attempts = {
  active:  ()           => request("/attempts/active"),
  list:    ()           => request("/attempts"),
  start:   body         => request("/attempts",             { method: "POST",  body: JSON.stringify(body) }),
  answer:  (id, body)   => request(`/attempts/${id}/answer`,{ method: "PATCH", body: JSON.stringify(body) }),
  submit:  id           => request(`/attempts/${id}/submit`,{ method: "POST",  body: JSON.stringify({}) }),
  result:  id           => request(`/attempts/${id}/result`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasks = {
  list:   (filter = "all") => request(`/tasks?filter=${filter}`),
  create: body             => request("/tasks",      { method: "POST",   body: JSON.stringify(body) }),
  update: (id, body)       => request(`/tasks/${id}`,{ method: "PATCH",  body: JSON.stringify(body) }),
  remove: id               => request(`/tasks/${id}`,{ method: "DELETE" }),
};

// ── Performance ───────────────────────────────────────────────────────────────
export const performance = {
  get: () => request("/performance"),
};
