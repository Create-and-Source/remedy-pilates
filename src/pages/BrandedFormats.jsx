import { useState, useMemo } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const ACCENT       = "#C4704B";
const ACCENT_LIGHT = "#FDF5F0";
const FONT         = "'Outfit', sans-serif";
const DISPLAY      = "'Playfair Display', serif";
const MONO         = "'JetBrains Mono', monospace";
const CARD_BG      = "rgba(255,255,255,0.72)";
const CARD_BORDER  = "rgba(255,255,255,0.6)";

const s = {
  card: {
    background: CARD_BG,
    backdropFilter: "blur(20px)",
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

// ─── Format Data ──────────────────────────────────────────────────────────────
const FORMATS = [
  {
    classType:   "Reformer",
    brandName:   "REMEDY FLOW",
    tagline:     "Lengthen. Strengthen. Transform.",
    color:       "#C4704B",
    category:    "Reformer-based",
    description: "Our signature reformer class that takes you through a full-body sequence designed to build long, lean muscle while improving posture and mobility. Equal parts challenge and grace.",
    equipment:   ["Reformer", "Foot Bar", "Springs"],
    duration:    50,
    difficulty:  "All Levels",
  },
  {
    classType:   "Mat",
    brandName:   "REMEDY CORE",
    tagline:     "Your foundation starts here.",
    color:       "#6B8F71",
    category:    "Mat-based",
    description: "A deep dive into classical Pilates mat work. No equipment required — just your body, your breath, and your intention. Build the core strength that powers everything else you do.",
    equipment:   ["Mat", "Resistance Band (optional)"],
    duration:    45,
    difficulty:  "Beginner–Intermediate",
  },
  {
    classType:   "Barre",
    brandName:   "REMEDY SCULPT",
    tagline:     "Pulse. Hold. Shake. Repeat.",
    color:       "#8B6B94",
    category:    "Barre-based",
    description: "Barre meets Pilates in this ballet-inspired format targeting the seat, thighs, and arms through small isometric movements. Expect high reps, low impact, and serious results.",
    equipment:   ["Barre", "Mat", "Light Weights", "Ball"],
    duration:    50,
    difficulty:  "All Levels",
  },
  {
    classType:   "Barre Burn",
    brandName:   "REMEDY BURN",
    tagline:     "Turn up the burn.",
    color:       "#B85C38",
    category:    "Barre-based",
    description: "The elevated version of REMEDY SCULPT. Faster tempo, heavier weights, and cardio intervals between barre sections. Your muscles will not forget this one.",
    equipment:   ["Barre", "Mat", "Medium Weights", "Resistance Band"],
    duration:    55,
    difficulty:  "Intermediate–Advanced",
  },
  {
    classType:   "TRX Fusion",
    brandName:   "REMEDY SUSPEND",
    tagline:     "Defy gravity.",
    color:       "#5B7B8F",
    category:    "Specialty",
    description: "Suspension training fused with Pilates principles. TRX straps challenge your stability on every exercise, forcing your core to work overtime. Functional strength at its finest.",
    equipment:   ["TRX Straps", "Mat"],
    duration:    50,
    difficulty:  "Intermediate",
  },
  {
    classType:   "Stretch & Restore",
    brandName:   "REMEDY RESTORE",
    tagline:     "Move better. Feel better.",
    color:       "#7BA68B",
    category:    "Specialty",
    description: "A therapeutic stretch and mobility class that uses breathwork, foam rolling, and guided flexibility sequences. Essential recovery for every active body.",
    equipment:   ["Mat", "Foam Roller", "Strap", "Bolster"],
    duration:    45,
    difficulty:  "All Levels",
  },
  {
    classType:   "Reformer + Cardio",
    brandName:   "REMEDY TORCH",
    tagline:     "Reformer meets cardio fire.",
    color:       "#D4704B",
    category:    "Reformer-based",
    description: "Interval-style class alternating between reformer sequences and cardio bursts on the floor. Elevates your heart rate while keeping the Pilates mind-body connection intact.",
    equipment:   ["Reformer", "Jump Board", "Mat", "Light Weights"],
    duration:    55,
    difficulty:  "Intermediate–Advanced",
  },
  {
    classType:   "Group Apparatus",
    brandName:   "REMEDY APPARATUS",
    tagline:     "The full studio experience.",
    color:       "#A68B6B",
    category:    "Reformer-based",
    description: "Rotates through the full suite of Pilates apparatus — reformer, Cadillac, chair, and barrel. A comprehensive class that deepens your understanding of classical Pilates.",
    equipment:   ["Reformer", "Cadillac", "Wunda Chair", "Spine Corrector"],
    duration:    60,
    difficulty:  "Intermediate–Advanced",
  },
  {
    classType:   "Private Training",
    brandName:   "REMEDY PRIVATE",
    tagline:     "Your body. Your plan.",
    color:       "#8B7B6B",
    category:    "Specialty",
    description: "One-on-one session with a REMEDY instructor. Your goals, your timeline, your full attention. The fastest path to results and the most personalized experience we offer.",
    equipment:   ["Full Studio Access"],
    duration:    55,
    difficulty:  "All Levels",
  },
  {
    classType:   "Semi-Private",
    brandName:   "REMEDY DUO",
    tagline:     "Better together.",
    color:       "#6B8B8F",
    category:    "Specialty",
    description: "Small-group training for two to three clients with semi-personalized programming. The accountability of a partner, the precision of near-private instruction.",
    equipment:   ["Reformer", "Mat", "Various Apparatus"],
    duration:    55,
    difficulty:  "All Levels",
  },
  {
    classType:   "Prenatal",
    brandName:   "REMEDY BLOOM",
    tagline:     "Strength for two.",
    color:       "#C47B8E",
    category:    "Specialty",
    description: "A gentle, safe, and empowering class designed specifically for pregnant clients. Focuses on pelvic floor strength, back relief, and breath awareness throughout all trimesters.",
    equipment:   ["Mat", "Bolster", "Resistance Band", "Ball"],
    duration:    45,
    difficulty:  "All Levels (Prenatal)",
  },
  {
    classType:   "Youth Conditioning",
    brandName:   "REMEDY JUNIOR",
    tagline:     "Start strong. Stay strong.",
    color:       "#5BA68B",
    category:    "Specialty",
    description: "Age-appropriate Pilates and functional conditioning for teen athletes. Builds body awareness, core stability, and injury resilience during critical developmental years.",
    equipment:   ["Mat", "Light Weights", "Resistance Band"],
    duration:    45,
    difficulty:  "Beginner–Intermediate",
  },
  {
    classType:   "Intro to Reformer",
    brandName:   "REMEDY FIRST",
    tagline:     "Your first step.",
    color:       "#7B8FC4",
    category:    "Reformer-based",
    description: "The essential starting point for anyone new to reformer Pilates. Learn the machine, the springs, the vocabulary, and the fundamentals that will make every class better from here on out.",
    equipment:   ["Reformer", "Foot Bar"],
    duration:    50,
    difficulty:  "Beginner",
  },
];

// ─── Exported Utility ─────────────────────────────────────────────────────────
export function toBrandName(classType) {
  const match = FORMATS.find(
    (f) => f.classType.toLowerCase() === classType.toLowerCase()
  );
  return match ? match.brandName : classType;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Reformer-based", "Mat-based", "Barre-based", "Specialty"];

function DifficultyDots({ level }) {
  const map = {
    "Beginner":              1,
    "Beginner–Intermediate": 2,
    "All Levels":            2,
    "Intermediate":          3,
    "Intermediate–Advanced": 4,
    "Advanced":              5,
    "All Levels (Prenatal)": 2,
  };
  const filled = map[level] ?? 2;
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: i < filled ? ACCENT : "#E5DDD5",
            display: "inline-block",
          }}
        />
      ))}
    </span>
  );
}

function FormatCard({ format }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s.card,
        borderTop: `6px solid ${format.color}`,
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)"
          : s.card.boxShadow,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 24px 16px",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ ...s.label, marginBottom: 8 }}>{format.classType}</div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 22,
            fontWeight: 700,
            color: format.color,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          {format.brandName}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: "#888",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          "{format.tagline}"
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 13.5,
            color: "#555",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {format.description}
        </p>

        {/* Equipment */}
        <div>
          <div style={{ ...s.label, marginBottom: 6 }}>Equipment</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {format.equipment.map((eq) => (
              <span
                key={eq}
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 500,
                  background: ACCENT_LIGHT,
                  color: ACCENT,
                  borderRadius: 6,
                  padding: "3px 8px",
                  letterSpacing: "0.03em",
                }}
              >
                {eq}
              </span>
            ))}
          </div>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: 4,
            borderTop: "1px solid rgba(0,0,0,0.05)",
            marginTop: "auto",
          }}
        >
          <div>
            <div style={{ ...s.label, marginBottom: 4 }}>Duration</div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 13,
                fontWeight: 600,
                color: "#333",
              }}
            >
              {format.duration} min
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ ...s.label, marginBottom: 4 }}>Difficulty</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
              <DifficultyDots level={format.difficulty} />
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 11,
                  color: "#888",
                }}
              >
                {format.difficulty}
              </span>
            </div>
          </div>
          <div>
            <div style={{ ...s.label, marginBottom: 4 }}>Category</div>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 600,
                color: format.color,
                background: `${format.color}18`,
                borderRadius: 100,
                padding: "3px 10px",
              }}
            >
              {format.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div
      style={{
        ...s.card,
        padding: "20px 28px",
        textAlign: "center",
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 36,
          fontWeight: 700,
          color: ACCENT,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ ...s.label }}>{label}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BrandedFormats() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return FORMATS.filter((f) => {
      const matchCat =
        activeCategory === "All" || f.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        f.brandName.toLowerCase().includes(q) ||
        f.classType.toLowerCase().includes(q) ||
        f.tagline.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.equipment.some((e) => e.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  // Stats
  const totalFormats = FORMATS.length;
  const equipmentSet = new Set(FORMATS.flatMap((f) => f.equipment));
  const totalEquipment = equipmentSet.size;
  const categoryCount = CATEGORIES.length - 1; // exclude "All"
  const avgDuration = Math.round(
    FORMATS.reduce((sum, f) => sum + f.duration, 0) / FORMATS.length
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF6F1",
        fontFamily: FONT,
        paddingBottom: 80,
      }}
    >
      {/* Page Header */}
      <div
        style={{
          padding: "48px 48px 0",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div style={{ ...s.label, marginBottom: 10 }}>Class System</div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: 42,
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          Brand Guide
        </h1>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 15,
            color: "#888",
            margin: "0 0 36px",
            maxWidth: 520,
            lineHeight: 1.6,
          }}
        >
          Every class format at REMEDY carries a distinct identity. Use this
          guide to understand the brand name, voice, and purpose behind each
          offering.
        </p>

        {/* Search + Filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "0 0 auto" }}>
            <svg
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#aaa",
                pointerEvents: "none",
              }}
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={11} cy={11} r={8} />
              <line x1={21} y1={21} x2={16.65} y2={16.65} />
            </svg>
            <input
              type="text"
              placeholder="Search formats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: "#333",
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: 100,
                padding: "9px 18px 9px 38px",
                outline: "none",
                width: 220,
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = ACCENT;
                e.target.style.boxShadow = `0 0 0 3px ${ACCENT}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0,0,0,0.10)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Category Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    ...s.pill,
                    background: active ? ACCENT : "rgba(255,255,255,0.85)",
                    color: active ? "#fff" : "#666",
                    border: active ? "none" : "1px solid rgba(0,0,0,0.10)",
                    boxShadow: active
                      ? `0 2px 12px ${ACCENT}40`
                      : "none",
                    transform: active ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Result count */}
          {(search || activeCategory !== "All") && (
            <span
              style={{
                ...s.label,
                marginLeft: "auto",
              }}
            >
              {filtered.length} format{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div
        style={{
          padding: "0 48px",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "#aaa",
              fontFamily: FONT,
              fontSize: 15,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
            No formats match your search.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {filtered.map((format) => (
              <FormatCard key={format.classType} format={format} />
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div
        style={{
          padding: "56px 48px 0",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            borderTop: "1px solid rgba(0,0,0,0.07)",
            paddingTop: 40,
          }}
        >
          <div style={{ ...s.label, marginBottom: 20 }}>Brand System Overview</div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <StatCard value={totalFormats} label="Total Formats" />
            <StatCard value={totalEquipment} label="Equipment Types" />
            <StatCard value={categoryCount} label="Categories" />
            <StatCard value={`${avgDuration}m`} label="Avg Duration" />
            <StatCard
              value={FORMATS.filter((f) => f.difficulty === "All Levels").length}
              label="All-Levels Classes"
            />
            <StatCard
              value={FORMATS.filter((f) => f.category === "Reformer-based").length}
              label="Reformer-Based"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
