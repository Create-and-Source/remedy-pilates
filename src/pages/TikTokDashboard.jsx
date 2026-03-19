import { useState, useMemo } from "react";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const ACCENT = "#C4704B";
const ACCENT_LIGHT = "#FDF5F0";
const FONT = "'Outfit', sans-serif";
const DISPLAY = "'Playfair Display', serif";
const MONO = "'JetBrains Mono', monospace";
const CARD_BG = "rgba(255,255,255,0.72)";
const CARD_BORDER = "rgba(255,255,255,0.6)";

const s = {
  card: {
    background: CARD_BG,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  },
  pill: {
    border: "none",
    borderRadius: 100,
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 500,
    padding: "8px 18px",
    transition: "all 0.2s",
  },
  label: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#999",
  },
};

// ─── Content Pillars ─────────────────────────────────────────────────────────
const PILLARS = [
  { id: "transformation", label: "Transformation", pct: 25, color: "#C4704B", desc: "Before/after, progress stories" },
  { id: "education", label: "Education", pct: 25, color: "#5B7B8F", desc: "Form tips, myth busting, exercise breakdowns" },
  { id: "bts", label: "Behind the Scenes", pct: 20, color: "#6B8F71", desc: "Studio life, instructor prep, equipment setup" },
  { id: "trending", label: "Trending/Fun", pct: 15, color: "#8B6B94", desc: "Trending sounds, challenges, humor" },
  { id: "community", label: "Community", pct: 15, color: "#A68B6B", desc: "Member spotlights, events, team moments" },
];

const PILLAR_MAP = Object.fromEntries(PILLARS.map((p) => [p.id, p]));

// ─── Content Ideas ────────────────────────────────────────────────────────────
const IDEAS = [
  {
    id: 1,
    title: "5 Reformer Mistakes Beginners Make",
    pillar: "education",
    format: "Tutorial",
    hook: "Stop doing this on the reformer — your instructor is cringing 😬",
    audio: "Voiceover",
    difficulty: "Easy",
    views: "15K–40K",
    status: "Published",
  },
  {
    id: 2,
    title: "Client Lost 20lbs in 3 Months",
    pillar: "transformation",
    format: "Before/After",
    hook: "She almost quit after week one. Here's what kept her going ✨",
    audio: "Trending",
    difficulty: "Medium",
    views: "50K–200K",
    status: "Published",
  },
  {
    id: 3,
    title: "POV: First Barre Class Ever",
    pillar: "trending",
    format: "POV",
    hook: "POV: you signed up for barre thinking it would be easy 💀",
    audio: "Trending",
    difficulty: "Easy",
    views: "20K–80K",
    status: "Scheduled",
  },
  {
    id: 4,
    title: "How We Set Up a Reformer for a New Client",
    pillar: "bts",
    format: "Timelapse",
    hook: "Watch us transform a reformer in under 60 seconds 🎬",
    audio: "Trending",
    difficulty: "Easy",
    views: "8K–25K",
    status: "Published",
  },
  {
    id: 5,
    title: "Pilates Myth: It's Only for Flexible People",
    pillar: "education",
    format: "Talking Head",
    hook: "If I hear this one more time… 🙄 Let's debunk this Pilates myth",
    audio: "Original",
    difficulty: "Easy",
    views: "10K–35K",
    status: "Scheduled",
  },
  {
    id: 6,
    title: "Member Spotlight: Sarah's 1-Year Journey",
    pillar: "community",
    format: "Before/After",
    hook: "One year ago she couldn't touch her toes. Look at her now 🤩",
    audio: "Trending",
    difficulty: "Medium",
    views: "30K–100K",
    status: "Draft",
  },
  {
    id: 7,
    title: "A Day in the Life of a Pilates Instructor",
    pillar: "bts",
    format: "POV",
    hook: "POV: you're a Pilates instructor and you actually love Mondays ☀️",
    audio: "Trending",
    difficulty: "Medium",
    views: "12K–45K",
    status: "Draft",
  },
  {
    id: 8,
    title: "Reformer vs Mat: Which Is Better?",
    pillar: "education",
    format: "Talking Head",
    hook: "The reformer vs mat debate — here's the honest truth 👇",
    audio: "Original",
    difficulty: "Easy",
    views: "18K–60K",
    status: "Draft",
  },
  {
    id: 9,
    title: "Can You See a Difference in 30 Days?",
    pillar: "transformation",
    format: "Before/After",
    hook: "30 days of Pilates, 5x a week. Here's what actually happened 👀",
    audio: "Trending",
    difficulty: "Hard",
    views: "80K–300K",
    status: "Scheduled",
  },
  {
    id: 10,
    title: "We Tried the TikTok Pilates Challenge",
    pillar: "trending",
    format: "Trending Sound",
    hook: "We had to try this viral Pilates challenge so you don't have to 😂",
    audio: "Trending",
    difficulty: "Medium",
    views: "25K–90K",
    status: "Draft",
  },
  {
    id: 11,
    title: "New Studio Tour — Come See Us!",
    pillar: "community",
    format: "Timelapse",
    hook: "We got a glow-up 🪄 Come see the new Remedy Pilates studio",
    audio: "Trending",
    difficulty: "Easy",
    views: "10K–30K",
    status: "Published",
  },
  {
    id: 12,
    title: "3 Core Exercises Better Than Crunches",
    pillar: "education",
    format: "Tutorial",
    hook: "Stop doing crunches. Your core will thank you later 🙏",
    audio: "Voiceover",
    difficulty: "Easy",
    views: "20K–70K",
    status: "Published",
  },
];

// ─── Schedule ─────────────────────────────────────────────────────────────────
const SCHEDULE = [
  { day: "Mon", slots: [{ time: "7:00 AM MST", pillar: "education", note: "Myth-busting or tip video" }] },
  { day: "Tue", slots: [{ time: "12:00 PM MST", pillar: "transformation", note: "Progress or before/after" }] },
  { day: "Wed", slots: [
    { time: "7:00 AM MST", pillar: "bts", note: "Studio or instructor life" },
    { time: "6:00 PM MST", pillar: "education", note: "Tutorial or form breakdown" },
  ]},
  { day: "Thu", slots: [{ time: "12:00 PM MST", pillar: "trending", note: "Trending sound or challenge" }] },
  { day: "Fri", slots: [
    { time: "7:00 AM MST", pillar: "community", note: "Member spotlight or event" },
    { time: "6:00 PM MST", pillar: "transformation", note: "Weekly result or journey" },
  ]},
  { day: "Sat", slots: [{ time: "10:00 AM MST", pillar: "bts", note: "Weekend studio vibes" }] },
  { day: "Sun", slots: [{ time: "6:00 PM MST", pillar: "community", note: "Weekly recap or team moment" }] },
];

// ─── Trending Audios ──────────────────────────────────────────────────────────
const AUDIOS = [
  {
    id: 1,
    name: "Espresso",
    artist: "Sabrina Carpenter",
    category: "Dance",
    useCase: "Upbeat reformer flow montage or studio b-roll transitions",
    notes: "Pair with aesthetic studio shots — great for reach with younger audience",
    badge: "Trending",
  },
  {
    id: 2,
    name: "Good Days",
    artist: "SZA",
    category: "Motivational",
    useCase: "Transformation videos, client journey storytelling",
    notes: "Slower pace works beautifully with before/after reveals",
    badge: "Evergreen",
  },
  {
    id: 3,
    name: "Running Up That Hill",
    artist: "Kate Bush",
    category: "Transition",
    useCase: "Dramatic before/after cuts or client milestone moments",
    notes: "High emotional impact — use sparingly for maximum effect",
    badge: "Evergreen",
  },
  {
    id: 4,
    name: "Calm Down",
    artist: "Rema & Selena Gomez",
    category: "Dance",
    useCase: "Fun reformer choreography, instructor dance challenge",
    notes: "Great for trending challenge format — add 'Pilates edition' spin",
    badge: "Trending",
  },
  {
    id: 5,
    name: "original sound - pilatesprincess",
    artist: "pilatesprincess (TikTok)",
    category: "Voiceover",
    useCase: "Stitch or duet with popular Pilates creator for credibility boost",
    notes: "Monitor niche Pilates accounts — stitching adds authority and reach",
    badge: "Trending",
  },
];

// ─── Analytics Data ───────────────────────────────────────────────────────────
const METRICS = [
  { label: "Followers", value: "12.4K", delta: "+340 this month", up: true },
  { label: "Avg Views", value: "8.2K", delta: "+12% vs last month", up: true },
  { label: "Engagement Rate", value: "4.8%", delta: "Industry avg: 3.1%", up: true },
  { label: "Website Clicks", value: "340/mo", delta: "+28% vs last month", up: true },
];

const PILLAR_PERF = [
  { pillar: "transformation", avgViews: 85000 },
  { pillar: "trending", avgViews: 62000 },
  { pillar: "education", avgViews: 38000 },
  { pillar: "community", avgViews: 22000 },
  { pillar: "bts", avgViews: 18000 },
];

const POST_TIMES = [
  { time: "7:00 AM MST", perf: 88, label: "High reach — commute scroll" },
  { time: "12:00 PM MST", perf: 72, label: "Lunch break peak" },
  { time: "6:00 PM MST", perf: 95, label: "Best performer — evening wind-down" },
];

const ACTUAL_PCTS = [
  { id: "transformation", actual: 32 },
  { id: "education", actual: 28 },
  { id: "bts", actual: 18 },
  { id: "trending", actual: 12 },
  { id: "community", actual: 10 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function PillarBadge({ pillarId, style = {} }) {
  const p = PILLAR_MAP[pillarId];
  if (!p) return null;
  return (
    <span style={{
      display: "inline-block",
      background: p.color + "18",
      color: p.color,
      border: `1px solid ${p.color}30`,
      borderRadius: 100,
      fontFamily: MONO,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "3px 10px",
      ...style,
    }}>
      {p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    Draft: { bg: "#F3F4F6", color: "#6B7280" },
    Scheduled: { bg: "#EFF6FF", color: "#2563EB" },
    Published: { bg: "#F0FDF4", color: "#16A34A" },
  };
  const { bg, color } = map[status] || map.Draft;
  return (
    <span style={{
      display: "inline-block",
      background: bg,
      color,
      borderRadius: 100,
      fontFamily: MONO,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "3px 10px",
    }}>
      {status}
    </span>
  );
}

function DiffBadge({ level }) {
  const map = {
    Easy: { bg: "#F0FDF4", color: "#16A34A" },
    Medium: { bg: "#FFFBEB", color: "#D97706" },
    Hard: { bg: "#FFF1F2", color: "#E11D48" },
  };
  const { bg, color } = map[level] || map.Easy;
  return (
    <span style={{
      display: "inline-block",
      background: bg,
      color,
      borderRadius: 4,
      fontFamily: MONO,
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 7px",
    }}>
      {level}
    </span>
  );
}

function AudioBadge({ type }) {
  const map = {
    Original: { bg: ACCENT_LIGHT, color: ACCENT },
    Trending: { bg: "#FAF0FF", color: "#8B6B94" },
    Voiceover: { bg: "#F0F7FF", color: "#5B7B8F" },
  };
  const { bg, color } = map[type] || {};
  return (
    <span style={{
      display: "inline-block",
      background: bg,
      color,
      borderRadius: 4,
      fontFamily: MONO,
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 7px",
    }}>
      {type}
    </span>
  );
}

// ─── Tab: Content Ideas ───────────────────────────────────────────────────────
function ContentIdeasTab() {
  const [activePillar, setActivePillar] = useState("all");
  const [hoveredCard, setHoveredCard] = useState(null);

  const filtered = useMemo(() => {
    if (activePillar === "all") return IDEAS;
    return IDEAS.filter((i) => i.pillar === activePillar);
  }, [activePillar]);

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setActivePillar("all")}
          style={{
            ...s.pill,
            background: activePillar === "all" ? ACCENT : "rgba(0,0,0,0.06)",
            color: activePillar === "all" ? "#fff" : "#555",
          }}
        >
          All
        </button>
        {PILLARS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePillar(p.id)}
            style={{
              ...s.pill,
              background: activePillar === p.id ? p.color : "rgba(0,0,0,0.06)",
              color: activePillar === p.id ? "#fff" : "#555",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div className="tt-ideas-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16,
      }}>
        {filtered.map((idea) => {
          const isHovered = hoveredCard === idea.id;
          return (
            <div
              key={idea.id}
              onMouseEnter={() => setHoveredCard(idea.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...s.card,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "transform 0.2s, box-shadow 0.2s",
                transform: isHovered ? "translateY(-2px)" : "none",
                boxShadow: isHovered
                  ? "0 8px 32px rgba(0,0,0,0.08)"
                  : s.card.boxShadow,
              }}
            >
              {/* Top row: pillar + status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <PillarBadge pillarId={idea.pillar} />
                <StatusBadge status={idea.status} />
              </div>

              {/* Title */}
              <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3 }}>
                {idea.title}
              </div>

              {/* Hook */}
              <div style={{
                fontFamily: FONT,
                fontSize: 13,
                color: "#666",
                lineHeight: 1.5,
                background: "rgba(0,0,0,0.03)",
                borderRadius: 8,
                padding: "10px 12px",
                borderLeft: `3px solid ${PILLAR_MAP[idea.pillar]?.color || ACCENT}`,
              }}>
                {idea.hook}
              </div>

              {/* Meta row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#777",
                  background: "rgba(0,0,0,0.05)",
                  borderRadius: 4,
                  padding: "2px 7px",
                }}>
                  {idea.format}
                </span>
                <AudioBadge type={idea.audio} />
                <DiffBadge level={idea.difficulty} />
              </div>

              {/* Estimated views */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={s.label}>Est. Views</span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: ACCENT }}>
                  {idea.views}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Schedule ────────────────────────────────────────────────────────────
function ScheduleTab() {
  return (
    <div>
      <div style={{ marginBottom: 20, fontFamily: FONT, fontSize: 14, color: "#888" }}>
        Optimal weekly posting schedule based on TikTok algorithm analysis and audience activity patterns.
      </div>

      {/* 7-column grid */}
      <div className="tt-schedule-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 12,
      }}>
        {SCHEDULE.map(({ day, slots }) => (
          <div key={day} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Day header */}
            <div style={{
              textAlign: "center",
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#aaa",
              paddingBottom: 8,
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}>
              {day}
            </div>

            {/* Slots */}
            {slots.map((slot, i) => {
              const pillar = PILLAR_MAP[slot.pillar];
              return (
                <div
                  key={i}
                  style={{
                    ...s.card,
                    padding: "12px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    borderTop: `3px solid ${pillar?.color || ACCENT}`,
                  }}
                >
                  <div style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: pillar?.color || ACCENT,
                    letterSpacing: "0.04em",
                  }}>
                    {slot.time}
                  </div>
                  <div style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    color: "#1A1A1A",
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}>
                    {pillar?.label}
                  </div>
                  <div style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    color: "#888",
                    lineHeight: 1.3,
                  }}>
                    {slot.note}
                  </div>
                </div>
              );
            })}

            {/* Empty placeholder if only 1 slot */}
            {slots.length < 2 && (
              <div style={{
                ...s.card,
                padding: "12px 10px",
                border: "1.5px dashed rgba(0,0,0,0.08)",
                boxShadow: "none",
                background: "rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "#ccc", textAlign: "center" }}>
                  Optional 2nd post
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 24, ...s.card, padding: 20 }}>
        <div style={{ ...s.label, marginBottom: 14 }}>Content Pillar Key</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {PILLARS.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT, fontSize: 13, color: "#555" }}>
                <strong>{p.label}</strong> — {p.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Trending Audios ─────────────────────────────────────────────────────
function TrendingAudiosTab() {
  const catColors = {
    Dance: { bg: "#FAF0FF", color: "#8B6B94" },
    Voiceover: { bg: "#F0F7FF", color: "#5B7B8F" },
    Transition: { bg: "#F0FDF4", color: "#16A34A" },
    Comedy: { bg: "#FFFBEB", color: "#D97706" },
    Motivational: { bg: ACCENT_LIGHT, color: ACCENT },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontFamily: FONT, fontSize: 14, color: "#888", marginBottom: 6 }}>
        Curated sounds that perform well for wellness and fitness studios. Refresh monthly as TikTok trends cycle quickly.
      </div>

      {AUDIOS.map((audio) => {
        const cat = catColors[audio.category] || { bg: "#F3F4F6", color: "#6B7280" };
        const isEvergreen = audio.badge === "Evergreen";
        return (
          <div key={audio.id} style={{ ...s.card, padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Music note icon */}
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: cat.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 20,
            }}>
              🎵
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
                    {audio.name}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: "#888" }}>
                    {audio.artist}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: cat.bg,
                    color: cat.color,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>
                    {audio.category}
                  </span>
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: isEvergreen ? "#F0FDF4" : "#FFF7ED",
                    color: isEvergreen ? "#16A34A" : "#EA580C",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>
                    {audio.badge}
                  </span>
                </div>
              </div>

              <div style={{ fontFamily: FONT, fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 6 }}>
                <strong>Use case:</strong> {audio.useCase}
              </div>

              <div style={{
                fontFamily: FONT,
                fontSize: 12,
                color: "#888",
                background: "rgba(0,0,0,0.03)",
                borderRadius: 8,
                padding: "8px 12px",
                lineHeight: 1.5,
              }}>
                💡 {audio.notes}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Analytics ───────────────────────────────────────────────────────────
function AnalyticsTab() {
  const maxViews = Math.max(...PILLAR_PERF.map((p) => p.avgViews));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Quick metric cards */}
      <div className="tt-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
        {METRICS.map((m) => (
          <div key={m.label} style={{ ...s.card, padding: 20 }}>
            <div style={s.label}>{m.label}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: "#1A1A1A", margin: "6px 0 4px" }}>
              {m.value}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: m.up ? "#16A34A" : "#E11D48" }}>
              {m.up ? "↑" : "↓"} {m.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column row */}
      <div className="tt-analytics-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Best performing content types */}
        <div style={{ ...s.card, padding: 24 }}>
          <div style={{ ...s.label, marginBottom: 18 }}>Avg Views by Content Pillar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {PILLAR_PERF.map(({ pillar, avgViews }) => {
              const p = PILLAR_MAP[pillar];
              const pct = Math.round((avgViews / maxViews) * 100);
              return (
                <div key={pillar}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#333" }}>
                      {p?.label}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: p?.color, fontWeight: 700 }}>
                      {avgViews >= 1000 ? `${(avgViews / 1000).toFixed(0)}K` : avgViews}
                    </span>
                  </div>
                  <div style={{ height: 8, background: "rgba(0,0,0,0.06)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: p?.color || ACCENT,
                      borderRadius: 100,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimal posting times */}
        <div style={{ ...s.card, padding: 24 }}>
          <div style={{ ...s.label, marginBottom: 18 }}>Optimal Posting Times (MST)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {POST_TIMES.map((pt) => (
              <div key={pt.time}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#333" }}>
                    {pt.time}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: ACCENT, fontWeight: 700 }}>
                    {pt.perf}%
                  </span>
                </div>
                <div style={{ height: 8, background: "rgba(0,0,0,0.06)", borderRadius: 100, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{
                    height: "100%",
                    width: `${pt.perf}%`,
                    background: `linear-gradient(90deg, ${ACCENT}99, ${ACCENT})`,
                    borderRadius: 100,
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: "#888" }}>{pt.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pillar distribution: actual vs target */}
      <div style={{ ...s.card, padding: 24 }}>
        <div style={{ ...s.label, marginBottom: 18 }}>Content Mix — Actual vs Target</div>
        <div className="tt-content-mix" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {PILLARS.map((p) => {
            const actual = ACTUAL_PCTS.find((a) => a.id === p.id)?.actual ?? 0;
            return (
              <div key={p.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#333" }}>
                    {p.label}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: "#888" }}>
                    {actual}% actual / {p.pct}% target
                  </span>
                </div>
                {/* Target bar */}
                <div style={{ position: "relative", height: 14, background: "rgba(0,0,0,0.05)", borderRadius: 100, overflow: "hidden", marginBottom: 5 }}>
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, bottom: 0,
                    width: `${p.pct}%`,
                    background: p.color + "40",
                    borderRadius: 100,
                  }} />
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, bottom: 0,
                    width: `${actual}%`,
                    background: p.color,
                    borderRadius: 100,
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                    <span style={{ fontFamily: MONO, fontSize: 10, color: "#888" }}>Actual</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color + "40", border: `1px solid ${p.color}` }} />
                    <span style={{ fontFamily: MONO, fontSize: 10, color: "#888" }}>Target</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function TikTokDashboard() {
  const [activeTab, setActiveTab] = useState("ideas");

  const TABS = [
    { id: "ideas", label: "Content Ideas" },
    { id: "schedule", label: "Schedule" },
    { id: "audios", label: "Trending Audios" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div className="tt-root" style={{
      minHeight: "100vh",
      background: "#FAF6F1",
      fontFamily: FONT,
      padding: "32px 24px",
    }}>
      <style>{`
        @media (max-width: 768px) {
          .tt-root { padding: 20px 16px !important; }
          .tt-ideas-grid { grid-template-columns: 1fr !important; }
          .tt-schedule-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .tt-metrics-grid { grid-template-columns: 1fr 1fr !important; }
          .tt-analytics-row { grid-template-columns: 1fr !important; }
          .tt-content-mix { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
      {/* Max width container */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}>
              🎵
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: 2 }}>
                Content Strategy
              </div>
              <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                TikTok Dashboard
              </h1>
            </div>
          </div>
          <p style={{ fontFamily: FONT, fontSize: 14, color: "#888", maxWidth: 560, margin: 0 }}>
            Content ideas, weekly scheduling, trending audios, and performance analytics for Remedy Pilates on TikTok.
          </p>
        </div>

        {/* Pillar overview strip */}
        <div style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 28,
        }}>
          {PILLARS.map((p) => (
            <div key={p.id} style={{
              ...s.card,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: "1 1 160px",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#333" }}>{p.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: p.color, fontWeight: 700 }}>Target {p.pct}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          background: "rgba(0,0,0,0.04)",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
        }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...s.pill,
                  background: isActive ? "#fff" : "transparent",
                  color: isActive ? ACCENT : "#777",
                  boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "ideas" && <ContentIdeasTab />}
        {activeTab === "schedule" && <ScheduleTab />}
        {activeTab === "audios" && <TrendingAudiosTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}
