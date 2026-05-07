import { useState, useRef, useEffect, useMemo } from "react";

// ─── Storage ───────────────────────────────────────────────────────
const SK = { patients:"kinesio_patients_v3", templates:"kinesio_templates_v2", agenda:"kinesio_agenda_v1", subjects:"kinesio_subjects_v1", projects:"kinesio_projects_v1" };
const load = k => { try { const r=localStorage.getItem(k); return r?JSON.parse(r):null; } catch { return null; } };
const save = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);

// ─── Theme: Graphite / Navy-Sky ────────────────────────────────────
const T = {
  // Backgrounds
  bg: "#f4f5f7",
  surface: "#ffffff",
  surfaceHover: "#f8f9fa",
  sidebar: "#1a2236",
  sidebarHover: "#243048",

  // Text
  text: "#111827",
  textMuted: "#6b7280",
  textLight: "#9ca3af",

  // Accent — navy / sky
  accent: "#1e4d8c",
  accentL: "#4a7cbf",
  accentD: "#153666",
  accentBg: "#eef3fb",
  accentBorder: "#b8cfe8",

  // Neutrals
  border: "#e5e7eb",
  borderDark: "#d1d5db",
  graphite: "#374151",
  graphiteL: "#4b5563",

  // Status
  green: "#16a34a", greenBg: "#f0fdf4",
  amber: "#d97706", amberBg: "#fffbeb",
  red: "#dc2626", redBg: "#fef2f2",
  white: "#ffffff",
};

const FONT = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{font-family:'Inter','Aptos','Segoe UI',system-ui,sans-serif;box-sizing:border-box;}
  body{margin:0;background:${T.bg};}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px;}
  input,textarea,select{font-family:inherit;}
`;

// ─── SVG Icons ─────────────────────────────────────────────────────
const Icon = ({ name, size=16, color="currentColor", strokeWidth=1.75 }) => {
  const p = {
    clinical: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    patients: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    agenda: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    research: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
    teaching: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
    ai: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
    search: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
    plus: "M12 4.5v15m7.5-7.5h-15",
    menu: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
    close: "M6 18L18 6M6 6l12 12",
    send: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
    trash: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
    edit: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
    file: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    upload: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
    check: "M4.5 12.75l6 6 9-13.5",
    star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    link: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
    settings: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z",
    chevLeft: "M15.75 19.5L8.25 12l7.5-7.5",
    chevRight: "M8.25 4.5l7.5 7.5-7.5 7.5",
    folder: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  };
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d={p[name]||""}/></svg>;
};

// ─── Logo SVG ──────────────────────────────────────────────────────
const Logo = ({ size=28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill={T.accent}/>
    <path d="M16 7v18M10 13l6-6 6 6M10 19l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Markdown ──────────────────────────────────────────────────────
function Md({ text }) {
  if (!text) return null;
  const html = text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>")
    .replace(/^### (.+)$/gm,`<h3 style="color:${T.accentD};font-size:.9rem;font-weight:600;margin:.85rem 0 .2rem">$1</h3>`)
    .replace(/^## (.+)$/gm,`<h2 style="color:${T.accentD};font-size:.98rem;font-weight:700;margin:.95rem 0 .28rem">$1</h2>`)
    .replace(/^# (.+)$/gm,`<h1 style="color:${T.text};font-size:1.05rem;font-weight:700;margin:.95rem 0 .35rem">$1</h1>`)
    .replace(/^- (.+)$/gm,`<li style="margin:.18rem 0">$1</li>`)
    .replace(/(<li.*<\/li>\n?)+/g,m=>`<ul style="padding-left:1.1rem;margin:.38rem 0">${m}</ul>`)
    .replace(/\n\n/g,`</p><p style="margin:.42rem 0">`).replace(/\n/g,"<br/>");
  return <div dangerouslySetInnerHTML={{__html:`<p style="margin:.42rem 0">${html}</p>`}} style={{fontSize:".86rem",lineHeight:1.75,color:T.text}}/>;
}

// ─── Claude API ────────────────────────────────────────────────────
async function askClaude(system, messages, onChunk) {
  const resp = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,stream:true,system,messages})});
  const reader=resp.body.getReader(); const dec=new TextDecoder(); let full="";
  while(true){const{done,value}=await reader.read();if(done)break;for(const line of dec.decode(value).split("\n")){if(line.startsWith("data: ")){try{const d=JSON.parse(line.slice(6));if(d.type==="content_block_delta"&&d.delta?.text){full+=d.delta.text;onChunk(full);}}catch{}}}}
  return full;
}

// ─── File helpers ──────────────────────────────────────────────────
const fileToBase64=f=>new Promise((r,j)=>{const x=new FileReader();x.onload=()=>r(x.result);x.onerror=j;x.readAsDataURL(f);});
const isImage=n=>/\.(png|jpg|jpeg|gif|webp)$/i.test(n);
const isPDF=n=>/\.pdf$/i.test(n);
const getMediaType=n=>/\.png$/i.test(n)?"image/png":/\.(jpg|jpeg)$/i.test(n)?"image/jpeg":"application/pdf";

// ─── Primitives ────────────────────────────────────────────────────
function Btn({onClick,children,variant="primary",size="md",disabled=false,icon,full=false}){
  const S={
    primary:{bg:T.accent,color:"#fff",border:"none"},
    secondary:{bg:T.white,color:T.graphite,border:`1px solid ${T.border}`},
    ghost:{bg:"transparent",color:T.accent,border:`1px solid ${T.accentBorder}`},
    danger:{bg:T.redBg,color:T.red,border:"1px solid #fecaca"},
    subtle:{bg:T.bg,color:T.graphite,border:`1px solid ${T.border}`},
  };
  const P={sm:".28rem .6rem",md:".5rem 1rem",lg:".7rem 1.3rem"};
  const FS={sm:".75rem",md:".84rem",lg:".9rem"};
  return <button onClick={onClick} disabled={disabled} style={{background:S[variant].bg,color:S[variant].color,border:S[variant].border,padding:P[size],borderRadius:"6px",fontWeight:"500",fontSize:FS[size],cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:".35rem",opacity:disabled?.55:1,width:full?"100%":"auto",justifyContent:full?"center":"flex-start",transition:"opacity .15s,background .15s"}} onMouseEnter={e=>{if(!disabled&&variant==="primary")e.currentTarget.style.background=T.accentD;}} onMouseLeave={e=>{if(variant==="primary")e.currentTarget.style.background=T.accent;}}>
    {icon&&<Icon name={icon} size={size==="sm"?12:14} color={S[variant].color}/>}{children}
  </button>;
}

function Input({value,onChange,placeholder,type="text",rows,onKeyDown,onFocus,onBlur}){
  const s={width:"100%",padding:".52rem .8rem",borderRadius:"6px",border:`1px solid ${T.border}`,fontSize:".85rem",outline:"none",color:T.text,background:T.white,transition:"border-color .15s"};
  if(rows) return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...s,resize:"vertical",fontFamily:"inherit",lineHeight:1.65}} onFocus={e=>{e.target.style.borderColor=T.accent;onFocus&&onFocus(e);}} onBlur={e=>{e.target.style.borderColor=T.border;onBlur&&onBlur(e);}}/>;
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} style={s} onFocus={e=>{e.target.style.borderColor=T.accent;onFocus&&onFocus(e);}} onBlur={e=>{e.target.style.borderColor=T.border;onBlur&&onBlur(e);}}/>;
}

function Label({children}){return <label style={{fontSize:".75rem",fontWeight:"600",color:T.textMuted,display:"block",marginBottom:".25rem",textTransform:"uppercase",letterSpacing:".03em"}}>{children}</label>;}

function Card({children,style={}}){return <div style={{background:T.surface,borderRadius:"8px",padding:"1rem",border:`1px solid ${T.border}`,...style}}>{children}</div>;}

function SubTab({tabs,active,onChange}){
  return <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,marginBottom:"1rem",gap:"0"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{padding:".48rem .85rem",border:"none",background:"none",fontWeight:active===t.id?"600":"400",fontSize:".8rem",color:active===t.id?T.accent:T.textMuted,borderBottom:active===t.id?`2px solid ${T.accent}`:"2px solid transparent",marginBottom:"-1px",cursor:"pointer",transition:"color .15s"}}>{t.label}</button>)}
  </div>;
}

function Modal({title,onClose,children,width="560px"}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"1rem"}}>
    <div style={{background:T.surface,borderRadius:"10px",padding:"1.5rem",width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem"}}>
        <div style={{fontWeight:"600",fontSize:".95rem",color:T.text}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,display:"flex",padding:".2rem"}}><Icon name="close" size={16}/></button>
      </div>
      {children}
    </div>
  </div>;
}

function FileUpload({label,files,onAdd,onRemove,accept="*"}){
  const ref=useRef();
  async function handle(e){for(const f of Array.from(e.target.files)){const b=await fileToBase64(f);onAdd({id:uid(),name:f.name,type:f.type||getMediaType(f.name),data:b,date:new Date().toISOString()});}e.target.value="";}
  return <div>
    <div style={{display:"flex",alignItems:"center",gap:".45rem",marginBottom:".4rem"}}>
      <Label>{label}</Label>
      <button onClick={()=>ref.current.click()} style={{display:"flex",alignItems:"center",gap:".28rem",padding:".22rem .6rem",borderRadius:"5px",border:`1px solid ${T.accentBorder}`,background:T.accentBg,color:T.accent,fontSize:".72rem",fontWeight:"600",cursor:"pointer"}}><Icon name="upload" size={11} color={T.accent}/>Subir</button>
      <input ref={ref} type="file" accept={accept} multiple onChange={handle} style={{display:"none"}}/>
    </div>
    {files.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:".3rem"}}>{files.map(f=><div key={f.id} style={{display:"flex",alignItems:"center",gap:".3rem",background:T.bg,borderRadius:"5px",padding:".22rem .55rem",border:`1px solid ${T.border}`}}><Icon name="file" size={11} color={T.textMuted}/><a href={f.data} download={f.name} style={{fontSize:".73rem",color:T.accent,textDecoration:"none",maxWidth:"110px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={f.name}>{f.name}</a><button onClick={()=>onRemove(f.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:0,display:"flex"}}><Icon name="close" size={10}/></button></div>)}</div>}
  </div>;
}

// ─── AI Chat ───────────────────────────────────────────────────────
function AIChat({system,placeholder,suggestions=[],extraContent=[]}){
  const [input,setInput]=useState("");const [msgs,setMsgs]=useState([]);const [loading,setLoading]=useState(false);const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  async function send(text){
    const q=text||input.trim();if(!q)return;setInput("");
    const history=msgs.map(m=>({role:m.role==="user"?"user":"assistant",content:m.text}));
    const uc=extraContent.length>0&&msgs.length===0?[...extraContent,{type:"text",text:q}]:q;
    setMsgs(p=>[...p,{role:"user",text:q},{role:"ai",text:""}]);setLoading(true);
    try{await askClaude(system,[...history,{role:"user",content:uc}],c=>{setMsgs(p=>{const x=[...p];x[x.length-1]={role:"ai",text:c};return x;});});}
    catch{setMsgs(p=>{const x=[...p];x[x.length-1]={role:"ai",text:"Error de conexión."};return x;});}
    setLoading(false);
  }
  return <div style={{display:"flex",flexDirection:"column",height:"100%",gap:".7rem"}}>
    {msgs.length===0&&suggestions.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:".38rem"}}>{suggestions.map((s,i)=><button key={i} onClick={()=>send(s)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"5px",padding:".32rem .75rem",fontSize:".76rem",color:T.graphite,cursor:"pointer",transition:"border-color .15s"}} onMouseEnter={e=>e.target.style.borderColor=T.accent} onMouseLeave={e=>e.target.style.borderColor=T.border}>{s}</button>)}</div>}
    <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:".6rem",paddingRight:".25rem"}}>
      {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:".45rem"}}>
        {m.role==="ai"&&<div style={{width:26,height:26,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:".1rem"}}><Icon name="ai" size={13} color="white"/></div>}
        <div style={{maxWidth:"82%",padding:".6rem .88rem",borderRadius:"8px",background:m.role==="user"?T.graphite:T.surface,color:m.role==="user"?"#fff":T.text,boxShadow:"0 1px 3px rgba(0,0,0,.07)",border:m.role==="ai"?`1px solid ${T.border}`:"none",fontSize:".86rem"}}>
          {m.role==="user"?m.text:<Md text={m.text||"▋"}/>}
        </div>
      </div>)}
      <div ref={endRef}/>
    </div>
    <div style={{display:"flex",gap:".45rem",borderTop:`1px solid ${T.border}`,paddingTop:".7rem"}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder={placeholder} disabled={loading} style={{flex:1,padding:".6rem .85rem",borderRadius:"6px",border:`1px solid ${T.border}`,fontSize:".86rem",outline:"none",color:T.text}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
      <button onClick={()=>send()} disabled={loading||!input.trim()} style={{padding:".6rem .95rem",borderRadius:"6px",border:"none",background:loading?T.textLight:T.accent,color:"#fff",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center"}}><Icon name="send" size={14} color="white"/></button>
    </div>
  </div>;
}

// ─── Calendar ──────────────────────────────────────────────────────
function CalendarView({events,onDayClick,selectedDate}){
  const [current,setCurrent]=useState(new Date());
  const year=current.getFullYear(),month=current.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const today=new Date().toISOString().slice(0,10);
  const DAYS=["Do","Lu","Ma","Mi","Ju","Vi","Sá"];
  const MONTHS=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const eventsByDay=useMemo(()=>{const m={};events.forEach(e=>{if(!m[e.date])m[e.date]=[];m[e.date].push(e);});return m;},[events]);
  const cells=[];
  for(let i=0;i<firstDay;i++)cells.push(null);
  for(let d=1;d<=daysInMonth;d++)cells.push(d);
  return <div style={{background:T.surface,borderRadius:"8px",border:`1px solid ${T.border}`,overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:".75rem 1rem",borderBottom:`1px solid ${T.border}`}}>
      <button onClick={()=>setCurrent(new Date(year,month-1,1))} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,display:"flex",padding:".2rem"}}><Icon name="chevLeft" size={16}/></button>
      <div style={{fontWeight:"600",fontSize:".88rem",color:T.text}}>{MONTHS[month]} {year}</div>
      <button onClick={()=>setCurrent(new Date(year,month+1,1))} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,display:"flex",padding:".2rem"}}><Icon name="chevRight" size={16}/></button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:".5rem .75rem .75rem"}}>
      {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:".7rem",fontWeight:"600",color:T.textLight,padding:".3rem 0"}}>{d}</div>)}
      {cells.map((d,i)=>{
        if(!d)return <div key={`e${i}`}/>;
        const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const hasEvents=eventsByDay[dateStr]?.length>0;
        const isToday=dateStr===today;
        const isSelected=dateStr===selectedDate;
        return <div key={d} onClick={()=>onDayClick(dateStr)} style={{textAlign:"center",padding:".28rem",cursor:"pointer",borderRadius:"6px",background:isSelected?T.accent:isToday?T.accentBg:"transparent",color:isSelected?"white":isToday?T.accent:T.text,fontSize:".82rem",fontWeight:isToday||isSelected?"600":"400",position:"relative",transition:"background .1s"}} onMouseEnter={e=>{if(!isSelected&&!isToday)e.currentTarget.style.background=T.bg;}} onMouseLeave={e=>{if(!isSelected&&!isToday)e.currentTarget.style.background="transparent";}}>
          {d}
          {hasEvents&&<div style={{width:4,height:4,borderRadius:"50%",background:isSelected?"rgba(255,255,255,.8)":T.accent,margin:"1px auto 0"}}/>}
        </div>;
      })}
    </div>
  </div>;
}

// ─── Agenda ────────────────────────────────────────────────────────
function AgendaModule(){
  const [events,setEvents]=useState(()=>load(SK.agenda)||[]);
  const [selectedDate,setSelectedDate]=useState(new Date().toISOString().slice(0,10));
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({title:"",date:selectedDate,time:"09:00",duration:"60",patient:"",notes:""});
  function persist(list){setEvents(list);save(SK.agenda,list);}
  function addEvent(){persist([...events,{id:uid(),...form}]);setShowAdd(false);setForm({title:"",date:selectedDate,time:"09:00",duration:"60",patient:"",notes:""});}
  const dayEvents=events.filter(e=>e.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
  const today=new Date().toISOString().slice(0,10);
  return <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{fontWeight:"600",color:T.text,fontSize:".9rem"}}>Agenda</div>
      <div style={{display:"flex",gap:".45rem"}}>
        <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:".3rem",padding:".38rem .75rem",borderRadius:"6px",border:`1px solid ${T.border}`,background:T.surface,color:T.graphite,fontSize:".76rem",fontWeight:"500",textDecoration:"none"}}><Icon name="link" size={12} color={T.textMuted}/>Google Calendar</a>
        <Btn onClick={()=>{setForm(p=>({...p,date:selectedDate}));setShowAdd(true);}} icon="plus" size="sm">Nueva cita</Btn>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",alignItems:"start"}}>
      <CalendarView events={events} onDayClick={d=>{setSelectedDate(d);setForm(p=>({...p,date:d}));}} selectedDate={selectedDate}/>
      <div>
        <div style={{fontWeight:"600",fontSize:".82rem",color:T.text,marginBottom:".6rem",display:"flex",alignItems:"center",gap:".4rem"}}>
          <Icon name="clock" size={13} color={T.accent}/>
          {selectedDate===today?"Hoy":selectedDate}
          <span style={{marginLeft:"auto",fontSize:".74rem",color:T.textMuted,fontWeight:"400"}}>{dayEvents.length} cita{dayEvents.length!==1?"s":""}</span>
        </div>
        {dayEvents.length===0?<div style={{color:T.textLight,fontSize:".82rem",padding:"1.5rem",textAlign:"center",background:T.bg,borderRadius:"8px",border:`1px dashed ${T.border}`}}>Sin citas este día</div>:
          <div style={{display:"flex",flexDirection:"column",gap:".4rem"}}>
            {dayEvents.map(e=><div key={e.id} style={{display:"flex",gap:".6rem",padding:".6rem .75rem",borderRadius:"7px",background:T.accentBg,border:`1px solid ${T.accentBorder}`,alignItems:"flex-start"}}>
              <div style={{fontWeight:"600",color:T.accent,fontSize:".78rem",minWidth:"38px",marginTop:".05rem"}}>{e.time}</div>
              <div style={{flex:1}}><div style={{fontWeight:"500",fontSize:".84rem",color:T.text}}>{e.title}</div>{e.patient&&<div style={{fontSize:".74rem",color:T.textMuted,marginTop:".1rem"}}>{e.patient} · {e.duration} min</div>}</div>
              <button onClick={()=>persist(events.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:0}}><Icon name="trash" size={13}/></button>
            </div>)}
          </div>
        }
      </div>
    </div>
    {showAdd&&<Card>
      <div style={{fontWeight:"600",fontSize:".86rem",marginBottom:".8rem",color:T.text}}>Nueva cita — {form.date}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".6rem"}}>
        {[["Título *","title","text"],["Paciente","patient","text"],["Fecha","date","date"],["Hora","time","time"]].map(([l,k,t])=><div key={k}><Label>{l}</Label><Input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>)}
        <div><Label>Duración (min)</Label><select value={form.duration} onChange={e=>setForm(p=>({...p,duration:e.target.value}))} style={{width:"100%",padding:".52rem .8rem",borderRadius:"6px",border:`1px solid ${T.border}`,fontSize:".85rem",color:T.text}}>{["30","45","60","90","120"].map(d=><option key={d}>{d}</option>)}</select></div>
        <div><Label>Notas</Label><Input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
      </div>
      <div style={{display:"flex",gap:".45rem",justifyContent:"flex-end",marginTop:".8rem"}}><Btn onClick={()=>setShowAdd(false)} variant="secondary" size="sm">Cancelar</Btn><Btn onClick={addEvent} disabled={!form.title||!form.date} size="sm" icon="check">Guardar cita</Btn></div>
    </Card>}
  </div>;
}

// ─── Templates ────────────────────────────────────────────────────
function TemplateManager({templates,onSave,onClose}){
  const [evalTpl,setEvalTpl]=useState(templates.eval||"");
  const [sessTpl,setSessTpl]=useState(templates.session||"");
  const [saved,setSaved]=useState(false);
  function handleSave(){
    onSave({eval:evalTpl,session:sessTpl});
    setSaved(true);
    setTimeout(()=>{setSaved(false);onClose();},900);
  }
  return <Modal title="Formatos de Fichas" onClose={onClose} width="680px">
    <p style={{fontSize:".82rem",color:T.textMuted,marginBottom:"1rem"}}>La IA usará estos formatos al generar fichas automáticamente cuando ingreses datos de evaluación o sesión.</p>
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div>
        <Label>Formato Ficha de Evaluación</Label>
        <textarea value={evalTpl} onChange={ev=>setEvalTpl(ev.target.value)} rows={9}
          placeholder={"FICHA DE EVALUACIÓN KINESIOLÓGICA\n\nI. DATOS DEL PACIENTE\n- Nombre:\n- Edad:\n\nII. ANAMNESIS\n- Motivo de consulta:\n- EVA reposo / movimiento:\n\nIII. EXAMEN FÍSICO\n- Inspección:\n- Tests especiales:\n\nIV. DIAGNÓSTICO KINESIOLÓGICO\n\nV. OBJETIVOS\n\nVI. PLAN DE TRATAMIENTO"}
          style={{width:"100%",padding:".7rem",borderRadius:"6px",border:`1px solid ${T.border}`,fontSize:".8rem",resize:"vertical",fontFamily:"monospace",lineHeight:1.6,outline:"none"}}
          onFocus={ev=>ev.target.style.borderColor=T.accent} onBlur={ev=>ev.target.style.borderColor=T.border}/>
      </div>
      <div>
        <Label>Formato Ficha de Sesión / Atención</Label>
        <textarea value={sessTpl} onChange={ev=>setSessTpl(ev.target.value)} rows={7}
          placeholder={"FICHA DE ATENCIÓN KINESIOLÓGICA\n\nFecha:\nSesión N°:\nPaciente:\n\nEstado al inicio (EVA, observaciones):\n\nTécnicas aplicadas:\n\nRespuesta del paciente:\n\nObjetivos próxima sesión:"}
          style={{width:"100%",padding:".7rem",borderRadius:"6px",border:`1px solid ${T.border}`,fontSize:".8rem",resize:"vertical",fontFamily:"monospace",lineHeight:1.6,outline:"none"}}
          onFocus={ev=>ev.target.style.borderColor=T.accent} onBlur={ev=>ev.target.style.borderColor=T.border}/>
      </div>
      {saved&&<div style={{background:T.accentBg,border:`1px solid ${T.accentBorder}`,borderRadius:"6px",padding:".55rem .9rem",fontSize:".82rem",color:T.accentD,display:"flex",alignItems:"center",gap:".4rem"}}><Icon name="check" size={13} color={T.accentD}/>Formatos guardados correctamente</div>}
      <div style={{display:"flex",justifyContent:"flex-end",gap:".45rem"}}>
        <Btn onClick={onClose} variant="secondary">Cancelar</Btn>
        <Btn onClick={handleSave} icon="check" disabled={saved}>{saved?"Guardado":"Guardar formatos"}</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Generate Ficha ────────────────────────────────────────────────
function GenerateFicha({patient,type,template,onClose,onSave}){
  const [raw,setRaw]=useState("");const [files,setFiles]=useState([]);const [result,setResult]=useState("");const [loading,setLoading]=useState(false);
  const hasT=template&&template.trim().length>10;
  async function generate(){
    setLoading(true);setResult("");
    let uc=[];
    for(const f of files){if(isImage(f.name))uc.push({type:"image",source:{type:"base64",media_type:f.type,data:f.data.split(",")[1]}});else if(isPDF(f.name))uc.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:f.data.split(",")[1]}});}
    const prompt=type==="eval"
      ?`Paciente: ${patient.name}, ${patient.age}a. Dx: ${patient.diagnosis}. Notas: ${patient.notes}\n\nDATOS EVALUACIÓN:\n${raw}\n\n${hasT?`FORMATO:\n${template}`:"Genera ficha de evaluación kinesiológica completa."}`
      :`Paciente: ${patient.name}, ${patient.age}a. Dx: ${patient.diagnosis}. Sesión N°${(patient.sessions||[]).length+1}\n\nDATOS SESIÓN:\n${raw}\n\n${hasT?`FORMATO:\n${template}`:"Genera ficha de atención kinesiológica completa."}`;
    uc.push({type:"text",text:prompt});
    await askClaude("Eres kinesióloga experta. Genera fichas clínicas profesionales y completas. Sigue EXACTAMENTE el formato indicado.",[{role:"user",content:uc}],c=>setResult(c));
    setLoading(false);
  }
  return <Modal title={type==="eval"?"Generar Ficha de Evaluación":"Generar Ficha de Sesión"} onClose={onClose} width="660px">
    <div style={{display:"flex",flexDirection:"column",gap:".9rem"}}>
      {!hasT&&<div style={{background:T.amberBg,border:"1px solid #fcd34d",borderRadius:"6px",padding:".6rem .85rem",fontSize:".78rem",color:T.amber}}>Sin formato configurado — se usará formato estándar. Configura en Ajustes.</div>}
      <div><Label>{type==="eval"?"Datos de anamnesis y examen físico":"Datos de la sesión"}</Label><Input value={raw} onChange={e=>setRaw(e.target.value)} placeholder={type==="eval"?"Escribe tus notas en bruto:\nEj: pcte 35a, dolor hombro der 6/10, 3 sem, EVA 3/10 rep 7/10 mov, ABD 100°, Neer +, Hawkins +...":"Ej: pcte 4/10 dolor. US 3MHz 5min, TENS 80Hz, moviliz glenohumeral grado III, buena tolerancia, sale 2/10..."} rows={7}/></div>
      <FileUpload label="Adjuntar exámenes / documentos" files={files} onAdd={f=>setFiles(p=>[...p,f])} onRemove={id=>setFiles(p=>p.filter(x=>x.id!==id))} accept="image/*,.pdf"/>
      <Btn onClick={generate} disabled={loading||!raw.trim()} icon="ai" full>{loading?"Generando ficha...":"Generar ficha automáticamente"}</Btn>
      {result&&<><div style={{background:T.bg,borderRadius:"7px",padding:".9rem",maxHeight:"260px",overflowY:"auto",border:`1px solid ${T.border}`}}><Md text={result}/></div><div style={{display:"flex",gap:".45rem",justifyContent:"flex-end"}}><Btn onClick={onClose} variant="secondary">Cancelar</Btn><Btn onClick={()=>{onSave(result,files);onClose();}} icon="check">Guardar ficha</Btn></div></>}
    </div>
  </Modal>;
}

// ─── Patient Detail ────────────────────────────────────────────────
function PatientDetail({patient,templates,onBack,onUpdate}){
  const [tab,setTab]=useState("overview");const [showGenEval,setShowGenEval]=useState(false);const [showGenSess,setShowGenSess]=useState(false);
  const [showNewSess,setShowNewSess]=useState(false);const [sessDate,setSessDate]=useState(new Date().toISOString().slice(0,10));const [sessNotes,setSessNotes]=useState("");const [sessFiles,setSessFiles]=useState([]);
  const [homeLoading,setHomeLoading]=useState(false);const [homeResult,setHomeResult]=useState("");
  function upd(c){onUpdate({...patient,...c});}
  async function genHome(){setHomeLoading(true);setHomeResult("");await askClaude("Eres kinesióloga experta. Genera programas de ejercicios domiciliarios detallados en lenguaje claro para el paciente.",[{role:"user",content:`Programa para: ${patient.name}, ${patient.age}a, Dx: ${patient.diagnosis}. ${(patient.sessions||[]).length} sesiones. Incluye: nombre, descripción simple, series, reps, frecuencia, señales de alerta.`}],c=>setHomeResult(c));setHomeLoading(false);}
  const tabs=[{id:"overview",label:"Resumen"},{id:"eval",label:"Evaluación"},{id:"sessions",label:`Sesiones (${(patient.sessions||[]).length})`},{id:"exams",label:"Exámenes"},{id:"exercises",label:"Ejercicios"},{id:"ai",label:"Asistente IA"}];
  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    {showGenEval&&<GenerateFicha patient={patient} type="eval" template={templates.eval} onClose={()=>setShowGenEval(false)} onSave={(t,f)=>upd({evalFicha:t,evalFiles:f})}/>}
    {showGenSess&&<GenerateFicha patient={patient} type="session" template={templates.session} onClose={()=>setShowGenSess(false)} onSave={(t,f)=>upd({sessions:[...(patient.sessions||[]),{id:uid(),date:sessDate,notes:"",ficha:t,files:f,createdAt:new Date().toISOString()}]})}/>}
    <div style={{display:"flex",alignItems:"center",gap:".8rem",marginBottom:".8rem"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontWeight:"500",fontSize:".84rem",display:"flex",alignItems:"center",gap:".25rem"}}><Icon name="chevLeft" size={14} color={T.accent}/>Volver</button>
      <div style={{flex:1}}><div style={{fontWeight:"600",fontSize:".95rem",color:T.text}}>{patient.name}</div><div style={{fontSize:".75rem",color:T.textMuted}}>{patient.age} años · {patient.diagnosis}</div></div>
    </div>
    <SubTab tabs={tabs} active={tab} onChange={setTab}/>
    <div style={{flex:1,overflowY:"auto"}}>
      {tab==="overview"&&<div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:".55rem"}}>
          {[[`${(patient.sessions||[]).length}`,"Sesiones",T.accent],[`${(patient.examFiles||[]).length+(patient.orderFiles||[]).length}`,"Archivos","#7c3aed"],[patient.evalFicha?"Evaluado":"Pendiente","Estado",patient.evalFicha?T.green:T.amber]].map(([v,l,c])=><Card key={l} style={{textAlign:"center",padding:".8rem"}}><div style={{fontSize:"1.4rem",fontWeight:"700",color:c}}>{v}</div><div style={{fontSize:".72rem",color:T.textMuted,marginTop:".1rem"}}>{l}</div></Card>)}
        </div>
        {patient.notes&&<Card><div style={{fontSize:".72rem",fontWeight:"600",color:T.textMuted,textTransform:"uppercase",letterSpacing:".04em",marginBottom:".3rem"}}>Notas</div><p style={{fontSize:".84rem",color:T.text,margin:0,lineHeight:1.65}}>{patient.notes}</p></Card>}
        {patient.evalFicha&&<Card><div style={{fontSize:".72rem",fontWeight:"600",color:T.textMuted,textTransform:"uppercase",letterSpacing:".04em",marginBottom:".45rem"}}>Evaluación</div><div style={{maxHeight:"170px",overflowY:"auto"}}><Md text={patient.evalFicha}/></div></Card>}
      </div>}
      {tab==="eval"&&<div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
        <Btn onClick={()=>setShowGenEval(true)} icon="ai">{patient.evalFicha?"Regenerar evaluación":"Generar ficha de evaluación"}</Btn>
        {patient.evalFicha?<Card><Md text={patient.evalFicha}/></Card>:<div style={{textAlign:"center",color:T.textMuted,padding:"2rem",fontSize:".86rem"}}>Sin ficha de evaluación.</div>}
      </div>}
      {tab==="sessions"&&<div style={{display:"flex",flexDirection:"column",gap:".65rem"}}>
        <div style={{display:"flex",gap:".45rem"}}><Btn onClick={()=>setShowNewSess(p=>!p)} variant="ghost" icon="plus" size="sm">Registrar</Btn><Btn onClick={()=>setShowGenSess(true)} icon="ai" size="sm">Generar ficha</Btn></div>
        {showNewSess&&<Card style={{display:"flex",flexDirection:"column",gap:".6rem"}}>
          <Input type="date" value={sessDate} onChange={e=>setSessDate(e.target.value)}/>
          <Input value={sessNotes} onChange={e=>setSessNotes(e.target.value)} placeholder="Notas de la sesión..." rows={3}/>
          <FileUpload label="Adjuntos" files={sessFiles} onAdd={f=>setSessFiles(p=>[...p,f])} onRemove={id=>setSessFiles(p=>p.filter(x=>x.id!==id))} accept="image/*,.pdf"/>
          <div style={{display:"flex",gap:".45rem",justifyContent:"flex-end"}}><Btn onClick={()=>setShowNewSess(false)} variant="secondary" size="sm">Cancelar</Btn><Btn onClick={()=>{upd({sessions:[...(patient.sessions||[]),{id:uid(),date:sessDate,notes:sessNotes,ficha:"",files:sessFiles,createdAt:new Date().toISOString()}]});setShowNewSess(false);setSessNotes("");setSessFiles([]);}} size="sm" icon="check">Guardar</Btn></div>
        </Card>}
        {(patient.sessions||[]).length===0&&!showNewSess&&<div style={{textAlign:"center",color:T.textMuted,padding:"2rem",fontSize:".86rem"}}>Sin sesiones registradas.</div>}
        {[...(patient.sessions||[])].reverse().map((s,i,a)=><Card key={s.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".28rem"}}>
            <div style={{fontWeight:"500",color:T.text,fontSize:".84rem"}}>Sesión {a.length-i} <span style={{color:T.textMuted,fontWeight:"400"}}>· {s.date}</span></div>
            <button onClick={()=>{if(!confirm("¿Eliminar?"))return;upd({sessions:(patient.sessions||[]).filter(x=>x.id!==s.id)});}} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight}}><Icon name="trash" size={13}/></button>
          </div>
          {s.notes&&<p style={{fontSize:".81rem",color:T.textMuted,margin:"0 0 .3rem"}}>{s.notes}</p>}
          {s.ficha&&<details><summary style={{cursor:"pointer",fontSize:".76rem",color:T.accent,fontWeight:"500"}}>Ver ficha de atención</summary><div style={{marginTop:".45rem",background:T.bg,borderRadius:"6px",padding:".7rem"}}><Md text={s.ficha}/></div></details>}
        </Card>)}
      </div>}
      {tab==="exams"&&<div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
        <Card>
          <FileUpload label="Exámenes (Ecografía, RMN, RX, etc.)" files={patient.examFiles||[]} onAdd={f=>upd({examFiles:[...(patient.examFiles||[]),f]})} onRemove={id=>upd({examFiles:(patient.examFiles||[]).filter(x=>x.id!==id)})} accept="image/*,.pdf"/>
          {(patient.examFiles||[]).filter(f=>isImage(f.name)).map(f=><img key={f.id} src={f.data} alt={f.name} style={{maxWidth:"100%",borderRadius:"6px",marginTop:".65rem",border:`1px solid ${T.border}`}}/>)}
        </Card>
        <Card>
          <FileUpload label="Orden médica" files={patient.orderFiles||[]} onAdd={f=>upd({orderFiles:[...(patient.orderFiles||[]),f]})} onRemove={id=>upd({orderFiles:(patient.orderFiles||[]).filter(x=>x.id!==id)})} accept="image/*,.pdf"/>
          <p style={{fontSize:".74rem",color:T.textMuted,margin:".55rem 0 0",lineHeight:1.5}}>La IA considera las indicaciones médicas y puede proponer avances según evidencia y evolución.</p>
        </Card>
      </div>}
      {tab==="exercises"&&<div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
        <Btn onClick={genHome} disabled={homeLoading} icon="ai">{homeLoading?"Generando programa...":"Generar programa de ejercicios para el hogar"}</Btn>
        {homeResult&&<Card><Md text={homeResult}/><div style={{marginTop:".65rem"}}><Btn onClick={()=>{upd({homeExercises:homeResult});setHomeResult("");}} size="sm" icon="check">Guardar programa</Btn></div></Card>}
        {patient.homeExercises&&!homeResult&&<Card><div style={{fontSize:".72rem",fontWeight:"600",color:T.textMuted,textTransform:"uppercase",letterSpacing:".04em",marginBottom:".5rem"}}>Programa guardado</div><Md text={patient.homeExercises}/></Card>}
      </div>}
      {tab==="ai"&&<div style={{height:"400px",display:"flex",flexDirection:"column"}}><AIChat key={`ai-${patient.id}`} system={`Eres kinesióloga clínica experta. Paciente: ${patient.name}, ${patient.age}a, Dx: ${patient.diagnosis}. Notas: ${patient.notes}. Sesiones: ${(patient.sessions||[]).length}. Responde con criterio clínico basado en evidencia actual.`} placeholder={`Consulta sobre ${patient.name}...`} extraContent={(patient.examFiles||[]).filter(f=>isImage(f.name)).map(f=>({type:"image",source:{type:"base64",media_type:f.type,data:f.data.split(",")[1]}}))} suggestions={["Técnicas más efectivas para este diagnóstico","¿Cómo progreso el tratamiento?","Analiza los exámenes adjuntos","Evidencia actual sobre este caso"]}/></div>}
    </div>
  </div>;
}

// ─── Patients ─────────────────────────────────────────────────────
function PatientsModule({templates}){
  const [patients,setPatients]=useState(()=>load(SK.patients)||[]);const [view,setView]=useState("list");const [selected,setSelected]=useState(null);const [search,setSearch]=useState("");const [form,setForm]=useState({name:"",age:"",diagnosis:"",notes:""});
  function persist(l){setPatients(l);save(SK.patients,l);}
  function saveP(){const base={sessions:[],examFiles:[],orderFiles:[]};const l=selected?.id?patients.map(p=>p.id===selected.id?{...p,...form}:p):[...patients,{...base,id:uid(),...form}];persist(l);setView("list");setSelected(null);}
  function updP(u){const l=patients.map(p=>p.id===u.id?u:p);persist(l);setSelected(u);}
  const filtered=patients.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||(p.diagnosis||"").toLowerCase().includes(search.toLowerCase()));
  if(view==="detail"&&selected)return <PatientDetail patient={selected} templates={templates} onBack={()=>{setView("list");setSelected(null);}} onUpdate={updP}/>;
  if(view==="form")return <div>
    <div style={{fontWeight:"600",fontSize:".9rem",marginBottom:".9rem",color:T.text}}>{selected?"Editar paciente":"Nuevo paciente"}</div>
    <div style={{display:"flex",flexDirection:"column",gap:".7rem"}}>
      {[["Nombre completo *","name","text"],["Edad","age","number"],["Diagnóstico / Motivo","diagnosis","text"]].map(([l,k,t])=><div key={k}><Label>{l}</Label><Input type={t} value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>)}
      <div><Label>Notas</Label><Input value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={3}/></div>
      <div style={{display:"flex",gap:".45rem",justifyContent:"flex-end"}}><Btn onClick={()=>{setView("list");setSelected(null);}} variant="secondary">Cancelar</Btn><Btn onClick={saveP} disabled={!form.name?.trim()} icon="check">Guardar</Btn></div>
    </div>
  </div>;
  return <div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
    <div style={{display:"flex",gap:".5rem"}}>
      <div style={{flex:1,position:"relative"}}><div style={{position:"absolute",left:".7rem",top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Icon name="search" size={14} color={T.textLight}/></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente o diagnóstico..." style={{width:"100%",padding:".52rem .8rem .52rem 2.1rem",borderRadius:"6px",border:`1px solid ${T.border}`,fontSize:".84rem",outline:"none"}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/></div>
      <Btn onClick={()=>{setSelected(null);setForm({name:"",age:"",diagnosis:"",notes:""});setView("form");}} icon="plus">Nuevo</Btn>
    </div>
    {filtered.length===0?<div style={{textAlign:"center",padding:"2.5rem",color:T.textMuted}}><Icon name="patients" size={32} color={T.border}/><div style={{fontWeight:"500",marginTop:".45rem",fontSize:".88rem"}}>{search?"Sin resultados":"Sin pacientes aún"}</div><div style={{fontSize:".78rem",color:T.textLight}}>Agrega tu primer paciente</div></div>
    :filtered.map(p=><div key={p.id} onClick={()=>{setSelected(p);setView("detail");}} style={{background:T.surface,borderRadius:"7px",padding:".8rem .95rem",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:".8rem",cursor:"pointer",transition:"border-color .12s,box-shadow .12s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accentBorder;e.currentTarget.style.boxShadow=`0 0 0 3px ${T.accentBg}`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="none";}}>
      <div style={{width:34,height:34,borderRadius:"50%",background:T.accentBg,border:`1.5px solid ${T.accentBorder}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontWeight:"700",color:T.accent,fontSize:".9rem"}}>{p.name[0]?.toUpperCase()}</span></div>
      <div style={{flex:1,minWidth:0}}><div style={{fontWeight:"500",color:T.text,fontSize:".87rem"}}>{p.name}</div><div style={{fontSize:".74rem",color:T.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.age?`${p.age} años · `:""}{p.diagnosis||"Sin diagnóstico"}</div></div>
      <div style={{fontSize:".73rem",color:T.textMuted,textAlign:"right"}}><div style={{fontWeight:"500",color:T.accent}}>{(p.sessions||[]).length} sesiones</div></div>
      <div style={{display:"flex",gap:".2rem"}}>
        <button onClick={e=>{e.stopPropagation();setSelected(p);setForm(p);setView("form");}} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:".25rem"}}><Icon name="edit" size={13}/></button>
        <button onClick={e=>{e.stopPropagation();if(!confirm("¿Eliminar paciente?"))return;persist(patients.filter(x=>x.id!==p.id));}} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:".25rem"}}><Icon name="trash" size={13}/></button>
      </div>
    </div>)}
  </div>;
}

// ─── Research ─────────────────────────────────────────────────────
function ResearchModule(){
  const [tab,setTab]=useState("ia");
  const [projects,setProjects]=useState(()=>load(SK.projects)||[]);const [showAdd,setShowAdd]=useState(false);const [newP,setNewP]=useState({title:"",description:""});
  const [summaries,setSummaries]=useState([]);const [sInput,setSInput]=useState("");const [sLoading,setSLoading]=useState(false);
  function persistP(l){setProjects(l);save(SK.projects,l);}
  async function addSummary(){if(!sInput.trim())return;setSLoading(true);let r="";await askClaude("Eres investigadora experta en kinesiología. Resume artículos científicos estructuradamente: objetivo, metodología, resultados, nivel de evidencia, aplicación clínica.",[{role:"user",content:`Resume: ${sInput}`}],c=>r=c);setSummaries(p=>[{id:uid(),query:sInput,result:r,date:new Date().toLocaleDateString()},...p]);setSInput("");setSLoading(false);}
  const tabs=[{id:"ia",label:"Investigación con IA"},{id:"projects",label:"Proyectos"},{id:"summaries",label:"Resúmenes"}];
  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <SubTab tabs={tabs} active={tab} onChange={setTab}/>
    {tab==="ia"&&<div style={{flex:1}}><AIChat key="res" system="Eres investigadora experta en kinesiología, fisioterapia y rehabilitación. Conoces la literatura científica actualizada. Citas evidencia real, explicas nivel de evidencia (GRADE, PEDro), señalas limitaciones y sintetizas hallazgos de forma práctica." placeholder="¿Qué evidencia existe sobre...?" suggestions={["Evidencia dry needling en dolor miofascial","Ejercicio vs terapia manual en lumbalgia","Kinesiotaping: evidencia actual","Guías clínicas rehab de hombro 2024-2025"]}/></div>}
    {tab==="projects"&&<div style={{display:"flex",flexDirection:"column",gap:".7rem"}}>
      <div style={{display:"flex",justifyContent:"flex-end"}}><Btn onClick={()=>setShowAdd(true)} icon="plus" size="sm">Nuevo proyecto</Btn></div>
      {showAdd&&<Card style={{display:"flex",flexDirection:"column",gap:".6rem"}}>
        {[["Título","title"],["Descripción","description"]].map(([l,k])=><div key={k}><Label>{l}</Label><Input value={newP[k]} onChange={e=>setNewP(p=>({...p,[k]:e.target.value}))}/></div>)}
        <div style={{display:"flex",gap:".45rem",justifyContent:"flex-end"}}><Btn onClick={()=>setShowAdd(false)} variant="secondary" size="sm">Cancelar</Btn><Btn onClick={()=>{persistP([...projects,{id:uid(),...newP,date:new Date().toLocaleDateString()}]);setShowAdd(false);setNewP({title:"",description:""});}} size="sm" disabled={!newP.title} icon="check">Guardar</Btn></div>
      </Card>}
      {projects.length===0&&!showAdd&&<div style={{textAlign:"center",color:T.textMuted,padding:"2rem",fontSize:".86rem"}}>Sin proyectos aún.</div>}
      {projects.map(p=><Card key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{fontWeight:"500",color:T.text,fontSize:".87rem"}}>{p.title}</div>{p.description&&<div style={{fontSize:".78rem",color:T.textMuted,marginTop:".15rem"}}>{p.description}</div>}<div style={{fontSize:".71rem",color:T.textLight,marginTop:".25rem"}}>{p.date}</div></div>
        <button onClick={()=>persistP(projects.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight}}><Icon name="trash" size={13}/></button>
      </Card>)}
    </div>}
    {tab==="summaries"&&<div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
      <div style={{display:"flex",gap:".45rem"}}><input value={sInput} onChange={e=>setSInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSummary()} placeholder="Pega un tema, resumen o DOI para resumir..." style={{flex:1,padding:".52rem .8rem",borderRadius:"6px",border:`1px solid ${T.border}`,fontSize:".84rem",outline:"none"}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/><Btn onClick={addSummary} disabled={sLoading||!sInput.trim()} icon="ai">{sLoading?"...":"Resumir"}</Btn></div>
      {summaries.map(s=><Card key={s.id}><div style={{display:"flex",justifyContent:"space-between",marginBottom:".4rem"}}><div style={{fontWeight:"500",fontSize:".8rem",color:T.text}}>{s.query}</div><div style={{fontSize:".71rem",color:T.textLight}}>{s.date}</div></div><Md text={s.result}/></Card>)}
    </div>}
  </div>;
}

// ─── Teaching ─────────────────────────────────────────────────────
// ─── Subject Colors ───────────────────────────────────────────────
const SUBJECT_COLORS = [
  {id:"navy",  bg:"#1e4d8c", light:"#eef3fb", border:"#b8cfe8"},
  {id:"slate", bg:"#475569", light:"#f1f5f9", border:"#cbd5e1"},
  {id:"teal",  bg:"#0f766e", light:"#f0fdfa", border:"#99f6e4"},
  {id:"violet",bg:"#6d28d9", light:"#f5f3ff", border:"#ddd6fe"},
  {id:"rose",  bg:"#be123c", light:"#fff1f2", border:"#fecdd3"},
  {id:"amber", bg:"#b45309", light:"#fffbeb", border:"#fde68a"},
  {id:"green", bg:"#15803d", light:"#f0fdf4", border:"#bbf7d0"},
  {id:"gray",  bg:"#374151", light:"#f9fafb", border:"#e5e7eb"},
];
function getColor(cid){ return SUBJECT_COLORS.find(c=>c.id===cid)||SUBJECT_COLORS[0]; }

// ─── Subject Detail ────────────────────────────────────────────────
function SubjectDetail({subject,onUpdate,onBack}){
  const [tab,setTab]=useState("material");
  const col=getColor(subject.color);
  function upd(changes){ onUpdate({...subject,...changes}); }

  // Dates/reminders
  const [showAddDate,setShowAddDate]=useState(false);
  const [dateForm,setDateForm]=useState({title:"",date:"",type:"evaluacion",notes:""});
  function addDate(){
    const nd={id:uid(),...dateForm,createdAt:new Date().toISOString()};
    upd({dates:[...(subject.dates||[]),nd]});
    // Request browser notification permission and schedule
    if(Notification.permission==="granted"){ scheduleNotif(nd); }
    else if(Notification.permission!=="denied"){
      Notification.requestPermission().then(p=>{ if(p==="granted") scheduleNotif(nd); });
    }
    setShowAddDate(false);setDateForm({title:"",date:"",type:"evaluacion",notes:""});
  }
  function scheduleNotif(d){
    const ms=new Date(d.date+"T08:00").getTime()-Date.now();
    if(ms>0&&ms<7*24*60*60*1000){ setTimeout(()=>new Notification("KinesioAI — "+subject.name,{body:d.title+" · Hoy",icon:"/favicon.ico"}),ms); }
  }
  function requestNotifPermission(){
    Notification.requestPermission().then(p=>{
      if(p==="granted") alert("Notificaciones activadas. Recibirás recordatorios el día de cada fecha.");
      else alert("Permisos denegados. Activa las notificaciones en la configuración de tu navegador.");
    });
  }

  // Evaluations
  const [showAddEval,setShowAddEval]=useState(false);
  const [evalForm,setEvalForm]=useState({title:"",date:"",weight:"",description:"",result:""});
  function addEval(){ upd({evals:[...(subject.evals||[]),{id:uid(),...evalForm}]}); setShowAddEval(false);setEvalForm({title:"",date:"",weight:"",description:"",result:""}); }

  // Rubrics
  const [showAddRubric,setShowAddRubric]=useState(false);
  const [rubricForm,setRubricForm]=useState({title:"",content:""});
  const [genRubric,setGenRubric]=useState("");const [genLoading,setGenLoading]=useState(false);
  async function generateRubric(){
    if(!rubricForm.title)return;
    setGenLoading(true);setGenRubric("");
    await askClaude("Eres docente experta en kinesiología. Genera rúbricas detalladas con criterios claros y niveles de desempeño (Excelente/Bueno/Suficiente/Insuficiente).",
      [{role:"user",content:`Genera una rúbrica para: ${rubricForm.title}. Asignatura: ${subject.name}.`}],
      c=>setGenRubric(c));
    setGenLoading(false);
  }
  function saveRubric(){ upd({rubrics:[...(subject.rubrics||[]),{id:uid(),title:rubricForm.title,content:genRubric||rubricForm.content,date:new Date().toLocaleDateString()}]}); setShowAddRubric(false);setRubricForm({title:"",content:""});setGenRubric(""); }

  const DATE_TYPES={evaluacion:"Evaluación",prueba:"Prueba",entrega:"Entrega",clase:"Clase",otro:"Otro"};
  const upcoming=(subject.dates||[]).filter(d=>d.date>=new Date().toISOString().slice(0,10)).sort((a,b)=>a.date.localeCompare(b.date));
  const past=(subject.dates||[]).filter(d=>d.date<new Date().toISOString().slice(0,10)).sort((a,b)=>b.date.localeCompare(a.date));

  const tabs=[{id:"material",label:"Material"},{id:"dates",label:`Fechas (${(subject.dates||[]).length})`},{id:"evals",label:`Evaluaciones (${(subject.evals||[]).length})`},{id:"rubrics",label:`Rúbricas (${(subject.rubrics||[]).length})`}];

  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:".8rem",marginBottom:".9rem",paddingBottom:".9rem",borderBottom:`1px solid ${T.border}`}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontWeight:"500",fontSize:".83rem",display:"flex",alignItems:"center",gap:".25rem",flexShrink:0}}><Icon name="chevLeft" size={13} color={T.accent}/>Asignaturas</button>
      <div style={{width:10,height:10,borderRadius:"50%",background:col.bg,flexShrink:0}}/>
      <div style={{fontWeight:"700",fontSize:".95rem",color:T.text,flex:1}}>{subject.name}</div>
    </div>

    <SubTab tabs={tabs} active={tab} onChange={setTab}/>

    <div style={{flex:1,overflowY:"auto"}}>

      {/* MATERIAL */}
      {tab==="material"&&<div style={{display:"flex",flexDirection:"column",gap:".7rem",height:"100%"}}>
        <textarea value={subject.notes||""} onChange={ev=>{const u={...subject,notes:ev.target.value};onUpdate(u);}}
          placeholder="Agrega contenidos, objetivos de aprendizaje, bibliografía, apuntes, links..." rows={16}
          style={{flex:1,padding:".8rem",borderRadius:"7px",border:`1px solid ${T.border}`,fontSize:".86rem",resize:"none",fontFamily:"inherit",lineHeight:1.75,outline:"none",color:T.text,minHeight:"320px"}}
          onFocus={ev=>ev.target.style.borderColor=T.accent} onBlur={ev=>ev.target.style.borderColor=T.border}/>
      </div>}

      {/* DATES */}
      {tab==="dates"&&<div style={{display:"flex",flexDirection:"column",gap:".8rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:".8rem",color:T.textMuted}}>Fechas importantes, evaluaciones y entregas</div>
          <div style={{display:"flex",gap:".4rem"}}>
            <Btn onClick={requestNotifPermission} variant="subtle" size="sm" icon="clock">Activar recordatorios</Btn>
            <Btn onClick={()=>setShowAddDate(true)} icon="plus" size="sm">Nueva fecha</Btn>
          </div>
        </div>

        {showAddDate&&<Card style={{display:"flex",flexDirection:"column",gap:".65rem"}}>
          <div style={{fontWeight:"600",fontSize:".86rem",color:T.text}}>Nueva fecha</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".6rem"}}>
            <div><Label>Título *</Label><Input value={dateForm.title} onChange={ev=>setDateForm(p=>({...p,title:ev.target.value}))}/></div>
            <div><Label>Fecha *</Label><Input type="date" value={dateForm.date} onChange={ev=>setDateForm(p=>({...p,date:ev.target.value}))}/></div>
            <div><Label>Tipo</Label>
              <select value={dateForm.type} onChange={ev=>setDateForm(p=>({...p,type:ev.target.value}))} style={{width:"100%",padding:".52rem .8rem",borderRadius:"6px",border:`1px solid ${T.border}`,fontSize:".85rem",color:T.text}}>
                {Object.entries(DATE_TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><Label>Notas</Label><Input value={dateForm.notes} onChange={ev=>setDateForm(p=>({...p,notes:ev.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:".4rem",justifyContent:"flex-end"}}><Btn onClick={()=>setShowAddDate(false)} variant="secondary" size="sm">Cancelar</Btn><Btn onClick={addDate} disabled={!dateForm.title||!dateForm.date} size="sm" icon="check">Guardar</Btn></div>
        </Card>}

        {upcoming.length>0&&<div>
          <div style={{fontSize:".73rem",fontWeight:"600",color:T.textMuted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:".5rem"}}>Próximas</div>
          {upcoming.map(d=>{
            const daysLeft=Math.ceil((new Date(d.date)-new Date())/(1000*60*60*24));
            const urgent=daysLeft<=3;
            return <div key={d.id} style={{display:"flex",alignItems:"center",gap:".7rem",padding:".6rem .8rem",borderRadius:"7px",background:urgent?"#fff7ed":T.surface,border:`1px solid ${urgent?"#fed7aa":T.border}`,marginBottom:".35rem"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:col.bg,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:"500",fontSize:".85rem",color:T.text}}>{d.title}</div>
                <div style={{fontSize:".73rem",color:T.textMuted}}>{DATE_TYPES[d.type]} · {d.date}{d.notes&&" · "+d.notes}</div>
              </div>
              <div style={{fontSize:".73rem",fontWeight:"600",color:urgent?"#c2410c":T.textMuted,whiteSpace:"nowrap"}}>{daysLeft===0?"Hoy":daysLeft===1?"Mañana":`${daysLeft}d`}</div>
              <button onClick={()=>upd({dates:(subject.dates||[]).filter(x=>x.id!==d.id)})} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:0}}><Icon name="trash" size={12}/></button>
            </div>;
          })}
        </div>}

        {past.length>0&&<div>
          <div style={{fontSize:".73rem",fontWeight:"600",color:T.textMuted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:".5rem"}}>Pasadas</div>
          {past.map(d=><div key={d.id} style={{display:"flex",alignItems:"center",gap:".7rem",padding:".55rem .8rem",borderRadius:"7px",background:T.bg,border:`1px solid ${T.border}`,marginBottom:".3rem",opacity:.7}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:T.textLight,flexShrink:0}}/>
            <div style={{flex:1}}><div style={{fontWeight:"400",fontSize:".83rem",color:T.textMuted,textDecoration:"line-through"}}>{d.title}</div><div style={{fontSize:".71rem",color:T.textLight}}>{DATE_TYPES[d.type]} · {d.date}</div></div>
            <button onClick={()=>upd({dates:(subject.dates||[]).filter(x=>x.id!==d.id)})} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:0}}><Icon name="trash" size={12}/></button>
          </div>)}
        </div>}

        {(subject.dates||[]).length===0&&!showAddDate&&<div style={{textAlign:"center",color:T.textLight,padding:"2rem",fontSize:".85rem"}}>Sin fechas registradas. Agrega evaluaciones, entregas o clases importantes.</div>}
      </div>}

      {/* EVALUACIONES */}
      {tab==="evals"&&<div style={{display:"flex",flexDirection:"column",gap:".8rem"}}>
        <div style={{display:"flex",justifyContent:"flex-end"}}><Btn onClick={()=>setShowAddEval(true)} icon="plus" size="sm">Nueva evaluación</Btn></div>

        {showAddEval&&<Card style={{display:"flex",flexDirection:"column",gap:".65rem"}}>
          <div style={{fontWeight:"600",fontSize:".86rem",color:T.text}}>Nueva evaluación</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".6rem"}}>
            <div><Label>Nombre *</Label><Input value={evalForm.title} onChange={ev=>setEvalForm(p=>({...p,title:ev.target.value}))}/></div>
            <div><Label>Fecha</Label><Input type="date" value={evalForm.date} onChange={ev=>setEvalForm(p=>({...p,date:ev.target.value}))}/></div>
            <div><Label>Ponderación (%)</Label><Input value={evalForm.weight} onChange={ev=>setEvalForm(p=>({...p,weight:ev.target.value}))}/></div>
            <div><Label>Resultado / Nota</Label><Input value={evalForm.result} onChange={ev=>setEvalForm(p=>({...p,result:ev.target.value}))}/></div>
          </div>
          <div><Label>Descripción / Instrucciones</Label><Input value={evalForm.description} onChange={ev=>setEvalForm(p=>({...p,description:ev.target.value}))} rows={3}/></div>
          <div style={{display:"flex",gap:".4rem",justifyContent:"flex-end"}}><Btn onClick={()=>setShowAddEval(false)} variant="secondary" size="sm">Cancelar</Btn><Btn onClick={addEval} disabled={!evalForm.title} size="sm" icon="check">Guardar</Btn></div>
        </Card>}

        {(subject.evals||[]).length===0&&!showAddEval&&<div style={{textAlign:"center",color:T.textLight,padding:"2rem",fontSize:".85rem"}}>Sin evaluaciones registradas.</div>}

        {(subject.evals||[]).map(ev=><Card key={ev.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:".2rem"}}>
                <div style={{fontWeight:"600",fontSize:".88rem",color:T.text}}>{ev.title}</div>
                {ev.weight&&<div style={{fontSize:".72rem",background:col.light,color:col.bg,border:`1px solid ${col.border}`,borderRadius:"4px",padding:".1rem .45rem",fontWeight:"600"}}>{ev.weight}%</div>}
                {ev.result&&<div style={{fontSize:".72rem",background:T.accentBg,color:T.accentD,border:`1px solid ${T.accentBorder}`,borderRadius:"4px",padding:".1rem .45rem",fontWeight:"700"}}>{ev.result}</div>}
              </div>
              {ev.date&&<div style={{fontSize:".74rem",color:T.textMuted}}>{ev.date}</div>}
              {ev.description&&<p style={{fontSize:".82rem",color:T.textMuted,margin:".3rem 0 0",lineHeight:1.55}}>{ev.description}</p>}
            </div>
            <button onClick={()=>upd({evals:(subject.evals||[]).filter(x=>x.id!==ev.id)})} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:0,marginLeft:".5rem"}}><Icon name="trash" size={13}/></button>
          </div>
        </Card>)}
      </div>}

      {/* RÚBRICAS */}
      {tab==="rubrics"&&<div style={{display:"flex",flexDirection:"column",gap:".8rem"}}>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <Btn onClick={()=>setShowAddRubric(true)} icon="plus" size="sm">Nueva rúbrica</Btn>
        </div>

        {showAddRubric&&<Card style={{display:"flex",flexDirection:"column",gap:".7rem"}}>
          <div style={{fontWeight:"600",fontSize:".86rem",color:T.text}}>Nueva rúbrica</div>
          <div><Label>Título *</Label><Input value={rubricForm.title} onChange={ev=>setRubricForm(p=>({...p,title:ev.target.value}))}/></div>
          <div style={{display:"flex",gap:".4rem"}}>
            <Btn onClick={generateRubric} disabled={genLoading||!rubricForm.title} icon="ai" size="sm">{genLoading?"Generando...":"Generar con IA"}</Btn>
            <span style={{fontSize:".75rem",color:T.textMuted,alignSelf:"center"}}>o escribe manualmente abajo</span>
          </div>
          {genRubric&&<div style={{background:T.bg,borderRadius:"6px",padding:".8rem",maxHeight:"220px",overflowY:"auto",border:`1px solid ${T.border}`}}><Md text={genRubric}/></div>}
          {!genRubric&&<div><Label>Contenido (opcional)</Label><Input value={rubricForm.content} onChange={ev=>setRubricForm(p=>({...p,content:ev.target.value}))} rows={5}/></div>}
          <div style={{display:"flex",gap:".4rem",justifyContent:"flex-end"}}><Btn onClick={()=>{setShowAddRubric(false);setGenRubric("");}} variant="secondary" size="sm">Cancelar</Btn><Btn onClick={saveRubric} disabled={!rubricForm.title} size="sm" icon="check">Guardar rúbrica</Btn></div>
        </Card>}

        {(subject.rubrics||[]).length===0&&!showAddRubric&&<div style={{textAlign:"center",color:T.textLight,padding:"2rem",fontSize:".85rem"}}>Sin rúbricas guardadas. Crea una manualmente o con IA.</div>}

        {(subject.rubrics||[]).map(r=><Card key={r.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".4rem"}}>
            <div style={{fontWeight:"600",fontSize:".88rem",color:T.text}}>{r.title}</div>
            <div style={{display:"flex",gap:".3rem",alignItems:"center"}}>
              <span style={{fontSize:".71rem",color:T.textLight}}>{r.date}</span>
              <button onClick={()=>upd({rubrics:(subject.rubrics||[]).filter(x=>x.id!==r.id)})} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:0}}><Icon name="trash" size={13}/></button>
            </div>
          </div>
          <details><summary style={{cursor:"pointer",fontSize:".77rem",color:T.accent,fontWeight:"500"}}>Ver rúbrica completa</summary><div style={{marginTop:".5rem"}}><Md text={r.content}/></div></details>
        </Card>)}
      </div>}

    </div>
  </div>;
}

// ─── Teaching Module ───────────────────────────────────────────────
function TeachingModule(){
  const [tab,setTab]=useState("subjects");
  const [subjects,setSubjects]=useState(()=>load(SK.subjects)||[]);
  const [sel,setSel]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [newName,setNewName]=useState("");
  const [newColor,setNewColor]=useState("navy");
  function persist(l){setSubjects(l);save(SK.subjects,l);}
  function updateSubject(upd){const l=subjects.map(s=>s.id===upd.id?upd:s);persist(l);setSel(upd);}

  const tabs=[{id:"subjects",label:"Asignaturas"},{id:"rubrics",label:"IA Rúbricas"},{id:"ia",label:"IA Docencia"}];

  if(tab==="subjects"&&sel) return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <SubTab tabs={tabs} active={tab} onChange={t=>{if(t!=="subjects"){setSel(null);}setTab(t);}}/>
    <SubjectDetail subject={sel} onUpdate={updateSubject} onBack={()=>setSel(null)}/>
  </div>;

  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <SubTab tabs={tabs} active={tab} onChange={setTab}/>
    {tab==="subjects"&&<div style={{display:"flex",gap:"1rem",flex:1,minHeight:0}}>
      {/* Sidebar */}
      <div style={{width:"200px",flexShrink:0,display:"flex",flexDirection:"column",gap:".35rem"}}>
        <Btn onClick={()=>setShowAdd(p=>!p)} icon="plus" size="sm" full>Nueva asignatura</Btn>
        {showAdd&&<Card style={{padding:".7rem",display:"flex",flexDirection:"column",gap:".5rem"}}>
          <div><Label>Nombre</Label><Input value={newName} onChange={ev=>setNewName(ev.target.value)} placeholder="Ej: Kinesiología Deportiva"/></div>
          <div><Label>Color</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:".3rem",marginTop:".2rem"}}>
              {SUBJECT_COLORS.map(c=><button key={c.id} onClick={()=>setNewColor(c.id)} style={{width:20,height:20,borderRadius:"50%",background:c.bg,border:newColor===c.id?"2px solid "+T.text:"2px solid transparent",cursor:"pointer",padding:0}}/>)}
            </div>
          </div>
          <div style={{display:"flex",gap:".3rem",justifyContent:"flex-end"}}>
            <Btn onClick={()=>{setShowAdd(false);setNewName("");}} variant="secondary" size="sm">×</Btn>
            <Btn onClick={()=>{if(!newName)return;persist([...subjects,{id:uid(),name:newName,color:newColor,notes:"",dates:[],evals:[],rubrics:[]}]);setShowAdd(false);setNewName("");setNewColor("navy");}} size="sm" disabled={!newName} icon="check">Crear</Btn>
          </div>
        </Card>}
        {subjects.map(s=>{
          const col=getColor(s.color);
          return <div key={s.id} onClick={()=>setSel(s)} style={{padding:".5rem .7rem",borderRadius:"6px",border:`1px solid ${sel?.id===s.id?col.bg:T.border}`,background:sel?.id===s.id?col.light:T.surface,cursor:"pointer",display:"flex",alignItems:"center",gap:".5rem",transition:"all .1s"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:col.bg,flexShrink:0}}/>
            <span style={{fontSize:".82rem",fontWeight:sel?.id===s.id?"600":"400",color:sel?.id===s.id?col.bg:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
            <button onClick={ev=>{ev.stopPropagation();if(!confirm("¿Eliminar?"))return;persist(subjects.filter(x=>x.id!==s.id));if(sel?.id===s.id)setSel(null);}} style={{background:"none",border:"none",cursor:"pointer",color:T.textLight,padding:0,flexShrink:0}}><Icon name="trash" size={11}/></button>
          </div>;
        })}
        {subjects.length===0&&!showAdd&&<div style={{fontSize:".78rem",color:T.textLight,textAlign:"center",padding:"1rem 0"}}>Sin asignaturas aún</div>}
      </div>
      {/* Content */}
      <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",color:T.textLight,fontSize:".86rem"}}>
          <Icon name="teaching" size={32} color={T.border}/>
          <div style={{marginTop:".5rem"}}>Selecciona una asignatura para ver su contenido</div>
        </div>
      </div>
    </div>}
    {tab==="rubrics"&&<div style={{flex:1}}><AIChat key="rubrics" system="Eres docente universitaria experta en kinesiología. Creas rúbricas, pautas de cotejo e instrumentos de evaluación con criterios claros, niveles de desempeño y alineados con objetivos de aprendizaje." placeholder="Pide una rúbrica, pauta o instrumento..." suggestions={["Rúbrica evaluar examen físico de hombro","Pauta de cotejo para punción seca","Rúbrica presentación caso clínico 10 min","Instrumento evaluación práctica clínica final"]}/></div>}
    {tab==="ia"&&<div style={{flex:1}}><AIChat key="teach" system="Eres docente universitaria experta en kinesiología. Preparas clases, casos clínicos, esquemas conceptuales, guías prácticas con objetivos de aprendizaje claros y evidencia actualizada." placeholder="¿Qué material necesitas preparar?" suggestions={["Caso clínico LCA 3er año con preguntas","Esquema biomecánica de la marcha 60 min","10 preguntas tipo OSCE evaluación de rodilla","Guía práctica evaluación neurológica"]}/></div>}
  </div>;
}

// ─── Clinical ─────────────────────────────────────────────────────
function ClinicalModule({templates,onOpenTemplates}){
  const [tab,setTab]=useState("agenda");
  const tabs=[{id:"agenda",label:"Agenda"},{id:"patients",label:"Pacientes"},{id:"ia",label:"Asistente IA"},{id:"settings",label:"Ajustes"}];
  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <SubTab tabs={tabs} active={tab} onChange={setTab}/>
    {tab==="agenda"&&<AgendaModule/>}
    {tab==="patients"&&<PatientsModule templates={templates}/>}
    {tab==="ia"&&<div style={{flex:1}}><AIChat key="clin" system="Eres kinesióloga clínica con actualización constante en evidencia. Respondes con criterio clínico profesional. Orientas sobre diagnóstico diferencial, evaluación, protocolos y abordajes kinesiológicos." placeholder="Consulta clínica, protocolo, diagnóstico diferencial..." suggestions={["Protocolo evaluación dolor de hombro","¿Diferenciar tendinopatía de bursitis?","Abordaje kinesiológico post ACV","Criterios de alta rehabilitación rodilla"]}/></div>}
    {tab==="settings"&&<div style={{display:"flex",flexDirection:"column",gap:".85rem"}}>
      <div style={{fontWeight:"600",color:T.text,fontSize:".88rem"}}>Ajustes del Área Clínica</div>
      <Card><div style={{fontWeight:"500",fontSize:".85rem",color:T.text,marginBottom:".3rem"}}>Formatos de Fichas</div><p style={{fontSize:".79rem",color:T.textMuted,margin:"0 0 .7rem",lineHeight:1.5}}>Configura tus formatos de evaluación y sesión para que la IA los use automáticamente.</p><Btn onClick={onOpenTemplates} icon="file">Configurar formatos</Btn></Card>
    </div>}
  </div>;
}

// ─── Global Search ─────────────────────────────────────────────────
function GlobalSearch({onClose,onNavigate}){
  const [q,setQ]=useState("");const inputRef=useRef(null);
  useEffect(()=>inputRef.current?.focus(),[]);
  const patients=useMemo(()=>load(SK.patients)||[],[]);
  const results=useMemo(()=>{
    if(q.trim().length<2)return[];
    const ql=q.toLowerCase();const res=[];
    patients.forEach(p=>{
      if(p.name.toLowerCase().includes(ql)||p.diagnosis?.toLowerCase().includes(ql))res.push({type:"patient",label:p.name,sub:p.diagnosis||"Sin diagnóstico",id:p.id,data:p});
      (p.sessions||[]).forEach(s=>{if(s.notes?.toLowerCase().includes(ql)||s.ficha?.toLowerCase().includes(ql))res.push({type:"session",label:`Sesión — ${p.name}`,sub:s.date,id:s.id,data:p});});
    });
    return res.slice(0,8);
  },[q,patients]);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:2000,paddingTop:"12vh"}}>
    <div style={{background:T.surface,borderRadius:"10px",width:"100%",maxWidth:"520px",boxShadow:"0 20px 60px rgba(0,0,0,.2)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:".6rem",padding:".85rem 1rem",borderBottom:`1px solid ${T.border}`}}>
        <Icon name="search" size={16} color={T.textMuted}/>
        <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar pacientes, diagnósticos, sesiones..." onKeyDown={e=>e.key==="Escape"&&onClose()} style={{flex:1,border:"none",outline:"none",fontSize:".9rem",color:T.text}}/>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,display:"flex"}}><Icon name="close" size={15}/></button>
      </div>
      {q.trim().length>=2&&<div style={{maxHeight:"320px",overflowY:"auto"}}>
        {results.length===0?<div style={{padding:"1.5rem",textAlign:"center",color:T.textMuted,fontSize:".85rem"}}>Sin resultados para "{q}"</div>:
        results.map((r,i)=><button key={i} onClick={()=>{onNavigate(r);onClose();}} style={{width:"100%",padding:".7rem 1rem",background:"none",border:"none",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:".65rem",cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <div style={{width:28,height:28,borderRadius:"50%",background:r.type==="patient"?T.accentBg:"#f3e8ff",border:`1px solid ${r.type==="patient"?T.accentBorder:"#e9d5ff"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name={r.type==="patient"?"patients":"clinical"} size={13} color={r.type==="patient"?T.accent:"#7c3aed"}/>
          </div>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:"500",fontSize:".85rem",color:T.text}}>{r.label}</div><div style={{fontSize:".74rem",color:T.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.sub}</div></div>
          <div style={{fontSize:".7rem",color:T.textLight,background:T.bg,padding:".18rem .5rem",borderRadius:"4px",flexShrink:0}}>{r.type==="patient"?"Paciente":"Sesión"}</div>
        </button>)}
      </div>}
      {q.trim().length<2&&<div style={{padding:"1.2rem 1rem",color:T.textLight,fontSize:".8rem"}}>Escribe al menos 2 caracteres para buscar</div>}
    </div>
  </div>;
}

// ─── App ───────────────────────────────────────────────────────────
const AREAS=[{id:"clinical",label:"Clínica",icon:"clinical"},{id:"research",label:"Investigación",icon:"research"},{id:"teaching",label:"Docencia",icon:"teaching"}];

export default function App(){
  const [area,setArea]=useState("clinical");
  const [templates,setTemplates]=useState(()=>load(SK.templates)||{eval:"",session:""});
  const [showTpl,setShowTpl]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  function saveTpl(t){setTemplates(t);save(SK.templates,t);}
  useEffect(()=>{function h(e){if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setShowSearch(true);}}window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);
  return <>
    <style>{FONT}</style>
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column"}}>
      <header style={{background:T.sidebar,height:"48px",display:"flex",alignItems:"center",paddingInline:"1rem",gap:".8rem",boxShadow:"0 1px 2px rgba(0,0,0,.3)",position:"sticky",top:0,zIndex:100}}>
        
        <nav style={{display:"flex",flex:1,height:"100%"}}>
          {AREAS.map(a=><button key={a.id} onClick={()=>setArea(a.id)} style={{display:"flex",alignItems:"center",gap:".35rem",padding:"0 .85rem",background:"none",color:area===a.id?"white":"rgba(255,255,255,.45)",border:"none",borderBottom:area===a.id?`2px solid ${T.accent}`:"2px solid transparent",fontSize:".8rem",fontWeight:area===a.id?"600":"400",cursor:"pointer",height:"100%",transition:"color .12s"}}>
            <Icon name={a.icon} size={13} color={area===a.id?"white":"rgba(255,255,255,.4)"}/>
            {a.label}
          </button>)}
        </nav>
        <button onClick={()=>setShowSearch(true)} style={{display:"flex",alignItems:"center",gap:".4rem",padding:".32rem .7rem",borderRadius:"5px",border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.07)",color:"rgba(255,255,255,.55)",cursor:"pointer",fontSize:".75rem"}}>
          <Icon name="search" size={13} color="rgba(255,255,255,.55)"/>Buscar
        </button>
        <div style={{position:"relative",flexShrink:0}}>
          <button onClick={()=>setMenuOpen(p=>!p)} style={{display:"flex",alignItems:"center",padding:".32rem .5rem",borderRadius:"5px",border:"none",background:"rgba(255,255,255,.07)",color:"rgba(255,255,255,.6)",cursor:"pointer"}}><Icon name="menu" size={15} color="rgba(255,255,255,.6)"/></button>
          {menuOpen&&<><div style={{position:"fixed",inset:0,zIndex:150}} onClick={()=>setMenuOpen(false)}/>
          <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:T.surface,borderRadius:"8px",boxShadow:"0 8px 24px rgba(0,0,0,.12)",border:`1px solid ${T.border}`,minWidth:"200px",zIndex:200,overflow:"hidden"}}>
            {[{label:"Formatos de fichas",icon:"file",fn:()=>{setShowTpl(true);setMenuOpen(false);}},{label:"Google Calendar",icon:"agenda",fn:()=>{window.open("https://calendar.google.com","_blank");setMenuOpen(false);}},{label:"AgendaPro",icon:"star",fn:()=>{window.open("https://agendapro.com","_blank");setMenuOpen(false);}}].map((x,i)=><button key={i} onClick={x.fn} style={{width:"100%",padding:".65rem .95rem",background:"none",border:"none",display:"flex",alignItems:"center",gap:".5rem",fontSize:".83rem",color:T.text,cursor:"pointer",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background="none"}><Icon name={x.icon} size={13} color={T.accent}/>{x.label}</button>)}
          </div></>}
        </div>
      </header>
      <main style={{flex:1,padding:"1.2rem 1.5rem",maxWidth:"980px",width:"100%",margin:"0 auto",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:"500px"}}>
          {area==="clinical"&&<ClinicalModule templates={templates} onOpenTemplates={()=>setShowTpl(true)}/>}
          {area==="research"&&<ResearchModule/>}
          {area==="teaching"&&<TeachingModule/>}
        </div>
      </main>
      {showTpl&&<TemplateManager templates={templates} onSave={saveTpl} onClose={()=>setShowTpl(false)}/>}
      {showSearch&&<GlobalSearch onClose={()=>setShowSearch(false)} onNavigate={r=>{setArea("clinical");}}/>}
    </div>
  </>;
}
