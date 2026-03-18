import { useState, useMemo } from "react";

// ─── Design Tokens ───────────────────────────────────────────────────────────
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

// ─── Tier Data ────────────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "drop-in",
    name: "Drop-In",
    price: "$38",
    priceSub: "per class",
    color: "#8B7B6B",
    bookingWindow: 3,
    friendPasses: "0",
    friendPassDetail: "None",
    retailDiscount: 0,
    birthdayGift: null,
    priorityWaitlist: false,
    merchDiscount: false,
    eventAccess: false,
    recoveryText: false,
    badge: null,
    perks: [
      { label: "Booking window", value: "3 days ahead", included: true },
      { label: "Friend passes", value: "None", included: false },
      { label: "Retail discount", value: "None", included: false },
      { label: "Birthday gift", value: "None", included: false },
      { label: "Priority waitlist", value: "No", included: false },
    ],
  },
  {
    id: "10-class",
    name: "10-Class Pack",
    price: "$340",
    priceSub: "$34/class",
    color: "#6B8F71",
    bookingWindow: 7,
    friendPasses: "1 per pack",
    friendPassDetail: "1 per pack",
    retailDiscount: 5,
    birthdayGift: "Free class",
    priorityWaitlist: false,
    merchDiscount: false,
    eventAccess: false,
    recoveryText: false,
    badge: null,
    perks: [
      { label: "Booking window", value: "7 days ahead", included: true },
      { label: "Friend passes", value: "1 per pack", included: true },
      { label: "Retail discount", value: "5% off retail", included: true },
      { label: "Birthday gift", value: "Free class", included: true },
      { label: "Priority waitlist", value: "No", included: false },
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited Monthly",
    price: "$189",
    priceSub: "per month",
    color: "#C4704B",
    bookingWindow: 14,
    friendPasses: "1 per month",
    friendPassDetail: "1 per month",
    retailDiscount: 10,
    birthdayGift: "Free private",
    priorityWaitlist: true,
    merchDiscount: false,
    eventAccess: false,
    recoveryText: false,
    badge: "Most Popular",
    perks: [
      { label: "Booking window", value: "14 days ahead", included: true },
      { label: "Friend passes", value: "1 per month", included: true },
      { label: "Retail discount", value: "10% off retail", included: true },
      { label: "Birthday gift", value: "Free private session", included: true },
      { label: "Priority waitlist", value: "Yes", included: true },
    ],
  },
  {
    id: "vip",
    name: "VIP Annual",
    price: "$1,799",
    priceSub: "$150/mo billed annually",
    color: "#8B6B94",
    bookingWindow: 30,
    friendPasses: "2 per month",
    friendPassDetail: "2 per month",
    retailDiscount: 15,
    birthdayGift: "Curated gift box",
    priorityWaitlist: true,
    merchDiscount: true,
    eventAccess: true,
    recoveryText: true,
    badge: null,
    perks: [
      { label: "Booking window", value: "30 days ahead", included: true },
      { label: "Friend passes", value: "2 per month", included: true },
      { label: "Retail discount", value: "15% off retail", included: true },
      { label: "Birthday gift", value: "Curated gift box", included: true },
      { label: "Priority waitlist", value: "Yes", included: true },
      { label: "Merch discount", value: "Exclusive discount", included: true },
      { label: "Event access", value: "Members-only events", included: true },
      { label: "Recovery texts", value: "Personalized check-ins", included: true },
    ],
  },
];

// ─── Friend Pass Seed Data ────────────────────────────────────────────────────
const FRIEND_PASSES = [
  { id: 1, member: "Caitlin Rhodes",    tier: "Unlimited Monthly", used: 1, total: 1, friendName: "Mara Chen",      date: "2026-03-10", status: "Used" },
  { id: 2, member: "Sofia Navarro",     tier: "VIP Annual",        used: 1, total: 2, friendName: "Priya Mehta",    date: "2026-03-12", status: "Used" },
  { id: 3, member: "Jourdan Bell",      tier: "10-Class Pack",     used: 0, total: 1, friendName: "—",              date: "—",          status: "Available" },
  { id: 4, member: "Alexis Tran",       tier: "VIP Annual",        used: 2, total: 2, friendName: "Leila Osman",    date: "2026-03-15", status: "Used" },
  { id: 5, member: "Natasha Kim",       tier: "Unlimited Monthly", used: 0, total: 1, friendName: "—",              date: "—",          status: "Available" },
  { id: 6, member: "Brooke Weston",     tier: "VIP Annual",        used: 1, total: 2, friendName: "Simone Dupont",  date: "2026-03-08", status: "Used" },
  { id: 7, member: "Maya Okafor",       tier: "10-Class Pack",     used: 1, total: 1, friendName: "Hannah Reyes",   date: "2026-03-17", status: "Used" },
  { id: 8, member: "Camille Dubois",    tier: "Unlimited Monthly", used: 1, total: 1, friendName: "Iris Solano",    date: "2026-03-16", status: "Used" },
];

// ─── Birthday Seed Data ───────────────────────────────────────────────────────
const BIRTHDAYS = [
  { id: 1, name: "Caitlin Rhodes",   date: "Mar 19", tier: "Unlimited Monthly", gift: "Free private session" },
  { id: 2, name: "Sofia Navarro",    date: "Mar 21", tier: "VIP Annual",        gift: "Curated gift box" },
  { id: 3, name: "Jourdan Bell",     date: "Mar 23", tier: "10-Class Pack",     gift: "Free class" },
  { id: 4, name: "Alexis Tran",      date: "Mar 25", tier: "VIP Annual",        gift: "Curated gift box" },
  { id: 5, name: "Natasha Kim",      date: "Mar 27", tier: "Unlimited Monthly", gift: "Free private session" },
  { id: 6, name: "Brooke Weston",    date: "Mar 30", tier: "Drop-In",           gift: "None" },
  { id: 7, name: "Maya Okafor",      date: "Apr 3",  tier: "10-Class Pack",     gift: "Free class" },
  { id: 8, name: "Camille Dubois",   date: "Apr 11", tier: "Unlimited Monthly", gift: "Free private session" },
];

// ─── KPI Cards ────────────────────────────────────────────────────────────────
const KPI_DATA = [
  { label: "Active Members",        value: "284",   sub: "across all tiers" },
  { label: "Friend Passes Used",    value: "23",    sub: "this month" },
  { label: "Upcoming Birthdays",    value: "8",     sub: "next 30 days" },
  { label: "Avg Booking Utilization", value: "71%", sub: "of window used" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tierColor(tierName) {
  const t = TIERS.find(t => t.name === tierName);
  return t ? t.color : "#999";
}

function TierBadge({ tier }) {
  const color = tierColor(tier);
  return (
    <span style={{
      display: "inline-block",
      background: color + "18",
      color,
      borderRadius: 100,
      padding: "2px 10px",
      fontFamily: MONO,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {tier}
    </span>
  );
}

function CheckIcon({ included }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: included ? "#E8F5E9" : "#F5F5F5",
      color: included ? "#4CAF50" : "#BDBDBD",
      fontSize: 12,
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {included ? "✓" : "×"}
    </span>
  );
}

// ─── Tab: Tiers ───────────────────────────────────────────────────────────────
function TiersTab() {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
      {TIERS.map(tier => (
        <div
          key={tier.id}
          onMouseEnter={() => setHovered(tier.id)}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...s.card,
            padding: 28,
            position: "relative",
            transition: "transform 0.2s, box-shadow 0.2s",
            transform: hovered === tier.id ? "translateY(-4px)" : "none",
            boxShadow: hovered === tier.id
              ? `0 12px 40px ${tier.color}22, 0 2px 8px rgba(0,0,0,0.06)`
              : s.card.boxShadow,
            borderTop: `3px solid ${tier.color}`,
          }}
        >
          {/* Most Popular Badge */}
          {tier.badge && (
            <div style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: ACCENT,
              color: "#fff",
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 100,
              padding: "3px 10px",
              letterSpacing: "0.03em",
            }}>
              {tier.badge}
            </div>
          )}

          {/* Tier color dot + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: tier.color,
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: DISPLAY,
              fontSize: 19,
              fontWeight: 600,
              color: "#1A1A1A",
            }}>
              {tier.name}
            </span>
          </div>

          {/* Price */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 700,
              color: tier.color,
              letterSpacing: "-0.02em",
            }}>
              {tier.price}
            </span>
            <span style={{
              fontFamily: FONT,
              fontSize: 13,
              color: "#888",
              marginLeft: 6,
            }}>
              {tier.priceSub}
            </span>
          </div>

          {/* Perks list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tier.perks.map((perk, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckIcon included={perk.included} />
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: "#999", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {perk.label}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: perk.included ? "#1A1A1A" : "#BBB", fontWeight: 500 }}>
                    {perk.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking window pill at bottom */}
          <div style={{
            marginTop: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: tier.color + "14",
            borderRadius: 100,
            padding: "5px 12px",
          }}>
            <span style={{ fontSize: 13, color: tier.color }}>🗓</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: tier.color, fontWeight: 600 }}>
              {tier.bookingWindow}-day booking window
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Friend Passes ───────────────────────────────────────────────────────
function FriendPassesTab() {
  const usedCount = useMemo(() => FRIEND_PASSES.filter(p => p.status === "Used").length, []);

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Passes Issued", value: FRIEND_PASSES.length },
          { label: "Used This Month",     value: usedCount },
          { label: "Available",           value: FRIEND_PASSES.length - usedCount },
        ].map((kpi, i) => (
          <div key={i} style={{ ...s.card, padding: "14px 20px", minWidth: 140, flex: "0 0 auto" }}>
            <div style={s.label}>{kpi.label}</div>
            <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginTop: 4 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ ...s.card, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              {["Member", "Tier", "Passes Used / Total", "Friend Invited", "Date Used", "Status"].map(h => (
                <th key={h} style={{
                  ...s.label,
                  padding: "12px 16px",
                  textAlign: "left",
                  background: "rgba(0,0,0,0.02)",
                  fontWeight: 600,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRIEND_PASSES.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: i < FRIEND_PASSES.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = ACCENT_LIGHT}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)"}
              >
                <td style={{ padding: "12px 16px", fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>
                  {row.member}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <TierBadge tier={row.tier} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 48,
                      height: 6,
                      borderRadius: 3,
                      background: "#EEE",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${(row.used / row.total) * 100}%`,
                        height: "100%",
                        background: tierColor(row.tier),
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: "#666" }}>
                      {row.used}/{row.total}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontFamily: FONT, fontSize: 13, color: row.friendName === "—" ? "#CCC" : "#444" }}>
                  {row.friendName}
                </td>
                <td style={{ padding: "12px 16px", fontFamily: MONO, fontSize: 12, color: "#888" }}>
                  {row.date}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 100,
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: row.status === "Used" ? "#E8F5E9" : ACCENT_LIGHT,
                    color: row.status === "Used" ? "#4CAF50" : ACCENT,
                  }}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Birthdays ───────────────────────────────────────────────────────────
function BirthdaysTab() {
  return (
    <div>
      <div style={{
        fontFamily: MONO,
        fontSize: 11,
        color: "#999",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 16,
      }}>
        Upcoming Birthdays · Next 30 Days
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BIRTHDAYS.map((member, i) => {
          const hasGift = member.gift !== "None";
          const color = tierColor(member.tier);

          return (
            <div
              key={member.id}
              style={{
                ...s.card,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.boxShadow = `0 6px 24px rgba(0,0,0,0.06)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = s.card.boxShadow;
              }}
            >
              {/* Day countdown decoration */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: color + "18",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 18 }}>🎂</span>
              </div>

              {/* Name + date */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}>
                  {member.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: "#999", marginTop: 2, letterSpacing: "0.04em" }}>
                  {member.date}
                </div>
              </div>

              {/* Tier */}
              <TierBadge tier={member.tier} />

              {/* Gift */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={s.label}>Gift</div>
                <div style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: hasGift ? color : "#CCC",
                  marginTop: 2,
                }}>
                  {member.gift}
                </div>
              </div>

              {/* Send reminder button */}
              <button
                style={{
                  ...s.pill,
                  background: hasGift ? ACCENT_LIGHT : "#F5F5F5",
                  color: hasGift ? ACCENT : "#BBB",
                  fontSize: 12,
                  padding: "6px 14px",
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (hasGift) e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = hasGift ? ACCENT_LIGHT : "#F5F5F5"; e.currentTarget.style.color = hasGift ? ACCENT : "#BBB"; }}
              >
                Send Gift
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Booking Windows ─────────────────────────────────────────────────────
function BookingWindowsTab() {
  const maxDays = 30;

  return (
    <div>
      <div style={{
        fontFamily: MONO,
        fontSize: 11,
        color: "#999",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 20,
      }}>
        Advance booking window by tier (days before class)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {TIERS.map(tier => {
          const pct = (tier.bookingWindow / maxDays) * 100;

          return (
            <div key={tier.id} style={{ ...s.card, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tier.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, color: "#1A1A1A" }}>
                    {tier.name}
                  </span>
                  {tier.badge && (
                    <span style={{
                      background: ACCENT,
                      color: "#fff",
                      fontFamily: FONT,
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 100,
                      padding: "2px 8px",
                    }}>
                      {tier.badge}
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: tier.color, letterSpacing: "-0.02em" }}>
                    {tier.bookingWindow}
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: 14, color: "#888", marginLeft: 4 }}>
                    {tier.bookingWindow === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              {/* Animated progress bar */}
              <div style={{
                width: "100%",
                height: 14,
                borderRadius: 7,
                background: "#F0EEEC",
                overflow: "hidden",
                position: "relative",
              }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: 7,
                    background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
                    transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Shimmer effect */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                    animation: "shimmer 2s infinite",
                  }} />
                </div>
              </div>

              {/* Scale labels */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
              }}>
                {[0, 7, 14, 21, 30].map(d => (
                  <span key={d} style={{ fontFamily: MONO, fontSize: 10, color: d <= tier.bookingWindow ? tier.color : "#CCC" }}>
                    {d}d
                  </span>
                ))}
              </div>

              {/* Tier price reminder */}
              <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={s.label}>Price</div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginTop: 2 }}>
                    {tier.price} <span style={{ color: "#888", fontWeight: 400 }}>{tier.priceSub}</span>
                  </div>
                </div>
                <div>
                  <div style={s.label}>Retail Discount</div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginTop: 2 }}>
                    {tier.retailDiscount > 0 ? `${tier.retailDiscount}% off` : "None"}
                  </div>
                </div>
                <div>
                  <div style={s.label}>Friend Passes</div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginTop: 2 }}>
                    {tier.friendPassDetail}
                  </div>
                </div>
                <div>
                  <div style={s.label}>Priority Waitlist</div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: tier.priorityWaitlist ? "#4CAF50" : "#BBB", marginTop: 2 }}>
                    {tier.priorityWaitlist ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        ...s.card,
        padding: "14px 20px",
        marginTop: 20,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: "#999", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Legend:
        </span>
        {TIERS.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color }} />
            <span style={{ fontFamily: FONT, fontSize: 12, color: "#555" }}>{t.name}</span>
          </div>
        ))}
        <span style={{ fontFamily: MONO, fontSize: 10, color: "#BBB", marginLeft: "auto" }}>
          Scale: 0 – 30 days
        </span>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
const TABS = [
  { id: "tiers",    label: "Tiers" },
  { id: "passes",   label: "Friend Passes" },
  { id: "bdays",    label: "Birthdays" },
  { id: "windows",  label: "Booking Windows" },
];

export default function MembershipPerks() {
  const [activeTab, setActiveTab] = useState("tiers");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF6F1",
      fontFamily: FONT,
      padding: "32px 28px",
      boxSizing: "border-box",
    }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={s.label}>Membership</div>
        <h1 style={{
          fontFamily: DISPLAY,
          fontSize: 30,
          fontWeight: 700,
          color: "#1A1A1A",
          margin: "6px 0 6px",
          letterSpacing: "-0.01em",
        }}>
          Membership Perks
        </h1>
        <p style={{ fontFamily: FONT, fontSize: 14, color: "#888", margin: 0 }}>
          Manage tier benefits, friend pass usage, upcoming birthdays, and booking windows.
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 32 }}>
        {KPI_DATA.map((kpi, i) => (
          <div key={i} style={{ ...s.card, padding: "18px 20px" }}>
            <div style={s.label}>{kpi.label}</div>
            <div style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
              margin: "6px 0 2px",
            }}>
              {kpi.value}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: "#AAA" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: 6,
        marginBottom: 24,
        background: CARD_BG,
        backdropFilter: "blur(20px)",
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 100,
        padding: 4,
        width: "fit-content",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...s.pill,
                background: active ? ACCENT : "transparent",
                color: active ? "#fff" : "#666",
                fontWeight: active ? 600 : 500,
                boxShadow: active ? "0 2px 8px rgba(196,112,75,0.28)" : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "tiers"   && <TiersTab />}
        {activeTab === "passes"  && <FriendPassesTab />}
        {activeTab === "bdays"   && <BirthdaysTab />}
        {activeTab === "windows" && <BookingWindowsTab />}
      </div>
    </div>
  );
}
