import { useState, useMemo, useCallback, useEffect, useRef } from "react";

const INSTRUCTORS = [
  { id: "INS-1", name: "Kelly Snailum", title: "Owner & Master Trainer", color: "#C4704B", specialties: ["Reformer", "Mat", "Barre", "Private", "Teacher Training", "TRX"] },
  { id: "INS-2", name: "Megan Torres", title: "Lead Reformer Instructor", color: "#6B8F71", specialties: ["Reformer", "Reformer + Cardio", "Private", "Prenatal"] },
  { id: "INS-3", name: "Danielle Park", title: "Barre & TRX Specialist", color: "#8B6B94", specialties: ["Barre", "TRX Fusion", "Barre Burn", "Group Apparatus"] },
  { id: "INS-4", name: "Rachel Kim", title: "Pilates Instructor", color: "#5B7B8F", specialties: ["Mat", "Reformer", "Stretch & Restore", "Youth"] },
  { id: "INS-5", name: "Ava Mitchell", title: "Pilates Instructor", color: "#A68B6B", specialties: ["Reformer", "Mat", "Barre", "Private"] },
  { id: "INS-6", name: "Jordan Reeves", title: "Teacher Training Lead", color: "#B85C38", specialties: ["Teacher Training", "Reformer", "Group Apparatus", "Mat"] },
];

const CLASS_TYPES = ["Reformer", "Mat", "Barre", "TRX Fusion", "Barre Burn", "Stretch & Restore", "Reformer + Cardio", "Group Apparatus"];
const DURATIONS = [15, 20, 30, 45, 60];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const FOCUS_AREAS = ["Core", "Full Body", "Lower Body", "Upper Body", "Flexibility", "Strength", "Balance", "Recovery"];

function generateClasses() {
  const titles = [
    { name: "Power Reformer Flow", type: "Reformer", dur: 45, level: "Intermediate", focus: "Full Body", equip: "Reformer", ins: "INS-1" },
    { name: "Morning Mat Energizer", type: "Mat", dur: 30, level: "All Levels", focus: "Core", equip: "Mat Only", ins: "INS-4" },
    { name: "Barre Sculpt & Burn", type: "Barre", dur: 45, level: "Intermediate", focus: "Lower Body", equip: "Barre", ins: "INS-3" },
    { name: "Gentle Stretch & Restore", type: "Stretch & Restore", dur: 30, level: "Beginner", focus: "Recovery", equip: "Foam Roller", ins: "INS-4" },
    { name: "Advanced Reformer Challenge", type: "Reformer", dur: 60, level: "Advanced", focus: "Strength", equip: "Reformer", ins: "INS-1" },
    { name: "TRX Fusion Blast", type: "TRX Fusion", dur: 45, level: "Intermediate", focus: "Full Body", equip: "TRX", ins: "INS-3" },
    { name: "Prenatal Pilates Flow", type: "Mat", dur: 30, level: "Beginner", focus: "Core", equip: "Mat Only", ins: "INS-2" },
    { name: "Reformer + Cardio Torch", type: "Reformer + Cardio", dur: 45, level: "Intermediate", focus: "Full Body", equip: "Reformer", ins: "INS-2" },
    { name: "Barre Burn Express", type: "Barre Burn", dur: 20, level: "All Levels", focus: "Lower Body", equip: "Barre", ins: "INS-3" },
    { name: "Core Foundations", type: "Mat", dur: 30, level: "Beginner", focus: "Core", equip: "Mat Only", ins: "INS-5" },
    { name: "Reformer Basics 101", type: "Reformer", dur: 45, level: "Beginner", focus: "Full Body", equip: "Reformer", ins: "INS-5" },
    { name: "Kelly's Signature Flow", type: "Reformer", dur: 60, level: "Advanced", focus: "Strength", equip: "Reformer", ins: "INS-1" },
    { name: "Upper Body Sculpt", type: "Mat", dur: 30, level: "Intermediate", focus: "Upper Body", equip: "Resistance Band", ins: "INS-6" },
    { name: "Balance & Stability", type: "Mat", dur: 30, level: "All Levels", focus: "Balance", equip: "Magic Circle", ins: "INS-4" },
    { name: "Group Apparatus Intro", type: "Group Apparatus", dur: 45, level: "Beginner", focus: "Full Body", equip: "Reformer", ins: "INS-6" },
    { name: "Flexibility Deep Dive", type: "Stretch & Restore", dur: 45, level: "All Levels", focus: "Flexibility", equip: "Foam Roller", ins: "INS-4" },
    { name: "Power Barre Intervals", type: "Barre Burn", dur: 30, level: "Advanced", focus: "Strength", equip: "Barre", ins: "INS-3" },
    { name: "Reformer for Runners", type: "Reformer", dur: 45, level: "Intermediate", focus: "Lower Body", equip: "Reformer", ins: "INS-2" },
    { name: "15-Min Core Ignite", type: "Mat", dur: 15, level: "All Levels", focus: "Core", equip: "No Equipment", ins: "INS-1" },
    { name: "Evening Wind Down", type: "Stretch & Restore", dur: 20, level: "Beginner", focus: "Recovery", equip: "No Equipment", ins: "INS-5" },
    { name: "Reformer Cardio Blast", type: "Reformer + Cardio", dur: 30, level: "Advanced", focus: "Full Body", equip: "Reformer", ins: "INS-2" },
    { name: "Barre Basics", type: "Barre", dur: 30, level: "Beginner", focus: "Lower Body", equip: "Barre", ins: "INS-3" },
    { name: "Mat Power Series", type: "Mat", dur: 45, level: "Advanced", focus: "Strength", equip: "Mat Only", ins: "INS-6" },
    { name: "Posture Reset", type: "Mat", dur: 20, level: "All Levels", focus: "Balance", equip: "No Equipment", ins: "INS-4" },
  ];
  return titles.map((t, i) => {
    const pub = new Date(); pub.setDate(pub.getDate() - Math.floor(Math.random() * 90));
    return { id: `VOD-${String(i + 1).padStart(3, "0")}`, title: t.name, classType: t.type, duration: t.dur, level: t.level, focusArea: t.focus, equipment: t.equip, instructorId: t.ins, description: `A ${t.dur}-minute ${t.level.toLowerCase()} ${t.type.toLowerCase()} class focusing on ${t.focus.toLowerCase()}. ${t.dur >= 45 ? "Includes warm-up, main sequence, and cool-down." : "Quick and effective."}`, views: Math.floor(Math.random() * 800) + 50, rating: +(3.5 + Math.random() * 1.5).toFixed(1), ratingCount: Math.floor(Math.random() * 60) + 5, publishedAt: pub.toISOString(), thumbnail: null, playbackId: `mux-placeholder-${i + 1}`, tags: [t.type, t.focus, t.level], isFeatured: i < 4, completions: Math.floor(Math.random() * 400) + 20, calories: Math.floor(t.dur * (t.type.includes("Cardio") || t.type.includes("Burn") ? 8.5 : t.type === "Stretch & Restore" ? 3.5 : 6.2)) };
  });
}

const COLLECTIONS = [
  { id: "COL-1", name: "30-Day Reformer Challenge", description: "Progressive reformer series from foundations to advanced flows", classIds: ["VOD-001", "VOD-011", "VOD-005", "VOD-012"], icon: "\u{1F525}", color: "#C4704B" },
  { id: "COL-2", name: "Post-Pregnancy Recovery", description: "Gentle return to movement with prenatal-certified instruction", classIds: ["VOD-007", "VOD-004", "VOD-010", "VOD-016"], icon: "\u{1F338}", color: "#C47B8E" },
  { id: "COL-3", name: "Lunch Break Express", description: "15-30 minute classes perfect for midday movement breaks", classIds: ["VOD-019", "VOD-024", "VOD-020", "VOD-009"], icon: "\u26A1", color: "#5B7B8F" },
  { id: "COL-4", name: "Kelly's Favorites", description: "Hand-picked by our founder for the ultimate Pilates experience", classIds: ["VOD-001", "VOD-012", "VOD-005", "VOD-019"], icon: "\u2B50", color: "#A68B6B" },
];

const PLANS = [
  { id: "digital-monthly", name: "Digital Monthly", price: 19, interval: "month", features: ["Full on-demand library", "New classes weekly", "Progress tracking", "Mobile & desktop"] },
  { id: "digital-annual", name: "Digital Annual", price: 179, interval: "year", features: ["Everything in Monthly", "Save $49/year", "Early access to new content", "Exclusive collections"], badge: "Best Value" },
  { id: "hybrid-addon", name: "Hybrid Add-on", price: 9, interval: "month", features: ["For existing studio members", "Unlimited on-demand", "Syncs with in-studio progress", "Fatigue tracking integration"] },
];

const ACCENT = "#C4704B";
const ACCENT_LIGHT = "#FDF5F0";
const FONT = "'Outfit', sans-serif";
const DISPLAY = "'Playfair Display', serif";
const MONO = "'JetBrains Mono', monospace";
const CARD_BG = "rgba(255,255,255,0.72)";
const CARD_BORDER = "rgba(255,255,255,0.6)";

const s = {
  pill: { border: "none", borderRadius: 100, cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 500, padding: "8px 18px", transition: "all 0.2s" },
  card: { background: CARD_BG, backdropFilter: "blur(20px)", border: `1px solid ${CARD_BORDER}`, borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)" },
  label: { fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999" },
};

const PlayIcon = ({ size = 20, color = "#fff" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z" /></svg>);
const ClockIcon = ({ size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const StarIcon = ({ size = 14, filled = true }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>);
const FilterIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>);
const GridIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>);
const ListIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>);
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const ChevronLeft = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>);
const HeartIcon = ({ filled }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#DC2626" : "none"} stroke={filled ? "#DC2626" : "currentColor"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>);
const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>);
const UploadIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>);

function ClassThumbnail({ classData, instructor, size = "large" }) {
  const colors = [["#C4704B","#E8A87C"],["#6B8F71","#A3C4A8"],["#8B6B94","#BEA4C8"],["#5B7B8F","#94B8CC"],["#A68B6B","#D4C4A8"],["#B85C38","#E09070"]];
  const idx = parseInt(classData.id.replace("VOD-", "")) % colors.length;
  const [c1, c2] = colors[idx];
  const h = size === "large" ? 200 : size === "medium" ? 160 : 120;
  return (
    <div style={{ height: h, borderRadius: size === "large" ? "12px 12px 0 0" : 12, background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.12 }}><div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", border: "2px solid #fff", top: -60, right: -40 }} /><div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: "2px solid #fff", bottom: -30, left: -20 }} /></div>
      <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "3px 8px", borderRadius: 6, fontFamily: MONO, fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 4 }}><ClockIcon size={11} /> {classData.duration} min</div>
      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.2)", color: "#fff", padding: "3px 8px", borderRadius: 6, fontFamily: MONO, fontSize: 10, fontWeight: 600, backdropFilter: "blur(4px)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{classData.level}</div>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.4)", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}><PlayIcon size={24} /></div>
      {instructor && (<div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: instructor.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FONT, fontSize: 11, fontWeight: 700, border: "2px solid rgba(255,255,255,0.5)" }}>{instructor.name.split(" ").map(n => n[0]).join("")}</div><span style={{ color: "#fff", fontFamily: FONT, fontSize: 12, fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>{instructor.name.split(" ")[0]}</span></div>)}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (<button onClick={onClick} style={{ ...s.pill, background: active ? ACCENT : "rgba(0,0,0,0.04)", color: active ? "#fff" : "#555", fontSize: 12, padding: "6px 14px", boxShadow: active ? `0 2px 8px ${ACCENT}33` : "none" }}>{label}</button>);
}

function VideoPlayerView({ classData, instructor, onBack, allClasses }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const timerRef = useRef(null);
  const handlePlay = () => { setIsPlaying(true); timerRef.current = setInterval(() => { setProgress(p => { if (p >= 100) { clearInterval(timerRef.current); setIsPlaying(false); return 100; } return p + 0.5; }); }, classData.duration * 6); };
  useEffect(() => () => clearInterval(timerRef.current), []);
  const related = allClasses.filter(c => c.id !== classData.id && (c.classType === classData.classType || c.instructorId === classData.instructorId)).slice(0, 4);

  return (
    <div>
      <button onClick={onBack} style={{ ...s.pill, background: "transparent", color: "#555", padding: "6px 12px", display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }} onMouseEnter={e => e.currentTarget.style.color = ACCENT} onMouseLeave={e => e.currentTarget.style.color = "#555"}><ChevronLeft /> Back to Library</button>
      <div className="odl-player-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ ...s.card, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ aspectRatio: "16/9", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }} onClick={!isPlaying ? handlePlay : undefined}>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${instructor?.color || ACCENT}40 0%, #11111180 100%)` }} />
              {!isPlaying ? (<div style={{ textAlign: "center", zIndex: 1 }}><div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.3)", margin: "0 auto 12px" }}><PlayIcon size={32} /></div><div style={{ color: "rgba(255,255,255,0.7)", fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em" }}>CLICK TO PLAY DEMO</div></div>) : (<div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}><div style={{ display: "flex", alignItems: "flex-end", gap: 2, padding: "0 20px 40px", height: 80 }}>{Array.from({ length: 50 }).map((_, i) => { const h2 = 10 + Math.sin(i * 0.3 + progress * 0.05) * 25 + Math.random() * 15; const active = (i / 50) * 100 < progress; return <div key={i} style={{ flex: 1, height: h2, borderRadius: 2, background: active ? (instructor?.color || ACCENT) : "rgba(255,255,255,0.15)", transition: "height 0.3s" }} />; })}</div><div style={{ height: 4, background: "rgba(255,255,255,0.1)" }}><div style={{ height: "100%", width: `${progress}%`, background: instructor?.color || ACCENT, transition: "width 0.3s" }} /></div></div>)}
              <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.6)", padding: "3px 8px", borderRadius: 4, fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", backdropFilter: "blur(4px)" }}>POWERED BY MUX</div>
            </div>
          </div>
          <div style={{ ...s.card, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontFamily: DISPLAY, fontSize: 26, color: "#111", margin: 0, lineHeight: 1.2 }}>{classData.title}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <span style={s.label}>{classData.classType}</span><span style={{ color: "#ccc" }}>|</span><span style={{ display: "flex", alignItems: "center", gap: 4, color: "#555", fontFamily: FONT, fontSize: 13 }}><ClockIcon /> {classData.duration} min</span><span style={{ color: "#ccc" }}>|</span><span style={{ display: "flex", alignItems: "center", gap: 4, color: "#555", fontFamily: FONT, fontSize: 13 }}><StarIcon size={13} /> {classData.rating} ({classData.ratingCount})</span><span style={{ color: "#ccc" }}>|</span><span style={{ color: "#555", fontFamily: FONT, fontSize: 13 }}>{classData.views.toLocaleString()} views</span>
                </div>
              </div>
              <button onClick={() => setLiked(!liked)} style={{ ...s.pill, background: liked ? "#FEE2E2" : "rgba(0,0,0,0.04)", color: liked ? "#DC2626" : "#555", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}><HeartIcon filled={liked} /> {liked ? "Saved" : "Save"}</button>
            </div>
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: 16 }}>
              {["overview", "exercises", "reviews"].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === tab ? ACCENT : "transparent"}`, padding: "10px 16px", fontFamily: FONT, fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? ACCENT : "#999", cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s" }}>{tab}</button>))}
            </div>
            {activeTab === "overview" && (<div><p style={{ fontFamily: FONT, fontSize: 14, color: "#555", lineHeight: 1.7, margin: "0 0 16px" }}>{classData.description}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>{[{ label: "Level", value: classData.level },{ label: "Focus", value: classData.focusArea },{ label: "Equipment", value: classData.equipment },{ label: "Est. Calories", value: `~${classData.calories} kcal` }].map(item => (<div key={item.label} style={{ padding: 12, background: "rgba(0,0,0,0.02)", borderRadius: 10 }}><div style={s.label}>{item.label}</div><div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#111", marginTop: 4 }}>{item.value}</div></div>))}</div></div>)}
            {activeTab === "exercises" && (<div style={{ fontFamily: FONT, fontSize: 14, color: "#555" }}><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{["Warm-Up: Breathing & Pelvic Tilts", "Cat-Cow Flow (8 reps)", "Footwork Series (3 positions)", "Leg Circles (8 each direction)", "Short Box: Round Back", "Short Box: Flat Back + Twist", "Long Stretch Series", "Knee Stretches (Round + Arched)", "Cool-Down: Mermaid Stretch", "Final: Roll-Down & Centering"].map((ex, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: i % 2 === 0 ? "rgba(0,0,0,0.02)" : "transparent", borderRadius: 8 }}><span style={{ fontFamily: MONO, fontSize: 11, color: "#999", width: 20 }}>{String(i + 1).padStart(2, "0")}</span><span>{ex}</span></div>))}</div></div>)}
            {activeTab === "reviews" && (<div style={{ fontFamily: FONT, fontSize: 14, color: "#555" }}>{[{ name: "Sarah M.", rating: 5, text: "Kelly's cueing is incredible. I felt every muscle engage.", date: "2 days ago" },{ name: "Jennifer L.", rating: 5, text: "Perfect for mornings when I can't make it to the studio.", date: "1 week ago" },{ name: "Michael R.", rating: 4, text: "Great flow and pacing. Would love more advanced spring options.", date: "2 weeks ago" }].map((r, i) => (<div key={i} style={{ padding: "14px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.06)" : "none" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><strong style={{ color: "#111" }}>{r.name}</strong><span style={{ display: "flex", gap: 2 }}>{Array.from({ length: r.rating }).map((_, j) => <StarIcon key={j} size={12} />)}</span><span style={{ color: "#999", fontSize: 12 }}>{r.date}</span></div><p style={{ margin: 0, lineHeight: 1.6 }}>{r.text}</p></div>))}</div>)}
          </div>
        </div>
        <div className="odl-player-sidebar">
          {instructor && (<div style={{ ...s.card, padding: 20, marginBottom: 16 }}><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}><div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${instructor.color}, ${instructor.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FONT, fontSize: 16, fontWeight: 700 }}>{instructor.name.split(" ").map(n => n[0]).join("")}</div><div><div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#111" }}>{instructor.name}</div><div style={{ fontFamily: FONT, fontSize: 12, color: "#999" }}>{instructor.title}</div></div></div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{instructor.specialties.slice(0, 4).map(sp => (<span key={sp} style={{ fontFamily: MONO, fontSize: 9, color: "#666", background: "rgba(0,0,0,0.04)", padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sp}</span>))}</div></div>)}
          <div style={{ ...s.card, padding: 16, marginBottom: 16, background: ACCENT_LIGHT }}><div style={{ ...s.label, marginBottom: 8, color: ACCENT }}>Body Intelligence Integration</div><div style={{ fontFamily: FONT, fontSize: 13, color: "#555", lineHeight: 1.6 }}>Completing this class will update your <strong>Fatigue Tracker</strong> and earn <strong>10 challenge points</strong>.</div></div>
          <div style={{ ...s.card, padding: 16 }}><div style={{ ...s.label, marginBottom: 12 }}>Up Next</div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{related.map(rc => { const ri = INSTRUCTORS.find(ins => ins.id === rc.instructorId); return (<div key={rc.id} style={{ display: "flex", gap: 10, padding: 8, borderRadius: 10, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.03)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><div style={{ width: 72, height: 48, borderRadius: 8, flexShrink: 0, background: `linear-gradient(135deg, ${ri?.color || ACCENT}, ${ri?.color || ACCENT}88)`, display: "flex", alignItems: "center", justifyContent: "center" }}><PlayIcon size={16} /></div><div style={{ minWidth: 0 }}><div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rc.title}</div><div style={{ fontFamily: FONT, fontSize: 11, color: "#999" }}>{ri?.name.split(" ")[0]} · {rc.duration} min</div></div></div>); })}</div></div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionGate({ onClose }) {
  const [selected, setSelected] = useState("digital-annual");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ ...s.card, padding: 32, maxWidth: 720, width: "90%", background: "#fff" }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 28 }}><div style={s.label}>Pilates On-Demand</div><h2 style={{ fontFamily: DISPLAY, fontSize: 28, color: "#111", margin: "8px 0 4px" }}>Your studio, anywhere</h2><p style={{ fontFamily: FONT, fontSize: 14, color: "#777", margin: 0 }}>Stream every class from all 3 Pilates Studio locations, on any device.</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>{PLANS.map(plan => (<div key={plan.id} onClick={() => setSelected(plan.id)} style={{ ...s.card, padding: 20, cursor: "pointer", position: "relative", border: selected === plan.id ? `2px solid ${ACCENT}` : `1px solid ${CARD_BORDER}`, background: selected === plan.id ? ACCENT_LIGHT : CARD_BG, transition: "all 0.2s" }}>{plan.badge && (<div style={{ position: "absolute", top: -10, right: 12, background: ACCENT, color: "#fff", fontFamily: MONO, fontSize: 9, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{plan.badge}</div>)}<div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4 }}>{plan.name}</div><div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 12 }}><span style={{ fontFamily: DISPLAY, fontSize: 32, color: "#111" }}>${plan.price}</span><span style={{ fontFamily: FONT, fontSize: 12, color: "#999" }}>/{plan.interval}</span></div><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{plan.features.map(f => (<div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12, color: "#555" }}><CheckIcon /> {f}</div>))}</div></div>))}</div>
        <div style={{ textAlign: "center" }}><button style={{ ...s.pill, background: ACCENT, color: "#fff", padding: "12px 36px", fontSize: 15, fontWeight: 600, boxShadow: `0 4px 16px ${ACCENT}40` }}>Start 7-Day Free Trial</button><p style={{ fontFamily: FONT, fontSize: 11, color: "#999", marginTop: 8 }}>Cancel anytime. Powered by Stripe.</p></div>
      </div>
    </div>
  );
}

function AdminUploadPanel({ onClose }) {
  const [step, setStep] = useState(1);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ ...s.card, padding: 28, maxWidth: 560, width: "90%", background: "#fff" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h3 style={{ fontFamily: DISPLAY, fontSize: 22, color: "#111", margin: 0 }}>Upload New Class</h3><button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>&times;</button></div>
        {step === 1 && (<div><div style={{ border: "2px dashed rgba(0,0,0,0.12)", borderRadius: 12, padding: 40, textAlign: "center", marginBottom: 20, cursor: "pointer", background: "rgba(0,0,0,0.01)" }}><UploadIcon /><div style={{ fontFamily: FONT, fontSize: 14, color: "#555", marginTop: 8 }}>Drop video file here or <span style={{ color: ACCENT, fontWeight: 600 }}>browse</span></div><div style={{ fontFamily: MONO, fontSize: 10, color: "#999", marginTop: 4 }}>MP4, MOV, or MKV up to 4GB</div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}><div><label style={{ ...s.label, display: "block", marginBottom: 6 }}>Class Title</label><input placeholder="e.g., Morning Mat Flow" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontFamily: FONT, fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div><div><label style={{ ...s.label, display: "block", marginBottom: 6 }}>Instructor</label><select style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontFamily: FONT, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}><option value="">Select...</option>{INSTRUCTORS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}><div><label style={{ ...s.label, display: "block", marginBottom: 6 }}>Class Type</label><select style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontFamily: FONT, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}><option value="">Select...</option>{CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><div><label style={{ ...s.label, display: "block", marginBottom: 6 }}>Duration</label><select style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontFamily: FONT, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}>{DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}</select></div><div><label style={{ ...s.label, display: "block", marginBottom: 6 }}>Level</label><select style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontFamily: FONT, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div></div><button onClick={() => setStep(2)} style={{ ...s.pill, background: ACCENT, color: "#fff", padding: "11px 28px", fontSize: 14, fontWeight: 600, width: "100%", boxShadow: `0 4px 16px ${ACCENT}40` }}>Upload to Mux & Publish</button></div>)}
        {step === 2 && (<div style={{ textAlign: "center", padding: "20px 0" }}><div style={{ width: 64, height: 64, borderRadius: "50%", border: `3px solid ${ACCENT}`, borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style><div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 4 }}>Uploading to Mux...</div><div style={{ marginTop: 20, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 12, fontFamily: MONO, fontSize: 11, color: "#666", textAlign: "left" }}><div>{"POST /api/mux/assets → 201 Created"}</div><div style={{ marginTop: 4 }}>{"asset_id: \"mux_a1b2c3d4...\""}</div><div style={{ marginTop: 4, color: "#16A34A" }}>{"✓ Encoding queued"}</div></div></div>)}
      </div>
    </div>
  );
}

export default function OnDemandLibrary() {
  const [classes] = useState(generateClasses);
  const [view, setView] = useState("library");
  const [selectedClass, setSelectedClass] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ type: null, level: null, duration: null, instructor: null, focus: null });
  const [sortBy, setSortBy] = useState("newest");
  const [layout, setLayout] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [activeCollection, setActiveCollection] = useState(null);

  const toggleFilter = (key, value) => setFilters(f => ({ ...f, [key]: f[key] === value ? null : value }));

  const filtered = useMemo(() => {
    let result = [...classes];
    if (activeCollection) { const col = COLLECTIONS.find(c => c.id === activeCollection); if (col) result = result.filter(c => col.classIds.includes(c.id)); }
    if (search) { const q = search.toLowerCase(); result = result.filter(c => c.title.toLowerCase().includes(q) || c.classType.toLowerCase().includes(q) || INSTRUCTORS.find(i => i.id === c.instructorId)?.name.toLowerCase().includes(q)); }
    if (filters.type) result = result.filter(c => c.classType === filters.type);
    if (filters.level) result = result.filter(c => c.level === filters.level);
    if (filters.duration) result = result.filter(c => c.duration === filters.duration);
    if (filters.instructor) result = result.filter(c => c.instructorId === filters.instructor);
    if (filters.focus) result = result.filter(c => c.focusArea === filters.focus);
    if (sortBy === "newest") result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    else if (sortBy === "popular") result.sort((a, b) => b.views - a.views);
    else if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "shortest") result.sort((a, b) => a.duration - b.duration);
    return result;
  }, [classes, search, filters, sortBy, activeCollection]);

  const featured = useMemo(() => classes.filter(c => c.isFeatured), [classes]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const openClass = useCallback((cls) => { setSelectedClass(cls); setView("player"); }, []);

  if (view === "player" && selectedClass) {
    const instructor = INSTRUCTORS.find(i => i.id === selectedClass.instructorId);
    return (<div style={{ fontFamily: FONT, minHeight: "100vh", background: "#FAF6F1", padding: "24px 32px" }}><style>{`.odl-player-grid { } @media (max-width: 768px) { .odl-player-grid { grid-template-columns: 1fr !important; } .odl-player-sidebar { display: none; } }`}</style><VideoPlayerView classData={selectedClass} instructor={instructor} onBack={() => { setView("library"); setSelectedClass(null); }} allClasses={classes} /></div>);
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: "100vh", background: "#FAF6F1" }}>
      <style>{`
        @media (max-width: 768px) {
          .odl-header { flex-direction: column !important; align-items: flex-start !important; }
          .odl-header-actions { width: 100%; justify-content: flex-start !important; }
          .odl-featured-grid { grid-template-columns: 1fr 1fr !important; }
          .odl-collections-grid { grid-template-columns: 1fr 1fr !important; }
          .odl-library-grid { grid-template-columns: 1fr 1fr !important; }
          .odl-player-grid { grid-template-columns: 1fr !important; }
          .odl-player-sidebar { display: none; }
          .odl-overview-stats { flex-direction: column !important; gap: 12px !important; }
          .odl-search-bar { flex-wrap: wrap !important; }
          .odl-page-pad { padding: 16px !important; }
          .odl-sub-plans { grid-template-columns: 1fr !important; }
          .odl-overview-meta { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
        @media (max-width: 480px) {
          .odl-featured-grid { grid-template-columns: 1fr !important; }
          .odl-collections-grid { grid-template-columns: 1fr !important; }
          .odl-library-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="odl-page-pad" style={{ padding: "24px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div><div style={{ ...s.label, color: ACCENT, marginBottom: 6 }}>Pilates On-Demand</div><h1 style={{ fontFamily: DISPLAY, fontSize: 32, color: "#111", margin: 0 }}>Class Library</h1><p style={{ fontFamily: FONT, fontSize: 14, color: "#777", margin: "6px 0 0" }}>{classes.length} classes across {CLASS_TYPES.length} formats from {INSTRUCTORS.length} instructors</p></div>
          <div style={{ display: "flex", gap: 8 }}><button onClick={() => setShowPricing(true)} style={{ ...s.pill, background: "rgba(0,0,0,0.04)", color: "#555" }}>Subscriptions</button><button onClick={() => setShowUpload(true)} style={{ ...s.pill, background: ACCENT, color: "#fff", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 2px 12px ${ACCENT}33` }}><UploadIcon /> Upload Class</button></div>
        </div>

        <div style={{ marginBottom: 28 }}><div style={s.label}>Featured This Week</div><div className="odl-featured-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 10 }}>{featured.map(cls => { const ins = INSTRUCTORS.find(i => i.id === cls.instructorId); return (<div key={cls.id} onClick={() => openClass(cls)} style={{ ...s.card, cursor: "pointer", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = s.card.boxShadow; }}><ClassThumbnail classData={cls} instructor={ins} size="medium" /><div style={{ padding: "12px 14px" }}><div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cls.title}</div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontFamily: FONT, fontSize: 12, color: "#999" }}>{ins?.name.split(" ")[0]}</span><span style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: FONT, fontSize: 12, color: "#999" }}><StarIcon size={11} /> {cls.rating}</span></div></div></div>); })}</div></div>

        <div style={{ marginBottom: 28 }}><div style={s.label}>Collections</div><div className="odl-collections-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 10 }}>{COLLECTIONS.map(col => (<button key={col.id} onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)} style={{ ...s.card, padding: "14px 16px", cursor: "pointer", textAlign: "left", border: activeCollection === col.id ? `2px solid ${col.color}` : `1px solid ${CARD_BORDER}`, background: activeCollection === col.id ? `${col.color}08` : CARD_BG, transition: "all 0.2s" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ fontSize: 18 }}>{col.icon}</span><span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#111" }}>{col.name}</span></div><div style={{ fontFamily: FONT, fontSize: 11, color: "#999" }}>{col.classIds.length} classes</div></button>))}</div></div>

        <div style={{ ...s.card, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "0 12px" }}><SearchIcon /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes, instructors..." style={{ flex: 1, border: "none", background: "transparent", padding: "10px 0", fontFamily: FONT, fontSize: 13, outline: "none", color: "#111" }} />{search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 16 }}>&times;</button>}</div>
          <button onClick={() => setShowFilters(!showFilters)} style={{ ...s.pill, background: activeFilterCount > 0 ? ACCENT : "rgba(0,0,0,0.04)", color: activeFilterCount > 0 ? "#fff" : "#555", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}><FilterIcon /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...s.pill, background: "rgba(0,0,0,0.04)", color: "#555", padding: "8px 14px", appearance: "none", cursor: "pointer" }}><option value="newest">Newest</option><option value="popular">Most Popular</option><option value="rating">Highest Rated</option><option value="shortest">Shortest First</option></select>
          <div style={{ display: "flex", gap: 4 }}><button onClick={() => setLayout("grid")} style={{ ...s.pill, padding: "8px 10px", background: layout === "grid" ? ACCENT : "rgba(0,0,0,0.04)", color: layout === "grid" ? "#fff" : "#555" }}><GridIcon /></button><button onClick={() => setLayout("list")} style={{ ...s.pill, padding: "8px 10px", background: layout === "list" ? ACCENT : "rgba(0,0,0,0.04)", color: layout === "list" ? "#fff" : "#555" }}><ListIcon /></button></div>
        </div>

        {showFilters && (<div style={{ ...s.card, padding: 16, marginBottom: 16 }}>{[{ key: "type", label: "Class Type", options: CLASS_TYPES },{ key: "level", label: "Level", options: LEVELS },{ key: "duration", label: "Duration", options: DURATIONS.map(d => d) },{ key: "focus", label: "Focus Area", options: FOCUS_AREAS }].map(section => (<div key={section.key} style={{ marginBottom: 12 }}><div style={{ ...s.label, marginBottom: 8 }}>{section.label}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{section.options.map(opt => <Chip key={opt} label={section.key === "duration" ? `${opt} min` : opt} active={filters[section.key] === opt} onClick={() => toggleFilter(section.key, opt)} />)}</div></div>))}<div style={{ marginBottom: 12 }}><div style={{ ...s.label, marginBottom: 8 }}>Instructor</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{INSTRUCTORS.map(i => <Chip key={i.id} label={i.name} active={filters.instructor === i.id} onClick={() => toggleFilter("instructor", i.id)} />)}</div></div>{activeFilterCount > 0 && <button onClick={() => setFilters({ type: null, level: null, duration: null, instructor: null, focus: null })} style={{ ...s.pill, background: "transparent", color: ACCENT, padding: "6px 0", marginTop: 12, fontSize: 12 }}>Clear all filters</button>}</div>)}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><span style={{ fontFamily: FONT, fontSize: 13, color: "#999" }}>{filtered.length} class{filtered.length !== 1 ? "es" : ""}{activeCollection && ` in "${COLLECTIONS.find(c => c.id === activeCollection)?.name}"`}</span>{activeCollection && <button onClick={() => setActiveCollection(null)} style={{ ...s.pill, background: "transparent", color: ACCENT, padding: "4px 0", fontSize: 12 }}>Show all classes</button>}</div>

        {layout === "grid" && (<div className="odl-library-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>{filtered.map(cls => { const ins = INSTRUCTORS.find(i => i.id === cls.instructorId); return (<div key={cls.id} onClick={() => openClass(cls)} style={{ ...s.card, cursor: "pointer", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = s.card.boxShadow; }}><ClassThumbnail classData={cls} instructor={ins} /><div style={{ padding: "14px 16px" }}><div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 4 }}>{cls.title}</div><div style={{ fontFamily: FONT, fontSize: 12, color: "#777", marginBottom: 10, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{cls.description}</div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: ins?.color || ACCENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FONT, fontSize: 8, fontWeight: 700 }}>{ins?.name.split(" ").map(n => n[0]).join("")}</div><span style={{ fontFamily: FONT, fontSize: 12, color: "#555" }}>{ins?.name}</span></div><div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 12, color: "#999" }}><span style={{ display: "flex", alignItems: "center", gap: 3 }}><StarIcon size={11} /> {cls.rating}</span><span>{cls.views.toLocaleString()} views</span></div></div></div></div>); })}</div>)}

        {layout === "list" && (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{filtered.map(cls => { const ins = INSTRUCTORS.find(i => i.id === cls.instructorId); return (<div key={cls.id} onClick={() => openClass(cls)} style={{ ...s.card, padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "transform 0.15s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}><div style={{ width: 100, height: 64, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${ins?.color || ACCENT}, ${ins?.color || ACCENT}88)`, display: "flex", alignItems: "center", justifyContent: "center" }}><PlayIcon size={20} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#111" }}>{cls.title}</div><div style={{ fontFamily: FONT, fontSize: 12, color: "#999", marginTop: 2 }}>{ins?.name} · {cls.classType} · {cls.focusArea}</div></div><span style={{ fontFamily: MONO, fontSize: 11, color: "#555", background: "rgba(0,0,0,0.04)", padding: "4px 8px", borderRadius: 4 }}>{cls.level}</span><span style={{ fontFamily: MONO, fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 4 }}><ClockIcon /> {cls.duration}m</span><span style={{ fontFamily: FONT, fontSize: 12, color: "#999", display: "flex", alignItems: "center", gap: 3 }}><StarIcon size={12} /> {cls.rating}</span></div>); })}</div>)}

        {filtered.length === 0 && (<div style={{ textAlign: "center", padding: "60px 0" }}><div style={{ fontSize: 48, marginBottom: 12 }}>&#x1F9D8;</div><div style={{ fontFamily: DISPLAY, fontSize: 20, color: "#111", marginBottom: 4 }}>No classes found</div><div style={{ fontFamily: FONT, fontSize: 14, color: "#999" }}>Try adjusting your filters</div></div>)}

        <div style={{ ...s.card, padding: "16px 20px", marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", gap: 32 }}>{[{ label: "Total Classes", value: classes.length },{ label: "Total Watch Time", value: `${Math.floor(classes.reduce((a, c) => a + c.duration, 0) / 60)}h ${classes.reduce((a, c) => a + c.duration, 0) % 60}m` },{ label: "Total Views", value: classes.reduce((a, c) => a + c.views, 0).toLocaleString() },{ label: "Avg Rating", value: (classes.reduce((a, c) => a + c.rating, 0) / classes.length).toFixed(1) }].map(stat => (<div key={stat.label}><div style={s.label}>{stat.label}</div><div style={{ fontFamily: DISPLAY, fontSize: 20, color: "#111", marginTop: 2 }}>{stat.value}</div></div>))}</div><div style={{ fontFamily: MONO, fontSize: 10, color: "#999", padding: "6px 10px", background: "rgba(0,0,0,0.02)", borderRadius: 6 }}>{"Mux Video · Stripe Billing · Supabase"}</div></div>
      </div>
      {showPricing && <SubscriptionGate onClose={() => setShowPricing(false)} />}
      {showUpload && <AdminUploadPanel onClose={() => setShowUpload(false)} />}
    </div>
  );
}
