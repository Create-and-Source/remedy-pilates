import { useState, useMemo } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT       = "#C4704B";
const ACCENT_LIGHT = "#FDF5F0";
const FONT         = "'Outfit', sans-serif";
const DISPLAY      = "'Playfair Display', serif";
const MONO         = "'JetBrains Mono', monospace";
const CARD_BG      = "rgba(255,255,255,0.72)";
const CARD_BORDER  = "rgba(255,255,255,0.6)";

const s = {
  card: {
    background:    CARD_BG,
    backdropFilter:"blur(20px)",
    border:        `1px solid ${CARD_BORDER}`,
    borderRadius:  16,
    boxShadow:     "0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  },
  pill: {
    border:       "none",
    borderRadius: 100,
    cursor:       "pointer",
    fontFamily:   FONT,
    fontSize:     13,
    fontWeight:   500,
    padding:      "8px 18px",
    transition:   "all 0.2s",
  },
  label: {
    fontFamily:    MONO,
    fontSize:      10,
    fontWeight:    600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color:         "#999",
  },
};

// ─── Event package definitions ────────────────────────────────────────────────
const EVENT_TYPES = [
  {
    id:       "birthday",
    name:     "Birthday Party",
    base:     350,
    minGuests:4,
    maxGuests:12,
    color:    "#C47B8E",
    emoji:    "🎂",
    tagline:  "Celebrate your special day in style",
    includes: [
      "Private reformer class",
      "Grip socks for all",
      "Celebratory champagne toast",
      "Group photo",
    ],
  },
  {
    id:       "bachelorette",
    name:     "Bachelorette",
    base:     450,
    minGuests:6,
    maxGuests:14,
    color:    "#8B6B94",
    emoji:    "💍",
    tagline:  "Last workout before the big day",
    includes: [
      "Themed class",
      "Matching grip socks",
      "Champagne & mimosa bar",
      "Custom playlist",
      "Photo booth props",
    ],
  },
  {
    id:       "corporate",
    name:     "Corporate Wellness",
    base:     500,
    minGuests:8,
    maxGuests:20,
    color:    "#5B7B8F",
    emoji:    "💼",
    tagline:  "Invest in your team's wellbeing",
    includes: [
      "Team building reformer class",
      "Wellness talk",
      "Healthy snacks",
      "Branded water bottles",
    ],
  },
  {
    id:       "bridal",
    name:     "Bridal Shower",
    base:     400,
    minGuests:6,
    maxGuests:14,
    color:    "#C4704B",
    emoji:    "👰",
    tagline:  "A mindful celebration for the bride",
    includes: [
      "Gentle reformer flow",
      "Champagne",
      "Flower crown station",
      "Group photo",
    ],
  },
  {
    id:       "milestone",
    name:     "Milestone Celebration",
    base:     300,
    minGuests:4,
    maxGuests:10,
    color:    "#6B8F71",
    emoji:    "🏆",
    tagline:  "Mark life's biggest moments",
    includes: [
      "Choice of class format",
      "Cake & refreshments",
      "Celebration decor",
    ],
  },
  {
    id:       "team",
    name:     "Team Building",
    base:     600,
    minGuests:10,
    maxGuests:25,
    color:    "#A68B6B",
    emoji:    "🤝",
    tagline:  "Build bonds through movement",
    includes: [
      "Mixed-format class rotation",
      "Catered lunch",
      "Team challenge activities",
      "Certificates",
    ],
  },
];

const LOCATIONS = ["Scottsdale", "Arcadia", "North Central"];

const ADDONS = [
  { id: "photo",       label: "Photo Package",      price: 150,  unit: "flat" },
  { id: "socks",       label: "Custom Grip Socks",  price: 18,   unit: "per guest" },
  { id: "champagne",   label: "Champagne Upgrade",  price: 75,   unit: "flat" },
  { id: "cake",        label: "Cake",                price: 65,   unit: "flat" },
  { id: "flowers",     label: "Flowers",             price: 85,   unit: "flat" },
  { id: "time",        label: "Extended Time (+30 min)", price: 100, unit: "flat" },
];

// ─── Seeded bookings ──────────────────────────────────────────────────────────
const SEEDED_BOOKINGS = [
  {
    id:       1,
    name:     "Sarah's 30th Birthday",
    type:     "Birthday",
    location: "Scottsdale",
    date:     "Mar 22",
    guests:   8,
    total:    520,
    status:   "Confirmed",
  },
  {
    id:       2,
    name:     "TechCorp Team Day",
    type:     "Corporate",
    location: "North Central",
    date:     "Mar 28",
    guests:   15,
    total:    875,
    status:   "Confirmed",
  },
  {
    id:       3,
    name:     "Jessica's Bachelorette",
    type:     "Bachelorette",
    location: "Arcadia",
    date:     "Apr 5",
    guests:   10,
    total:    680,
    status:   "Pending",
  },
  {
    id:       4,
    name:     "Spring Wedding Shower",
    type:     "Bridal",
    location: "Scottsdale",
    date:     "Apr 12",
    guests:   8,
    total:    550,
    status:   "Inquiry",
  },
];

const TAX_RATE = 0.086;

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    Confirmed: { bg: "#E8F5E9", color: "#388E3C" },
    Pending:   { bg: "#FFF8E1", color: "#F9A825" },
    Inquiry:   { bg: "#F5F5F5", color: "#757575" },
  };
  const c = config[status] || config.Inquiry;
  return (
    <span style={{
      background:   c.bg,
      color:        c.color,
      borderRadius: 100,
      padding:      "3px 10px",
      fontSize:     12,
      fontWeight:   600,
      fontFamily:   FONT,
      whiteSpace:   "nowrap",
    }}>
      {status}
    </span>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon }) {
  return (
    <div style={{ ...s.card, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ ...s.label, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, fontFamily: DISPLAY, color: "#1A1A1A" }}>{value}</span>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#999", fontFamily: FONT }}>{sub}</div>}
    </div>
  );
}

// ─── Package card ────────────────────────────────────────────────────────────
function PackageCard({ pkg, onBuild }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s.card,
        padding:    0,
        overflow:   "hidden",
        transform:  hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow:  hovered
          ? "0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04)"
          : s.card.boxShadow,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Color header */}
      <div style={{
        background:    pkg.color,
        padding:       "24px 24px 20px",
        position:      "relative",
        overflow:      "hidden",
      }}>
        <div style={{
          position:   "absolute",
          top:        -20,
          right:      -20,
          fontSize:   80,
          opacity:    0.15,
          lineHeight: 1,
        }}>{pkg.emoji}</div>
        <div style={{ fontSize: 28, marginBottom: 6 }}>{pkg.emoji}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
          {pkg.name}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
          {pkg.tagline}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px 24px" }}>
        {/* Price & guests */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <span style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: "#1A1A1A" }}>
              ${pkg.base}
            </span>
            <span style={{ fontFamily: FONT, fontSize: 12, color: "#999", marginLeft: 4 }}>base</span>
          </div>
          <div style={{
            background:   "#F5F0EB",
            borderRadius: 100,
            padding:      "4px 12px",
            fontFamily:   MONO,
            fontSize:     11,
            color:        "#7A6A5A",
            fontWeight:   600,
          }}>
            {pkg.minGuests}–{pkg.maxGuests} guests
          </div>
        </div>

        {/* Includes */}
        <div style={{ ...s.label, marginBottom: 10 }}>What's included</div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {pkg.includes.map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 13, color: "#444" }}>
              <span style={{ color: pkg.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onBuild(pkg)}
          style={{
            ...s.pill,
            background: pkg.color,
            color:      "#fff",
            width:      "100%",
            marginTop:  20,
            fontSize:   14,
            fontWeight: 600,
            padding:    "11px 18px",
          }}
        >
          Get a Quote →
        </button>
      </div>
    </div>
  );
}

// ─── Inquiry modal ────────────────────────────────────────────────────────────
function InquiryModal({ quoteDetails, onClose }) {
  const [form, setForm]       = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inp = {
    width:       "100%",
    border:      "1px solid rgba(0,0,0,0.12)",
    borderRadius:10,
    padding:     "10px 14px",
    fontFamily:  FONT,
    fontSize:    14,
    outline:     "none",
    background:  "#fff",
    boxSizing:   "border-box",
    color:       "#1A1A1A",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position:       "fixed",
        inset:          0,
        background:     "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex:         1000,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...s.card,
          width:     "100%",
          maxWidth:  480,
          padding:   32,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {submitted ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
              Inquiry Submitted!
            </div>
            <div style={{ fontFamily: FONT, fontSize: 14, color: "#666", marginBottom: 24 }}>
              We'll reach out within 24 hours to confirm your group booking.
            </div>
            <button onClick={onClose} style={{ ...s.pill, background: ACCENT, color: "#fff" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>
                  Submit Inquiry
                </div>
                <div style={{ fontFamily: FONT, fontSize: 13, color: "#999", marginTop: 4 }}>
                  {quoteDetails}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#999", padding: 4 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ ...s.label, marginBottom: 6 }}>Full Name *</div>
                <input
                  required
                  style={inp}
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <div style={{ ...s.label, marginBottom: 6 }}>Email *</div>
                <input
                  required
                  type="email"
                  style={inp}
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <div style={{ ...s.label, marginBottom: 6 }}>Phone</div>
                <input
                  type="tel"
                  style={inp}
                  placeholder="(480) 555-0100"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <div style={{ ...s.label, marginBottom: 6 }}>Notes</div>
                <textarea
                  rows={3}
                  style={{ ...inp, resize: "vertical", minHeight: 80 }}
                  placeholder="Any special requests, dietary needs, or questions..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                style={{
                  ...s.pill,
                  background: ACCENT,
                  color:      "#fff",
                  padding:    "12px 18px",
                  fontSize:   14,
                  fontWeight: 600,
                  marginTop:  6,
                }}
              >
                Submit Inquiry
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Quote sidebar ────────────────────────────────────────────────────────────
function QuoteSidebar({ selectedType, guests, selectedAddons, onSubmit }) {
  const pkg = EVENT_TYPES.find(e => e.id === selectedType);

  const lineItems = useMemo(() => {
    if (!pkg) return [];
    const items = [{ label: `${pkg.name} base price`, amount: pkg.base }];
    const extraGuests = Math.max(0, guests - pkg.minGuests);
    if (extraGuests > 0) {
      items.push({ label: `Additional guests (${extraGuests} × $25)`, amount: extraGuests * 25 });
    }
    ADDONS.forEach(addon => {
      if (selectedAddons.includes(addon.id)) {
        const amt = addon.unit === "per guest" ? addon.price * guests : addon.price;
        const unitLabel = addon.unit === "per guest" ? ` (${guests} × $${addon.price})` : "";
        items.push({ label: `${addon.label}${unitLabel}`, amount: amt });
      }
    });
    return items;
  }, [pkg, guests, selectedAddons]);

  const subtotal = useMemo(() => lineItems.reduce((s, i) => s + i.amount, 0), [lineItems]);
  const tax      = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total    = subtotal + tax;

  if (!pkg) {
    return (
      <div style={{ ...s.card, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: "#999" }}>
          Select an event type to see your quote
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...s.card, padding: 24, position: "sticky", top: 80 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
        Your Quote
      </div>
      <div style={{ fontFamily: FONT, fontSize: 12, color: "#999", marginBottom: 20 }}>
        {pkg.name} · {guests} guests
      </div>

      {/* Line items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {lineItems.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontFamily: FONT, fontSize: 13, color: "#555", lineHeight: 1.4 }}>{item.label}</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: "#1A1A1A", fontWeight: 600, flexShrink: 0 }}>
              ${item.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: FONT, fontSize: 13, color: "#555" }}>Subtotal</span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>
            ${subtotal.toLocaleString()}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 0 }}>
          <span style={{ fontFamily: FONT, fontSize: 13, color: "#555" }}>Tax (8.6%)</span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>
            ${tax.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Total */}
      <div style={{
        background:   ACCENT_LIGHT,
        borderRadius: 10,
        padding:      "12px 16px",
        display:      "flex",
        justifyContent:"space-between",
        alignItems:   "center",
        marginBottom: 20,
      }}>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Total</span>
        <span style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: ACCENT }}>
          ${total.toFixed(2)}
        </span>
      </div>

      <button
        onClick={onSubmit}
        style={{
          ...s.pill,
          background: ACCENT,
          color:      "#fff",
          width:      "100%",
          padding:    "12px 18px",
          fontSize:   14,
          fontWeight: 600,
        }}
      >
        Submit Inquiry →
      </button>
      <div style={{ fontFamily: FONT, fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 10 }}>
        No payment required now · We'll confirm details first
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GroupBookings() {
  const [activeTab,     setActiveTab]     = useState("packages");
  const [showModal,     setShowModal]     = useState(false);

  // Builder state
  const [builderType,   setBuilderType]   = useState("");
  const [guests,        setGuests]        = useState(8);
  const [location,      setLocation]      = useState(LOCATIONS[0]);
  const [preferredDate, setPreferredDate] = useState("");
  const [selectedAddons, setSelectedAddons] = useState([]);

  const selectedPkg = EVENT_TYPES.find(e => e.id === builderType);

  // Clamp guests within range when type changes
  const handleTypeChange = (typeId) => {
    setBuilderType(typeId);
    const pkg = EVENT_TYPES.find(e => e.id === typeId);
    if (pkg) {
      setGuests(g => Math.min(Math.max(g, pkg.minGuests), pkg.maxGuests));
    }
    setSelectedAddons([]);
  };

  const handleGuestChange = (delta) => {
    if (!selectedPkg) return;
    setGuests(g => Math.min(Math.max(g + delta, selectedPkg.minGuests), selectedPkg.maxGuests));
  };

  const toggleAddon = (id) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const quoteDetails = selectedPkg
    ? `${selectedPkg.name} · ${guests} guests · ${location}`
    : "";

  // KPI values
  const totalRevenue = SEEDED_BOOKINGS.reduce((s, b) => s + b.total, 0);
  const avgGuests    = Math.round(SEEDED_BOOKINGS.reduce((s, b) => s + b.guests, 0) / SEEDED_BOOKINGS.length);
  const upcoming     = SEEDED_BOOKINGS.filter(b => b.status !== "Inquiry").length;

  const TAB_DATA = [
    { id: "packages", label: "Packages" },
    { id: "bookings", label: "Bookings" },
    { id: "builder",  label: "Builder" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6F1", fontFamily: FONT }}>
      <style>{`
        @media (max-width: 768px) {
          .gb-table-header { display: none !important; }
          .gb-table-row { grid-template-columns: 1fr auto !important; }
          .gb-table-row > *:nth-child(n+3) { display: none !important; }
          .gb-builder-grid { grid-template-columns: 1fr !important; }
          .gb-guest-grid { grid-template-columns: 1fr !important; }
          .gb-page-inner { padding: 16px 12px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ ...s.label, marginBottom: 8, color: ACCENT }}>Group Events</div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 700, color: "#1A1A1A", margin: 0, marginBottom: 8 }}>
            Group Bookings
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 15, color: "#666", margin: 0 }}>
            Manage private events, bespoke group packages, and booking inquiries
          </p>
        </div>

        {/* KPI cards */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap:                 16,
          marginBottom:        32,
        }}>
          <KpiCard label="Total Bookings"    value={SEEDED_BOOKINGS.length}        sub="All time"           icon="📋" />
          <KpiCard label="Revenue This Qtr"  value={`$${totalRevenue.toLocaleString()}`} sub="Q1 2025"       icon="💰" />
          <KpiCard label="Avg Group Size"    value={`${avgGuests} ppl`}            sub="Per booking"        icon="👥" />
          <KpiCard label="Upcoming Events"   value={upcoming}                      sub="Confirmed & pending" icon="📅" />
        </div>

        {/* Tab bar */}
        <div style={{
          display:      "flex",
          gap:          8,
          marginBottom: 28,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          paddingBottom:0,
        }}>
          {TAB_DATA.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background:   "none",
                border:       "none",
                cursor:       "pointer",
                fontFamily:   FONT,
                fontSize:     14,
                fontWeight:   600,
                color:        activeTab === tab.id ? ACCENT : "#888",
                padding:      "10px 18px",
                borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : "2px solid transparent",
                marginBottom: -1,
                transition:   "color 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Packages tab ─────────────────────────────────────────────────── */}
        {activeTab === "packages" && (
          <div>
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap:                 20,
            }}>
              {EVENT_TYPES.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onBuild={(pkg) => {
                    handleTypeChange(pkg.id);
                    setActiveTab("builder");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Bookings tab ─────────────────────────────────────────────────── */}
        {activeTab === "bookings" && (
          <div style={{ ...s.card, overflow: "hidden" }}>
            {/* Table header */}
            <div className="gb-table-header" style={{
              display:      "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 80px 100px 100px",
              gap:          12,
              padding:      "14px 24px",
              background:   "rgba(0,0,0,0.02)",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}>
              {["Event Name", "Type", "Location", "Date", "Guests", "Total", "Status"].map(h => (
                <div key={h} style={{ ...s.label }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {SEEDED_BOOKINGS.map((booking, i) => (
              <div
                key={booking.id}
                className="gb-table-row"
                style={{
                  display:         "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 80px 100px 100px",
                  gap:             12,
                  padding:         "16px 24px",
                  borderBottom:    i < SEEDED_BOOKINGS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  alignItems:      "center",
                  transition:      "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.015)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                  {booking.name}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 13, color: "#555" }}>
                  {booking.type}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 13, color: "#555" }}>
                  {booking.location}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: "#555" }}>
                  {booking.date}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>
                  {booking.guests}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: ACCENT, fontWeight: 700 }}>
                  ${booking.total.toLocaleString()}
                </div>
                <div>
                  <StatusBadge status={booking.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Builder tab ───────────────────────────────────────────────────── */}
        {activeTab === "builder" && (
          <div className="gb-builder-grid" style={{
            display:             "grid",
            gridTemplateColumns: "1fr 320px",
            gap:                 24,
            alignItems:          "start",
          }}>
            {/* Left: form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Event type selector */}
              <div style={{ ...s.card, padding: 24 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>
                  Event Type
                </div>
                <div style={{
                  display:             "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap:                 10,
                }}>
                  {EVENT_TYPES.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => handleTypeChange(pkg.id)}
                      style={{
                        border:       builderType === pkg.id ? `2px solid ${pkg.color}` : "2px solid rgba(0,0,0,0.1)",
                        borderRadius: 12,
                        padding:      "12px 14px",
                        cursor:       "pointer",
                        background:   builderType === pkg.id ? `${pkg.color}14` : "#fff",
                        textAlign:    "left",
                        transition:   "all 0.2s",
                        fontFamily:   FONT,
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{pkg.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 2 }}>{pkg.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: pkg.color, fontWeight: 600 }}>${pkg.base}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest counter + location + date */}
              <div className="gb-guest-grid" style={{ ...s.card, padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                {/* Guest counter */}
                <div>
                  <div style={{ ...s.label, marginBottom: 10 }}>Number of Guests</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={() => handleGuestChange(-1)}
                      disabled={!selectedPkg || guests <= selectedPkg.minGuests}
                      style={{
                        width:        36,
                        height:       36,
                        borderRadius: "50%",
                        border:       "1.5px solid rgba(0,0,0,0.15)",
                        background:   "#fff",
                        cursor:       "pointer",
                        fontSize:     18,
                        display:      "flex",
                        alignItems:   "center",
                        justifyContent:"center",
                        fontFamily:   FONT,
                        opacity:      (!selectedPkg || guests <= (selectedPkg?.minGuests ?? 0)) ? 0.4 : 1,
                        flexShrink:   0,
                      }}
                    >
                      −
                    </button>
                    <span style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, color: "#1A1A1A", minWidth: 30, textAlign: "center" }}>
                      {guests}
                    </span>
                    <button
                      onClick={() => handleGuestChange(1)}
                      disabled={!selectedPkg || guests >= selectedPkg.maxGuests}
                      style={{
                        width:        36,
                        height:       36,
                        borderRadius: "50%",
                        border:       "1.5px solid rgba(0,0,0,0.15)",
                        background:   "#fff",
                        cursor:       "pointer",
                        fontSize:     18,
                        display:      "flex",
                        alignItems:   "center",
                        justifyContent:"center",
                        fontFamily:   FONT,
                        opacity:      (!selectedPkg || guests >= (selectedPkg?.maxGuests ?? Infinity)) ? 0.4 : 1,
                        flexShrink:   0,
                      }}
                    >
                      +
                    </button>
                  </div>
                  {selectedPkg && (
                    <div style={{ fontFamily: FONT, fontSize: 11, color: "#aaa", marginTop: 6 }}>
                      Min {selectedPkg.minGuests} · Max {selectedPkg.maxGuests}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <div style={{ ...s.label, marginBottom: 10 }}>Location</div>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{
                      width:        "100%",
                      border:       "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 10,
                      padding:      "9px 12px",
                      fontFamily:   FONT,
                      fontSize:     14,
                      color:        "#1A1A1A",
                      background:   "#fff",
                      outline:      "none",
                      cursor:       "pointer",
                    }}
                  >
                    {LOCATIONS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <div style={{ ...s.label, marginBottom: 10 }}>Preferred Date</div>
                  <input
                    type="text"
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                    placeholder="e.g. April 20, 2025"
                    style={{
                      width:        "100%",
                      border:       "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 10,
                      padding:      "9px 12px",
                      fontFamily:   FONT,
                      fontSize:     14,
                      color:        "#1A1A1A",
                      background:   "#fff",
                      outline:      "none",
                      boxSizing:    "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Add-ons */}
              <div style={{ ...s.card, padding: 24 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>
                  Add-ons
                </div>
                <div style={{
                  display:             "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap:                 10,
                }}>
                  {ADDONS.map(addon => {
                    const checked = selectedAddons.includes(addon.id);
                    const price   = addon.unit === "per guest"
                      ? `$${addon.price}/person`
                      : `$${addon.price}`;
                    return (
                      <label
                        key={addon.id}
                        style={{
                          display:      "flex",
                          alignItems:   "center",
                          gap:          10,
                          padding:      "12px 14px",
                          border:       `1.5px solid ${checked ? ACCENT : "rgba(0,0,0,0.1)"}`,
                          borderRadius: 10,
                          cursor:       "pointer",
                          background:   checked ? ACCENT_LIGHT : "#fff",
                          transition:   "all 0.2s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddon(addon.id)}
                          style={{ accentColor: ACCENT, width: 16, height: 16, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
                            {addon.label}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 11, color: ACCENT, marginTop: 2 }}>
                            {price}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: quote sidebar */}
            <QuoteSidebar
              selectedType={builderType}
              guests={guests}
              selectedAddons={selectedAddons}
              onSubmit={() => setShowModal(true)}
            />
          </div>
        )}
      </div>

      {/* Inquiry modal */}
      {showModal && (
        <InquiryModal
          quoteDetails={quoteDetails}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
