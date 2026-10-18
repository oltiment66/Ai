/* Subject: AI FREE Telegram Mini App dashboard. Plan: a dark orbital control room with a 3D-like command core, compact Persian-first navigation, and live provider/model states. */
import { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Boxes, ChevronLeft, ChevronRight, CircleDot, Cpu, Gauge, KeyRound, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Plus, Power, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Terminal, Video, WandSparkles, X } from 'lucide-react';
import './styles.css';

const folders = [
  { name: 'همه مدل‌ها', icon: '✦', count: 24 },
  { name: 'ChatGPT', icon: '🤖', count: 8 },
  { name: 'Claude', icon: '🟠', count: 5 },
  { name: 'Gemini', icon: '♊', count: 4 },
  { name: 'DeepSeek', icon: '🐋', count: 3 },
];
const models = [
  { name: 'claude-opus-4.7', folder: 'Claude', type: 'Chat', state: 'online', speed: '1.2s', usage: '84%' },
  { name: 'gpt-6-luna:free', folder: 'ChatGPT', type: 'Chat', state: 'online', speed: '0.8s', usage: '62%' },
  { name: 'gemini-3.1-pro', folder: 'Gemini', type: 'Vision', state: 'online', speed: '1.5s', usage: '48%' },
  { name: 'deepseek-v4-flash:free', folder: 'DeepSeek', type: 'Chat', state: 'warning', speed: '2.1s', usage: '91%' },
];

function Orb({ label, value, color, icon: Icon }) { return <div className="orb-wrap"><div className="orb" style={{'--orb':color}}><Icon size={24}/><b>{value}</b></div><span>{label}</span></div> }
function Status({ state }) { return <span className={`status ${state}`}><CircleDot size={12}/>{state === 'online' ? 'آنلاین' : 'نیازمند بررسی'}</span> }

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [folder, setFolder] = useState('همه مدل‌ها');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState('');
  const [api, setApi] = useState({ connected: false, models: [], providers: [] });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const API_URL = window.__AI_FREE_API_URL__ || '';
  useEffect(() => {
    const init = window.Telegram?.WebApp?.initData || '';
    window.Telegram?.WebApp?.ready?.();
    fetch(`${API_URL}/api/bootstrap`, { headers: { 'X-Telegram-Init-Data': init } })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Mini App احراز هویت نشد')))
      .then(data => setApi({ connected: true, ...data }))
      .catch(() => setApi({ connected: false, models: [], providers: [] }));
  }, [API_URL]);
  const sendChat = async () => {
    if (!chatText.trim()) return;
    const message = chatText.trim(); setChatText('');
    setChatMessages(items => [...items, { role: 'user', content: message }]);
    const model = api.models.find(m => m.section === 'chat') || models[0];
    if (!api.connected || !model?.id) { setChatMessages(items => [...items, { role: 'assistant', content: 'برای چت واقعی، Mini App را با API_URL ربات و Telegram باز کن.' }]); return; }
    try {
      const init = window.Telegram?.WebApp?.initData || '';
      const r = await fetch(`${API_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': init }, body: JSON.stringify({ model: model.id, message }) });
      const data = await r.json();
      setChatMessages(items => [...items, { role: 'assistant', content: data.answer || data.error || 'پاسخ دریافت نشد' }]);
    } catch { setChatMessages(items => [...items, { role: 'assistant', content: 'اتصال به ربات برقرار نشد.' }]); }
  };
  const filtered = useMemo(() => models.filter(m => (folder === 'همه مدل‌ها' || m.folder === folder) && m.name.toLowerCase().includes(search.toLowerCase())), [folder, search]);
  const notify = (t) => { setToast(t); setTimeout(() => setToast(''), 2200); };
  return <div className="app" dir="rtl">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={20}/></div><div><strong>AI FREE</strong><small>mini command</small></div></div>
      <nav>
        {[['dashboard','داشبورد',LayoutDashboard],['models','مدل‌ها',Boxes],['providers','سرویس‌ها',Activity],['chat','چت هوشمند',MessageSquare],['settings','تنظیمات',Settings2]].map(([id,label,Icon]) => <button key={id} className={active===id?'nav-item active':'nav-item'} onClick={() => setActive(id)}><Icon size={18}/><span>{label}</span>{id==='models'&&<em>24</em>}</button>)}
      </nav>
      <div className="side-bottom"><div className="bot-card"><div className="pulse"><Bot size={20}/></div><div><b>ربات متصل است</b><small>@ai_free_bot</small></div><span className="live-dot"/></div><button className="rail-btn" onClick={()=>notify('اتصال ربات فعال است')}><Power size={15}/> اتصال زنده</button></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu"><Menu size={20}/></button><div className="crumb"><span>AI FREE</span><ChevronLeft size={16}/><b>{active==='dashboard'?'مرکز فرمان':active==='models'?'مدیریت مدل‌ها':active==='providers'?'سرویس‌ها':'تنظیمات'}</b></div><div className="top-actions"><button onClick={()=>notify('همه سیستم‌ها پایدار هستند')}><ShieldCheck size={17}/> سلامت سیستم</button><div className="avatar">G</div></div></header>
      {active==='dashboard' && <>
        <section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="spark-dot"/> مرکز فرمان ربات</span><h1>همه مدل‌ها،<br/><i>یک‌جا و زنده.</i></h1><p>اتصال، تست و مدیریت مدل‌های هوش مصنوعی رباتت از یک پنل سریع و تمیز.</p><div className="hero-actions"><button className="primary" onClick={()=>setActive('models')}><Boxes size={17}/> مدیریت مدل‌ها</button><button className="ghost" onClick={()=>notify('در حال بررسی سلامت سرویس‌ها...')}><RefreshCw size={16}/> تست همه سرویس‌ها</button></div></div><div className="reactor"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="core"><Sparkles size={36}/><small>BOT CORE</small></div><span className="reactor-tag tag-a">24 مدل فعال</span><span className="reactor-tag tag-b">99.8% uptime</span></div></section>
        <section className="stats"><Orb label="درخواست امروز" value="1,284" color="#9b5c1c" icon={Activity}/><Orb label="مدل‌های فعال" value="24" color="#6a7d3a" icon={Cpu}/><Orb label="سرویس‌های آنلاین" value="05" color="#b9893e" icon={ShieldCheck}/><Orb label="زمان پاسخ میانگین" value="1.4s" color="#7e6651" icon={Gauge}/></section>
        <section className="section-head"><div><span className="eyebrow">LIVE MATRIX</span><h2>مدل‌های فعال</h2></div><button className="text-btn" onClick={()=>setActive('models')}>مشاهده همه <ChevronLeft size={16}/></button></section>
        <div className="model-grid">{models.slice(0,3).map((m,i)=><article className="model-card" key={m.name}><div className="card-top"><div className="model-icon">{i===0?'🟠':i===1?'🤖':'♊'}</div><Status state={m.state}/><button className="dots" onClick={()=>notify('منوی مدل باز شد')}><MoreHorizontal size={18}/></button></div><h3>{m.name}</h3><p>{m.folder} <span>·</span> {m.type}</p><div className="meter"><div style={{width:m.usage}}/></div><div className="card-meta"><span>مصرف این ماه <b>{m.usage}</b></span><span><Activity size={13}/> {m.speed}</span></div></article>)}</div>
      </>}
      {active==='models' && <section className="page"><div className="page-title"><div><span className="eyebrow">MODEL LIBRARY</span><h1>کتابخانه مدل‌ها</h1><p>مدل‌ها را مثل پوشه‌های ربات مرتب و آماده نگه دار.</p></div><button className="primary" onClick={()=>setShowAdd(true)}><Plus size={17}/> افزودن مدل</button></div><div className="toolbar"><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جستجوی مدل..."/></div><div className="folder-pills">{folders.map(f=><button key={f.name} className={folder===f.name?'pill active':'pill'} onClick={()=>setFolder(f.name)}>{f.icon} {f.name} <small>{f.count}</small></button>)}</div></div><div className="table-card"><div className="table-head"><span>مدل</span><span>پوشه</span><span>وضعیت</span><span>سرعت</span><span>مصرف</span><span/></div>{filtered.map(m=><div className="table-row" key={m.name}><div className="model-name"><span className="mini-icon">{m.folder==='Claude'?'🟠':m.folder==='Gemini'?'♊':m.folder==='DeepSeek'?'🐋':'🤖'}</span><b>{m.name}</b></div><span className="folder-label">{m.folder}</span><Status state={m.state}/><span className="mono">{m.speed}</span><div className="row-meter"><div style={{width:m.usage}}/></div><button className="dots" onClick={()=>notify(`تنظیمات ${m.name}`)}><MoreHorizontal size={18}/></button></div>)}</div><div className="pager"><button><ChevronRight size={16}/> قبلی</button><span>صفحه ۱ از ۳</span><button onClick={()=>notify('صفحه بعد آماده است')}>بعدی <ChevronLeft size={16}/></button></div></section>}
      {active==='providers' && <section className="page"><div className="page-title"><div><span className="eyebrow">API NETWORK</span><h1>شبکه سرویس‌ها</h1><p>کلیدها امن، وضعیت‌ها زنده، کنترل کامل.</p></div><button className="primary" onClick={()=>setShowAdd(true)}><Plus size={17}/> افزودن سرویس</button></div><div className="provider-grid">{['UnoRouter','OpenAI','Pollinations','BytePlus','OpenRouter'].map((p,i)=><div className="provider" key={p}><div className="provider-logo">{['⚡','◉','✦','◈','◌'][i]}</div><div><h3>{p}</h3><small>https://api.{p.toLowerCase()}.com/v1</small></div><Status state={i===3?'warning':'online'}/><button className="dots"><MoreHorizontal size={18}/></button></div>)}</div></section>}
      {active==='chat' && <section className="page"><div className="chat-shell"><div className="chat-head"><div className="model-icon">🤖</div><div><b>چت هوشمند</b><small>gpt-6-luna:free · آنلاین</small></div><span className="live-dot"/></div><div className="messages">{chatMessages.length===0 && <div className="msg bot">سلام Gikk، مرکز فرمان آماده‌ست. پیام بفرست تا از مدل واقعی ربات پاسخ بگیری.<small>{api.connected?'متصل':'در انتظار اتصال'}</small></div>}{chatMessages.map((m,i)=><div className={`msg ${m.role==='user'?'user':'bot'}`} key={i}>{m.content}<small>{m.role==='user'?'شما':'AI FREE'}</small></div>)}</div><div className="chat-input"><input value={chatText} onChange={e=>setChatText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="پیامت را بنویس..."/><button onClick={sendChat}><ChevronLeft size={18}/></button></div></div></section>}
      {active==='settings' && <section className="page"><div className="page-title"><div><span className="eyebrow">CONTROL ROOM</span><h1>تنظیمات ربات</h1><p>تنظیمات مهم ربات را بدون دست‌زدن به کد کنترل کن.</p></div></div><div className="settings-grid">{[['حالت تعمیر','ربات موقتاً برای کاربران غیرفعال شود.'],['تایید دستی کاربران','کاربر جدید قبل از استفاده تایید شود.'],['ثبت لاگ کامل','گزارش دقیق درخواست‌ها ذخیره شود.']].map(([t,d],i)=><div className="setting" key={t}><div><b>{t}</b><p>{d}</p></div><button className={i===0?'toggle':'toggle on'} onClick={()=>notify(`${t} تغییر کرد`)}><span/></button></div>)}</div></section>}
    </main>
    {showAdd && <div className="modal-backdrop" onClick={()=>setShowAdd(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowAdd(false)}><X size={18}/></button><span className="eyebrow">NEW CONNECTION</span><h2>اتصال جدید</h2><p>سرویس یا مدل جدید را به مرکز فرمان اضافه کن.</p><label>نام سرویس<input placeholder="مثلاً My AI"/></label><label>Base URL<input placeholder="https://api.example.com/v1"/></label><button className="primary full" onClick={()=>{setShowAdd(false);notify('اتصال ذخیره شد')}}><KeyRound size={16}/> ذخیره اتصال</button></div></div>}
    {toast && <div className="toast"><ShieldCheck size={16}/>{toast}</div>}
  </div>
}
