import React, { useEffect, useState } from "react";
import { planApi, safetyApi, simApi, runPipeline, savePlaybook, listPlaybooks } from "./digitalApi";

export default function TaskPlaybook({ onLoadExample }) {

  // Playbook state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [task, setTask] = useState({ 
    name: "", 
    description: "", 
    inputs: {}, 
    actions: [] 
  });

  // Twin (minimal software twin for checks)
  const [twin, setTwin] = useState({
    name: "Research Analyst",
    skills: ["web_research", "summarization"],
    policies: { 
      respect_robots: true, 
      rate_limit_rps: 1, 
      allowed_domains: [], 
      blocked_domains: [] 
    }
  });

  // Results
  const [plan, setPlan] = useState(null);
  const [safety, setSafety] = useState(null);
  const [sim, setSim] = useState(null);

  // UX
  const [imported, setImported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [playbooks, setPlaybooks] = useState([]);

  // Load import from Prompt Lab (localStorage) - simplified version
  useEffect(() => {
    const raw = localStorage.getItem("HDL_PLAYBOOK_IMPORT");
    if (!raw) return;
    try {
      const pb = JSON.parse(raw);
      setName(pb.name || "Imported Playbook");
      setDescription(pb.description || "");
      const t = pb.task || {};
      setTask({
        name: t.name || pb.name || "Imported Task",
        description: t.description || pb.description || "",
        inputs: t.inputs || {},
        actions: Array.isArray(t.actions) ? t.actions : []
      });
      setImported(true);
    } catch (e) {
      console.error("Invalid HDL_PLAYBOOK_IMPORT:", e);
    } finally {
      localStorage.removeItem("HDL_PLAYBOOK_IMPORT");
    }
  }, []);

  useEffect(() => {
    // Optional: show existing playbooks for quick load/compare
    listPlaybooks().then(r => setPlaybooks(r.items || [])).catch(()=>{});
  }, []);

  async function oneClickPipeline() {
    setBusy(true); 
    setError(""); 
    setPlan(null); 
    setSafety(null); 
    setSim(null);
    try {
      // You can also call planApi/safetyApi/simApi sequentially.
      const out = await runPipeline({ twin, task });
      setPlan(out.plan);
      setSafety(out.safety);
      setSim(out.sim);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doPlan() {
    setBusy(true); 
    setError(""); 
    setPlan(null);
    try {
      const out = await planApi({ twin, task });
      setPlan(out.plan || out); // depending on your planner return shape
    } catch (e) { 
      setError(String(e)); 
    }
    finally { 
      setBusy(false); 
    }
  }
  
  async function doSafety() {
    if (!plan) { 
      alert("Run Plan first."); 
      return; 
    }
    setBusy(true); 
    setError(""); 
    setSafety(null);
    try {
      const out = await safetyApi({ twin, task, plan });
      setSafety(out);
    } catch (e) { 
      setError(String(e)); 
    }
    finally { 
      setBusy(false); 
    }
  }
  
  async function doSim() {
    if (!plan) { 
      alert("Run Plan first."); 
      return; 
    }
    setBusy(true); 
    setError(""); 
    setSim(null);
    try {
      const out = await simApi({ plan });
      setSim(out);
    } catch (e) { 
      setError(String(e)); 
    }
    finally { 
      setBusy(false); 
    }
  }

  async function saveToDB() {
    try {
      const doc = await savePlaybook({ name, description, task });
      alert(`Saved Playbook: ${doc._id || "(ok)"}`);
      // refresh list
      const r = await listPlaybooks();
      setPlaybooks(r.items || []);
    } catch (e) {
      alert(`Save failed: ${e}`);
    }
  }

  // --- UI ---
  return (
    <div className="p-4 space-y-4" data-cy="task-playbook">
      <h2 className="text-xl font-semibold">Task Playbook</h2>
      {imported && <p className="text-green-700">Imported playbook loaded from Prompt Lab.</p>}

      {/* One-click toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button 
          className="bg-blue-600 text-white px-3 py-1 rounded" 
          onClick={oneClickPipeline} 
          disabled={busy}
        >
          {busy ? "Running…" : "Run One-Click: Plan → Safety → Sim"}
        </button>
        <button 
          className="bg-gray-200 px-3 py-1 rounded" 
          onClick={doPlan} 
          disabled={busy}
        >
          Plan
        </button>
        <button 
          className="bg-gray-200 px-3 py-1 rounded" 
          onClick={doSafety} 
          disabled={busy || !plan}
        >
          Safety
        </button>
        <button 
          className="bg-gray-200 px-3 py-1 rounded" 
          onClick={doSim} 
          disabled={busy || !plan}
        >
          Sim Preview
        </button>

        <div className="ml-auto flex gap-2">
          <button 
            className="bg-purple-600 text-white px-3 py-1 rounded" 
            onClick={saveToDB}
          >
            Save to DB
          </button>
          {onLoadExample && (
            <button
              onClick={onLoadExample}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              🎯 Load Example
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-red-700">{error}</div>}

      {/* Editor */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm">Playbook Name</label>
          <input 
            className="w-full border rounded px-2 py-1" 
            value={name} 
            onChange={e=>setName(e.target.value)} 
          />
          <label className="block text-sm">Description</label>
          <input 
            className="w-full border rounded px-2 py-1" 
            value={description} 
            onChange={e=>setDescription(e.target.value)} 
          />
          <label className="block text-sm">Task Name</label>
          <input 
            className="w-full border rounded px-2 py-1" 
            value={task.name} 
            onChange={e=>setTask({...task, name:e.target.value})} 
          />
          <label className="block text-sm">Task Description</label>
          <input 
            className="w-full border rounded px-2 py-1" 
            value={task.description} 
            onChange={e=>setTask({...task, description:e.target.value})} 
          />
          {/* Minimal Twin editor */}
          <div className="mt-3">
            <div className="font-semibold">Software Twin (minimal)</div>
            <label className="block text-sm">Persona Name</label>
            <input 
              className="w-full border rounded px-2 py-1" 
              value={twin.name} 
              onChange={e=>setTwin({...twin, name:e.target.value})} 
            />
            <label className="block text-sm">Allowed domains (CSV)</label>
            <input 
              className="w-full border rounded px-2 py-1"
              onChange={e=>setTwin({...twin, policies:{...twin.policies, allowed_domains: splitCsv(e.target.value)}})} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Actions</div>
          </div>
          <ActionList task={task} setTask={setTask} />
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <h3 className="font-semibold">Plan</h3>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold">Safety</h3>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(safety, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold">Sim Preview</h3>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(sim, null, 2)}
          </pre>
        </div>
      </div>

      {/* Optional: quick list of saved playbooks */}
      <div>
        <h3 className="font-semibold mt-4">Saved Playbooks</h3>
        <ul className="list-disc ml-5">
          {playbooks.map(pb => (
            <li key={pb._id}>
              <b>{pb.name}</b> — {pb.description}
            </li>
          ))}
          {playbooks.length === 0 && <li>No saved playbooks yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function ActionList({ task, setTask }) {
  function updateAction(idx, field, value) {
    const next = [...task.actions];
    next[idx] = { ...next[idx], [field]: value };
    setTask({ ...task, actions: next });
  }
  
  function updateActionParam(idx, key, value) {
    const next = [...task.actions];
    next[idx] = { ...next[idx], params: { ...(next[idx].params || {}), [key]: value } };
    setTask({ ...task, actions: next });
  }
  
  function addAction() {
    setTask({ ...task, actions: [...task.actions, { type: "fetch_url", params: { url: "" } }] });
  }
  
  function removeAction(i) {
    const next = [...task.actions];
    next.splice(i, 1);
    setTask({ ...task, actions: next });
  }
  
  return (
    <div className="space-y-3">
      <button 
        className="bg-gray-200 px-3 py-1 rounded" 
        onClick={addAction}
      >
        + Add Action
      </button>
      {task.actions.map((a, i) => (
        <div key={i} className="border rounded p-2">
          <div className="flex gap-2 items-center">
            <label className="text-sm">Type</label>
            <select 
              className="border rounded px-2 py-1"
              value={a.type} 
              onChange={e=>updateAction(i, "type", e.target.value)}
            >
              <option value="fetch_url">fetch_url</option>
              <option value="extract_text">extract_text</option>
              <option value="prompt_chain">prompt_chain</option>
              <option value="classify">classify</option>
              <option value="transform">transform</option>
              <option value="http_request">http_request</option>
              <option value="write_file">write_file</option>
              <option value="send_webhook">send_webhook</option>
            </select>
            <button 
              className="ml-auto bg-red-600 text-white px-2 py-1 rounded" 
              onClick={()=>removeAction(i)}
            >
              Delete
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.entries(a.params || {}).map(([k,v]) => (
              <div key={k}>
                <label className="text-xs text-gray-600">{k}</label>
                <input 
                  className="w-full border rounded px-2 py-1"
                  value={String(v)} 
                  onChange={e=>updateActionParam(i, k, e.target.value)} 
                />
              </div>
            ))}
            <ParamAdder onAdd={(k,v)=>updateActionParam(i, k, v)} />
          </div>
        </div>
      ))}
      {task.actions.length === 0 && (
        <div className="text-sm text-gray-600">No actions yet.</div>
      )}
    </div>
  );
}

function ParamAdder({ onAdd }) {
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");
  return (
    <div className="col-span-2 flex gap-2 items-end">
      <div>
        <label className="text-xs text-gray-600">+ Param key</label>
        <input 
          className="border rounded px-2 py-1" 
          value={key} 
          onChange={e=>setKey(e.target.value)} 
          placeholder="url / prompt / ..." 
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-600">value</label>
        <input 
          className="w-full border rounded px-2 py-1" 
          value={val} 
          onChange={e=>setVal(e.target.value)} 
        />
      </div>
      <button 
        className="bg-gray-200 px-2 py-1 rounded" 
        onClick={()=>{ 
          if(key) onAdd(key, val); 
          setKey(""); 
          setVal(""); 
        }}
      >
        Add
      </button>
    </div>
  );
}

function splitCsv(s) {
  return (s || "").split(",").map(x => x.trim()).filter(Boolean);
}