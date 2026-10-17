/* Pinned subject: an AI control room for honest, provider-agnostic creation. Plan: deep ink canvas, warm signal orange, compact command layout, one-screen demo that makes provider choice feel tangible without pretending paid APIs are magically free. */
import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bot, Check, ChevronDown, CircleHelp, Image, Layers3, Menu, Paperclip, Play, Plus, Send, Settings2, Sparkles, Video, WandSparkles, X, Zap } from "lucide-react";
import "./styles.css";

const providers = {
  chat: [
    { name: "OpenAI", provider: "openai", model: "gpt-4o-mini", badge: "LIVE", color: "orange", logo: "◉" },
    { name: "OpenRouter", provider: "openrouter", model: "openai/gpt-4o-mini", badge: "ROUTE", color: "lilac", logo: "◆" },
    { name: "Groq", provider: "groq", model: "llama-3.3-70b-versatile", badge: "FAST", color: "lime", logo: "G" },
  ],
  image: [
    { name: "OpenAI Images", provider: "openai", model: "gpt-image-1", badge: "READY", color: "orange", logo: "◉" },
    { name: "Replicate", model: "flux-1.1-pro", badge: "STYLE", color: "lime" },
  ],
  video: [
    { name: "Video workspace", provider: "demo", model: "video-preview", badge: "LOCAL", color: "blue", logo: "▶" },
  ],
};

const starter = [
  { role: "assistant", text: "Hey. I’m your model-agnostic copilot. Pick a provider, describe the work, and keep the keys on the server.", time: "12:41" },
  { role: "user", text: "Give me a sharp launch concept for a tiny AI studio.", time: "12:42" },
  { role: "assistant", text: "Make the model switcher the product: one calm room for many engines. No vendor lock-in, no fake promises, just the right tool for the job.", time: "12:42" },
];

function ProviderPicker({ kind, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const options = providers[kind];
  const current = options.find((item) => item.model === selected) || options[0];
  return <div className="picker-wrap">
    <button className="picker" onClick={() => setOpen(!open)}>
      <span className={`provider-mark ${current.color}`}>{current.logo || <Sparkles size={15} />}</span>
      <span><strong>{current.name}</strong><small>{current.model}</small></span>
      <ChevronDown size={16} className={open ? "rotate" : ""} />
    </button>
    {open && <div className="picker-menu">{options.map((item) => <button key={item.model} onClick={() => { onChange(item.model); setOpen(false); }} className="picker-option">
      <span className={`provider-mark ${item.color}`}>{item.logo || <Sparkles size={14} />}</span><span><strong>{item.name}</strong><small>{item.model}</small></span><em>{item.badge}</em>{current.model === item.model && <Check size={15} />}
    </button>)}</div>}
  </div>;
}

export default function App() {
  const [mode, setMode] = useState("chat");
  const [models, setModels] = useState({ chat: "gpt-4o-mini", image: "gpt-image-1", video: "video-preview" });
  const [messages, setMessages] = useState(starter);
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const fileRef = useRef(null);
  const current = useMemo(() => providers[mode].find((p) => p.model === models[mode]) || providers[mode][0], [mode, models]);

  const pickFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttachment({ name: file.name, url: URL.createObjectURL(file), type: file.type.startsWith("video") ? "video" : "image" });
  };

  const run = async () => {
    if (!prompt.trim()) return;
    const text = prompt.trim();
    setPrompt(""); setRunning(true);
    setMessages((m) => [...m, { role: "user", text, time: "now", attachment }]);
    if (mode !== "chat") {
      setTimeout(() => { setRunning(false); setMessages((m) => [...m, { role: "assistant", text: `${mode === "image" ? "Image" : "Video"} brief saved locally. Connect a provider adapter to render it.`, time: "now" }]); }, 700);
      return;
    }
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: current.provider, model: current.model, messages: [...messages, { role: "user", content: text }].map((m) => ({ role: m.role, content: m.content || m.text })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setMessages((m) => [...m, { role: "assistant", text: data.message?.content || "The provider returned an empty response.", time: "now" }]);
    } catch (error) {
      setMessages((m) => [...m, { role: "assistant", text: `Couldn’t reach ${current.name}: ${error.message}`, time: "now" }]);
    } finally { setRunning(false); setAttachment(null); }
  };

  return <main className="shell">
    <button className="mobile-menu" onClick={() => setShowMenu(!showMenu)}><Menu size={20}/></button>
    <aside className={`sidebar ${showMenu ? "drawer-open" : ""}`}>
      <div className="brand"><div className="brand-orb"><Sparkles size={18} /></div><span>orbit<span className="accent">/</span>studio</span></div>
      <div className="workspace"><span className="avatar">T</span><span><b>Tgfrr’s Workspace</b><small>Personal space</small></span><ChevronDown size={15} /></div>
      <nav><p className="nav-label">WORKSPACE</p><button className="nav-item active"><Layers3 size={17} /> Playground <span className="nav-count">1</span></button><button className="nav-item"><Sparkles size={17} /> Templates</button><button className="nav-item"><Zap size={17} /> Usage & keys</button><p className="nav-label second">PROJECTS</p><button className="project"><span className="dot orange-dot" />Launch film</button><button className="project"><span className="dot lilac-dot" />Brand system</button><button className="new-project"><Plus size={16} /> New project</button></nav>
      <div className="sidebar-bottom"><button className="nav-item" onClick={() => setShowSettings(true)}><Settings2 size={17} /> Settings</button><button className="nav-item" onClick={() => setShowHelp(true)}><CircleHelp size={17} /> Help center</button><div className="status"><span className="live-dot" /> Server boundary online</div></div>
    </aside>

    <section className="content">
      <header className="topbar"><button className="mobile-menu"><Menu size={20}/></button><div><p className="eyebrow">PLAYGROUND <span>/</span> NEW SESSION</p><h1>Make something <i>unreasonably good.</i></h1></div><div className="top-actions"><button className="icon-btn" onClick={() => setShowHelp(true)}><CircleHelp size={18} /></button><button className="user-chip"><span className="avatar small">T</span><ChevronDown size={14}/></button></div></header>
      <div className="canvas">
        <div className="mode-row"><div className="mode-tabs">{[["chat", Bot, "Chat"],["image", Image, "Image"],["video", Video, "Video"]].map(([key, Icon, label]) => <button key={key} onClick={() => setMode(key)} className={mode === key ? "mode active-mode" : "mode"}><Icon size={17} />{label}</button>)}</div><div className="session-meta"><span className="green-pip" />Auto-save on <span className="divider" /> <span>0 credits used</span></div></div>
        <div className="workbench">
          <div className="panel-head"><div><span className="panel-kicker">{mode === "chat" ? "CONVERSATION" : mode === "image" ? "IMAGE LAB" : "MOTION LAB"}</span><h2>{mode === "chat" ? "Open canvas" : mode === "image" ? "Describe your frame" : "Direct your shot"}</h2></div><ProviderPicker kind={mode} selected={models[mode]} onChange={(value) => setModels({ ...models, [mode]: value })} /></div>
          <div className="messages">
            {mode === "chat" ? messages.map((msg, i) => <div className={`message ${msg.role}`} key={i}><div className="message-avatar">{msg.role === "assistant" ? <Sparkles size={15} /> : "T"}</div><div className="message-body"><div className="message-meta"><b>{msg.role === "assistant" ? "Orbit" : "You"}</b><span>{msg.time}</span></div><p>{msg.text}</p>{msg.attachment && <div className="attachment-preview">{msg.attachment.type === "video" ? <video src={msg.attachment.url} controls /> : <img src={msg.attachment.url} alt="Attached reference" />}</div>}</div></div>) : <div className="empty-state"><div className="empty-icon">{mode === "image" ? <WandSparkles size={29} /> : <Play size={29} />}</div><h3>{mode === "image" ? "A blank frame is a good start." : "Motion starts with a sentence."}</h3><p>{mode === "image" ? "Describe the scene, mood, and details you want to see." : "Write a shot, a feeling, or a tiny story. We’ll shape it."}</p></div>}
            {running && <div className="typing"><span></span><span></span><span></span><small>Orbit is thinking</small></div>}
          </div>
          <div className="composer">{attachment && <div className="attachment-chip"><Paperclip size={14} />{attachment.name}<button onClick={() => setAttachment(null)}><X size={13}/></button></div>}<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); } }} placeholder={mode === "chat" ? "Ask anything..." : mode === "image" ? "A neon-lit reading room on Mars..." : "A slow push-in through a quiet forest..."} rows="2" /><div className="composer-bottom"><div className="composer-tools"><button onClick={() => fileRef.current?.click()}><Paperclip size={16} /> Attach</button><input ref={fileRef} type="file" hidden accept="image/*,video/*" onChange={pickFile}/><span className="model-note"><span className={`provider-mark mini ${current.color}`}>{current.logo || <Sparkles size={10}/>}</span>{current.model}</span></div><button className="send" onClick={run} disabled={running || !prompt.trim()}>{running ? "Running" : "Run"}<Send size={15} /></button></div></div>
          <p className="disclaimer">Orbit is a control room, not a magic bypass. Provider access and usage limits still apply.</p>
        </div>
        <div className="lower-grid"><div className="feature-card orange-card"><div><span className="card-label">THE GOOD STUFF</span><h3>One room.<br/><i>Every engine.</i></h3><p>Switch models without rebuilding your workflow.</p></div><ArrowUpRight size={21} /></div><div className="feature-card dark-card"><div><span className="card-label">YOUR KEYS STAY YOURS</span><h3>Private by<br/><i>default.</i></h3><p>Secrets live server-side, never in the browser.</p></div><div className="key-shape"><span/><span/><span/></div></div></div>
      </div>
    </section>
    {showHelp && <div className="modal-backdrop" onClick={() => setShowHelp(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setShowHelp(false)}><X size={17}/></button><div className="modal-icon"><CircleHelp size={20}/></div><h2>Ship it honestly.</h2><p>Chat is live when a provider key is configured. Image and video attachments preview locally and are ready for provider adapters.</p><button className="modal-action" onClick={() => setShowHelp(false)}>Got it</button></div></div>}
    {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setShowSettings(false)}><X size={17}/></button><div className="modal-icon"><Settings2 size={20}/></div><h2>Workspace settings</h2><p>Add <code>OPENAI_API_KEY</code>, <code>OPENROUTER_API_KEY</code>, or <code>GROQ_API_KEY</code> in Railway Variables, then redeploy.</p><div className="setting-row"><span>Server routing</span><b>ON</b></div><div className="setting-row"><span>Local attachments</span><b>ON</b></div><button className="modal-action" onClick={() => setShowSettings(false)}>Done</button></div></div>}
  </main>;
}
