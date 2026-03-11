import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════
   LOVE SITE — Tam Sürüm
   localStorage tabanlı, şifreli, romantik
═══════════════════════════════════════════════ */

const STORAGE_KEY  = "lovesite:data:v4";
const USERS_KEY    = "lovesite:users:v4";
const AUTH_KEY     = "lovesite:auth:v4";
const SESSION_KEY  = "lovesite:session:v4";

const uid      = () => Math.random().toString(36).slice(2, 10);
const nowISO   = () => new Date().toISOString();
const fmtDate  = (iso) => { try { return new Date(iso).toLocaleString("tr-TR"); } catch { return iso || ""; } };
const fmtShort = (iso) => { try { return new Date(iso).toLocaleDateString("tr-TR"); } catch { return iso || ""; } };

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(16);
}

function safeLoad(key, fb) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function safeSave(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch(e) { console.error(e); }
}
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/* ── DEFAULT DATA ── */
const DEFAULT_DATA = {
  meta: {
    title: "Seninle Her An",
    subtitle: "Senin için yapıldı 💕",
    logo: "❤️",
    welcome: "Hoş geldin, güzel.",
    bgColor1: "#ff5b6b",
    bgColor2: "#ff2d55"
  },
  videos: [],
  poems: [],
  letters: [],
  stories: [],
  photos: [],
  timeline: [],
  drawings: [],
  movies: [],
  music: [],
  games: { memory: [], wordSearch: [], puzzle: [] }
};

/* ══════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════ */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Dancing+Script:wght@500;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Cormorant Garamond', Georgia, serif; background: #fff7f8; color: #2a0a12; }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #fff0f5; }
    ::-webkit-scrollbar-thumb { background: #e8336d; border-radius: 3px; }

    .btn {
      padding: 8px 18px; border: none; border-radius: 8px; cursor: pointer;
      font-family: 'Cormorant Garamond', serif; font-size: 1rem; letter-spacing: 0.04em;
      background: linear-gradient(135deg, #e8336d, #c0143c); color: white;
      transition: all 0.25s; box-shadow: 0 3px 12px rgba(192,20,60,0.25);
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(192,20,60,0.35); }
    .btn.ghost { background: transparent; border: 1.5px solid currentColor; box-shadow: none; color: inherit; }
    .btn.sm { padding: 5px 12px; font-size: 0.88rem; }
    .btn.danger { background: linear-gradient(135deg, #ff6b6b, #c0143c); }

    .input {
      padding: 10px 14px; border: 1.5px solid rgba(232,51,109,0.25); border-radius: 8px;
      font-family: 'Cormorant Garamond', serif; font-size: 1rem; background: white;
      color: #2a0a12; outline: none; width: 100%; transition: border-color 0.2s;
    }
    .input:focus { border-color: #e8336d; box-shadow: 0 0 0 3px rgba(232,51,109,0.1); }
    textarea.input { resize: vertical; min-height: 100px; line-height: 1.6; }

    .section-wrap { max-width: 1100px; margin: 0 auto; padding: 20px 24px; }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; padding-bottom: 16px;
      border-bottom: 2px solid rgba(232,51,109,0.15);
    }
    .section-title {
      font-family: 'Playfair Display', serif; font-size: 1.9rem;
      font-style: italic; color: inherit;
    }

    @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
    @keyframes heartbeat { 0%,100% { transform:scale(1); } 50% { transform:scale(1.2); } }
    @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
    @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes envelopeOpen {
      0% { transform: rotateX(0deg); }
      100% { transform: rotateX(-160deg); }
    }
    @keyframes letterRise {
      0% { transform: translateY(0) scaleY(0.3); opacity:0; }
      100% { transform: translateY(-80px) scaleY(1); opacity:1; }
    }
    @keyframes ledBlink {
      0%,100% { opacity:1; box-shadow: 0 0 4px currentColor; }
      50% { opacity:0.4; box-shadow: none; }
    }
    @keyframes petalFall {
      0% { transform: translateY(-20px) rotate(0deg); opacity: 0.8; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    .petal { position: fixed; pointer-events: none; animation: petalFall linear infinite; z-index: 0; font-size: 1rem; }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      animation: fadeIn 0.2s ease; backdrop-filter: blur(4px);
    }
    .modal-box {
      background: white; border-radius: 18px; padding: 28px;
      width: 92%; max-width: 720px; max-height: 90vh; overflow-y: auto;
      animation: scaleIn 0.25s ease; position: relative;
      box-shadow: 0 30px 80px rgba(0,0,0,0.25);
    }
    .modal-close {
      position: absolute; right: 16px; top: 16px;
      background: #f5f5f7; border: none; width: 32px; height: 32px;
      border-radius: 50%; cursor: pointer; font-size: 1.1rem;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .modal-close:hover { background: #ffe0e8; }

    .card {
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.07);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .card:hover { transform: translateY(-4px); box-shadow: 0 12px 35px rgba(0,0,0,0.12); }

    .tag {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 0.78rem; letter-spacing: 0.06em; text-transform: uppercase;
    }

    /* Floating hearts on home */
    .heart-float {
      position: absolute; pointer-events: none; animation: float ease-in-out infinite;
      font-size: 1.4rem; opacity: 0.15;
    }
  `}</style>
);

/* ══════════════════════════════════════════════════
   DELETE BUTTON — two-step confirm, no window.confirm
══════════════════════════════════════════════════ */
function DeleteBtn({ onDelete, label="Sil", style={} }) {
  const [confirmDel, setConfirmDel] = useState(false);
  if (confirmDel) return (
    <span style={{ display:"inline-flex", gap:4 }}>
      <button className="btn sm danger" style={style} onClick={e=>{e.stopPropagation();onDelete();setConfirmDel(false);}}>Evet, sil</button>
      <button className="btn sm ghost" style={{ color:"#888", borderColor:"#ccc", ...style }} onClick={e=>{e.stopPropagation();setConfirmDel(false);}}>İptal</button>
    </span>
  );
  return <button className="btn sm danger" style={style} onClick={e=>{e.stopPropagation();setConfirmDel(true);}}>{label}</button>;
}

/* ══════════════════════════════════════════════════
   PETAL BACKGROUND
══════════════════════════════════════════════════ */
function PetalBg() {
  const petals = ["🌸","🌹","💕","✨","🌺","💗","🌷"];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {Array.from({length:10}).map((_,i) => (
        <span key={i} className="petal" style={{
          left: `${(i*11+7)%100}%`,
          animationDuration: `${8+i*1.3}s`,
          animationDelay: `${i*0.9}s`,
          fontSize: `${0.7+i%3*0.3}rem`
        }}>{petals[i%petals.length]}</span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   LOGIN / REGISTER SCREEN
══════════════════════════════════════════════════ */
function LoginScreen({ users, onLogin, onRegister, meta }) {
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [name, setName]     = useState("");
  const [mode, setMode]     = useState("login"); // login | register
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  function submit() {
    setErr("");
    if (!email.trim() || !pass.trim()) { setErr("E-posta ve şifre zorunlu."); return; }
    if (mode === "register") {
      if (!name.trim()) { setErr("İsim gir."); return; }
      if (pass.length < 6) { setErr("Şifre en az 6 karakter olmalı."); return; }
      const ok = onRegister(email.trim(), pass, name.trim());
      if (!ok) setErr("Bu e-posta zaten kayıtlı veya kayıt başarısız.");
    } else {
      const ok = onLogin(email.trim(), pass);
      if (!ok) setErr("E-posta veya şifre hatalı.");
    }
  }

  const isFirst = users.length === 0;

  return (
    <div style={{
      minHeight: "100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background: `linear-gradient(160deg, ${meta.bgColor1 || "#ff5b6b"}, ${meta.bgColor2 || "#ff2d55"})`,
      position: "relative", overflow: "hidden"
    }}>
      <PetalBg />
      {/* decorative circles */}
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.07)", top:-100, right:-100 }} />
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.05)", bottom:-80, left:-80 }} />

      <div style={{
        background:"rgba(255,255,255,0.97)", borderRadius:24, padding:"40px 36px", width:420,
        boxShadow:"0 30px 80px rgba(0,0,0,0.3)", zIndex:1, animation:"scaleIn 0.4s ease"
      }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:52, animation:"heartbeat 1.5s ease-in-out infinite" }}>{meta.logo}</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.8rem", fontStyle:"italic", marginTop:10, color:"#c0143c" }}>{meta.title}</h1>
          <p style={{ color:"#9a4060", marginTop:6, fontSize:"1rem", fontStyle:"italic" }}>{meta.welcome}</p>
        </div>

        {isFirst && (
          <div style={{ background:"#fff3cd", border:"1px solid #ffc107", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:"0.9rem", color:"#856404" }}>
            💡 İlk kez açılıyor. Kendinizi sahip olarak kaydedin.
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{
              flex:1, padding:"9px 0", border:`2px solid ${mode===m?"#c0143c":"#eee"}`,
              borderRadius:10, cursor:"pointer", background: mode===m ? "#c0143c" : "white",
              color: mode===m ? "white" : "#555", fontFamily:"'Cormorant Garamond',serif",
              fontSize:"0.95rem", fontWeight:600, transition:"all 0.2s"
            }}>{m==="login" ? "Giriş Yap" : "Kayıt Ol"}</button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {mode==="register" && (
            <input className="input" placeholder="İsminiz" value={name} onChange={e=>setName(e.target.value)} />
          )}
          <input className="input" type="email" placeholder="E-posta adresi" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()} />
          <input className="input" type="password" placeholder="Şifre" value={pass} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()} />
        </div>

        {err && <div style={{ marginTop:12, color:"#c0143c", fontSize:"0.9rem", padding:"8px 12px", background:"#fff0f3", borderRadius:8 }}>⚠️ {err}</div>}

        <button className="btn" onClick={submit} style={{ width:"100%", marginTop:18, padding:"13px 0", fontSize:"1.05rem" }}>
          {mode==="login" ? "Giriş Yap" : "Kayıt Ol"}
        </button>

        <p style={{ marginTop:16, fontSize:"0.8rem", color:"#bbb", textAlign:"center", lineHeight:1.5 }}>
          Bu site sadece kayıtlı kişiler tarafından görüntülenebilir.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════ */
function Header({ meta, auth, onLogout, playing, onPlayToggle, onPlayRandom, setSection, currentSection }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sections = [
    { key:"home", label:"Ana Sayfa", icon:"🏠" },
    { key:"videos", label:"Videolar", icon:"🎬" },
    { key:"poems", label:"Şiirler", icon:"📜" },
    { key:"letters", label:"Mektuplar", icon:"✉️" },
    { key:"stories", label:"Hikayeler", icon:"📖" },
    { key:"photos", label:"Fotoğraflar", icon:"📷" },
    { key:"timeline", label:"Zaman Çizelgesi", icon:"⏳" },
    { key:"movies", label:"Filmler", icon:"🎭" },
    { key:"games", label:"Oyunlar", icon:"🎮" },
    { key:"puzzle", label:"Bulmaca", icon:"🧩" },
    { key:"settings", label:"Ayarlar", icon:"⚙️" },
  ];

  return (
    <header style={{
      background:"rgba(255,247,248,0.92)", backdropFilter:"blur(12px)",
      borderBottom:"1px solid rgba(232,51,109,0.15)",
      position:"sticky", top:0, zIndex:100,
      boxShadow:"0 2px 20px rgba(192,20,60,0.07)"
    }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        {/* Logo */}
        <div style={{ display:"flex", gap:10, alignItems:"center", cursor:"pointer" }} onClick={()=>setSection("home")}>
          <span style={{ fontSize:28, animation:"heartbeat 2s ease-in-out infinite" }}>{meta.logo}</span>
          <div>
            <div style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.3rem", color:"#c0143c", lineHeight:1.2 }}>{meta.title}</div>
            <div style={{ fontSize:"0.75rem", color:"#9a6070", fontStyle:"italic" }}>{meta.subtitle}</div>
          </div>
        </div>

        {/* Nav - desktop */}
        <nav style={{ display:"flex", gap:2, flexWrap:"wrap", flex:1, justifyContent:"center" }}>
          {sections.filter(s=>s.key!=="home").map(s => (
            <button key={s.key} onClick={()=>setSection(s.key)} style={{
              padding:"5px 10px", border:"none", borderRadius:8, cursor:"pointer", fontSize:"0.8rem",
              background: currentSection===s.key ? "linear-gradient(135deg,#e8336d,#c0143c)" : "transparent",
              color: currentSection===s.key ? "white" : "#555",
              fontFamily:"'Cormorant Garamond',serif", transition:"all 0.2s",
              display:"flex", alignItems:"center", gap:4
            }}>
              <span style={{ fontSize:"0.9rem" }}>{s.icon}</span>
              <span style={{ display:"none", "@media(minWidth:800px)":"inline" }}>{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          <button onClick={onPlayRandom} title="Müzik çal" style={{ background:"none", border:"1.5px solid rgba(232,51,109,0.3)", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:"1rem" }}>🎵</button>
          <button onClick={onPlayToggle} title={playing?"Durdur":"Devam"} style={{ background:"none", border:"1.5px solid rgba(232,51,109,0.3)", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:"1rem" }}>{playing?"⏸":"▶️"}</button>
          <div style={{ fontSize:"0.78rem", color:"#888", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{auth.name || auth.email}</div>
          <button className="btn sm" onClick={onLogout} style={{ background:"white", color:"#c0143c", border:"1.5px solid #ffd3db" }}>Çıkış</button>
        </div>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════
   HOME GRID
══════════════════════════════════════════════════ */
const SECTION_CONFIG = {
  videos:   { label:"Videolar",         icon:"🎬", grad:["#ff7a59","#ff2d55"], desc:"Anılarımızın filmi" },
  poems:    { label:"Şiirler",          icon:"📜", grad:["#f7c948","#e8a020"], desc:"Kalpten gelen dizeler" },
  letters:  { label:"Mektuplar",        icon:"✉️", grad:["#e8c4a0","#c98b6a"], desc:"Zarflar dolusu sevgi" },
  stories:  { label:"Hikayeler",        icon:"📖", grad:["#f4a0c4","#d45c8a"], desc:"Bizim masalımız" },
  photos:   { label:"Fotoğraflar",      icon:"📷", grad:["#5b4040","#8b6060"], desc:"Duvara asılı polaroidler" },
  timeline: { label:"Zaman Çizelgesi",  icon:"⏳", grad:["#a06040","#704020"], desc:"Birlikte yazdığımız tarih" },
  movies:   { label:"Filmler",          icon:"🎭", grad:["#4a2060","#8040a0"], desc:"Birlikte izlediklerimiz" },
  games:    { label:"Oyunlar",          icon:"🎮", grad:["#40c090","#208060"], desc:"Eğlenceli anlar" },
  puzzle:   { label:"Bulmaca",          icon:"🧩", grad:["#e04060","#a02040"], desc:"Parçaları birleştir" },
  settings: { label:"Ayarlar",          icon:"⚙️", grad:["#808090","#505060"], desc:"Site yönetimi" },
};

function HomeGrid({ meta, setSection }) {
  const secs = Object.entries(SECTION_CONFIG);
  return (
    <div style={{ padding:"30px 0" }}>
      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:40 }}>
        <h1 style={{
          fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.2rem,5vw,4rem)",
          fontStyle:"italic", color:"#c0143c", lineHeight:1.1,
          animation:"fadeUp 0.8s ease"
        }}>{meta.title}</h1>
        <p style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.4rem", color:"#e8336d", marginTop:8, animation:"fadeUp 0.8s 0.15s ease both" }}>
          {meta.subtitle}
        </p>
        <div style={{ marginTop:16, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
          {["💕","🌹","✨","💗","🌸"].map((e,i) => (
            <span key={i} className="heart-float" style={{ position:"relative", animationDuration:`${2+i*0.4}s`, animationDelay:`${i*0.2}s`, opacity:0.8 }}>{e}</span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:20 }}>
        {secs.map(([key, cfg], i) => (
          <div key={key} onClick={()=>setSection(key)} style={{
            height:200, borderRadius:20, cursor:"pointer", overflow:"hidden",
            background:`linear-gradient(135deg, ${cfg.grad[0]}, ${cfg.grad[1]})`,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            boxShadow:"0 8px 30px rgba(0,0,0,0.12)", transition:"all 0.3s",
            animation:`fadeUp 0.5s ${i*0.05}s ease both`,
            position:"relative"
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px) scale(1.02)";e.currentTarget.style.boxShadow="0 20px 50px rgba(0,0,0,0.2)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,0.12)";}}>
            {/* Glass overlay */}
            <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.08)", backdropFilter:"blur(0px)" }} />
            <div style={{ fontSize:"2.8rem", marginBottom:10, position:"relative", zIndex:1, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{cfg.icon}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", fontWeight:700, color:"white", position:"relative", zIndex:1, textShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>{cfg.label}</div>
            <div style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.8)", marginTop:6, position:"relative", zIndex:1, fontStyle:"italic" }}>{cfg.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION WRAPPER (colored bg)
══════════════════════════════════════════════════ */
function SectionWrap({ secKey, children, onBack }) {
  const cfg = SECTION_CONFIG[secKey] || { grad:["#ffb3c6","#ff6b9d"] };
  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg, ${cfg.grad[0]}22, ${cfg.grad[1]}11)`, animation:"fadeIn 0.3s ease" }}>
      <div className="section-wrap">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   VIDEOS SECTION — YouTube tarzı
══════════════════════════════════════════════════ */
function VideosSection({ data, addItem, updateItem, deleteItem, auth }) {
  const [title, setTitle]   = useState("");
  const [desc, setDesc]     = useState("");
  const [src, setSrc]       = useState(null);
  const [uploading, setUp]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");

  async function upload(e) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 80_000_000) { alert("Dosya çok büyük (max 80MB)"); return; }
    setUp(true);
    try {
      if (f.size <= 8_000_000) {
        const url = await fileToDataURL(f);
        setSrc({ url, name: f.name, persisted: true });
      } else {
        setSrc({ url: URL.createObjectURL(f), name: f.name, persisted: false });
      }
    } finally { setUp(false); }
  }

  function addVideo() {
    if (!src) { alert("Önce video yükle"); return; }
    if (!title.trim()) { alert("Başlık gir"); return; }
    addItem("videos", { id: uid(), title, desc, src: src.url, persisted: src.persisted, comments: [], likes: 0, createdAt: nowISO() });
    setTitle(""); setDesc(""); setSrc(null);
  }

  function addComment(v) {
    if (!comment.trim()) return;
    const c = { id: uid(), author: auth.name || auth.email, text: comment, createdAt: nowISO() };
    const next = { ...v, comments: [...(v.comments||[]), c] };
    updateItem("videos", v.id, next);
    setComment("");
  }

  function likeVideo(v) {
    updateItem("videos", v.id, { ...v, likes: (v.likes||0)+1 });
  }

  const videos = data.videos || [];
  const grad = SECTION_CONFIG.videos.grad;

  return (
    <SectionWrap secKey="videos">
      <div className="section-header" style={{ color: grad[0] }}>
        <h2 className="section-title">🎬 Videolar</h2>
      </div>

      {/* Upload */}
      {auth.email && (
        <div className="card" style={{ marginBottom:28, background:`linear-gradient(135deg, ${grad[0]}15, ${grad[1]}10)`, border:`1.5px solid ${grad[0]}30` }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:16, color:grad[1] }}>Yeni Video Ekle</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <input className="input" placeholder="Video başlığı..." value={title} onChange={e=>setTitle(e.target.value)} />
            <textarea className="input" placeholder="Açıklama..." value={desc} onChange={e=>setDesc(e.target.value)} rows={2} style={{ minHeight:44, resize:"none" }} />
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <label style={{ padding:"9px 16px", borderRadius:8, border:`2px dashed ${grad[0]}60`, cursor:"pointer", color:grad[1], fontFamily:"'Cormorant Garamond',serif", fontSize:"0.95rem", transition:"all 0.2s" }}>
              {uploading ? "Yükleniyor..." : src ? `✅ ${src.name}` : "📁 Video Seç"}
              <input type="file" accept="video/*" style={{ display:"none" }} onChange={upload} />
            </label>
            <button className="btn" onClick={addVideo}>Yayınla</button>
          </div>
        </div>
      )}

      {/* Video grid */}
      {videos.length === 0 && <div style={{ textAlign:"center", padding:"60px 0", color:"#aaa", fontStyle:"italic" }}>Henüz video yok. İlk videoyu ekle! 🎬</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:20 }}>
        {videos.map(v => (
          <div key={v.id} className="card" style={{ padding:0, overflow:"hidden", cursor:"pointer" }}>
            <div style={{ background:"#111", aspectRatio:"16/9", position:"relative" }} onClick={()=>setSelected(v)}>
              <video src={v.src} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.85 }} />
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem" }}>▶</div>
              </div>
            </div>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.05rem", marginBottom:4 }}>{v.title}</div>
              <div style={{ color:"#888", fontSize:"0.85rem", marginBottom:8 }}>{fmtShort(v.createdAt)} · {(v.comments||[]).length} yorum</div>
              {v.desc && <div style={{ color:"#666", fontSize:"0.9rem", fontStyle:"italic" }}>{v.desc}</div>}
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button className="btn sm ghost" style={{ color:grad[0], borderColor:grad[0] }} onClick={()=>likeVideo(v)}>❤️ {v.likes||0}</button>
                {auth.isAdmin && <DeleteBtn onDelete={()=>deleteItem("videos",v.id)} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal-box" style={{ maxWidth:800 }} onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setSelected(null)}>✕</button>
            <h2 style={{ fontFamily:"'Playfair Display',serif", marginBottom:12, paddingRight:32 }}>{selected.title}</h2>
            <video src={selected.src} controls style={{ width:"100%", borderRadius:10 }} />
            {selected.desc && <p style={{ margin:"12px 0", color:"#555", fontStyle:"italic" }}>{selected.desc}</p>}
            <div style={{ color:"#999", fontSize:"0.85rem", marginBottom:16 }}>{fmtDate(selected.createdAt)}</div>

            <div style={{ borderTop:"1px solid #f0e0e8", paddingTop:16 }}>
              <h4 style={{ marginBottom:12, color:"#c0143c" }}>Yorumlar ({(selected.comments||[]).length})</h4>
              {(selected.comments||[]).map(c => (
                <div key={c.id} style={{ padding:"10px 14px", background:"#fff5f8", borderRadius:10, marginBottom:8 }}>
                  <span style={{ fontWeight:700, color:"#c0143c", fontSize:"0.9rem" }}>{c.author} </span>
                  <span style={{ color:"#555" }}>{c.text}</span>
                  <div style={{ fontSize:"0.75rem", color:"#bbb", marginTop:4 }}>{fmtDate(c.createdAt)}</div>
                </div>
              ))}
              {auth.email && (
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <input className="input" placeholder="Yorum yaz..." value={comment} onChange={e=>setComment(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&addComment(selected)} />
                  <button className="btn" onClick={()=>addComment(selected)}>Gönder</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionWrap>
  );
}

/* ══════════════════════════════════════════════════
   POEMS SECTION — Sarı nostaljik kağıtlar
══════════════════════════════════════════════════ */
function PoemsSection({ data, addItem, deleteItem, auth }) {
  const [text, setText]   = useState("");
  const [title, setTitle] = useState("");
  const [open, setOpen]   = useState(null);

  function add() {
    if (!text.trim()) return;
    addItem("poems", { id: uid(), title: title || "Şiirim", text, createdAt: nowISO() });
    setText(""); setTitle("");
  }

  const poems = data.poems || [];

  return (
    <SectionWrap secKey="poems">
      <div className="section-header" style={{ color:"#8a6020" }}>
        <h2 className="section-title" style={{ color:"#8a6020" }}>📜 Şiirler</h2>
      </div>

      {auth.email && (
        <div style={{ marginBottom:32, background:"linear-gradient(160deg,#fff9e0,#fff4c0)", border:"2px solid #e8c060", borderRadius:16, padding:24, boxShadow:"0 4px 20px rgba(200,160,0,0.12)" }}>
          <div style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.1rem", color:"#8a6020", marginBottom:16 }}>✍️ Yeni Şiir Yaz</div>
          <input className="input" placeholder="Şiir başlığı..." value={title} onChange={e=>setTitle(e.target.value)} style={{ marginBottom:10, border:"1.5px solid #e8c060", background:"rgba(255,255,255,0.7)" }} />
          <textarea className="input" placeholder="Şiirini buraya yaz..." value={text} onChange={e=>setText(e.target.value)} rows={6} style={{ border:"1.5px solid #e8c060", background:"rgba(255,255,255,0.7)", fontFamily:"'Lora',Georgia,serif", fontSize:"1.05rem", lineHeight:1.8 }} />
          <button className="btn" onClick={add} style={{ marginTop:12, background:"linear-gradient(135deg,#e8c060,#c89030)" }}>Şiiri Ekle</button>
        </div>
      )}

      {poems.length === 0 && <div style={{ textAlign:"center", padding:"60px 0", color:"#c8a060", fontStyle:"italic" }}>Henüz şiir yok. İlk şiirini yaz! 📜</div>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:24 }}>
        {poems.map((p, i) => (
          <div key={p.id} onClick={()=>setOpen(p)} style={{
            cursor:"pointer",
            background: i%3===0 ? "linear-gradient(160deg,#fff8d0,#fff0a0)" : i%3===1 ? "linear-gradient(160deg,#fff5b8,#ffe880)" : "linear-gradient(160deg,#fffacc,#fff4aa)",
            borderRadius:4, padding:"28px 24px 24px",
            boxShadow:"3px 6px 20px rgba(160,120,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
            border:"1px solid rgba(220,180,60,0.4)",
            transform:`rotate(${(i%3-1)*1.2}deg)`,
            transition:"all 0.3s",
            position:"relative"
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform="rotate(0deg) translateY(-6px) scale(1.03)";e.currentTarget.style.boxShadow="6px 12px 40px rgba(160,120,0,0.25)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform=`rotate(${(i%3-1)*1.2}deg)`;e.currentTarget.style.boxShadow="3px 6px 20px rgba(160,120,0,0.15)";}}>
            {/* Paper texture lines */}
            {Array.from({length:8}).map((_,li)=>(
              <div key={li} style={{ position:"absolute", left:0, right:0, height:1, background:"rgba(180,140,40,0.12)", top: 65+li*24 }} />
            ))}
            <div style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.2rem", color:"#8a6020", marginBottom:12, position:"relative", zIndex:1 }}>{p.title}</div>
            <div style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"0.95rem", lineHeight:1.8, color:"#5a4010", position:"relative", zIndex:1, display:"-webkit-box", WebkitLineClamp:5, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
              {p.text}
            </div>
            <div style={{ marginTop:14, fontSize:"0.75rem", color:"#a08040", position:"relative", zIndex:1, fontStyle:"italic" }}>{fmtShort(p.createdAt)}</div>
            {auth.isAdmin && (
              <DeleteBtn onDelete={()=>deleteItem("poems",p.id)} style={{ position:"absolute", top:8, right:8, padding:"3px 8px", fontSize:"0.75rem" }} />
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(null)}>
          <div className="modal-box" style={{ background:"linear-gradient(160deg,#fffce0,#fff8c0)", border:"2px solid #e8c060" }} onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setOpen(null)}>✕</button>
            <h2 style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.8rem", color:"#8a6020", marginBottom:20 }}>{open.title}</h2>
            <div style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"1.1rem", lineHeight:2, color:"#5a4010", whiteSpace:"pre-wrap" }}>{open.text}</div>
            <div style={{ marginTop:20, fontSize:"0.85rem", color:"#a08040", fontStyle:"italic" }}>{fmtDate(open.createdAt)}</div>
          </div>
        </div>
      )}
    </SectionWrap>
  );
}

/* ══════════════════════════════════════════════════
   LETTERS SECTION — Zarf animasyonlu
══════════════════════════════════════════════════ */
function LettersSection({ data, addItem, deleteItem, auth }) {
  const [text, setText]     = useState("");
  const [subject, setSubject] = useState("");
  const [opening, setOpening] = useState(null); // id being animated
  const [opened, setOpened]   = useState(null); // letter modal

  function add() {
    if (!text.trim()) return;
    addItem("letters", { id: uid(), subject: subject || "Sana bir mektup...", text, createdAt: nowISO() });
    setText(""); setSubject("");
  }

  function openLetter(l) {
    setOpening(l.id);
    setTimeout(() => { setOpening(null); setOpened(l); }, 800);
  }

  const letters = data.letters || [];

  return (
    <SectionWrap secKey="letters">
      <div className="section-header" style={{ color:"#8a5020" }}>
        <h2 className="section-title" style={{ color:"#8a5020" }}>✉️ Mektuplar</h2>
      </div>

      {auth.email && (
        <div style={{ marginBottom:32, background:"linear-gradient(160deg,#fff5e8,#ffe8d0)", border:"2px solid #d4956a", borderRadius:16, padding:24 }}>
          <div style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.1rem", color:"#8a5020", marginBottom:16 }}>✍️ Yeni Mektup Yaz</div>
          <input className="input" placeholder="Konu / Başlık..." value={subject} onChange={e=>setSubject(e.target.value)} style={{ marginBottom:10, border:"1.5px solid #d4956a", background:"rgba(255,255,255,0.8)" }} />
          <textarea className="input" placeholder="Mektubunu buraya yaz..." value={text} onChange={e=>setText(e.target.value)} rows={7} style={{ border:"1.5px solid #d4956a", background:"rgba(255,255,255,0.8)", fontFamily:"'Lora',Georgia,serif", fontSize:"1.05rem", lineHeight:1.8 }} />
          <button className="btn" onClick={add} style={{ marginTop:12, background:"linear-gradient(135deg,#d4956a,#a05030)" }}>Mektubu Ekle</button>
        </div>
      )}

      {letters.length===0 && <div style={{ textAlign:"center", padding:"60px 0", color:"#c08060", fontStyle:"italic" }}>Henüz mektup yok ✉️</div>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:24 }}>
        {letters.map((l, i) => (
          <EnvelopeCard key={l.id} letter={l} index={i} opening={opening===l.id} onOpen={()=>openLetter(l)}
            onDelete={auth.isAdmin ? ()=>deleteItem("letters",l.id) : null} />
        ))}
      </div>

      {opened && (
        <div className="modal-overlay" onClick={()=>setOpened(null)}>
          <div className="modal-box" style={{ background:"linear-gradient(160deg,#fffdf8,#fff8f0)", border:"2px solid #d4956a" }} onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setOpened(null)}>✕</button>
            {/* Paper out of envelope effect */}
            <div style={{ animation:"letterRise 0.5s ease both" }}>
              <div style={{ borderBottom:"2px solid #e8c090", paddingBottom:12, marginBottom:20 }}>
                <div style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.6rem", color:"#8a5020" }}>{opened.subject}</div>
                <div style={{ fontSize:"0.8rem", color:"#b09070", marginTop:4, fontStyle:"italic" }}>{fmtDate(opened.createdAt)}</div>
              </div>
              <div style={{ fontFamily:"'Lora',Georgia,serif", fontSize:"1.05rem", lineHeight:1.9, color:"#4a3020", whiteSpace:"pre-wrap" }}>{opened.text}</div>
              <div style={{ marginTop:24, fontFamily:"'Dancing Script',cursive", fontSize:"1.3rem", color:"#c0143c", textAlign:"right" }}>— Seni seviyorum 💕</div>
            </div>
          </div>
        </div>
      )}
    </SectionWrap>
  );
}

function EnvelopeCard({ letter, index, opening, onOpen, onDelete }) {
  const colors = [
    { body:"#f7e7d7", flap:"#e8c9a8", line:"#d4956a", shadow:"rgba(200,120,60,0.2)" },
    { body:"#fce8e0", flap:"#f0c8b8", line:"#d07060", shadow:"rgba(200,100,80,0.2)" },
    { body:"#f0e8f8", flap:"#d8c0f0", line:"#9070c0", shadow:"rgba(150,100,200,0.2)" },
  ];
  const c = colors[index%3];

  return (
    <div style={{ perspective:600 }}>
      <div onClick={onOpen} style={{
        width:"100%", aspectRatio:"3/2", cursor:"pointer", position:"relative",
        transform: opening ? "rotateY(15deg)" : "rotateY(0)",
        transition:"all 0.3s"
      }}>
        {/* Envelope body */}
        <div style={{
          background: c.body, borderRadius:8,
          width:"100%", height:"100%",
          boxShadow:`0 8px 25px ${c.shadow}`,
          border:`1.5px solid ${c.line}40`,
          display:"flex", flexDirection:"column", overflow:"hidden",
          transition:"transform 0.3s"
        }}
        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
        onMouseLeave={e=>e.currentTarget.style.transform=""}>
          {/* Envelope flap */}
          <div style={{
            background: c.flap, height:"45%",
            clipPath:"polygon(0 0, 100% 0, 50% 100%)",
            transformOrigin:"top",
            animation: opening ? "envelopeOpen 0.6s ease forwards" : "none",
            borderBottom:`1.5px solid ${c.line}40`
          }} />
          {/* Body content */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 16px 12px" }}>
            <div style={{ fontSize:"1.5rem", marginBottom:6 }}>💌</div>
            <div style={{ fontFamily:"'Dancing Script',cursive", color:c.line, fontSize:"0.95rem", textAlign:"center", fontWeight:600 }}>{letter.subject}</div>
            <div style={{ fontSize:"0.72rem", color:"#aaa", marginTop:6 }}>{fmtShort(letter.createdAt)}</div>
          </div>
        </div>

        {/* Seal */}
        <div style={{
          position:"absolute", left:"50%", top:"42%", transform:"translate(-50%,-50%)",
          width:28, height:28, borderRadius:"50%",
          background:`linear-gradient(135deg, #c0143c, #ff6b9d)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"0.75rem", color:"white", boxShadow:"0 2px 8px rgba(192,20,60,0.4)",
          zIndex:2
        }}>💕</div>
      </div>
      {onDelete && (
        <DeleteBtn onDelete={onDelete} style={{ marginTop:6, width:"100%", fontSize:"0.78rem" }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STORIES SECTION
══════════════════════════════════════════════════ */
function StoriesSection({ data, addItem, deleteItem, auth }) {
  const [title, setTitle] = useState("");
  const [text, setText]   = useState("");
  const [open, setOpen]   = useState(null);

  function add() {
    if (!title.trim() || !text.trim()) return;
    addItem("stories", { id: uid(), title, text, createdAt: nowISO() });
    setTitle(""); setText("");
  }

  const stories = data.stories || [];
  const grad = SECTION_CONFIG.stories.grad;

  return (
    <SectionWrap secKey="stories">
      <div className="section-header">
        <h2 className="section-title" style={{ color:grad[1] }}>📖 Hikayeler</h2>
      </div>

      {auth.email && (
        <div className="card" style={{ marginBottom:28, border:`1.5px solid ${grad[0]}40`, background:`${grad[0]}10` }}>
          <h3 style={{ color:grad[1], fontFamily:"'Playfair Display',serif", marginBottom:14 }}>Yeni Hikaye Ekle</h3>
          <input className="input" placeholder="Hikaye başlığı..." value={title} onChange={e=>setTitle(e.target.value)} style={{ marginBottom:10 }} />
          <textarea className="input" placeholder="Hikayeni yaz..." value={text} onChange={e=>setText(e.target.value)} rows={8} />
          <button className="btn" onClick={add} style={{ marginTop:12, background:`linear-gradient(135deg,${grad[0]},${grad[1]})` }}>Hikayeyi Ekle</button>
        </div>
      )}

      {stories.length===0 && <div style={{ textAlign:"center", padding:"60px 0", color:grad[0], fontStyle:"italic" }}>Henüz hikaye yok 📖</div>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
        {stories.map(s => (
          <div key={s.id} className="card" style={{ cursor:"pointer", borderLeft:`4px solid ${grad[0]}` }} onClick={()=>setOpen(s)}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", fontStyle:"italic", marginBottom:8, color:grad[1] }}>{s.title}</div>
            <div style={{ color:"#666", lineHeight:1.7, display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{s.text}</div>
            <div style={{ marginTop:10, fontSize:"0.8rem", color:"#aaa" }}>{fmtShort(s.createdAt)}</div>
            {auth.isAdmin && <DeleteBtn onDelete={()=>deleteItem("stories",s.id)} style={{ marginTop:8 }} />}
          </div>
        ))}
      </div>

      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setOpen(null)}>✕</button>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", color:grad[1], marginBottom:16, paddingRight:32 }}>{open.title}</h2>
            <div style={{ fontFamily:"'Lora',Georgia,serif", lineHeight:1.9, fontSize:"1.05rem", color:"#3a2a30", whiteSpace:"pre-wrap" }}>{open.text}</div>
            <div style={{ marginTop:16, fontSize:"0.8rem", color:"#bbb" }}>{fmtDate(open.createdAt)}</div>
          </div>
        </div>
      )}
    </SectionWrap>
  );
}

/* ══════════════════════════════════════════════════
   PHOTOS SECTION — Polaroid wall
══════════════════════════════════════════════════ */
function PhotosSection({ data, addItem, deleteItem, auth }) {
  const [open, setOpen] = useState(null);
  const [caption, setCaption] = useState("");
  const [imgSrc, setImgSrc] = useState(null);
  const [imgName, setImgName] = useState("");
  const photos = data.photos || [];

  const ledColors = ["#ff6b9d","#ff9f43","#ffd700","#00d2d3","#a29bfe","#fd79a8","#55efc4","#fdcb6e"];

  async function uploadPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await fileToDataURL(f);
    setImgSrc(url); setImgName(f.name);
  }

  function addPhoto() {
    if (!imgSrc) { alert("Fotoğraf seç"); return; }
    addItem("photos", { id: uid(), src: imgSrc, caption: caption || imgName, createdAt: nowISO() });
    setImgSrc(null); setCaption(""); setImgName("");
  }

  return (
    <SectionWrap secKey="photos">
      <div className="section-header">
        <h2 className="section-title" style={{ color:"#6b3030" }}>📷 Fotoğraflar</h2>
      </div>

      {auth.email && (
        <div className="card" style={{ marginBottom:28, background:"#fff8f0", border:"1.5px solid #d0907060" }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:14, color:"#6b3030" }}>Yeni Fotoğraf Ekle</h3>
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <label style={{ padding:"9px 16px", border:"2px dashed #c08060", borderRadius:8, cursor:"pointer", color:"#8a5040", fontFamily:"'Cormorant Garamond',serif" }}>
              {imgSrc ? "✅ Seçildi" : "📷 Fotoğraf Seç"}
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={uploadPhoto} />
            </label>
            <input className="input" placeholder="Açıklama / Başlık..." value={caption} onChange={e=>setCaption(e.target.value)} style={{ flex:1, minWidth:200 }} />
            <button className="btn" onClick={addPhoto} style={{ background:"linear-gradient(135deg,#8b6060,#5b4040)" }}>Ekle</button>
          </div>
          {imgSrc && <img src={imgSrc} style={{ marginTop:10, height:80, borderRadius:6, objectFit:"cover" }} />}
        </div>
      )}

      {/* Photo Wall — rope with LEDs */}
      <div style={{ background:"linear-gradient(160deg,#3b2f2f,#6b4444)", borderRadius:20, padding:"32px 20px 40px", position:"relative", minHeight:300 }}>
        {/* Rope lines */}
        {Array.from({length:Math.ceil(photos.length/4)+1}).map((_,ri) => (
          <div key={ri} style={{ position:"relative", marginBottom:32 }}>
            {/* Rope */}
            <div style={{ height:3, background:"linear-gradient(90deg,#8b6040,#c09060,#8b6040)", borderRadius:2, margin:"0 -20px", boxShadow:"0 2px 8px rgba(0,0,0,0.4)", position:"relative", zIndex:1 }}>
              {/* LED lights on rope */}
              {Array.from({length:12}).map((_,li) => (
                <div key={li} style={{
                  position:"absolute", width:8, height:8, borderRadius:"50%",
                  background: ledColors[li%ledColors.length],
                  top:-2, left:`${(li+1)*8}%`, zIndex:2,
                  animation:`ledBlink ${0.8+li%3*0.4}s ease-in-out ${li*0.15}s infinite`,
                  boxShadow:`0 0 6px ${ledColors[li%ledColors.length]}`
                }} />
              ))}
            </div>

            {/* Polaroids on this row */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center", paddingTop:16 }}>
              {photos.slice(ri*4, ri*4+4).map((p, pi) => {
                const rot = ((pi+ri)%3-1)*4;
                return (
                  <div key={p.id} onClick={()=>setOpen(p)} style={{
                    background:"white", padding:"10px 10px 32px",
                    boxShadow:"4px 8px 25px rgba(0,0,0,0.35)",
                    transform:`rotate(${rot}deg)`, cursor:"pointer",
                    transition:"all 0.3s", width:160,
                    position:"relative"
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="rotate(0deg) translateY(-10px) scale(1.08)";e.currentTarget.style.zIndex=10;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform=`rotate(${rot}deg)`;e.currentTarget.style.zIndex=1;}}>
                    {/* Clip */}
                    <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", width:14, height:20, background:"#c0c0c0", borderRadius:"2px 2px 0 0", boxShadow:"0 2px 4px rgba(0,0,0,0.3)" }} />
                    <img src={p.src} alt={p.caption} style={{ width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" }} />
                    <div style={{ position:"absolute", bottom:8, left:0, right:0, textAlign:"center", fontFamily:"'Dancing Script',cursive", fontSize:"0.8rem", color:"#555" }}>{p.caption || fmtShort(p.createdAt)}</div>
                    {auth.isAdmin && <DeleteBtn onDelete={()=>deleteItem("photos",p.id)} style={{ position:"absolute", top:4, right:4, padding:"2px 6px", fontSize:"0.7rem" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {photos.length===0 && <div style={{ textAlign:"center", color:"rgba(255,255,255,0.5)", fontStyle:"italic", padding:"40px 0" }}>Henüz fotoğraf yok. Polaroidleri doldur! 📷</div>}
      </div>

      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ background:"white", textAlign:"center" }}>
            <button className="modal-close" onClick={()=>setOpen(null)}>✕</button>
            <div style={{ padding:"10px 10px 40px", display:"inline-block", boxShadow:"0 8px 30px rgba(0,0,0,0.2)", background:"white" }}>
              <img src={open.src} style={{ maxWidth:"100%", maxHeight:"65vh", display:"block" }} />
            </div>
            <div style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.2rem", color:"#6b3030", marginTop:12 }}>{open.caption}</div>
            <div style={{ fontSize:"0.8rem", color:"#bbb" }}>{fmtDate(open.createdAt)}</div>
          </div>
        </div>
      )}
    </SectionWrap>
  );
}

/* ══════════════════════════════════════════════════
   TIMELINE SECTION
══════════════════════════════════════════════════ */
function TimelineSection({ data, addItem, deleteItem, auth }) {
  const [date, setDate]   = useState("");
  const [desc, setDesc]   = useState("");
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState(null);
  const [open, setOpen]   = useState(null);

  const timeline = (data.timeline || []).sort((a,b)=>a.date>b.date?1:-1);
  const grad = SECTION_CONFIG.timeline.grad;

  async function uploadPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await fileToDataURL(f);
    setPhoto(url);
  }

  function add() {
    if (!date || !title.trim()) { alert("Tarih ve başlık gir"); return; }
    addItem("timeline", { id: uid(), date, title, desc, photo, createdAt: nowISO() });
    setDate(""); setTitle(""); setDesc(""); setPhoto(null);
  }

  return (
    <SectionWrap secKey="timeline">
      <div className="section-header">
        <h2 className="section-title" style={{ color:grad[0] }}>⏳ Zaman Çizelgesi</h2>
      </div>

      {auth.email && (
        <div className="card" style={{ marginBottom:32, border:`1.5px solid ${grad[0]}50`, background:`${grad[0]}0a` }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:14, color:grad[0] }}>Yeni An Ekle</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} />
            <input className="input" placeholder="Başlık..." value={title} onChange={e=>setTitle(e.target.value)} />
            <textarea className="input" placeholder="Ne oldu o gün?" value={desc} onChange={e=>setDesc(e.target.value)} rows={3} style={{ gridColumn:"1/-1" }} />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:10, alignItems:"center" }}>
            <label style={{ padding:"7px 14px", border:`1.5px dashed ${grad[0]}60`, borderRadius:8, cursor:"pointer", color:grad[0], fontSize:"0.9rem" }}>
              {photo ? "✅ Fotoğraf seçildi" : "📷 Fotoğraf Ekle (isteğe bağlı)"}
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={uploadPhoto} />
            </label>
            <button className="btn" onClick={add} style={{ background:`linear-gradient(135deg,${grad[0]},${grad[1]})` }}>Ekle</button>
          </div>
        </div>
      )}

      {timeline.length===0 && <div style={{ textAlign:"center", padding:"60px 0", color:grad[0], fontStyle:"italic" }}>Henüz anı yok. Hikayenizi yazmaya başlayın! ⏳</div>}

      {/* Timeline render */}
      <div style={{ position:"relative", paddingLeft:50 }}>
        {/* Vertical line */}
        <div style={{ position:"absolute", left:18, top:0, bottom:0, width:3, background:`linear-gradient(to bottom, ${grad[0]}, ${grad[1]})`, borderRadius:2 }} />

        {timeline.map((t, i) => (
          <div key={t.id} style={{ position:"relative", marginBottom:32, animation:`fadeUp 0.5s ${i*0.08}s ease both` }}>
            {/* Dot */}
            <div style={{ position:"absolute", left:-38, top:6, width:20, height:20, borderRadius:"50%", background:`linear-gradient(135deg,${grad[0]},${grad[1]})`, border:"3px solid white", boxShadow:`0 0 0 3px ${grad[0]}40` }} />

            <div className="card" style={{ borderLeft:`4px solid ${grad[0]}`, cursor:"pointer" }} onClick={()=>setOpen(t)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontFamily:"'Dancing Script',cursive", color:grad[0], fontSize:"1rem" }}>{t.date}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:700, marginTop:4 }}>{t.title}</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {auth.isAdmin && <DeleteBtn onDelete={()=>deleteItem("timeline",t.id)} />}
                </div>
              </div>
              {t.desc && <p style={{ color:"#666", marginTop:8, fontStyle:"italic", lineHeight:1.6 }}>{t.desc}</p>}
              {t.photo && <img src={t.photo} style={{ marginTop:10, height:120, borderRadius:8, objectFit:"cover" }} />}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setOpen(null)}>✕</button>
            <div style={{ fontFamily:"'Dancing Script',cursive", color:grad[0], fontSize:"1.1rem" }}>{open.date}</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", marginTop:6, marginBottom:14 }}>{open.title}</h2>
            {open.photo && <img src={open.photo} style={{ width:"100%", borderRadius:10, marginBottom:14, objectFit:"cover", maxHeight:300 }} />}
            <p style={{ lineHeight:1.8, color:"#444" }}>{open.desc}</p>
          </div>
        </div>
      )}
    </SectionWrap>
  );
}

/* ══════════════════════════════════════════════════
   DRAWINGS SECTION
══════════════════════════════════════════════════ */
function DrawingsSection({ data, addItem, deleteItem, auth }) {
  const [open, setOpen] = useState(null);
  const drawings = data.drawings || [];
  const grad = SECTION_CONFIG.drawings.grad;

  async function upload(e) {
    const files = Array.from(e.target.files); if (!files.length) return;
    for (const f of files) {
      const url = await fileToDataURL(f);
      addItem("drawings", { id: uid(), title: f.name.replace(/\.[^.]+$/,""), src: url, createdAt: nowISO() });
    }
  }

  return (
    <SectionWrap secKey="drawings">
      <div className="section-header">
        <h2 className="section-title" style={{ color:grad[0] }}>🎨 Resimler</h2>
      </div>
      {auth.email && (
        <div style={{ marginBottom:24 }}>
          <label style={{ padding:"12px 20px", background:`linear-gradient(135deg,${grad[0]},${grad[1]})`, color:"white", borderRadius:10, cursor:"pointer", fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem" }}>
            🎨 Resim(ler) Yükle
            <input type="file" accept="image/*" multiple style={{ display:"none" }} onChange={upload} />
          </label>
        </div>
      )}
      {drawings.length===0 && <div style={{ textAlign:"center", padding:"60px 0", color:grad[0], fontStyle:"italic" }}>Henüz resim yok 🎨</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
        {drawings.map(d => (
          <div key={d.id} className="card" style={{ padding:0, overflow:"hidden", cursor:"pointer" }} onClick={()=>setOpen(d)}>
            <img src={d.src} style={{ width:"100%", aspectRatio:"1", objectFit:"cover" }} />
            <div style={{ padding:"10px 12px" }}>
              <div style={{ fontWeight:600, fontSize:"0.95rem" }}>{d.title}</div>
              <div style={{ fontSize:"0.75rem", color:"#aaa", marginTop:3 }}>{fmtShort(d.createdAt)}</div>
              {auth.isAdmin && <button className="btn sm danger" style={{ marginTop:6 }} onClick={e=>{e.stopPropagation();deleteItem("drawings",d.id);}}>Sil</button>}
            </div>
          </div>
        ))}
      </div>
      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(null)}>
          <div className="modal-box" style={{ textAlign:"center" }} onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setOpen(null)}>✕</button>
            <img src={open.src} style={{ maxWidth:"100%", maxHeight:"75vh", borderRadius:8 }} />
            <div style={{ marginTop:10, fontFamily:"'Playfair Display',serif", fontSize:"1.1rem" }}>{open.title}</div>
          </div>
        </div>
      )}
    </SectionWrap>
  );
}

/* ══════════════════════════════════════════════════
   MOVIES SECTION
══════════════════════════════════════════════════ */
function MoviesSection({ data, addItem, deleteItem, auth }) {
  const [title, setTitle]     = useState("");
  const [myScore, setMy]      = useState("");
  const [herScore, setHer]    = useState("");
  const [poster, setPoster]   = useState(null);
  const [note, setNote]       = useState("");
  const movies = data.movies || [];
  const grad = SECTION_CONFIG.movies.grad;

  async function uploadPoster(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await fileToDataURL(f);
    setPoster(url);
  }

  function add() {
    if (!title.trim()) return;
    addItem("movies", { id: uid(), title, poster, myScore, herScore, note, createdAt: nowISO() });
    setTitle(""); setMy(""); setHer(""); setPoster(null); setNote("");
  }

  const stars = (n) => "⭐".repeat(Math.min(5, Math.max(0, parseInt(n)||0)));

  return (
    <SectionWrap secKey="movies">
      <div className="section-header">
        <h2 className="section-title" style={{ color:"#8040a0" }}>🎭 Filmler</h2>
      </div>
      {auth.email && (
        <div className="card" style={{ marginBottom:28, border:`1.5px solid ${grad[0]}50`, background:`${grad[0]}08` }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:14, color:grad[1] }}>Film Ekle</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <input className="input" placeholder="Film adı..." value={title} onChange={e=>setTitle(e.target.value)} style={{ gridColumn:"1/-1" }} />
            <input className="input" placeholder="Benim puanım (1-5)" value={myScore} onChange={e=>setMy(e.target.value)} />
            <input className="input" placeholder="Onun puanı (1-5)" value={herScore} onChange={e=>setHer(e.target.value)} />
            <textarea className="input" placeholder="Notlar..." value={note} onChange={e=>setNote(e.target.value)} rows={2} style={{ gridColumn:"1/-1", minHeight:60 }} />
          </div>
          <div style={{ display:"flex", gap:12, marginTop:10, alignItems:"center" }}>
            <label style={{ padding:"7px 14px", border:`1.5px dashed ${grad[0]}60`, borderRadius:8, cursor:"pointer", color:grad[1], fontSize:"0.9rem" }}>
              {poster ? "✅ Poster seçildi" : "🖼️ Film Afişi"}
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={uploadPoster} />
            </label>
            <button className="btn" onClick={add} style={{ background:`linear-gradient(135deg,${grad[0]},${grad[1]})` }}>Ekle</button>
          </div>
        </div>
      )}
      {movies.length===0 && <div style={{ textAlign:"center", padding:"60px 0", color:grad[0], fontStyle:"italic" }}>Film listesi boş 🎭</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:16 }}>
        {movies.map(m => (
          <div key={m.id} className="card" style={{ padding:0, overflow:"hidden" }}>
            <div style={{ aspectRatio:"2/3", background:`linear-gradient(160deg,${grad[0]}30,${grad[1]}20)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3rem" }}>
              {m.poster ? <img src={m.poster} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "🎬"}
            </div>
            <div style={{ padding:"10px 12px" }}>
              <div style={{ fontWeight:700, fontSize:"0.95rem", marginBottom:4 }}>{m.title}</div>
              <div style={{ fontSize:"0.8rem", color:"#888" }}>Ben: {stars(m.myScore)} {m.myScore}/5</div>
              <div style={{ fontSize:"0.8rem", color:"#888" }}>O: {stars(m.herScore)} {m.herScore}/5</div>
              {m.note && <div style={{ fontSize:"0.8rem", color:"#666", marginTop:4, fontStyle:"italic" }}>{m.note}</div>}
              {auth.isAdmin && <DeleteBtn onDelete={()=>deleteItem("movies",m.id)} style={{ marginTop:6 }} />}
            </div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

/* ══════════════════════════════════════════════════
   GAMES SECTION
══════════════════════════════════════════════════ */
function GamesSection({ data, addItem, auth }) {
  const [activeGame, setActiveGame] = useState("memory");
  const games = [
    { key:"memory",   label:"💌 Hafıza", icon:"💌" },
    { key:"tictactoe",label:"❤️ X-O", icon:"❤️" },
    { key:"clicker",  label:"💕 Kalp Tıkla", icon:"💕" },
    { key:"wordfind", label:"🔍 Kelime Bul", icon:"🔍" },
  ];
  const grad = SECTION_CONFIG.games.grad;

  return (
    <SectionWrap secKey="games">
      <div className="section-header">
        <h2 className="section-title" style={{ color:grad[0] }}>🎮 Oyunlar</h2>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {games.map(g => (
          <button key={g.key} onClick={()=>setActiveGame(g.key)} style={{
            padding:"10px 20px", borderRadius:10, border:"none", cursor:"pointer",
            background: activeGame===g.key ? `linear-gradient(135deg,${grad[0]},${grad[1]})` : "white",
            color: activeGame===g.key ? "white" : "#555",
            fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem",
            boxShadow:"0 2px 10px rgba(0,0,0,0.08)", transition:"all 0.2s",
            fontWeight: activeGame===g.key ? 700 : 400
          }}>{g.label}</button>
        ))}
      </div>
      <div style={{ background:"white", borderRadius:16, padding:24, boxShadow:"0 4px 20px rgba(0,0,0,0.07)", minHeight:400 }}>
        {activeGame==="memory"   && <MemoryGame />}
        {activeGame==="tictactoe"&& <TicTacToe />}
        {activeGame==="clicker"  && <HeartClicker />}
        {activeGame==="wordfind" && <WordFind />}
      </div>
    </SectionWrap>
  );
}

/* — Memory Game — */
function MemoryGame() {
  const emojis = ["💕","🌹","💋","🥂","🌸","✨","💍","🎀","🦋","🌙"];
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [canFlip, setCanFlip] = useState(true);

  function init() {
    const pairs = [...emojis.slice(0,8), ...emojis.slice(0,8)].sort(()=>Math.random()-0.5).map((e,i)=>({id:i,emoji:e,pair:e}));
    setCards(pairs); setFlipped([]); setMatched([]); setMoves(0); setCanFlip(true);
  }
  useEffect(init,[]);

  function flip(card) {
    if (!canFlip || flipped.includes(card.id) || matched.includes(card.pair)) return;
    const nf = [...flipped, card.id];
    setFlipped(nf);
    if (nf.length===2) {
      setMoves(m=>m+1); setCanFlip(false);
      const [a,b] = nf.map(id=>cards.find(c=>c.id===id));
      if (a.pair===b.pair) {
        setMatched(m=>[...m, a.pair]);
        setFlipped([]); setCanFlip(true);
      } else {
        setTimeout(()=>{ setFlipped([]); setCanFlip(true); }, 1000);
      }
    }
  }

  const won = matched.length===8;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div style={{ display:"flex", gap:20, marginBottom:8 }}>
        <span style={{ color:"#888" }}>Hamle: {moves}</span>
        <span style={{ color:"#888" }}>Eşleşme: {matched.length}/8</span>
      </div>
      {won && <div style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.8rem", color:"#c0143c", animation:"heartbeat 0.5s ease infinite" }}>🎉 Tebrikler! {moves} hamlede! 💕</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, maxWidth:320 }}>
        {cards.map(c=>{
          const isFlipped = flipped.includes(c.id) || matched.includes(c.pair);
          return (
            <div key={c.id} onClick={()=>flip(c)} style={{
              width:68, height:68, borderRadius:10, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem",
              background: isFlipped ? (matched.includes(c.pair)?"linear-gradient(135deg,#a8e6cf,#88d8b0)":"linear-gradient(135deg,#ffd1e8,#ffb3d1)") : "linear-gradient(135deg,#c0143c,#e8336d)",
              transition:"all 0.3s", boxShadow:"0 3px 10px rgba(0,0,0,0.12)",
              transform: isFlipped ? "scale(1.05)" : "scale(1)"
            }}>
              {isFlipped ? c.emoji : "💗"}
            </div>
          );
        })}
      </div>
      <button className="btn" onClick={init}>Yeniden Oyna</button>
    </div>
  );
}

/* — Tic Tac Toe — */
function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [winner, setWinner] = useState(null);

  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  function checkWinner(b) {
    for (const [a,c,d] of lines) if (b[a]&&b[a]===b[c]&&b[a]===b[d]) return b[a];
    if (b.every(Boolean)) return "draw";
    return null;
  }

  function click(i) {
    if (board[i]||winner) return;
    const nb = [...board]; nb[i]=isX?"❤️":"💙";
    const w = checkWinner(nb);
    setBoard(nb); setIsX(!isX); setWinner(w);
  }

  function reset() { setBoard(Array(9).fill(null)); setIsX(true); setWinner(null); }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", color:"#c0143c" }}>
        {winner ? (winner==="draw"?"Berabere! 🤝":`${winner} Kazandı! 🎉`) : `Sıra: ${isX?"❤️ Sen":"💙 O"}`}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
        {board.map((cell,i)=>(
          <div key={i} onClick={()=>click(i)} style={{
            width:88, height:88, background:"#fff0f5", borderRadius:10, border:"2px solid #ffd3db",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", cursor:"pointer",
            transition:"background 0.2s", boxShadow:"0 2px 8px rgba(0,0,0,0.06)"
          }}
          onMouseEnter={e=>{ if(!cell&&!winner) e.currentTarget.style.background="#ffe8f0"; }}
          onMouseLeave={e=>e.currentTarget.style.background="#fff0f5"}>
            {cell}
          </div>
        ))}
      </div>
      <button className="btn" onClick={reset}>Yeniden</button>
    </div>
  );
}

/* — Heart Clicker — */
function HeartClicker() {
  const [count, setCount] = useState(0);
  const [particles, setParticles] = useState([]);
  const [combo, setCombo] = useState(0);
  const lastClick = useRef(0);

  function click(e) {
    const now = Date.now();
    const newCombo = now-lastClick.current < 500 ? combo+1 : 1;
    lastClick.current = now;
    setCombo(newCombo);
    setCount(c=>c+Math.max(1,Math.floor(newCombo/3)));
    const rect = e.currentTarget.getBoundingClientRect();
    const p = { id:uid(), x:e.clientX-rect.left, y:e.clientY-rect.top };
    setParticles(ps=>[...ps, p]);
    setTimeout(()=>setParticles(ps=>ps.filter(x=>x.id!==p.id)), 1000);
  }

  const level = Math.floor(count/50);
  const emojis = ["❤️","💕","💗","💖","💝","🌹","💘","💓"];

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", color:"#c0143c" }}>
        💕 {count} sevgi noktası
      </div>
      {combo > 2 && <div style={{ color:"#e8336d", fontFamily:"'Dancing Script',cursive", fontSize:"1.3rem", animation:"fadeUp 0.3s ease" }}>COMBO x{combo}! 🔥</div>}
      <div style={{ fontFamily:"'Cormorant Garamond',serif", color:"#888" }}>Sevgi Seviyesi: {level} — {emojis[level%emojis.length]}</div>
      <div style={{ position:"relative" }} onClick={click}>
        <div style={{
          fontSize:"6rem", cursor:"pointer", userSelect:"none",
          animation:`heartbeat ${Math.max(0.3, 1.5-combo*0.1)}s ease-in-out infinite`,
          filter:`drop-shadow(0 0 ${Math.min(20,combo*2)}px rgba(232,51,109,0.6))`
        }}>❤️</div>
        {particles.map(p=>(
          <div key={p.id} style={{ position:"absolute", left:p.x, top:p.y, pointerEvents:"none", animation:"fadeUp 0.8s ease forwards", fontSize:"1.2rem" }}>+{Math.max(1,Math.floor(combo/3))} 💕</div>
        ))}
      </div>
      <button className="btn sm ghost" style={{ color:"#c0143c", borderColor:"#c0143c" }} onClick={()=>{setCount(0);setCombo(0);}}>Sıfırla</button>
    </div>
  );
}

/* — Word Find — */
function WordFind() {
  const words = ["SEVGI","ASIK","GULUM","KALP","OZEL","BAHAR","MUTLU"];
  const [grid, setGrid] = useState([]);
  const [found, setFound] = useState([]);
  const [sel, setSel] = useState([]);

  const SIZE = 10;
  function buildGrid() {
    const g = Array.from({length:SIZE},()=>Array(SIZE).fill(""));
    const dirs = [[0,1],[1,0],[1,1],[0,-1],[-1,0]];
    words.forEach(w=>{
      let placed=false, tries=0;
      while(!placed&&tries<200){
        tries++;
        const dir=dirs[Math.floor(Math.random()*dirs.length)];
        const r=Math.floor(Math.random()*SIZE);
        const c=Math.floor(Math.random()*SIZE);
        let ok=true;
        for(let i=0;i<w.length;i++){
          const nr=r+dir[0]*i, nc=c+dir[1]*i;
          if(nr<0||nr>=SIZE||nc<0||nc>=SIZE){ok=false;break;}
          if(g[nr][nc]&&g[nr][nc]!==w[i]){ok=false;break;}
        }
        if(ok){ for(let i=0;i<w.length;i++) g[r+dir[0]*i][c+dir[1]*i]=w[i]; placed=true; }
      }
    });
    const alpha="ABCDEFGHİJKLMNOPRSTUVYZ";
    for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!g[r][c]) g[r][c]=alpha[Math.floor(Math.random()*alpha.length)];
    return g;
  }
  useEffect(()=>{setGrid(buildGrid());setFound([]);setSel([]);},[]);

  function selectCell(r,c) {
    const key=`${r},${c}`;
    if(sel.length===0){setSel([key]);return;}
    const newSel=[...sel,key];
    const word=newSel.map(k=>{ const[rr,cc]=k.split(",").map(Number); return grid[rr]?.[cc]||""; }).join("");
    const rev=word.split("").reverse().join("");
    const match=words.find(w=>w===word||w===rev);
    if(match&&!found.includes(match)){ setFound([...found,match]); setSel([]); }
    else if(newSel.length>=10){ setSel([]); }
    else { setSel(newSel); }
  }

  const won = found.length===words.length;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      {won&&<div style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.8rem", color:"#c0143c" }}>🎉 Tüm kelimeleri buldun! 💕</div>}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8, justifyContent:"center" }}>
        {words.map(w=>(
          <span key={w} style={{ padding:"3px 10px", borderRadius:20, background: found.includes(w)?"#c0143c":"#f0f0f0", color:found.includes(w)?"white":"#888", fontSize:"0.82rem", textDecoration:found.includes(w)?"line-through":"none", fontFamily:"'Cormorant Garamond',serif" }}>{w}</span>
        ))}
      </div>
      <div style={{ display:"inline-grid", gridTemplateColumns:`repeat(${SIZE},32px)`, gap:2 }}>
        {grid.map((row,r)=>row.map((cell,c)=>{
          const key=`${r},${c}`;
          const isSelected=sel.includes(key);
          const isFound=words.some(w=>{
            // rough check: just color if found
            return false;
          });
          return (
            <div key={key} onClick={()=>selectCell(r,c)} style={{
              width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center",
              background: isSelected?"#e8336d":"#f8f0f5", borderRadius:4, cursor:"pointer",
              fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"0.85rem",
              color: isSelected?"white":"#3a1020", transition:"all 0.15s",
              border:"1px solid rgba(232,51,109,0.15)"
            }}
            onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#ffd1e8"; }}
            onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background="#f8f0f5"; }}>
              {cell}
            </div>
          );
        }))}
      </div>
      <button className="btn sm" onClick={()=>{setGrid(buildGrid());setFound([]);setSel([]);}}>Yenile</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PUZZLE SECTION
══════════════════════════════════════════════════ */
function PuzzleSection({ data, addItem, deleteItem, auth }) {
  const [selected, setSelected] = useState(null);
  const [parts, setParts] = useState(9);
  const puzzles = data.games?.puzzle || [];

  async function upload(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await fileToDataURL(f);
    const newP = { id: uid(), title: f.name.replace(/\.[^.]+$/,""), src: url, parts, createdAt: nowISO() };
    addItem("games.puzzle", newP);
  }

  return (
    <SectionWrap secKey="puzzle">
      <div className="section-header">
        <h2 className="section-title" style={{ color:"#a02040" }}>🧩 Bulmaca</h2>
      </div>

      {auth.email && (
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:12, color:"#a02040" }}>Puzzle Oluştur</h3>
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <select className="input" style={{ width:160 }} value={parts} onChange={e=>setParts(Number(e.target.value))}>
              <option value={9}>3×3 (9 parça)</option>
              <option value={16}>4×4 (16 parça)</option>
              <option value={25}>5×5 (25 parça)</option>
            </select>
            <label style={{ padding:"9px 16px", background:"linear-gradient(135deg,#e04060,#a02040)", color:"white", borderRadius:8, cursor:"pointer", fontFamily:"'Cormorant Garamond',serif" }}>
              🖼️ Resim Yükle → Puzzle
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={upload} />
            </label>
          </div>
        </div>
      )}

      {puzzles.length===0 && <div style={{ textAlign:"center", padding:"60px 0", color:"#e04060", fontStyle:"italic" }}>Henüz puzzle yok. Resim yükle! 🧩</div>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
        {puzzles.map(p=>(
          <div key={p.id} className="card" style={{ padding:0, overflow:"hidden", cursor:"pointer" }} onClick={()=>setSelected(p)}>
            <img src={p.src} style={{ width:"100%", aspectRatio:"1", objectFit:"cover" }} />
            <div style={{ padding:"10px 12px" }}>
              <div style={{ fontWeight:700 }}>{p.title}</div>
              <div style={{ fontSize:"0.8rem", color:"#888" }}>🧩 {Math.sqrt(p.parts)}×{Math.sqrt(p.parts)}</div>
              {auth.isAdmin && <DeleteBtn onDelete={()=>deleteItem("games.puzzle",p.id)} style={{ marginTop:6 }} />}
            </div>
          </div>
        ))}
      </div>

      {selected && <PuzzleModal puzzle={selected} onClose={()=>setSelected(null)} />}
    </SectionWrap>
  );
}

function PuzzleModal({ puzzle, onClose }) {
  const size = Math.sqrt(puzzle.parts);
  const [pieces, setPieces] = useState(()=>Array.from({length:puzzle.parts},(_,i)=>i).sort(()=>Math.random()-0.5));
  const [dragging, setDragging] = useState(null);
  const [solved, setSolved] = useState(false);

  function checkSolved(ps) { return ps.every((p,i)=>p===i); }

  function drop(toIdx) {
    if (dragging===null) return;
    const np = [...pieces];
    [np[dragging], np[toIdx]] = [np[toIdx], np[dragging]];
    setPieces(np);
    setDragging(null);
    if (checkSolved(np)) setSolved(true);
  }

  // Each piece shows only its own slice of the image via background-position
  function pieceStyle(pieceIdx) {
    const row = Math.floor(pieceIdx / size);
    const col = pieceIdx % size;
    const bgPosX = size <= 1 ? 0 : (col / (size - 1)) * 100;
    const bgPosY = size <= 1 ? 0 : (row / (size - 1)) * 100;
    return {
      backgroundImage: `url(${puzzle.src})`,
      backgroundSize: `${size * 100}% ${size * 100}%`,
      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
      backgroundRepeat: "no-repeat",
    };
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:580 }} onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:16 }}>🧩 {puzzle.title}</h3>
        {solved && <div style={{ background:"#c0143c", color:"white", padding:"10px 16px", borderRadius:10, marginBottom:16, fontFamily:"'Dancing Script',cursive", fontSize:"1.3rem", textAlign:"center" }}>🎉 Tebrikler! Puzzle tamamlandı! 💕</div>}
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${size},1fr)`, gap:3, maxWidth:480, margin:"0 auto" }}>
          {pieces.map((pieceIdx, i) => (
            <div key={i} draggable
              onDragStart={e=>{e.dataTransfer.effectAllowed="move"; setDragging(i);}}
              onDragOver={e=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; }}
              onDrop={e=>{ e.preventDefault(); drop(i); }}
              onDragEnd={()=>setDragging(null)}
              style={{
                aspectRatio:"1",
                cursor:"grab",
                borderRadius:2,
                border: dragging===i ? "2px solid #c0143c" : "2px solid rgba(0,0,0,0.15)",
                transition:"border-color 0.2s, opacity 0.2s",
                opacity: dragging===i ? 0.5 : 1,
                ...pieceStyle(pieceIdx)
              }}
            />
          ))}
        </div>
        <div style={{ marginTop:14, textAlign:"center", display:"flex", gap:10, justifyContent:"center" }}>
          <button className="btn sm" onClick={()=>{setPieces(Array.from({length:puzzle.parts},(_,i)=>i).sort(()=>Math.random()-0.5));setSolved(false);}}>Karıştır</button>
          <button className="btn sm ghost" style={{ color:"#888", borderColor:"#ccc" }} onClick={()=>{setPieces(Array.from({length:puzzle.parts},(_,i)=>i));setSolved(true);}}>Çözümü Göster</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SETTINGS / ADMIN PANEL
══════════════════════════════════════════════════ */
function SettingsSection({ data, setData, users, setUsers, auth, addItem }) {
  const [title, setTitle]       = useState(data.meta.title);
  const [subtitle, setSub]      = useState(data.meta.subtitle);
  const [welcome, setWelcome]   = useState(data.meta.welcome);
  const [logo, setLogo]         = useState(data.meta.logo);
  const [bg1, setBg1]           = useState(data.meta.bgColor1 || "#ff5b6b");
  const [bg2, setBg2]           = useState(data.meta.bgColor2 || "#ff2d55");
  const [newEmail, setNE]       = useState("");
  const [newPass, setNP]        = useState("");
  const [newName, setNN]        = useState("");
  const [tab, setTab]           = useState("meta");

  function saveMeta() {
    setData(prev=>({ ...prev, meta:{ ...prev.meta, title, subtitle, welcome, logo, bgColor1:bg1, bgColor2:bg2 } }));
    alert("Kaydedildi ✓");
  }

  function addUser() {
    if (!newEmail||!newPass) { alert("E-posta ve şifre gir"); return; }
    if (users.find(u=>u.email===newEmail)) { alert("Bu e-posta zaten kayıtlı"); return; }
    const u = { id:uid(), email:newEmail, name:newName||newEmail.split("@")[0], hash:hashStr(newPass), isAdmin:false, active:true, createdAt:nowISO() };
    setUsers(prev=>[...prev,u]);
    alert("Kullanıcı eklendi ✓"); setNE(""); setNP(""); setNN("");
  }

  function removeUser(id) {
    if (!window.confirm("Silinsin mi?")) return;
    setUsers(prev=>prev.filter(u=>u.id!==id));
  }

  async function addMusic(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await fileToDataURL(f);
    addItem("music", { id:uid(), title:f.name.replace(/\.[^.]+$/,""), src:url, createdAt:nowISO() });
    alert("Müzik yüklendi ✓");
  }

  function backup() {
    const blob = new Blob([JSON.stringify({data, users},null,2)],{type:"application/json"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="lovesite-backup.json"; a.click();
  }

  function clearAllData() {
    if (!window.confirm("TÜM veriler silinecek! Emin misin?")) return;
    if (!window.confirm("Bu işlem geri alınamaz! Devam et?")) return;
    localStorage.clear();
    window.location.reload();
  }

  const tabs = [
    { key:"meta", label:"🎨 Site Ayarları" },
    { key:"users", label:"👤 Kullanıcılar" },
    { key:"music", label:"🎵 Müzik" },
    { key:"data", label:"💾 Veri" },
  ];

  return (
    <SectionWrap secKey="settings">
      <div className="section-header">
        <h2 className="section-title" style={{ color:"#505060" }}>⚙️ Ayarlar</h2>
      </div>

      {!auth.isAdmin && (
        <div style={{ background:"#fff3cd", border:"1px solid #ffc107", borderRadius:10, padding:"12px 16px", color:"#856404" }}>
          ⚠️ Bu bölümde sadece admin değişiklik yapabilir.
        </div>
      )}

      {auth.isAdmin && (
        <>
          <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
            {tabs.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{
                padding:"9px 18px", borderRadius:10, border:"none", cursor:"pointer",
                background:tab===t.key?"linear-gradient(135deg,#505060,#303048)":"white",
                color:tab===t.key?"white":"#555",
                fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem",
                boxShadow:"0 2px 8px rgba(0,0,0,0.07)"
              }}>{t.label}</button>
            ))}
          </div>

          {tab==="meta" && (
            <div className="card">
              <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:16 }}>Site Bilgileri</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div><label style={{ display:"block", marginBottom:6, fontSize:"0.85rem", color:"#888", textTransform:"uppercase", letterSpacing:"0.06em" }}>Site Başlığı</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} /></div>
                <div><label style={{ display:"block", marginBottom:6, fontSize:"0.85rem", color:"#888", textTransform:"uppercase", letterSpacing:"0.06em" }}>Alt Başlık</label><input className="input" value={subtitle} onChange={e=>setSub(e.target.value)} /></div>
                <div><label style={{ display:"block", marginBottom:6, fontSize:"0.85rem", color:"#888", textTransform:"uppercase", letterSpacing:"0.06em" }}>Karşılama Mesajı</label><input className="input" value={welcome} onChange={e=>setWelcome(e.target.value)} /></div>
                <div><label style={{ display:"block", marginBottom:6, fontSize:"0.85rem", color:"#888", textTransform:"uppercase", letterSpacing:"0.06em" }}>Logo Emoji</label><input className="input" value={logo} onChange={e=>setLogo(e.target.value)} style={{ fontSize:"1.4rem" }} /></div>
                <div>
                  <label style={{ display:"block", marginBottom:6, fontSize:"0.85rem", color:"#888", textTransform:"uppercase", letterSpacing:"0.06em" }}>Giriş Sayfası Renk 1</label>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <input type="color" value={bg1} onChange={e=>setBg1(e.target.value)} style={{ width:44, height:36, border:"none", borderRadius:6, cursor:"pointer" }} />
                    <input className="input" value={bg1} onChange={e=>setBg1(e.target.value)} style={{ flex:1 }} />
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", marginBottom:6, fontSize:"0.85rem", color:"#888", textTransform:"uppercase", letterSpacing:"0.06em" }}>Giriş Sayfası Renk 2</label>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <input type="color" value={bg2} onChange={e=>setBg2(e.target.value)} style={{ width:44, height:36, border:"none", borderRadius:6, cursor:"pointer" }} />
                    <input className="input" value={bg2} onChange={e=>setBg2(e.target.value)} style={{ flex:1 }} />
                  </div>
                </div>
              </div>
              <div style={{ marginTop:16, padding:"10px 16px", background:`linear-gradient(135deg,${bg1},${bg2})`, borderRadius:10, color:"white", fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", textAlign:"center" }}>
                {logo} Önizleme: {title}
              </div>
              <button className="btn" onClick={saveMeta} style={{ marginTop:16 }}>Kaydet</button>
            </div>
          )}

          {tab==="users" && (
            <div className="card">
              <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:16 }}>Kullanıcı Yönetimi</h3>
              <div style={{ marginBottom:20 }}>
                <h4 style={{ marginBottom:10, color:"#888" }}>Kayıtlı Kullanıcılar</h4>
                {users.map(u=>(
                  <div key={u.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#f9f5f7", borderRadius:10, marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:700 }}>{u.name} <span style={{ fontWeight:400, color:"#888", fontSize:"0.85rem" }}>({u.email})</span></div>
                      <div style={{ fontSize:"0.78rem", color:"#aaa" }}>{u.isAdmin ? "👑 Admin" : "👤 Kullanıcı"} · {fmtShort(u.createdAt)}</div>
                    </div>
                    {u.email!==auth.email && <button className="btn sm danger" onClick={()=>removeUser(u.id)}>Kaldır</button>}
                  </div>
                ))}
              </div>
              <div style={{ borderTop:"1px solid #f0e0e8", paddingTop:16 }}>
                <h4 style={{ marginBottom:12, color:"#888" }}>Yeni Kullanıcı Ekle</h4>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  <input className="input" placeholder="İsim" value={newName} onChange={e=>setNN(e.target.value)} />
                  <input className="input" type="email" placeholder="E-posta" value={newEmail} onChange={e=>setNE(e.target.value)} />
                  <input className="input" type="password" placeholder="Şifre" value={newPass} onChange={e=>setNP(e.target.value)} />
                </div>
                <button className="btn" onClick={addUser} style={{ marginTop:10 }}>Kullanıcı Ekle</button>
              </div>
            </div>
          )}

          {tab==="music" && (
            <div className="card">
              <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:16 }}>Arka Plan Müziği</h3>
              <div style={{ marginBottom:16 }}>
                {(data.music||[]).map(m=>(
                  <div key={m.id} style={{ padding:"10px 14px", background:"#f9f5f7", borderRadius:10, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>🎵 {m.title}</div>
                    <audio src={m.src} controls style={{ height:30 }} />
                  </div>
                ))}
              </div>
              <label style={{ display:"inline-block", padding:"10px 20px", background:"linear-gradient(135deg,#c0143c,#e8336d)", color:"white", borderRadius:10, cursor:"pointer", fontFamily:"'Cormorant Garamond',serif" }}>
                🎵 Müzik Dosyası Yükle
                <input type="file" accept="audio/*" style={{ display:"none" }} onChange={addMusic} />
              </label>
            </div>
          )}

          {tab==="data" && (
            <div className="card">
              <h3 style={{ fontFamily:"'Playfair Display',serif", marginBottom:16 }}>Veri Yönetimi</h3>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <button className="btn" onClick={backup} style={{ background:"linear-gradient(135deg,#2ecc71,#27ae60)" }}>💾 Yedek İndir</button>
                <button className="btn danger" onClick={clearAllData}>🗑️ Tüm Verileri Sil</button>
              </div>
              <div style={{ marginTop:16, padding:"12px 16px", background:"#fff3cd", borderRadius:10, fontSize:"0.9rem", color:"#856404" }}>
                ⚠️ Bu site tarayıcı localStorage kullanır. Veriler yalnızca bu cihazda saklanır. Paylaşmak için yedek indirip sevgiliye gönderebilirsin. Gerçek web'e açmadan önce sunucu tarafı kimlik doğrulama gereklidir.
              </div>
            </div>
          )}
        </>
      )}
    </SectionWrap>
  );
}

/* ══════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════ */
export default function App() {
  const [data, setData] = useState(() => {
    const stored = safeLoad(STORAGE_KEY, null);
    if (!stored) { safeSave(STORAGE_KEY, DEFAULT_DATA); return DEFAULT_DATA; }
    // Merge
    const merged = { ...DEFAULT_DATA, ...stored };
    merged.meta = { ...DEFAULT_DATA.meta, ...(stored.meta||{}) };
    merged.games = { ...DEFAULT_DATA.games, ...(stored.games||{}) };
    if (!Array.isArray(merged.videos)) merged.videos = [];
    if (!Array.isArray(merged.poems)) merged.poems = [];
    if (!Array.isArray(merged.letters)) merged.letters = [];
    if (!Array.isArray(merged.stories)) merged.stories = [];
    if (!Array.isArray(merged.photos)) merged.photos = [];
    if (!Array.isArray(merged.timeline)) merged.timeline = [];
    if (!Array.isArray(merged.drawings)) merged.drawings = [];
    if (!Array.isArray(merged.movies)) merged.movies = [];
    if (!Array.isArray(merged.music)) merged.music = [];
    if (!Array.isArray(merged.games.puzzle)) merged.games.puzzle = [];
    return merged;
  });

  const [users, setUsers] = useState(()=>safeLoad(USERS_KEY,[]));
  const [auth, setAuth]   = useState(()=>safeLoad(AUTH_KEY,{ email:null, isAdmin:false, name:"" }));
  const [section, setSection] = useState("home");
  const audioRef  = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Persist
  useEffect(()=>safeSave(STORAGE_KEY, data), [data]);
  useEffect(()=>safeSave(USERS_KEY, users), [users]);
  useEffect(()=>safeSave(AUTH_KEY, auth), [auth]);

  function registerOwner(email, pass, name) {
    if (users.find(u=>u.email===email)) return false;
    const u = { id:uid(), email, name:name||email.split("@")[0], hash:hashStr(pass), isAdmin:true, active:true, createdAt:nowISO() };
    const nu = [...users, u];
    setUsers(nu); safeSave(USERS_KEY, nu);
    setAuth({ email:u.email, isAdmin:true, name:u.name }); safeSave(AUTH_KEY, { email:u.email, isAdmin:true, name:u.name });
    return true;
  }

  function login(email, pass) {
    const u = users.find(x=>x.email===email);
    if (!u || u.hash!==hashStr(pass)) return false;
    const a = { email:u.email, isAdmin:!!u.isAdmin, name:u.name };
    setAuth(a); safeSave(AUTH_KEY, a);
    return true;
  }

  function logout() { setAuth({ email:null, isAdmin:false, name:"" }); setSection("home"); }

  // Persist setData wrapper
  const persistSet = useCallback((fn) => {
    setData(prev => {
      const next = typeof fn==="function" ? fn(prev) : fn;
      safeSave(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // addItem helper — supports dot paths like "games.puzzle"
  function addItem(path, item) {
    persistSet(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let cur = copy;
      for (let i=0;i<parts.length-1;i++) cur = cur[parts[i]];
      const key = parts[parts.length-1];
      if (!Array.isArray(cur[key])) cur[key]=[];
      cur[key].push(item);
      return copy;
    });
  }

  // updateItem — finds by id and merges
  function updateItem(path, id, patch) {
    persistSet(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let cur = copy;
      for (let i=0;i<parts.length-1;i++) cur = cur[parts[i]];
      const arr = cur[parts[parts.length-1]];
      const idx = arr.findIndex(x=>x.id===id);
      if (idx!==-1) arr[idx] = typeof patch==="object" ? patch : { ...arr[idx], ...patch };
      return copy;
    });
  }

  // deleteItem — no confirm dialog (blocks React updates), caller can confirm inline
  function deleteItem(path, id) {
    persistSet(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let cur = copy;
      for (let i=0;i<parts.length-1;i++) cur = cur[parts[i]];
      const key = parts[parts.length-1];
      cur[key] = (cur[key]||[]).filter(x=>x.id!==id);
      return copy;
    });
  }

  // Music
  function playRandom() {
    const music = data.music||[];
    if (!music.length) { alert("Henüz müzik yok. Ayarlar > Müzik'ten ekle."); return; }
    const s = music[Math.floor(Math.random()*music.length)].src;
    if (audioRef.current) { audioRef.current.src=s; audioRef.current.play().then(()=>setPlaying(true)).catch(()=>{}); }
  }
  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); } else { audioRef.current.play().then(()=>setPlaying(true)).catch(()=>{}); }
  }

  if (!auth.email) return (
    <>
      <GlobalStyle />
      <LoginScreen users={users} onLogin={login} onRegister={registerOwner} meta={data.meta} />
    </>
  );

  const props = { data, addItem, updateItem, deleteItem, auth, setData:persistSet, users, setUsers };

  return (
    <>
      <GlobalStyle />
      <PetalBg />
      <audio ref={audioRef} onEnded={playRandom} />
      <Header meta={data.meta} auth={auth} onLogout={logout} playing={playing} onPlayToggle={togglePlay} onPlayRandom={playRandom} setSection={setSection} currentSection={section} />
      <main style={{ position:"relative", zIndex:1 }}>
        {section==="home"     && <div className="section-wrap"><HomeGrid meta={data.meta} setSection={setSection} /></div>}
        {section==="videos"   && <VideosSection   {...props} />}
        {section==="poems"    && <PoemsSection    {...props} />}
        {section==="letters"  && <LettersSection  {...props} />}
        {section==="stories"  && <StoriesSection  {...props} />}
        {section==="photos"   && <PhotosSection   {...props} />}
        {section==="timeline" && <TimelineSection {...props} />}
        {section==="movies"   && <MoviesSection   {...props} />}
        {section==="games"    && <GamesSection    {...props} />}
        {section==="puzzle"   && <PuzzleSection   {...props} />}
        {section==="settings" && <SettingsSection {...props} />}
      </main>
      <footer style={{ textAlign:"center", padding:"28px 20px", color:"#bbb", fontSize:"0.82rem", borderTop:"1px solid #f0e8ec", marginTop:40, background:"#fff8f9", position:"relative", zIndex:1 }}>
        <span style={{ fontFamily:"'Dancing Script',cursive", fontSize:"1.1rem", color:"#e8336d" }}>Seni seviyorum 💕</span>
        <span style={{ display:"block", marginTop:4 }}>Bu site sadece senin için yapıldı.</span>
      </footer>
    </>
  );
}
