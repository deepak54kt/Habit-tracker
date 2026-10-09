import { useState, useEffect } from "react";

const STORAGE_KEY = "fixed-task-tracker-v5";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthDays(year, month) {
  const days = [];
  const total = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= total; d++) {
    days.push(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  }
  return days;
}

const LIGHT = {
  bg: "#F5F5F5", card: "#FFFFFF", border: "#E0E0E0",
  text: "#1A1A1A", sub: "#777777", input: "#FFFFFF",
  green: "#1D9E75", greenLight: "#E1F5EE", greenText: "#085041",
  green50: "#5DCAA5", green25: "#9FE1CB",
  tabActive: "#FFFFFF", tabBg: "#EBEBEB",
  red: "#E24B4A", blue: "#378ADD",
};

const DARK = {
  bg: "#111318", card: "#1E2128", border: "#2E3138",
  text: "#F0F0F0", sub: "#888888", input: "#16191F",
  green: "#1D9E75", greenLight: "#0D3529", greenText: "#5DCAA5",
  green50: "#1A6B54", green25: "#144D3C",
  tabActive: "#2A2E38", tabBg: "#16191F",
  red: "#FF6B6B", blue: "#5BA8F5",
};

export default function App() {
  const [dark, setDark] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [log, setLog] = useState({});
  const [view, setView] = useState("today");
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [loaded, setLoaded] = useState(false);

  const C = dark ? DARK : LIGHT;
  const today = getToday();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  useEffect(() => {
    document.documentElement.style.backgroundColor = C.bg;
    document.body.style.backgroundColor = C.bg;
    const root = document.getElementById("root");
    if (root) root.style.backgroundColor = C.bg;
  }, [dark, C.bg]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const d = JSON.parse(stored);
        if (Array.isArray(d.tasks)) setTasks(d.tasks);
        if (d.log && typeof d.log === "object") setLog(d.log);
        if (typeof d.dark === "boolean") setDark(d.dark);
      }
    } catch(e) { console.error("Load error:", e); }
    setLoaded(true);
  }, []);

  function persist(t, l, dk) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: t, log: l, dark: dk }));
      setSaveStatus("Saved ✓");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch(e) { setSaveStatus("Save failed!"); }
  }

  function toggleDark() {
    const nd = !dark;
    setDark(nd);
    persist(tasks, log, nd);
  }

  function toggle(taskId) {
    const key = `${today}__${taskId}`;
    const nl = { ...log, [key]: !log[key] };
    setLog(nl); persist(tasks, nl, dark);
  }

  function addTask() {
    const name = newTask.trim();
    if (!name) return;
    const updated = [...tasks, { id: Date.now().toString(), name }];
    setTasks(updated); setNewTask(""); persist(updated, log, dark);
  }

  function removeTask(id) {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated); persist(updated, log, dark);
  }

  function startEdit(t) { setEditingId(t.id); setEditVal(t.name); }

  function saveEdit(id) {
    const name = editVal.trim();
    if (!name) return;
    const updated = tasks.map(t => t.id === id ? { ...t, name } : t);
    setTasks(updated); setEditingId(null); setEditVal(""); persist(updated, log, dark);
  }

  const todayDone = tasks.filter(t => log[`${today}__${t.id}`]).length;
  const todayPct = tasks.length ? Math.round((todayDone / tasks.length) * 100) : 0;

  const monthDays = getMonthDays(year, month);
  const pastDays = monthDays.filter(d => d <= today);
  let mTotal = 0, mDone = 0;
  pastDays.forEach(d => tasks.forEach(t => { mTotal++; if (log[`${d}__${t.id}`]) mDone++; }));
  const monthPct = mTotal ? Math.round((mDone / mTotal) * 100) : 0;

  function dayPct(d) {
    if (!tasks.length) return -1;
    const done = tasks.filter(t => log[`${d}__${t.id}`]).length;
    return Math.round((done / tasks.length) * 100);
  }

  function cellBg(d) {
    const pct = dayPct(d);
    if (d > today) return "transparent";
    if (pct === 100) return C.green;
    if (pct >= 50) return C.green50;
    if (pct > 0) return C.green25;
    return C.input;
  }

  if (!loaded) return <div style={{padding:"2rem",color:"#888",fontSize:14,background:"#111",minHeight:"100vh"}}>Loading...</div>;

  const s = {
    wrap: { width: "100%", minHeight: "100vh", background: C.bg, padding: "1.25rem 1rem", fontFamily: "system-ui, sans-serif", transition: "background 0.3s" },
    card: { background: C.card, borderRadius: 12, padding: "1rem", border: `1px solid ${C.border}` },
    text: { color: C.text },
    sub: { color: C.sub },
    input: { width: "100%", boxSizing: "border-box", fontSize: 14, padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.input, color: C.text, outline: "none" },
    btn: (active) => ({ padding: "7px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: active ? 500 : 400, background: active ? C.tabActive : "transparent", color: active ? C.text : C.sub }),
  };

  return (
    <div style={s.wrap}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: C.text }}>Daily tracker</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sub }}>
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            {saveStatus && <p style={{ margin: "3px 0 0", fontSize: 11, color: C.green }}>{saveStatus}</p>}
          </div>
          {/* Dark/Light toggle */}
          <button onClick={toggleDark} title={dark ? "Switch to light" : "Switch to dark"} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 20, border: `1px solid ${C.border}`, background: C.card,
            color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s"
          }}>
            {dark ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke={C.text} strokeWidth="2"/>
                  <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={C.text} strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Light
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Dark
              </>
            )}
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
          {[
            { label: "Today", pct: todayPct, sub: `${todayDone} / ${tasks.length} tasks` },
            { label: now.toLocaleString("en-IN", { month: "long" }), pct: monthPct, sub: `${mDone} / ${mTotal} slots` }
          ].map((st, i) => (
            <div key={i} style={{ ...s.card }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: C.sub }}>{st.label}</p>
              <p style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 600, color: C.text }}>{st.pct}%</p>
              <div style={{ height: 6, background: C.bg, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${st.pct}%`, background: C.green, borderRadius: 99, transition: "width 0.4s" }}></div>
              </div>
              <p style={{ margin: "5px 0 0", fontSize: 11, color: C.sub }}>{st.sub}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1rem", background: C.tabBg, borderRadius: 10, padding: 4 }}>
          {[["today","Today"],["calendar","Calendar"],["manage","Manage"]].map(([v,label]) => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, ...s.btn(view === v) }}>{label}</button>
          ))}
        </div>

        {/* TODAY */}
        {view === "today" && (
          <div>
            {tasks.length === 0 && (
              <div style={{ ...s.card, textAlign: "center", padding: "2rem 1rem", color: C.sub, fontSize: 14 }}>
                No tasks yet. Go to <b style={{ color: C.text }}>Manage</b> to add your fixed tasks.
              </div>
            )}
            {tasks.map(t => {
              const done = !!log[`${today}__${t.id}`];
              return (
                <div key={t.id} onClick={() => toggle(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                  background: C.card, borderRadius: 10, marginBottom: 8,
                  border: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.2s"
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    border: done ? `2px solid ${C.green}` : `2px solid ${C.sub}`,
                    background: done ? C.green : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                  }}>
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, color: done ? C.sub : C.text, textDecoration: done ? "line-through" : "none" }}>{t.name}</span>
                  {done && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill={C.green}/>
                      <path d="M7 12l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              );
            })}
            {tasks.length > 0 && (
              <p style={{ textAlign: "center", fontSize: 12, color: C.sub, marginTop: 10 }}>Tap a task to mark done / undone</p>
            )}
          </div>
        )}

        {/* CALENDAR */}
        {view === "calendar" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              {[[C.green,"100%"],[C.green50,"≥50%"],[C.green25,">0%"]].map(([c,l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.sub }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: c, display: "inline-block" }}></span>{l}
                </span>
              ))}
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500, color: C.text }}>
              {now.toLocaleString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 4 }}>
              {["S","M","T","W","T","F","S"].map((d,i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 11, color: C.sub }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
              {Array(new Date(year, month, 1).getDay()).fill(null).map((_,i) => <div key={"off"+i}></div>)}
              {monthDays.map(d => {
                const isToday = d === today;
                const future = d > today;
                const pct = dayPct(d);
                return (
                  <div key={d} title={future ? "" : pct === 100 ? "All done!" : pct > 0 ? `${pct}% done` : "Nothing done"} style={{
                    aspectRatio: "1", borderRadius: 7,
                    background: cellBg(d),
                    border: isToday ? `2px solid ${C.green}` : `1px solid ${C.border}`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    opacity: future ? 0.3 : 1, gap: 1
                  }}>
                    <span style={{ fontSize: 11, fontWeight: isToday ? 600 : 400, color: pct > 0 && !future ? C.greenText : C.sub }}>
                      {new Date(d + "T00:00:00").getDate()}
                    </span>
                    {!future && pct >= 0 && tasks.length > 0 && (
                      <span style={{ fontSize: 9, color: pct > 0 ? C.greenText : C.sub }}>{pct}%</span>
                    )}
                  </div>
                );
              })}
            </div>
            {tasks.length > 0 && (
              <div style={{ marginTop: "1.25rem" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500, color: C.text }}>This month per task</p>
                {tasks.map(t => {
                  const done = pastDays.filter(d => log[`${d}__${t.id}`]).length;
                  const pct = pastDays.length ? Math.round((done / pastDays.length) * 100) : 0;
                  return (
                    <div key={t.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: C.text }}>{t.name}</span>
                        <span style={{ fontSize: 12, color: C.sub }}>{done}/{pastDays.length}d · {pct}%</span>
                      </div>
                      <div style={{ height: 5, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: C.green, borderRadius: 99 }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MANAGE */}
        {view === "manage" && (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: C.sub }}>Set your fixed daily tasks here.</p>
            {tasks.map(t => (
              <div key={t.id} style={{ background: C.card, borderRadius: 10, marginBottom: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {editingId === t.id ? (
                  <div style={{ display: "flex", gap: 8, padding: "8px 10px" }}>
                    <input
                      autoFocus value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(t.id); if (e.key === "Escape") setEditingId(null); }}
                      style={{ ...s.input }}
                    />
                    <button onClick={() => saveEdit(t.id)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.green, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent", color: C.sub, cursor: "pointer", fontSize: 13 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
                    <span style={{ flex: 1, fontSize: 14, color: C.text }}>{t.name}</span>
                    <button onClick={() => startEdit(t)} aria-label="Edit" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <path d="M4 20h4L18.5 9.5a2.828 2.828 0 0 0-4-4L4 16v4z" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.5 5.5l4 4" stroke={C.blue} strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button onClick={() => removeTask(t.id)} aria-label="Delete" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke={C.red} strokeWidth="2"/>
                        <path d="M8 8l8 8M16 8l-8 8" stroke={C.red} strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="New task name..."
                style={{ ...s.input }}
              />
              <button onClick={addTask} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.green, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>Add</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}