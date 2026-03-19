import { useState } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const ACCENT       = "#C4704B";
const ACCENT_LIGHT = "#FDF5F0";
const FONT         = "'Outfit', sans-serif";
const DISPLAY      = "'Playfair Display', serif";
const MONO         = "'JetBrains Mono', monospace";
const CARD_BG      = "rgba(255,255,255,0.72)";
const CARD_BORDER  = "rgba(255,255,255,0.6)";
const BG           = "#FAF6F1";

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

// ─── Static Data ──────────────────────────────────────────────────────────────
const LOCATIONS = [
  {
    id: "scottsdale",
    name: "Scottsdale",
    address: "7014 E Camelback Rd, Suite 1234",
    city: "Scottsdale, AZ 85251",
    phone: "(480) 555-0101",
    parking: "Free parking in rear lot",
    icon: "🌵",
  },
  {
    id: "arcadia",
    name: "Arcadia",
    address: "3508 E Indian School Rd",
    city: "Phoenix, AZ 85018",
    phone: "(480) 555-0102",
    parking: "Street parking available",
    icon: "🌴",
  },
  {
    id: "north-central",
    name: "North Central",
    address: "5025 N Central Ave",
    city: "Phoenix, AZ 85012",
    phone: "(480) 555-0103",
    parking: "Garage parking, Level 2",
    icon: "🏙️",
  },
];

const CLASSES = [
  {
    id: "remedy-first",
    name: "REMEDY FIRST",
    tagline: "Your intro to the reformer.",
    description: "Zero experience needed. We walk you through everything from foot bar height to spring resistance. The perfect starting point.",
    duration: "50 min",
    level: "Beginner",
    recommended: true,
    color: "#C4704B",
    bg: "#FDF5F0",
  },
  {
    id: "remedy-core",
    name: "REMEDY CORE",
    tagline: "Mat-based class for all levels.",
    description: "Core focus with foundational Pilates movements on the mat. Accessible for newcomers, challenging for regulars.",
    duration: "45 min",
    level: "All Levels",
    recommended: false,
    color: "#6366F1",
    bg: "#EDEFFD",
  },
  {
    id: "remedy-sculpt",
    name: "REMEDY SCULPT",
    tagline: "Barre-inspired toning.",
    description: "Great energy, great music. Small isometric movements that create long, lean lines. Expect to feel the burn.",
    duration: "55 min",
    level: "All Levels",
    recommended: false,
    color: "#D97706",
    bg: "#FEF3C7",
  },
  {
    id: "remedy-restore",
    name: "REMEDY RESTORE",
    tagline: "Gentle stretching. Perfect first experience.",
    description: "A slower, more mindful practice focused on flexibility, breathwork, and recovery. Deeply nourishing.",
    duration: "50 min",
    level: "Beginner-friendly",
    recommended: false,
    color: "#059669",
    bg: "#D1FAE5",
  },
];

const TIME_SLOTS = [
  { id: "mon-6am",  day: "Mon", date: "Mar 24", time: "6:00 AM",  instructor: "Kelly S.",    spots: 3, almostFull: true,  lastSpot: false },
  { id: "mon-930", day: "Mon", date: "Mar 24", time: "9:30 AM",  instructor: "Megan T.",    spots: 5, almostFull: false, lastSpot: false },
  { id: "tue-12pm", day: "Tue", date: "Mar 25", time: "12:00 PM", instructor: "Rachel K.",   spots: 8, almostFull: false, lastSpot: false },
  { id: "wed-530", day: "Wed", date: "Mar 26", time: "5:30 PM",  instructor: "Danielle P.", spots: 2, almostFull: true,  lastSpot: false },
  { id: "thu-7am",  day: "Thu", date: "Mar 27", time: "7:00 AM",  instructor: "Ava M.",      spots: 6, almostFull: false, lastSpot: false },
  { id: "sat-8am",  day: "Sat", date: "Mar 29", time: "8:00 AM",  instructor: "Kelly S.",    spots: 1, almostFull: false, lastSpot: true  },
];

const TESTIMONIALS = [
  {
    quote: "I was terrified to try my first class — I had zero Pilates experience. Remedy made me feel completely at home from the second I walked in.",
    name: "Sarah M.",
    location: "Scottsdale",
    months: "Member for 8 months",
  },
  {
    quote: "The instructors remember your name, your goals, your injuries. It feels like a community, not just a gym.",
    name: "Priya L.",
    location: "Arcadia",
    months: "Member for 14 months",
  },
  {
    quote: "I went for the free class and never left. That was two years ago. Best decision I've made for my body.",
    name: "Jordan T.",
    location: "North Central",
    months: "Member for 2 years",
  },
];

const STEPS = [
  { number: 1, label: "Location" },
  { number: 2, label: "Class Type" },
  { number: 3, label: "Time Slot" },
  { number: 4, label: "Your Info" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TopNav() {
  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(250,246,241,0.88)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(196,112,75,0.1)",
      padding: "0 24px",
      height: 60,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <a
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 100,
          background: ACCENT,
          color: "#fff",
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 16,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        R
      </a>
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: "#2D2320", letterSpacing: "-0.01em" }}>
        Remedy Pilates &amp; Barre
      </span>
    </nav>
  );
}

function ProgressBar({ step }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {STEPS.map((st, i) => {
          const done    = step > st.number;
          const active  = step === st.number;
          const upcoming = step < st.number;
          return (
            <div key={st.number} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              {/* Circle */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.3s",
                  background: done ? ACCENT : active ? ACCENT : "rgba(0,0,0,0.06)",
                  color: done || active ? "#fff" : "#aaa",
                  border: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                  boxShadow: active ? `0 0 0 4px ${ACCENT}22` : "none",
                }}>
                  {done ? "✓" : st.number}
                </div>
                <span style={{
                  ...s.label,
                  color: active ? ACCENT : done ? "#666" : "#ccc",
                  transition: "color 0.3s",
                  whiteSpace: "nowrap",
                }}>
                  {st.label}
                </span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  marginBottom: 22,
                  background: done ? ACCENT : "rgba(0,0,0,0.08)",
                  transition: "background 0.4s",
                  marginLeft: 8,
                  marginRight: 8,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TestimonialsSection() {
  return (
    <div style={{ maxWidth: 760, margin: "48px auto 0", padding: "0 24px" }}>
      <p style={{ ...s.label, textAlign: "center", marginBottom: 20 }}>What members say</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {TESTIMONIALS.map((t) => (
          <div key={t.name} style={{
            ...s.card,
            padding: "20px 22px",
          }}>
            <p style={{
              fontFamily: FONT,
              fontSize: 14,
              lineHeight: 1.65,
              color: "#4A3830",
              margin: "0 0 14px",
              fontStyle: "italic",
            }}>
              "{t.quote}"
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#2D2320" }}>{t.name}</span>
              <span style={{ ...s.label, color: ACCENT }}>{t.location} · {t.months}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Location ─────────────────────────────────────────────────────────
function StepLocation({ selected, onSelect }) {
  return (
    <div>
      <p style={{ ...s.label, textAlign: "center", marginBottom: 8 }}>Step 1 of 4</p>
      <h2 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: "#2D2320", textAlign: "center", margin: "0 0 6px" }}>
        Choose your studio
      </h2>
      <p style={{ fontFamily: FONT, fontSize: 15, color: "#8A7068", textAlign: "center", margin: "0 0 28px" }}>
        All three locations share the same quality instructors and equipment.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {LOCATIONS.map((loc) => {
          const isSelected = selected === loc.id;
          return (
            <div
              key={loc.id}
              onClick={() => onSelect(loc.id)}
              style={{
                ...s.card,
                padding: "20px 24px",
                cursor: "pointer",
                border: isSelected ? `2px solid ${ACCENT}` : `1px solid ${CARD_BORDER}`,
                boxShadow: isSelected
                  ? `0 0 0 4px ${ACCENT}18, 0 4px 24px rgba(0,0,0,0.04)`
                  : s.card.boxShadow,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "flex-start",
                gap: 18,
                background: isSelected ? ACCENT_LIGHT : CARD_BG,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: isSelected ? `${ACCENT}22` : "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
                transition: "background 0.2s",
              }}>
                {loc.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: "#2D2320" }}>{loc.name}</span>
                  {isSelected && (
                    <span style={{
                      ...s.pill,
                      padding: "2px 10px",
                      fontSize: 11,
                      background: ACCENT,
                      color: "#fff",
                    }}>
                      Selected
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#6B5750", margin: "0 0 2px", lineHeight: 1.5 }}>
                  {loc.address}
                </p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#6B5750", margin: "0 0 8px" }}>{loc.city}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ ...s.label, color: "#9A8A82" }}>📞 {loc.phone}</span>
                  <span style={{ ...s.label, color: "#9A8A82" }}>🅿 {loc.parking}</span>
                </div>
              </div>

              {/* Radio */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${isSelected ? ACCENT : "#D4C4BC"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
                transition: "all 0.2s",
              }}>
                {isSelected && (
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: ACCENT }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Class Type ───────────────────────────────────────────────────────
function StepClass({ selected, onSelect }) {
  return (
    <div>
      <p style={{ ...s.label, textAlign: "center", marginBottom: 8 }}>Step 2 of 4</p>
      <h2 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: "#2D2320", textAlign: "center", margin: "0 0 6px" }}>
        Pick your first class
      </h2>
      <p style={{ fontFamily: FONT, fontSize: 15, color: "#8A7068", textAlign: "center", margin: "0 0 28px" }}>
        Not sure? We recommend starting with Remedy First — it's designed exactly for this moment.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {CLASSES.map((cls) => {
          const isSelected = selected === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => onSelect(cls.id)}
              style={{
                ...s.card,
                padding: "20px 22px",
                cursor: "pointer",
                border: isSelected ? `2px solid ${ACCENT}` : `1px solid ${CARD_BORDER}`,
                boxShadow: isSelected
                  ? `0 0 0 4px ${ACCENT}18, 0 4px 24px rgba(0,0,0,0.04)`
                  : s.card.boxShadow,
                background: isSelected ? ACCENT_LIGHT : CARD_BG,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              {/* Color icon block */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: cls.bg,
                border: `1.5px solid ${cls.color}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: cls.color,
                  opacity: 0.85,
                }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    color: cls.color,
                  }}>
                    {cls.name}
                  </span>
                  {cls.recommended && (
                    <span style={{
                      ...s.pill,
                      padding: "2px 10px",
                      fontSize: 10,
                      background: "#16A34A",
                      color: "#fff",
                      letterSpacing: "0.04em",
                      fontFamily: MONO,
                      fontWeight: 700,
                    }}>
                      Recommended for You
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: "#2D2320", margin: "0 0 4px" }}>
                  {cls.tagline}
                </p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#8A7068", margin: "0 0 10px", lineHeight: 1.55 }}>
                  {cls.description}
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ ...s.label }}>⏱ {cls.duration}</span>
                  <span style={{ ...s.label }}>◈ {cls.level}</span>
                </div>
              </div>

              {/* Radio */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${isSelected ? ACCENT : "#D4C4BC"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
                transition: "all 0.2s",
              }}>
                {isSelected && (
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: ACCENT }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Time Slot ────────────────────────────────────────────────────────
function StepTime({ selected, onSelect }) {
  return (
    <div>
      <p style={{ ...s.label, textAlign: "center", marginBottom: 8 }}>Step 3 of 4</p>
      <h2 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: "#2D2320", textAlign: "center", margin: "0 0 6px" }}>
        Reserve your spot
      </h2>
      <p style={{ fontFamily: FONT, fontSize: 15, color: "#8A7068", textAlign: "center", margin: "0 0 28px" }}>
        Upcoming availability — spots fill quickly on weekday mornings.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TIME_SLOTS.map((slot) => {
          const isSelected = selected === slot.id;
          const urgent = slot.lastSpot || slot.almostFull;
          return (
            <div
              key={slot.id}
              onClick={() => onSelect(slot.id)}
              style={{
                ...s.card,
                padding: "16px 20px",
                cursor: "pointer",
                border: isSelected ? `2px solid ${ACCENT}` : `1px solid ${CARD_BORDER}`,
                boxShadow: isSelected
                  ? `0 0 0 4px ${ACCENT}18, 0 4px 24px rgba(0,0,0,0.04)`
                  : s.card.boxShadow,
                background: isSelected ? ACCENT_LIGHT : CARD_BG,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {/* Day + date badge */}
              <div style={{
                minWidth: 52,
                textAlign: "center",
                padding: "6px 10px",
                borderRadius: 10,
                background: isSelected ? `${ACCENT}22` : "rgba(0,0,0,0.04)",
                transition: "background 0.2s",
              }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: isSelected ? ACCENT : "#999", lineHeight: 1 }}>
                  {slot.day}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: "#bbb", marginTop: 2 }}>{slot.date}</div>
              </div>

              {/* Time */}
              <div style={{ flex: "0 0 90px" }}>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: "#2D2320" }}>{slot.time}</span>
              </div>

              {/* Instructor */}
              <div style={{ flex: 1 }}>
                <span style={{ ...s.label }}>with {slot.instructor}</span>
              </div>

              {/* Spots */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {slot.lastSpot ? (
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#DC2626",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: "#FEE2E2",
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}>
                    Last Spot!
                  </span>
                ) : slot.almostFull ? (
                  <span style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#DC2626",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: "#FEE2E2",
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}>
                    Almost Full
                  </span>
                ) : (
                  <span style={{ ...s.label }}>{slot.spots} spots</span>
                )}
              </div>

              {/* Radio */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${isSelected ? ACCENT : "#D4C4BC"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
              }}>
                {isSelected && (
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: ACCENT }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Intake Form ──────────────────────────────────────────────────────
function StepIntake({ form, setForm }) {
  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    fontFamily: FONT,
    fontSize: 14,
    color: "#2D2320",
    background: "rgba(255,255,255,0.9)",
    border: "1.5px solid rgba(196,112,75,0.18)",
    borderRadius: 10,
    padding: "12px 14px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#8A7068",
    marginBottom: 6,
    display: "block",
  };

  function handleChange(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div>
      <p style={{ ...s.label, textAlign: "center", marginBottom: 8 }}>Step 4 of 4</p>
      <h2 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: "#2D2320", textAlign: "center", margin: "0 0 6px" }}>
        A little about you
      </h2>
      <p style={{ fontFamily: FONT, fontSize: 15, color: "#8A7068", textAlign: "center", margin: "0 0 28px" }}>
        Your instructor will review this before class so they can support you from the start.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Name row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={labelStyle}>First Name *</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Jane"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name *</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Smith"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input
            style={inputStyle}
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input
            style={inputStyle}
            type="tel"
            placeholder="(480) 555-0000"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>

        {/* Experience */}
        <div>
          <label style={labelStyle}>Pilates Experience *</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.experience}
            onChange={(e) => handleChange("experience", e.target.value)}
          >
            <option value="">Select one...</option>
            <option value="none">Never tried Pilates</option>
            <option value="few">1–5 classes</option>
            <option value="regular">Regular practitioner</option>
          </select>
        </div>

        {/* Injuries */}
        <div>
          <label style={labelStyle}>Any injuries or limitations?</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.55 }}
            placeholder="E.g. lower back sensitivity, recovering from a shoulder sprain... (or leave blank)"
            value={form.injuries}
            onChange={(e) => handleChange("injuries", e.target.value)}
          />
        </div>

        {/* How did you hear */}
        <div>
          <label style={labelStyle}>How did you hear about us?</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.referral}
            onChange={(e) => handleChange("referral", e.target.value)}
          >
            <option value="">Select one...</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google Search</option>
            <option value="friend">Friend / Family</option>
            <option value="tiktok">TikTok</option>
            <option value="yelp">Yelp</option>
            <option value="neighborhood">Neighborhood flyer / signage</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Fine print */}
        <p style={{ fontFamily: FONT, fontSize: 12, color: "#B0A09A", lineHeight: 1.6, margin: 0 }}>
          By booking you agree to our cancellation policy: cancel at least 24 hours before class to avoid a late cancel fee. Your first class is completely free — no card required today.
        </p>
      </div>
    </div>
  );
}

// ─── Confirmation ─────────────────────────────────────────────────────────────
function Confirmation({ location, classType, timeSlot, form }) {
  const loc  = LOCATIONS.find((l) => l.id === location);
  const cls  = CLASSES.find((c) => c.id === classType);
  const slot = TIME_SLOTS.find((t) => t.id === timeSlot);

  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const BRING_LIST = [
    { icon: "💧", text: "Water bottle" },
    { icon: "🧦", text: "Grip socks (optional — we sell them at the front desk)" },
    { icon: "👕", text: "Comfortable, form-fitting clothes" },
    { icon: "⏰", text: "Arrive 10 minutes early to meet your instructor" },
  ];

  return (
    <div style={{ textAlign: "center" }}>
      {/* Animated checkmark */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: `linear-gradient(135deg, #16A34A 0%, #22C55E 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px",
        fontSize: 36,
        boxShadow: "0 8px 32px rgba(22,163,74,0.28)",
        animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      }}>
        ✓
      </div>

      <h2 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: "#2D2320", margin: "0 0 8px" }}>
        You're booked, {form.firstName || "friend"}!
      </h2>
      <p style={{ fontFamily: FONT, fontSize: 15, color: "#8A7068", margin: "0 0 32px", lineHeight: 1.6 }}>
        We'll send a confirmation to <strong>{form.email}</strong>.<br />
        We can't wait to see you on the reformer.
      </p>

      {/* Booking summary card */}
      <div style={{
        ...s.card,
        textAlign: "left",
        padding: "22px 24px",
        marginBottom: 24,
        border: `1.5px solid ${ACCENT}33`,
      }}>
        <p style={{ ...s.label, color: ACCENT, marginBottom: 16 }}>Booking Summary</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Studio", value: loc ? `${loc.name} — ${loc.address}, ${loc.city}` : "—" },
            { label: "Class", value: cls ? `${cls.name} · ${cls.duration} · ${cls.level}` : "—" },
            { label: "Time", value: slot ? `${slot.day}, ${slot.date} at ${slot.time} with ${slot.instructor}` : "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: 12 }}>
              <span style={{ ...s.label, minWidth: 60, paddingTop: 2 }}>{label}</span>
              <span style={{ fontFamily: FONT, fontSize: 14, color: "#4A3830", lineHeight: 1.5, flex: 1 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What to bring */}
      <div style={{
        ...s.card,
        textAlign: "left",
        padding: "22px 24px",
        marginBottom: 32,
      }}>
        <p style={{ ...s.label, marginBottom: 16 }}>What to Bring</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BRING_LIST.map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <span style={{ fontFamily: FONT, fontSize: 14, color: "#4A3830", lineHeight: 1.55 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Social sharing */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <p style={{ ...s.label, margin: 0 }}>Share with a friend</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href={`https://www.instagram.com/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...s.pill,
              background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
              color: "#fff",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📸 Instagram
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...s.pill,
              background: "#1877F2",
              color: "#fff",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            👥 Facebook
          </a>
          <button
            onClick={handleCopyLink}
            style={{
              ...s.pill,
              background: copied ? "#16A34A" : "rgba(0,0,0,0.06)",
              color: copied ? "#fff" : "#4A3830",
            }}
          >
            {copied ? "✓ Copied!" : "🔗 Copy Link"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FreeTrialFlow() {
  const [step,     setStep]     = useState(1);
  const [location, setLocation] = useState(null);
  const [classType, setClass]   = useState(null);
  const [timeSlot, setTimeSlot] = useState(null);
  const [form,     setForm]     = useState({
    firstName:  "",
    lastName:   "",
    email:      "",
    phone:      "",
    experience: "",
    injuries:   "",
    referral:   "",
  });
  const [done, setDone] = useState(false);

  const canContinue =
    (step === 1 && location !== null) ||
    (step === 2 && classType !== null) ||
    (step === 3 && timeSlot !== null) ||
    (step === 4 && form.firstName && form.lastName && form.email && form.experience);

  function handleContinue() {
    if (!canContinue) return;
    if (step < 4) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const showTestimonials = !done && (step === 1 || step === 2);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT }}>
      {/* Nav */}
      <TopNav />

      {/* Hero */}
      {!done && step === 1 && (
        <div style={{
          textAlign: "center",
          padding: "56px 24px 40px",
          maxWidth: 600,
          margin: "0 auto",
        }}>
          <span style={{
            display: "inline-block",
            background: "#16A34A",
            color: "#fff",
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "6px 16px",
            borderRadius: 100,
            marginBottom: 20,
          }}>
            Your First Class Is Free
          </span>
          <h1 style={{
            fontFamily: DISPLAY,
            fontSize: "clamp(32px, 7vw, 52px)",
            fontWeight: 700,
            color: "#2D2320",
            margin: "0 0 14px",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}>
            Experience Remedy
          </h1>
          <p style={{
            fontFamily: FONT,
            fontSize: 17,
            color: "#8A7068",
            lineHeight: 1.65,
            margin: 0,
            maxWidth: 480,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Book your free intro class in under two minutes. No card required, no commitment. Just you, the reformer, and an instructor who's been waiting to meet you.
          </p>
        </div>
      )}

      {/* Confirmation hero text */}
      {done && (
        <div style={{ padding: "40px 24px 0", textAlign: "center" }} />
      )}

      {/* Progress bar — only when not done */}
      {!done && <ProgressBar step={step} />}

      {/* Main content card */}
      <div style={{ maxWidth: 680, margin: "28px auto 0", padding: "0 16px 80px" }}>
        <div style={{ ...s.card, padding: "32px 28px" }}>
          {done ? (
            <Confirmation
              location={location}
              classType={classType}
              timeSlot={timeSlot}
              form={form}
            />
          ) : (
            <>
              {step === 1 && <StepLocation selected={location} onSelect={setLocation} />}
              {step === 2 && <StepClass    selected={classType} onSelect={setClass}   />}
              {step === 3 && <StepTime     selected={timeSlot}  onSelect={setTimeSlot} />}
              {step === 4 && <StepIntake   form={form}          setForm={setForm}      />}

              {/* Navigation buttons */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 32,
                paddingTop: 24,
                borderTop: "1px solid rgba(0,0,0,0.06)",
                gap: 12,
              }}>
                {step > 1 ? (
                  <button
                    onClick={handleBack}
                    style={{
                      ...s.pill,
                      background: "transparent",
                      border: `1.5px solid rgba(0,0,0,0.12)`,
                      color: "#8A7068",
                      padding: "10px 22px",
                    }}
                  >
                    ← Back
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  style={{
                    ...s.pill,
                    padding: "12px 32px",
                    fontSize: 15,
                    fontWeight: 700,
                    background: canContinue
                      ? `linear-gradient(135deg, ${ACCENT} 0%, #D4845F 100%)`
                      : "rgba(0,0,0,0.08)",
                    color: canContinue ? "#fff" : "#bbb",
                    cursor: canContinue ? "pointer" : "not-allowed",
                    boxShadow: canContinue ? `0 4px 16px ${ACCENT}44` : "none",
                    transform: canContinue ? "none" : "none",
                    transition: "all 0.25s",
                  }}
                >
                  {step === 4 ? "Book My Free Class →" : "Continue →"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Testimonials */}
        {showTestimonials && <TestimonialsSection />}

        {/* Bottom trust note */}
        {!done && (
          <p style={{
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 13,
            color: "#B0A09A",
            marginTop: 32,
            lineHeight: 1.6,
          }}>
            🔒 Your info is never shared. No card required. Cancel anytime before class.
          </p>
        )}
      </div>
    </div>
  );
}
