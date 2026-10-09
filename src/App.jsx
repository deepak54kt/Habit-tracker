import { useState, useEffect } from "react";

const STORAGE_KEY = "fixed-task-tracker-v4";

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

const VIEWS = ["today","calendar","manage"];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [log, setLog] = useState({});
  const [view, setView] = useState("today");
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [loaded, setLoaded] = useState(false);

  const today = getToday();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const d = JSON.parse(stored);
        if (Array.isArray(d.tasks)) setTasks(d.tasks);
        if (d.log && typeof d.log === "object") setLog(d.log);
      }
    } catch(e) {
      console.error("Load error:", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  function persist(t, l) {
    try {
      const payload = JSON.stringify({ tasks: t, log: l });
      window.localStorage.setItem(STORAGE_KEY, payload);
      setSaveStatus("Saved ✓");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch(e) {
      console.error("Save error:", e);
      setSaveStatus("Save failed!");
    }
  }

  function toggle(taskId) {
    const key = `${today}__${taskId}`;
    const nl = { ...log, [key]: !log[key] };
    setLog(nl); persist(tasks, nl);
  }

  function addTask() {
    const name = newTask.trim();
    if (!name) return;
    const updated = [...tasks, { id: Date.now().toString(), name }];
    setTasks(updated); setNewTask(""); persist(updated, log);
  }

  function removeTask(id) {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated); persist(updated, log);
  }

  function startEdit(t) { setEditingId(t.id); setEditVal(t.name); }

  function saveEdit(id) {
    const name = editVal.trim();
    if (!name) return;
    const updated = tasks.map(t => t.id === id ? { ...t, name } : t);
    setTasks(updated); setEditingId(null); setEditVal(""); persist(updated, log);
  }

  // Stats
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
    if (pct === 100) return "#1D9E75";
    if (pct >= 50) return "#5DCAA5";
    if (pct > 0) return "#9FE1CB";
    return "var(--color-background-primary)";
  }

  function cellText(d) {
    const pct = dayPct(d);
    if (pct > 0 && d <= today) return "#085041";
    return "var(--color-text-secondary)";
  }

  if (!loaded) return <div style={{padding:"2rem",color:"var(--color-text-secondary)",fontSize:14}}>Loading...</div>;

  return (
    <div style={{padding:"1.25rem 1rem",maxWidth:520,margin:"0 auto",fontFamily:"var(--font-sans)"}}>
      <h2 style={{position:"absolute",width:1,height:1,overflow:"hidden",margin:0}}>Daily Task Tracker</h2>

      {/* Header */}
      <div style={{marginBottom:"1rem"}}>
        <p style={{margin:0,fontSize:20,fontWeight:500,color:"var(--color-text-primary)"}}>Daily tracker</p>
        <p style={{margin:"2px 0 0",fontSize:13,color:"var(--color-text-secondary)"}}>
          {now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </p>
        {saveStatus && <p style={{margin:"4px 0 0",fontSize:11,color:"#1D9E75"}}>{saveStatus}</p>}
      </div>

      {/* Stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"1rem"}}>
        {[
          {label:"Today",pct:todayPct,sub:`${todayDone} / ${tasks.length} tasks`},
          {label:now.toLocaleString("en-IN",{month:"long"}),pct:monthPct,sub:`${mDone} / ${mTotal} slots`}
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--color-background-secondary)",borderRadius:12,padding:"0.9rem"}}>
            <p style={{margin:"0 0 4px",fontSize:12,color:"var(--color-text-secondary)"}}>{s.label}</p>
            <p style={{margin:"0 0 8px",fontSize:28,fontWeight:500,color:"var(--color-text-primary)"}}>{s.pct}%</p>
            <div style={{height:6,background:"var(--color-background-primary)",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${s.pct}%`,background:"#1D9E75",borderRadius:99,transition:"width 0.4s"}}></div>
            </div>
            <p style={{margin:"5px 0 0",fontSize:11,color:"var(--color-text-secondary)"}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:4,marginBottom:"1rem",background:"var(--color-background-secondary)",borderRadius:10,padding:4}}>
        {[["today","Today"],["calendar","Calendar"],["manage","Manage tasks"]].map(([v,label])=>(
          <button key={v} onClick={()=>setView(v)} style={{
            flex:1,padding:"7px 4px",borderRadius:8,border:"none",cursor:"pointer",
            fontSize:12,fontWeight:view===v?500:400,
            background:view===v?"var(--color-background-primary)":"transparent",
            color:view===v?"var(--color-text-primary)":"var(--color-text-secondary)"
          }}>{label}</button>
        ))}
      </div>

      {/* TODAY */}
      {view==="today" && (
        <div>
          {tasks.length===0 && (
            <div style={{textAlign:"center",padding:"2rem 1rem",color:"var(--color-text-secondary)",fontSize:14,background:"var(--color-background-secondary)",borderRadius:12}}>
              No tasks yet. Go to <b style={{fontWeight:500}}>Manage tasks</b> to add your fixed tasks.
            </div>
          )}
          {tasks.map(t=>{
            const done = !!log[`${today}__${t.id}`];
            return (
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",background:"var(--color-background-secondary)",borderRadius:10,marginBottom:8,cursor:"pointer"}} onClick={()=>toggle(t.id)}>
                <div style={{
                  width:26,height:26,borderRadius:8,flexShrink:0,
                  border:done?"2px solid #1D9E75":"2px solid #888",
                  background:done?"#1D9E75":"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all 0.2s"
                }}>
                  {done && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{fontSize:14,flex:1,color:done?"var(--color-text-secondary)":"var(--color-text-primary)",textDecoration:done?"line-through":"none"}}>{t.name}</span>
                {done && <i className="ti ti-circle-check" style={{fontSize:16,color:"#1D9E75"}} aria-hidden="true"></i>}
              </div>
            );
          })}
          {tasks.length>0 && (
            <p style={{textAlign:"center",fontSize:12,color:"var(--color-text-secondary)",marginTop:12}}>
              Tap a task to mark done / undone
            </p>
          )}
        </div>
      )}

      {/* CALENDAR */}
      {view==="calendar" && (
        <div>
          {/* Mini legend */}
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
            {[["#1D9E75","100%"],["#5DCAA5","≥50%"],["#9FE1CB",">0%"]].map(([c,l])=>(
              <span key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--color-text-secondary)"}}>
                <span style={{width:12,height:12,borderRadius:3,background:c,display:"inline-block"}}></span>{l}
              </span>
            ))}
          </div>

          {/* Month label */}
          <p style={{margin:"0 0 10px",fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>
            {now.toLocaleString("en-IN",{month:"long",year:"numeric"})}
          </p>

          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:4}}>
            {["S","M","T","W","T","F","S"].map((d,i)=>(
              <div key={i} style={{textAlign:"center",fontSize:11,color:"var(--color-text-secondary)"}}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
            {Array(new Date(year,month,1).getDay()).fill(null).map((_,i)=><div key={"off"+i}></div>)}
            {monthDays.map(d=>{
              const isToday = d===today;
              const future = d>today;
              const pct = dayPct(d);
              return (
                <div key={d} title={future?"":pct===100?"All done!":pct>0?`${pct}% done`:"Nothing done"} style={{
                  aspectRatio:"1",borderRadius:7,
                  background:cellBg(d),
                  border:isToday?"2px solid #1D9E75":"0.5px solid var(--color-border-tertiary)",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  opacity:future?0.3:1,
                  gap:1
                }}>
                  <span style={{fontSize:11,fontWeight:isToday?500:400,color:cellText(d)}}>
                    {new Date(d+"T00:00:00").getDate()}
                  </span>
                  {!future && pct>=0 && tasks.length>0 && (
                    <span style={{fontSize:9,color:pct>0?"#085041":"var(--color-text-secondary)"}}>{pct}%</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Per-task streak summary */}
          {tasks.length>0 && (
            <div style={{marginTop:"1.25rem"}}>
              <p style={{margin:"0 0 8px",fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>This month per task</p>
              {tasks.map(t=>{
                const done = pastDays.filter(d=>log[`${d}__${t.id}`]).length;
                const pct = pastDays.length ? Math.round((done/pastDays.length)*100) : 0;
                return (
                  <div key={t.id} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:13,color:"var(--color-text-primary)"}}>{t.name}</span>
                      <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{done}/{pastDays.length} days · {pct}%</span>
                    </div>
                    <div style={{height:5,background:"var(--color-background-secondary)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:"#1D9E75",borderRadius:99}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MANAGE TASKS */}
      {view==="manage" && (
        <div>
          <p style={{margin:"0 0 12px",fontSize:13,color:"var(--color-text-secondary)"}}>
            These are your fixed daily tasks. Add or remove them here.
          </p>
          {tasks.map(t=>(
            <div key={t.id} style={{background:"var(--color-background-secondary)",borderRadius:10,marginBottom:8,overflow:"hidden"}}>
              {editingId===t.id ? (
                <div style={{display:"flex",gap:8,padding:"8px 10px"}}>
                  <input
                    autoFocus
                    value={editVal}
                    onChange={e=>setEditVal(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")saveEdit(t.id);if(e.key==="Escape")setEditingId(null);}}
                    style={{flex:1,fontSize:14,padding:"7px 10px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}
                  />
                  <button onClick={()=>saveEdit(t.id)} style={{padding:"7px 14px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",cursor:"pointer",fontSize:13,fontWeight:500}}>Save</button>
                  <button onClick={()=>setEditingId(null)} style={{padding:"7px 10px",borderRadius:8,border:"none",background:"transparent",color:"var(--color-text-secondary)",cursor:"pointer",fontSize:13}}>Cancel</button>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px"}}>
                  <i className="ti ti-grip-vertical" style={{fontSize:15,color:"var(--color-text-secondary)"}} aria-hidden="true"></i>
                  <span style={{flex:1,fontSize:14,color:"var(--color-text-primary)"}}>{t.name}</span>
                  <button onClick={()=>startEdit(t)} aria-label="Edit task" style={{background:"none",border:"none",cursor:"pointer",padding:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 20h4L18.5 9.5a2.828 2.828 0 0 0-4-4L4 16v4z" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.5 5.5l4 4" stroke="#378ADD" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button onClick={()=>removeTask(t.id)} aria-label="Delete task" style={{background:"none",border:"none",cursor:"pointer",padding:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#E24B4A" strokeWidth="2"/>
                      <path d="M8 8l8 8M16 8l-8 8" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <input
              value={newTask}
              onChange={e=>setNewTask(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addTask()}
              placeholder="New task name..."
              style={{flex:1,fontSize:14,padding:"9px 12px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}
            />
            <button onClick={addTask} style={{padding:"9px 18px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",cursor:"pointer",fontSize:13,fontWeight:500}}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}