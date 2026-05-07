import { useState, useEffect, useRef } from "react";

// ─── Storage ───────────────────────────────────────────────────────
const SK = { patients: "kinesio_patients_v2", templates: "kinesio_templates_v2" };
const load = (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── Theme ─────────────────────────────────────────────────────────
const T = {
  teal: "#0d9488", tealL: "#14b8a6", tealD: "#0f766e",
  sage: "#65a30d", sageL: "#84cc16",
  amber: "#d97706",
  blue: "#2563eb",
  cream: "#f8f7f4", warm: "#f0ede6",
  charcoal: "#1a2e2e", slate: "#2d4444", muted: "#6b8585",
  border: "#d4e4e2", white: "#ffffff",
  red: "#dc2626", redBg: "#fef2f2",
};

// ─── Helpers ───────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function isImage(name) { return /\.(png|jpg|jpeg|gif|webp)$/i.test(name); }
function isPDF(name) { return /\.pdf$/i.test(name); }
function getMediaType(name) {
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.(jpg|jpeg)$/i.test(name)) return "image/jpeg";
  if (/\.gif$/i.test(name)) return "image/gif";
  if (/\.webp$/i.test(name)) return "image/webp";
  return "application/pdf";
}

// ─── Markdown ──────────────────────────────────────────────────────
function Md({ text }) {
  if (!text) return null;
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, `<h3 style="color:#0f766e;font-size:.93rem;font-weight:700;margin:.9rem 0 .2rem">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="color:#0f766e;font-size:1.02rem;font-weight:800;margin:1rem 0 .3rem">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="color:#1a2e2e;font-size:1.1rem;font-weight:800;margin:1rem 0 .4rem">$1</h1>`)
    .replace(/^- (.+)$/gm, `<li style="margin:.2rem 0;padding-left:.3rem">$1</li>`)
    .replace(/(<li.*<\/li>\n?)+/g, m => `<ul style="padding-left:1.2rem;margin:.4rem 0">${m}</ul>`)
    .replace(/\n\n/g, `</p><p style="margin:.45rem 0">`)
    .replace(/\n/g, "<br/>");
  return <div dangerouslySetInnerHTML={{ __html: `<p style="margin:.45rem 0">${html}</p>` }} style={{ fontSize: ".87rem", lineHeight: 1.75, color: "#1a2e2e" }} />;
}

// ─── Claude API ────────────────────────────────────────────────────
async function askClaude(system, messages, onChunk) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, stream: true, system, messages }),
  });
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const d = JSON.parse(line.slice(6));
          if (d.type === "content_block_delta" && d.delta?.text) { full += d.delta.text; onChunk(full); }
        } catch {}
      }
    }
  }
  return full;
}

// ─── AI Chat ───────────────────────────────────────────────────────
function AIChat({ system, placeholder, suggestions = [], extraContent = [] }) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send(text) {
    const q = text || input.trim(); if (!q) return;
    setInput("");
    const history = msgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    const userContent = extraContent.length > 0 && msgs.length === 0
      ? [...extraContent, { type: "text", text: q }] : q;
    setMsgs(p => [...p, { role: "user", text: q }, { role: "ai", text: "" }]);
    setLoading(true);
    try {
      await askClaude(system, [...history, { role: "user", content: userContent }], chunk => {
        setMsgs(p => { const c = [...p]; c[c.length - 1] = { role: "ai", text: chunk }; return c; });
      });
    } catch {
      setMsgs(p => { const c = [...p]; c[c.length - 1] = { role: "ai", text: "❌ Error de conexión. Intenta de nuevo." }; return c; });
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: ".75rem" }}>
      {msgs.length === 0 && suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{ background: T.warm, border: `1px solid ${T.border}`, borderRadius: "999px", padding: ".35rem .8rem", fontSize: ".78rem", color: T.slate, cursor: "pointer" }}>{s}</button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: ".65rem", paddingRight: ".3rem" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "ai" && <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg,${T.teal},${T.sageL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", marginRight: ".4rem", flexShrink: 0, marginTop: ".2rem" }}>🤖</div>}
            <div style={{ maxWidth: "83%", padding: ".62rem .9rem", borderRadius: m.role === "user" ? "15px 15px 4px 15px" : "15px 15px 15px 4px", background: m.role === "user" ? `linear-gradient(135deg,${T.teal},${T.tealD})` : T.white, color: m.role === "user" ? "#fff" : T.charcoal, boxShadow: "0 2px 8px rgba(0,0,0,.06)", border: m.role === "ai" ? `1px solid ${T.border}` : "none" }}>
              {m.role === "user" ? <span style={{ fontSize: ".87rem" }}>{m.text}</span> : <Md text={m.text || "▋"} />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: ".5rem" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder={placeholder} disabled={loading}
          style={{ flex: 1, padding: ".68rem .9rem", borderRadius: "11px", border: `1.5px solid ${T.border}`, fontSize: ".87rem", outline: "none", background: T.white, color: T.charcoal }}
          onFocus={e => e.target.style.borderColor = T.teal} onBlur={e => e.target.style.borderColor = T.border} />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: ".68rem 1.1rem", borderRadius: "11px", border: "none", background: loading ? T.muted : `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "#fff", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "···" : "→"}
        </button>
      </div>
    </div>
  );
}

// ─── File Upload ───────────────────────────────────────────────────
function FileUpload({ label, files, onAdd, onRemove, accept = "*" }) {
  const ref = useRef();
  async function handle(e) {
    for (const file of Array.from(e.target.files)) {
      const b64 = await fileToBase64(file);
      onAdd({ id: uid(), name: file.name, type: file.type || getMediaType(file.name), data: b64, date: new Date().toISOString() });
    }
    e.target.value = "";
  }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".45rem" }}>
        <span style={{ fontSize: ".81rem", fontWeight: "700", color: T.slate }}>{label}</span>
        <button onClick={() => ref.current.click()} style={{ padding: ".28rem .7rem", borderRadius: "7px", border: `1px solid ${T.teal}`, background: "transparent", color: T.teal, fontSize: ".75rem", fontWeight: "700", cursor: "pointer" }}>+ Subir</button>
        <input ref={ref} type="file" accept={accept} multiple onChange={handle} style={{ display: "none" }} />
      </div>
      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem" }}>
          {files.map(f => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: ".35rem", background: T.warm, borderRadius: "7px", padding: ".28rem .6rem", border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: ".75rem" }}>{isImage(f.name) ? "🖼️" : isPDF(f.name) ? "📄" : "📎"}</span>
              <a href={f.data} download={f.name} style={{ fontSize: ".76rem", color: T.teal, textDecoration: "none", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.name}>{f.name}</a>
              <button onClick={() => onRemove(f.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: ".72rem", padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = "580px" }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: T.white, borderRadius: "18px", padding: "1.6rem", width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.22)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <div style={{ fontWeight: "800", fontSize: "1.05rem", color: T.charcoal }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: T.muted }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Template Manager ──────────────────────────────────────────────
function TemplateManager({ templates, onSave, onClose }) {
  const [evalTpl, setEvalTpl] = useState(templates.eval || "");
  const [sessTpl, setSessTpl] = useState(templates.session || "");
  return (
    <Modal title="📋 Mis Formatos / Plantillas" onClose={onClose} width="720px">
      <p style={{ fontSize: ".82rem", color: T.muted, marginBottom: "1rem" }}>Pega aquí tus formatos. La IA los usará para estructurar las fichas automáticamente cuando ingreses datos de evaluación o sesión.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div>
          <label style={{ fontSize: ".84rem", fontWeight: "700", color: T.slate, display: "block", marginBottom: ".4rem" }}>📋 Formato de Ficha de Evaluación Kinesiológica</label>
          <textarea value={evalTpl} onChange={e => setEvalTpl(e.target.value)} rows={11}
            placeholder={"Pega aquí tu formato de evaluación. Ejemplo:\n\nFICHA DE EVALUACIÓN KINESIOLÓGICA\n\nI. DATOS DEL PACIENTE\n- Nombre:\n- Edad:\n- Diagnóstico médico:\n\nII. ANAMNESIS\n- Motivo de consulta:\n- Historia del dolor:\n- EVA reposo / movimiento:\n\nIII. EXAMEN FÍSICO\n- Inspección:\n- Palpación:\n- Rango articular:\n- Tests especiales:\n\nIV. DIAGNÓSTICO KINESIOLÓGICO\n\nV. OBJETIVOS\n\nVI. PLAN DE TRATAMIENTO"}
            style={{ width: "100%", padding: ".75rem", borderRadius: "10px", border: `1.5px solid ${T.border}`, fontSize: ".82rem", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box", color: T.charcoal, lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = T.teal} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <div>
          <label style={{ fontSize: ".84rem", fontWeight: "700", color: T.slate, display: "block", marginBottom: ".4rem" }}>📝 Formato de Ficha de Atención / Sesión</label>
          <textarea value={sessTpl} onChange={e => setSessTpl(e.target.value)} rows={9}
            placeholder={"Pega aquí tu formato de sesión. Ejemplo:\n\nFICHA DE ATENCIÓN KINESIOLÓGICA\n\nFecha:\nSesión N°:\nPaciente:\n\nEstado al inicio (EVA, observaciones):\n\nTécnicas aplicadas:\n1.\n2.\n\nRespuesta del paciente:\n\nObjetivos próxima sesión:\n\nFirma:"}
            style={{ width: "100%", padding: ".75rem", borderRadius: "10px", border: `1.5px solid ${T.border}`, fontSize: ".82rem", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box", color: T.charcoal, lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = T.teal} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: ".6rem" }}>
          <button onClick={onClose} style={{ padding: ".58rem 1.1rem", borderRadius: "9px", border: `1px solid ${T.border}`, background: "white", color: T.muted, cursor: "pointer", fontWeight: "600" }}>Cancelar</button>
          <button onClick={() => { onSave({ eval: evalTpl, session: sessTpl }); onClose(); }} style={{ padding: ".58rem 1.3rem", borderRadius: "9px", border: "none", background: `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: "pointer" }}>💾 Guardar formatos</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Generate Ficha Modal ──────────────────────────────────────────
function GenerateFicha({ patient, type, template, onClose, onSave }) {
  const [rawData, setRawData] = useState("");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const hasTemplate = template && template.trim().length > 10;

  async function generate() {
    setLoading(true); setResult("");
    const system = `Eres una kinesióloga experta. Genera fichas clínicas profesionales, completas, basadas en evidencia. Sigue EXACTAMENTE el formato indicado. Completa TODOS los campos con la información disponible. Si falta info, escribe lo que puedas inferir y marca como [a confirmar]. Usa lenguaje técnico profesional.`;
    let userContent = [];
    for (const f of files) {
      if (isImage(f.name)) userContent.push({ type: "image", source: { type: "base64", media_type: f.type, data: f.data.split(",")[1] } });
      else if (isPDF(f.name)) userContent.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data.split(",")[1] } });
    }
    const prompt = type === "eval"
      ? `Paciente: ${patient.name}, ${patient.age} años. Diagnóstico médico: ${patient.diagnosis}. Notas: ${patient.notes}\n\nDATOS RECOGIDOS EN EVALUACIÓN (anamnesis + examen físico):\n${rawData}\n\n${hasTemplate ? `FORMATO A COMPLETAR - respeta EXACTAMENTE esta estructura:\n${template}` : "Genera una ficha de evaluación kinesiológica completa y profesional con: datos, anamnesis, examen físico, diagnóstico kinesiológico, objetivos y plan."}`
      : `Paciente: ${patient.name}, ${patient.age} años. Diagnóstico: ${patient.diagnosis}. Sesión N°${(patient.sessions || []).length + 1}\n\nDATOS DE LA SESIÓN:\n${rawData}\n\n${hasTemplate ? `FORMATO A COMPLETAR - respeta EXACTAMENTE esta estructura:\n${template}` : "Genera una ficha de atención kinesiológica profesional completa."}`;
    userContent.push({ type: "text", text: prompt });
    await askClaude(system, [{ role: "user", content: userContent }], c => setResult(c));
    setLoading(false);
  }

  return (
    <Modal title={type === "eval" ? "📋 Generar Ficha de Evaluación" : "📋 Generar Ficha de Sesión"} onClose={onClose} width="700px">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {!hasTemplate && (
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "9px", padding: ".65rem .9rem", fontSize: ".8rem", color: "#92400e" }}>
            ⚠️ No tienes formato guardado. Se usará un formato estándar. Configura tus formatos en "📋 Mis Formatos" (arriba a la derecha).
          </div>
        )}
        <div>
          <label style={{ fontSize: ".82rem", fontWeight: "700", color: T.slate, display: "block", marginBottom: ".4rem" }}>
            {type === "eval" ? "Datos de anamnesis y examen físico:" : "Datos de la sesión:"}
          </label>
          <textarea value={rawData} onChange={e => setRawData(e.target.value)} rows={8}
            placeholder={type === "eval"
              ? "Escribe o pega tus notas tal como las tomaste. No necesitas redactarlas, escríbelas en bruto:\n\nEj: pcte 35a M, dolor hombro der 6/10 desde hace 3 sem post esfuerzo, EVA reposo 3/10 movimiento 7/10. Limitación ABD 100°, RE 60°. Arco doloroso 80-120°. Neer +, Hawkins +. Sin irradiación. Duerme mal por el dolor..."
              : "Ej: pcte llega 4/10 dolor. Mejor que semana pasada. Se aplicó US 3MHz 5min, TENS 80Hz 20min, movilización glenohumeral grado III. Ejercicios RMS. Buena tolerancia. Al finalizar 2/10. Refiere que hizo ejercicios en casa todos los días."}
            style={{ width: "100%", padding: ".7rem", borderRadius: "10px", border: `1.5px solid ${T.border}`, fontSize: ".84rem", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.65 }}
            onFocus={e => e.target.style.borderColor = T.teal} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <FileUpload label="Adjuntar exámenes / documentos:" files={files}
          onAdd={f => setFiles(p => [...p, f])} onRemove={id => setFiles(p => p.filter(x => x.id !== id))} accept="image/*,.pdf" />
        <button onClick={generate} disabled={loading || !rawData.trim()} style={{ padding: ".72rem", borderRadius: "11px", border: "none", background: loading ? T.muted : `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontSize: ".9rem" }}>
          {loading ? "⏳ Generando ficha..." : "✨ Generar ficha automáticamente"}
        </button>
        {result && (
          <>
            <div style={{ background: T.warm, borderRadius: "12px", padding: "1rem", maxHeight: "300px", overflowY: "auto", border: `1px solid ${T.border}` }}>
              <Md text={result} />
            </div>
            <div style={{ display: "flex", gap: ".6rem", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{ padding: ".58rem 1rem", borderRadius: "9px", border: `1px solid ${T.border}`, background: "white", color: T.muted, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => { onSave(result, files); onClose(); }} style={{ padding: ".58rem 1.3rem", borderRadius: "9px", border: "none", background: `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: "pointer" }}>💾 Guardar en ficha</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Patient Detail ────────────────────────────────────────────────
function PatientDetail({ patient, templates, onBack, onUpdate }) {
  const [tab, setTab] = useState("overview");
  const [showGenEval, setShowGenEval] = useState(false);
  const [showGenSess, setShowGenSess] = useState(false);
  const [showNewSess, setShowNewSess] = useState(false);
  const [sessDate, setSessDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessNotes, setSessNotes] = useState("");
  const [sessFiles, setSessFiles] = useState([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeResult, setHomeResult] = useState("");

  function upd(changes) { onUpdate({ ...patient, ...changes }); }

  function saveEval(text, files) { upd({ evalFicha: text, evalFiles: files }); }
  function saveSessFromGen(text, files) {
    const sess = { id: uid(), date: sessDate, notes: "", ficha: text, files, createdAt: new Date().toISOString() };
    upd({ sessions: [...(patient.sessions || []), sess] });
  }
  function saveManualSess() {
    const sess = { id: uid(), date: sessDate, notes: sessNotes, ficha: "", files: sessFiles, createdAt: new Date().toISOString() };
    upd({ sessions: [...(patient.sessions || []), sess] });
    setShowNewSess(false); setSessNotes(""); setSessFiles([]);
  }

  async function genHome() {
    setHomeLoading(true); setHomeResult("");
    const sys = "Eres una kinesióloga experta. Genera programas de ejercicios domiciliarios detallados, en lenguaje claro para el paciente, basados en evidencia.";
    const msg = `Programa de ejercicios para el hogar:\nPaciente: ${patient.name}, ${patient.age} años\nDiagnóstico: ${patient.diagnosis}\nSesiones: ${(patient.sessions || []).length}\nNotas: ${patient.notes}\n\nIncluye: nombre del ejercicio, descripción simple para el paciente, series, repeticiones, frecuencia semanal, cómo saber si lo está haciendo bien, señales de alerta para detenerse.`;
    await askClaude(sys, [{ role: "user", content: msg }], c => setHomeResult(c));
    setHomeLoading(false);
  }

  const tabs = [
    { id: "overview", label: "📊 Resumen" },
    { id: "eval", label: "📋 Evaluación" },
    { id: "sessions", label: `🗓️ Sesiones (${(patient.sessions || []).length})` },
    { id: "exams", label: "🔬 Exámenes" },
    { id: "exercises", label: "🏋️ Ejercicios" },
    { id: "ai", label: "🤖 IA" },
  ];

  const examImgs = (patient.examFiles || []).filter(f => isImage(f.name));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {showGenEval && <GenerateFicha patient={patient} type="eval" template={templates.eval} onClose={() => setShowGenEval(false)} onSave={saveEval} />}
      {showGenSess && <GenerateFicha patient={patient} type="session" template={templates.session} onClose={() => setShowGenSess(false)} onSave={saveSessFromGen} />}

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: ".9rem", flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: T.teal, cursor: "pointer", fontWeight: "700" }}>← Volver</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "800", fontSize: "1.08rem", color: T.charcoal }}>{patient.name}</div>
          <div style={{ fontSize: ".78rem", color: T.muted }}>{patient.age} años · {patient.diagnosis}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap", marginBottom: ".9rem" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: ".38rem .8rem", borderRadius: "999px", border: "none", background: tab === t.id ? T.teal : T.warm, color: tab === t.id ? "white" : T.slate, fontWeight: "600", fontSize: ".76rem", cursor: "pointer" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>

        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".6rem" }}>
              {[[`${(patient.sessions || []).length}`, "Sesiones", T.teal], [`${(patient.examFiles || []).length + (patient.orderFiles || []).length}`, "Archivos", T.blue], [patient.evalFicha ? "✓ Evaluado" : "Pendiente", "Evaluación", patient.evalFicha ? T.sage : T.amber]].map(([v, l, c]) => (
                <div key={l} style={{ background: T.white, borderRadius: "12px", padding: ".9rem", border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: "1.35rem", fontWeight: "800", color: c }}>{v}</div>
                  <div style={{ fontSize: ".75rem", color: T.muted }}>{l}</div>
                </div>
              ))}
            </div>
            {patient.notes && <div style={{ background: T.warm, borderRadius: "11px", padding: ".9rem", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: ".78rem", fontWeight: "700", color: T.slate, marginBottom: ".35rem" }}>📝 Notas</div>
              <p style={{ fontSize: ".84rem", color: T.charcoal, margin: 0 }}>{patient.notes}</p>
            </div>}
            {patient.evalFicha && <div style={{ background: T.white, borderRadius: "11px", padding: "1rem", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: ".78rem", fontWeight: "700", color: T.slate, marginBottom: ".5rem" }}>📋 Evaluación más reciente</div>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}><Md text={patient.evalFicha} /></div>
            </div>}
          </div>
        )}

        {tab === "eval" && (
          <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
            <button onClick={() => setShowGenEval(true)} style={{ padding: ".75rem", borderRadius: "11px", border: "none", background: `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: "pointer" }}>
              ✨ {patient.evalFicha ? "Regenerar ficha de evaluación" : "Generar ficha de evaluación"}
            </button>
            {patient.evalFicha ? (
              <div style={{ background: T.white, borderRadius: "13px", padding: "1.1rem", border: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: "700", color: T.charcoal, marginBottom: ".6rem", fontSize: ".88rem" }}>📋 Ficha de Evaluación</div>
                <Md text={patient.evalFicha} />
                {(patient.evalFiles || []).length > 0 && (
                  <div style={{ marginTop: ".9rem", paddingTop: ".9rem", borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: ".77rem", fontWeight: "700", color: T.muted, marginBottom: ".4rem" }}>Archivos adjuntos a la evaluación:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem" }}>
                      {(patient.evalFiles || []).map(f => <a key={f.id} href={f.data} download={f.name} style={{ fontSize: ".76rem", color: T.teal, background: T.warm, padding: ".28rem .6rem", borderRadius: "6px", textDecoration: "none", border: `1px solid ${T.border}` }}>{isImage(f.name) ? "🖼️" : "📄"} {f.name}</a>)}
                    </div>
                  </div>
                )}
              </div>
            ) : <div style={{ textAlign: "center", color: T.muted, padding: "2rem", fontSize: ".88rem" }}>Sin ficha de evaluación aún. ¡Genera una con el botón de arriba! 📋</div>}
          </div>
        )}

        {tab === "sessions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button onClick={() => setShowNewSess(p => !p)} style={{ flex: 1, padding: ".65rem", borderRadius: "10px", border: `2px dashed ${T.teal}`, background: "transparent", color: T.teal, fontWeight: "700", cursor: "pointer", fontSize: ".85rem" }}>+ Registrar sesión</button>
              <button onClick={() => setShowGenSess(true)} style={{ flex: 1, padding: ".65rem", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: "pointer", fontSize: ".85rem" }}>✨ Generar ficha de sesión</button>
            </div>
            {showNewSess && (
              <div style={{ background: T.white, borderRadius: "13px", padding: "1rem", border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: ".7rem" }}>
                <input type="date" value={sessDate} onChange={e => setSessDate(e.target.value)} style={{ padding: ".58rem", borderRadius: "8px", border: `1px solid ${T.border}`, fontSize: ".87rem" }} />
                <textarea placeholder="Notas de la sesión (opcional)..." value={sessNotes} onChange={e => setSessNotes(e.target.value)} rows={3} style={{ padding: ".6rem", borderRadius: "8px", border: `1px solid ${T.border}`, fontSize: ".84rem", resize: "vertical", fontFamily: "inherit" }} />
                <FileUpload label="Adjuntos:" files={sessFiles} onAdd={f => setSessFiles(p => [...p, f])} onRemove={id => setSessFiles(p => p.filter(x => x.id !== id))} accept="image/*,.pdf" />
                <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowNewSess(false)} style={{ padding: ".5rem .9rem", borderRadius: "8px", border: `1px solid ${T.border}`, background: "white", color: T.muted, cursor: "pointer" }}>Cancelar</button>
                  <button onClick={saveManualSess} style={{ padding: ".5rem 1.1rem", borderRadius: "8px", border: "none", background: T.teal, color: "white", fontWeight: "700", cursor: "pointer" }}>Guardar</button>
                </div>
              </div>
            )}
            {(patient.sessions || []).length === 0 && !showNewSess && <div style={{ textAlign: "center", color: T.muted, padding: "2rem", fontSize: ".88rem" }}>Sin sesiones aún 🗓️</div>}
            {[...(patient.sessions || [])].reverse().map((s, idx, arr) => (
              <div key={s.id} style={{ background: T.white, borderRadius: "12px", padding: ".95rem 1rem", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".35rem" }}>
                  <div style={{ fontWeight: "700", color: T.tealD, fontSize: ".86rem" }}>📅 Sesión {arr.length - idx} · {s.date}</div>
                  <button onClick={() => { if (!confirm("¿Eliminar sesión?")) return; upd({ sessions: (patient.sessions || []).filter(x => x.id !== s.id) }); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: ".78rem" }}>🗑️</button>
                </div>
                {s.notes && <p style={{ fontSize: ".82rem", color: T.slate, margin: "0 0 .35rem" }}>{s.notes}</p>}
                {s.ficha && <details><summary style={{ cursor: "pointer", fontSize: ".78rem", color: T.teal, fontWeight: "600" }}>Ver ficha de atención</summary>
                  <div style={{ marginTop: ".5rem", background: T.warm, borderRadius: "8px", padding: ".75rem" }}><Md text={s.ficha} /></div>
                </details>}
                {(s.files || []).length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem", marginTop: ".4rem" }}>
                  {(s.files || []).map(f => <a key={f.id} href={f.data} download={f.name} style={{ fontSize: ".73rem", color: T.teal, background: T.warm, padding: ".23rem .55rem", borderRadius: "6px", textDecoration: "none", border: `1px solid ${T.border}` }}>{isPDF(f.name) ? "📄" : "🖼️"} {f.name}</a>)}
                </div>}
              </div>
            ))}
          </div>
        )}

        {tab === "exams" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: T.white, borderRadius: "13px", padding: "1.1rem", border: `1px solid ${T.border}` }}>
              <FileUpload label="🔬 Exámenes (Ecografía, RMN, RX, scanner, etc.):"
                files={patient.examFiles || []} onAdd={f => upd({ examFiles: [...(patient.examFiles || []), f] })} onRemove={id => upd({ examFiles: (patient.examFiles || []).filter(x => x.id !== id) })} accept="image/*,.pdf" />
              {examImgs.length > 0 && (
                <div style={{ marginTop: ".9rem", display: "flex", flexDirection: "column", gap: ".6rem" }}>
                  {examImgs.map(f => (
                    <div key={f.id}>
                      <div style={{ fontSize: ".75rem", color: T.muted, marginBottom: ".25rem" }}>{f.name}</div>
                      <img src={f.data} alt={f.name} style={{ maxWidth: "100%", borderRadius: "9px", border: `1px solid ${T.border}` }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: T.white, borderRadius: "13px", padding: "1.1rem", border: `1px solid ${T.border}` }}>
              <FileUpload label="📃 Orden médica:"
                files={patient.orderFiles || []} onAdd={f => upd({ orderFiles: [...(patient.orderFiles || []), f] })} onRemove={id => upd({ orderFiles: (patient.orderFiles || []).filter(x => x.id !== id) })} accept="image/*,.pdf" />
              <p style={{ fontSize: ".76rem", color: T.muted, margin: ".6rem 0 0", lineHeight: 1.55 }}>La IA considerará las indicaciones médicas al generar planes, pero puede proponer avances basados en evidencia y la evolución del paciente.</p>
            </div>
            {((patient.examFiles || []).length > 0 || (patient.orderFiles || []).length > 0) && (
              <button onClick={() => setTab("ai")} style={{ padding: ".65rem 1.2rem", borderRadius: "11px", border: "none", background: `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: "pointer" }}>🤖 Analizar exámenes con IA →</button>
            )}
          </div>
        )}

        {tab === "exercises" && (
          <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
            <button onClick={genHome} disabled={homeLoading} style={{ padding: ".75rem", borderRadius: "11px", border: "none", background: homeLoading ? T.muted : `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: homeLoading ? "not-allowed" : "pointer" }}>
              {homeLoading ? "⏳ Generando programa..." : "🏋️ Generar programa de ejercicios para el hogar"}
            </button>
            {homeResult && (
              <div style={{ background: T.white, borderRadius: "13px", padding: "1.1rem", border: `1px solid ${T.border}` }}>
                <Md text={homeResult} />
                <button onClick={() => { upd({ homeExercises: homeResult }); setHomeResult(""); }} style={{ marginTop: ".75rem", padding: ".5rem 1rem", borderRadius: "8px", border: "none", background: T.teal, color: "white", fontWeight: "700", cursor: "pointer", fontSize: ".82rem" }}>💾 Guardar programa</button>
              </div>
            )}
            {patient.homeExercises && !homeResult && (
              <div style={{ background: T.white, borderRadius: "13px", padding: "1.1rem", border: `1px solid ${T.border}` }}>
                <div style={{ fontWeight: "700", color: T.charcoal, marginBottom: ".6rem", fontSize: ".88rem" }}>Programa guardado para {patient.name}</div>
                <Md text={patient.homeExercises} />
              </div>
            )}
            {!patient.homeExercises && !homeResult && !homeLoading && (
              <div style={{ textAlign: "center", color: T.muted, padding: "2rem", fontSize: ".88rem" }}>Genera un programa personalizado según el diagnóstico 🏠</div>
            )}
          </div>
        )}

        {tab === "ai" && (
          <div style={{ height: "430px", display: "flex", flexDirection: "column" }}>
            <AIChat key={`ai-${patient.id}`}
              system={`Eres una kinesióloga clínica con actualización constante en evidencia. Atienes a:\nPaciente: ${patient.name}, ${patient.age} años\nDiagnóstico: ${patient.diagnosis}\nNotas: ${patient.notes}\nSesiones realizadas: ${(patient.sessions || []).length}\nOrden médica: ${(patient.orderFiles || []).length > 0 ? "Sí (ver imágenes adjuntas)" : "No"}\n\nResponde con criterio clínico basado en evidencia. Si hay orden médica, considérala pero puedes proponer avances si la evidencia y evolución lo justifican.`}
              placeholder={`Consulta clínica sobre ${patient.name}...`}
              extraContent={(patient.examFiles || []).filter(f => isImage(f.name)).map(f => ({ type: "image", source: { type: "base64", media_type: f.type, data: f.data.split(",")[1] } })).concat((patient.orderFiles || []).filter(f => isImage(f.name)).map(f => ({ type: "image", source: { type: "base64", media_type: f.type, data: f.data.split(",")[1] } })))}
              suggestions={["¿Técnicas más efectivas para este diagnóstico?", "¿Cómo progreso el tratamiento?", "Analiza los exámenes adjuntos", "¿Qué dice la evidencia actual sobre este caso?"]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Patient Form ──────────────────────────────────────────────────
function PatientForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: "", age: "", diagnosis: "", notes: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
      {[["name", "Nombre completo *", "text"], ["age", "Edad", "number"], ["diagnosis", "Diagnóstico / Motivo de consulta", "text"]].map(([k, lbl, type]) => (
        <div key={k}>
          <label style={{ fontSize: ".81rem", fontWeight: "700", color: T.slate, display: "block", marginBottom: ".3rem" }}>{lbl}</label>
          <input type={type} value={form[k] || ""} onChange={e => set(k, e.target.value)}
            style={{ width: "100%", padding: ".62rem .88rem", borderRadius: "10px", border: `1.5px solid ${T.border}`, fontSize: ".87rem", boxSizing: "border-box", outline: "none", color: T.charcoal }}
            onFocus={e => e.target.style.borderColor = T.teal} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
      ))}
      <div>
        <label style={{ fontSize: ".81rem", fontWeight: "700", color: T.slate, display: "block", marginBottom: ".3rem" }}>Notas adicionales</label>
        <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3}
          style={{ width: "100%", padding: ".62rem .88rem", borderRadius: "10px", border: `1.5px solid ${T.border}`, fontSize: ".87rem", resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit", color: T.charcoal }}
          onFocus={e => e.target.style.borderColor = T.teal} onBlur={e => e.target.style.borderColor = T.border} />
      </div>
      <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: ".58rem 1.05rem", borderRadius: "9px", border: `1px solid ${T.border}`, background: "white", color: T.muted, cursor: "pointer", fontWeight: "600" }}>Cancelar</button>
        <button onClick={() => onSave(form)} disabled={!form.name?.trim()} style={{ padding: ".58rem 1.25rem", borderRadius: "9px", border: "none", background: `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: "pointer" }}>Guardar</button>
      </div>
    </div>
  );
}

// ─── Patients Module ───────────────────────────────────────────────
function PatientsModule({ templates }) {
  const [patients, setPatients] = useState(() => load(SK.patients) || []);
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  function persist(list) { setPatients(list); save(SK.patients, list); }
  function savePatient(form) {
    const base = { sessions: [], examFiles: [], orderFiles: [] };
    const list = selected?.id
      ? patients.map(p => p.id === selected.id ? { ...p, ...form } : p)
      : [...patients, { ...base, id: uid(), ...form }];
    persist(list); setView("list"); setSelected(null);
  }
  function updatePatient(upd) { const list = patients.map(p => p.id === upd.id ? upd : p); persist(list); setSelected(upd); }
  function del(id) { if (!confirm("¿Eliminar paciente y todos sus datos?")) return; persist(patients.filter(p => p.id !== id)); }

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.diagnosis || "").toLowerCase().includes(search.toLowerCase()));

  if (view === "detail" && selected) return <PatientDetail patient={selected} templates={templates} onBack={() => { setView("list"); setSelected(null); }} onUpdate={updatePatient} />;
  if (view === "form") return (
    <div>
      <div style={{ fontWeight: "800", fontSize: "1.05rem", marginBottom: "1.1rem", color: T.charcoal }}>{selected ? "Editar paciente" : "Nuevo paciente"}</div>
      <PatientForm initial={selected} onSave={savePatient} onCancel={() => { setView("list"); setSelected(null); }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
      <div style={{ display: "flex", gap: ".6rem" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o diagnóstico..."
          style={{ flex: 1, padding: ".62rem .9rem", borderRadius: "10px", border: `1.5px solid ${T.border}`, fontSize: ".87rem", outline: "none" }}
          onFocus={e => e.target.style.borderColor = T.teal} onBlur={e => e.target.style.borderColor = T.border} />
        <button onClick={() => { setSelected(null); setView("form"); }} style={{ padding: ".62rem 1.1rem", borderRadius: "10px", border: "none", background: `linear-gradient(135deg,${T.teal},${T.tealD})`, color: "white", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>+ Nuevo</button>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem", color: T.muted }}>
          <div style={{ fontSize: "2.2rem" }}>👤</div>
          <div style={{ fontWeight: "600", marginTop: ".4rem" }}>{search ? "Sin resultados" : "Sin pacientes aún"}</div>
          <div style={{ fontSize: ".81rem" }}>Agrega tu primer paciente con "+ Nuevo"</div>
        </div>
      ) : filtered.map(p => (
        <div key={p.id} onClick={() => { setSelected(p); setView("detail"); }} style={{ background: T.white, borderRadius: "13px", padding: ".95rem 1.1rem", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: ".9rem", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px rgba(13,148,136,.12)`}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${T.teal},${T.sageL})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "1rem", flexShrink: 0 }}>{p.name[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: "700", color: T.charcoal, fontSize: ".92rem" }}>{p.name}</div>
            <div style={{ fontSize: ".78rem", color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.age ? `${p.age} años · ` : ""}{p.diagnosis || "Sin diagnóstico"}</div>
          </div>
          <div style={{ fontSize: ".76rem", color: T.muted, textAlign: "right", flexShrink: 0, lineHeight: 1.7 }}>
            <div style={{ fontWeight: "700", color: T.teal }}>{(p.sessions || []).length} sesiones</div>
            <div>{(p.examFiles || []).length + (p.orderFiles || []).length} archivos</div>
          </div>
          <div style={{ display: "flex", gap: ".3rem" }}>
            <button onClick={e => { e.stopPropagation(); setSelected(p); setView("form"); }} style={{ padding: ".35rem .6rem", borderRadius: "7px", border: `1px solid ${T.border}`, background: "white", cursor: "pointer" }}>✏️</button>
            <button onClick={e => { e.stopPropagation(); del(p.id); }} style={{ padding: ".35rem .6rem", borderRadius: "7px", border: `1px solid ${T.redBg}`, background: T.redBg, cursor: "pointer" }}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────
const AREAS = [
  { id: "clinical", label: "🩺 Área Clínica", sub: "Pacientes · Fichas · Sesiones" },
  { id: "research", label: "🔬 Investigación", sub: "Evidencia científica" },
  { id: "teaching", label: "📚 Docencia", sub: "Material para clases" },
];

export default function App() {
  const [area, setArea] = useState("clinical");
  const [clinTab, setClinTab] = useState("patients");
  const [templates, setTemplates] = useState(() => load(SK.templates) || { eval: "", session: "" });
  const [showTpl, setShowTpl] = useState(false);

  function saveTpl(t) { setTemplates(t); save(SK.templates, t); }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${T.cream} 0%,#e5f2f0 100%)`, fontFamily: "Palatino,'Book Antiqua',Georgia,serif", display: "flex", flexDirection: "column" }}>

      <header style={{ background: `linear-gradient(135deg,${T.charcoal},${T.slate})`, padding: ".85rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "9px", background: `linear-gradient(135deg,${T.teal},${T.sageL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem" }}>🦴</div>
          <div>
            <div style={{ color: "white", fontWeight: "800", fontSize: "1.05rem" }}>KinesioAI</div>
            <div style={{ color: T.tealL, fontSize: ".68rem" }}>Clínica · Docencia · Investigación</div>
          </div>
        </div>
        <button onClick={() => setShowTpl(true)} style={{ padding: ".42rem .85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.1)", color: "white", fontWeight: "600", fontSize: ".76rem", cursor: "pointer" }}>
          📋 Mis Formatos
        </button>
      </header>

      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: ".55rem 1.5rem", display: "flex", gap: ".4rem", overflowX: "auto" }}>
        {AREAS.map(a => (
          <button key={a.id} onClick={() => setArea(a.id)} style={{ padding: ".48rem .95rem", borderRadius: "10px", border: "none", background: area === a.id ? `linear-gradient(135deg,${T.teal},${T.tealD})` : T.warm, color: area === a.id ? "white" : T.slate, fontWeight: "700", fontSize: ".81rem", cursor: "pointer", whiteSpace: "nowrap" }}>
            {a.label}
          </button>
        ))}
      </div>

      {area === "clinical" && (
        <div style={{ background: "#f5faf9", borderBottom: `1px solid ${T.border}`, padding: ".42rem 1.5rem", display: "flex", gap: ".35rem" }}>
          {[["patients", "👤 Pacientes"], ["clinical_ai", "🤖 IA Clínica General"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setClinTab(id)} style={{ padding: ".35rem .82rem", borderRadius: "999px", border: "none", background: clinTab === id ? T.tealL : "transparent", color: clinTab === id ? "white" : T.muted, fontWeight: "600", fontSize: ".77rem", cursor: "pointer" }}>{lbl}</button>
          ))}
        </div>
      )}

      <main style={{ flex: 1, padding: "1.1rem 1.5rem", maxWidth: "920px", width: "100%", margin: "0 auto", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ background: T.white, borderRadius: "17px", padding: "1.3rem", boxShadow: "0 4px 24px rgba(0,0,0,.06)", border: `1px solid ${T.border}`, flex: 1, display: "flex", flexDirection: "column", minHeight: "500px" }}>

          {area === "clinical" && clinTab === "patients" && (
            <><div style={{ fontWeight: "800", fontSize: "1.05rem", color: T.charcoal, marginBottom: ".9rem" }}>👤 Mis Pacientes</div><PatientsModule templates={templates} /></>
          )}

          {area === "clinical" && clinTab === "clinical_ai" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: "800", fontSize: "1.05rem", color: T.charcoal, marginBottom: ".25rem" }}>🤖 IA Clínica General</div>
              <div style={{ fontSize: ".78rem", color: T.muted, marginBottom: ".9rem" }}>Consultas clínicas, protocolos, diagnóstico diferencial, planificación de tratamientos</div>
              <div style={{ flex: 1 }}>
                <AIChat key="clin" system="Eres una kinesióloga clínica con actualización constante en evidencia. Respondes con criterio clínico profesional, razonamiento basado en evidencia actualizada. Puedes orientar sobre diagnóstico diferencial, técnicas de evaluación, protocolos de tratamiento, y abordajes kinesiológicos."
                  placeholder="Consulta clínica, protocolo, diagnóstico diferencial..."
                  suggestions={["Protocolo de evaluación para dolor de hombro", "¿Cómo diferenciar tendinopatía de bursitis?", "Abordaje kinesiológico post ACV", "Criterios de alta en rehab de rodilla"]} />
              </div>
            </div>
          )}

          {area === "research" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: "800", fontSize: "1.05rem", color: T.charcoal, marginBottom: ".25rem" }}>🔬 Investigación Científica</div>
              <div style={{ fontSize: ".78rem", color: T.muted, marginBottom: ".9rem" }}>Evidencia actualizada, análisis de estudios, revisiones sistemáticas, estado del arte en kinesiología</div>
              <div style={{ flex: 1 }}>
                <AIChat key="res" system="Eres una investigadora experta en kinesiología, fisioterapia y rehabilitación. Conoces profundamente la literatura científica actualizada. Citas evidencia real (autores, años, revistas), explicas nivel de evidencia (GRADE, PEDro, etc.), señalas limitaciones de estudios, y sintetizas hallazgos de forma práctica y rigurosa."
                  placeholder="¿Qué evidencia existe sobre...?"
                  suggestions={["Evidencia actual del dry needling en dolor miofascial", "Ejercicio vs terapia manual en lumbalgia crónica", "¿Qué dice la evidencia sobre kinesiotaping?", "Guías clínicas en rehabilitación de hombro 2024-2025"]} />
              </div>
            </div>
          )}

          {area === "teaching" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: "800", fontSize: "1.05rem", color: T.charcoal, marginBottom: ".25rem" }}>📚 Docencia</div>
              <div style={{ fontSize: ".78rem", color: T.muted, marginBottom: ".9rem" }}>Material didáctico, casos clínicos, evaluaciones, guías prácticas y recursos para estudiantes</div>
              <div style={{ flex: 1 }}>
                <AIChat key="teach" system="Eres una docente universitaria experta en kinesiología con amplia experiencia pedagógica en ciencias de la salud. Ayudas a preparar clases, casos clínicos complejos con preguntas orientadoras, rúbricas de evaluación, esquemas conceptuales, guías prácticas y recursos educativos de alta calidad. Estructuras el contenido con objetivos de aprendizaje claros, ejemplos reales, y base en evidencia actualizada."
                  placeholder="¿Qué material necesitas preparar?"
                  suggestions={["Caso clínico LCA para alumnos de 3er año con preguntas", "Esquema de biomecánica de la marcha (clase 60 min)", "10 preguntas de evaluación sobre SNC y movimiento", "Guía práctica de evaluación de hombro para estudiantes"]} />
              </div>
            </div>
          )}
        </div>
      </main>

      {showTpl && <TemplateManager templates={templates} onSave={saveTpl} onClose={() => setShowTpl(false)} />}
    </div>
  );
}
