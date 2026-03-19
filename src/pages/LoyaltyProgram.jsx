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

// ─── Tier Config ─────────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "bronze",
    name: "Bronze",
    color: "#CD7F32",
    bg: "#FDF3E7",
    minPts: 0,
    classPoints: 10,
    perks: ["10 pts per class", "Birthday bonus (50 pts)", "Member newsletter"],
  },
  {
    id: "silver",
    name: "Silver",
    color: "#9E9E9E",
    bg: "#F5F5F5",
    minPts: 200,
    classPoints: 12,
    perks: ["12 pts per class", "All Bronze perks", "Early class booking", "5% retail discount"],
  },
  {
    id: "gold",
    name: "Gold",
    color: "#E6B800",
    bg: "#FFFBE6",
    minPts: 500,
    classPoints: 15,
    perks: ["15 pts per class", "All Silver perks", "Free guest pass / month", "10% retail discount", "Priority waitlist"],
  },
  {
    id: "platinum",
    name: "Platinum",
    color: "#888",
    bg: "#F7F7F7",
    minPts: 1000,
    classPoints: 20,
    perks: ["20 pts per class", "All Gold perks", "Free private session / quarter", "15% retail discount", "Dedicated concierge", "VIP events"],
  },
];

function getTier(pts) {
  if (pts >= 1000) return TIERS[3];
  if (pts >= 500) return TIERS[2];
  if (pts >= 200) return TIERS[1];
  return TIERS[0];
}

// ─── Earning Rules ────────────────────────────────────────────────────────────
const EARNING_RULES = [
  { id: "class_bronze", category: "Class Attendance", label: "Class attended (Bronze)", points: 10, icon: "🧘" },
  { id: "class_silver", category: "Class Attendance", label: "Class attended (Silver)", points: 12, icon: "🧘" },
  { id: "class_gold", category: "Class Attendance", label: "Class attended (Gold)", points: 15, icon: "🧘" },
  { id: "class_plat", category: "Class Attendance", label: "Class attended (Platinum)", points: 20, icon: "🧘" },
  { id: "streak_3", category: "Streak Bonuses", label: "3-day streak bonus", points: 25, icon: "🔥" },
  { id: "streak_5", category: "Streak Bonuses", label: "5-day streak bonus", points: 50, icon: "🔥" },
  { id: "streak_7", category: "Streak Bonuses", label: "7-day streak bonus", points: 100, icon: "🔥" },
  { id: "referral", category: "Community", label: "Referral (friend joins)", points: 150, icon: "👥" },
  { id: "review", category: "Community", label: "Leave a review", points: 75, icon: "⭐" },
  { id: "birthday", category: "Special", label: "Birthday bonus", points: 50, icon: "🎂" },
];

// ─── Rewards Catalog ──────────────────────────────────────────────────────────
const REWARDS = [
  { id: 1, name: "Grip Socks", pts: 100, icon: "🧦", category: "Gear", desc: "Studio-branded grip socks, one pair" },
  { id: 2, name: "$10 Credit", pts: 150, icon: "💳", category: "Credit", desc: "Applied to next class booking" },
  { id: 3, name: "Free Class", pts: 200, icon: "🎟️", category: "Classes", desc: "Any group class, any time" },
  { id: 4, name: "Water Bottle", pts: 200, icon: "💧", category: "Gear", desc: "Pilates Studio insulated bottle" },
  { id: 5, name: "Friend Pass", pts: 250, icon: "🤝", category: "Classes", desc: "Bring a friend to any class free" },
  { id: 6, name: "Branded Tank", pts: 350, icon: "👕", category: "Gear", desc: "Pilates Studio premium tank top" },
  { id: 7, name: "Private Session", pts: 500, icon: "🏆", category: "Classes", desc: "60-min 1-on-1 with any instructor" },
  { id: 8, name: "1-Month Upgrade", pts: 750, icon: "⬆️", category: "Membership", desc: "Upgrade your membership tier for one month" },
];

// ─── Seeded Members ───────────────────────────────────────────────────────────
const MEMBERS = [
  { id: 1, name: "Sophia Martínez", avatar: "SM", points: 1240, streak: 9, classes: 87, joined: "2023-01" },
  { id: 2, name: "Ava Chen", avatar: "AC", points: 980, streak: 7, classes: 72, joined: "2023-03" },
  { id: 3, name: "Isabella Torres", avatar: "IT", points: 850, streak: 5, classes: 61, joined: "2023-05" },
  { id: 4, name: "Mia Johnson", avatar: "MJ", points: 620, streak: 4, classes: 45, joined: "2023-07" },
  { id: 5, name: "Emma Williams", avatar: "EW", points: 540, streak: 3, classes: 39, joined: "2023-08" },
  { id: 6, name: "Olivia Brown", avatar: "OB", points: 380, streak: 6, classes: 28, joined: "2023-09" },
  { id: 7, name: "Charlotte Davis", avatar: "CD", points: 290, streak: 2, classes: 22, joined: "2023-10" },
  { id: 8, name: "Amelia Garcia", avatar: "AG", points: 210, streak: 1, classes: 17, joined: "2024-01" },
  { id: 9, name: "Harper Wilson", avatar: "HW", points: 120, streak: 0, classes: 10, joined: "2024-02" },
  { id: 10, name: "Evelyn Lee", avatar: "EL", points: 55, streak: 2, classes: 5, joined: "2024-03" },
];

// Weekly earnings spark data (7 days, arbitrary units for each member)
const WEEKLY_SPARKS = {
  1: [20, 15, 20, 0, 20, 100, 20],
  2: [12, 0, 15, 15, 0, 50, 12],
  3: [15, 15, 0, 15, 15, 0, 25],
  4: [0, 12, 12, 0, 12, 0, 12],
  5: [10, 0, 15, 15, 0, 15, 0],
  6: [12, 12, 0, 12, 12, 25, 0],
  7: [10, 0, 12, 0, 12, 0, 10],
  8: [0, 10, 0, 10, 10, 0, 12],
  9: [10, 0, 0, 10, 0, 0, 10],
  10: [0, 10, 0, 0, 10, 0, 10],
};

// ─── Activity Feed ────────────────────────────────────────────────────────────
const ACTIVITY = [
  { id: 1, type: "earn", member: "Sophia Martínez", action: "Attended Reformer Flow class", pts: 20, minsAgo: 12 },
  { id: 2, type: "redeem", member: "Ava Chen", action: "Redeemed Free Class", pts: -200, minsAgo: 38 },
  { id: 3, type: "earn", member: "Isabella Torres", action: "7-day streak bonus", pts: 100, minsAgo: 65 },
  { id: 4, type: "earn", member: "Olivia Brown", action: "Referred Harper Wilson", pts: 150, minsAgo: 110 },
  { id: 5, type: "earn", member: "Mia Johnson", action: "Left a studio review", pts: 75, minsAgo: 180 },
  { id: 6, type: "redeem", member: "Emma Williams", action: "Redeemed Grip Socks", pts: -100, minsAgo: 240 },
  { id: 7, type: "earn", member: "Charlotte Davis", action: "Attended Mat Pilates class", pts: 12, minsAgo: 300 },
  { id: 8, type: "earn", member: "Amelia Garcia", action: "3-day streak bonus", pts: 25, minsAgo: 420 },
  { id: 9, type: "earn", member: "Harper Wilson", action: "Birthday bonus", pts: 50, minsAgo: 600 },
  { id: 10, type: "redeem", member: "Sophia Martínez", action: "Redeemed Private Session", pts: -500, minsAgo: 1440 },
];

function relativeTime(minsAgo) {
  if (minsAgo < 60) return `${minsAgo}m ago`;
  const h = Math.floor(minsAgo / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TierBadge({ tier, small }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: tier.bg,
        color: tier.color,
        border: `1px solid ${tier.color}30`,
        borderRadius: 100,
        padding: small ? "2px 8px" : "4px 12px",
        fontFamily: MONO,
        fontSize: small ? 9 : 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ fontSize: small ? 8 : 10 }}>◆</span>
      {tier.name}
    </span>
  );
}

function SparkBar({ data, color }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 24 }}>
      {data.map((v, i) => (
        <div
          key={i}
          title={`${v} pts`}
          style={{
            width: 6,
            height: `${Math.max((v / max) * 100, v > 0 ? 15 : 4)}%`,
            background: v > 0 ? color : "#E8E8E8",
            borderRadius: 2,
            transition: "height 0.3s",
          }}
        />
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, icon }) {
  return (
    <div
      style={{
        ...s.card,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flex: 1,
        minWidth: 140,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ ...s.label }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: "#1A1A1A", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: FONT, fontSize: 12, color: "#999" }}>{sub}</div>}
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ members }) {
  const totalPts = members.reduce((a, m) => a + m.points, 0);
  const activePts = members.filter((m) => m.streak > 0).length;
  const platCount = members.filter((m) => m.points >= 1000).length;
  const avgStreak = (members.reduce((a, m) => a + m.streak, 0) / members.length).toFixed(1);
  const redemptionRate = "34%";

  const tierBreakdown = TIERS.map((t) => {
    const count = members.filter((m) => {
      const tier = getTier(m.points);
      return tier.id === t.id;
    }).length;
    return { ...t, count };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <KpiCard label="Active Members" value={activePts} sub="with active streak" icon="🏃" />
        <KpiCard label="Points Issued" value={totalPts.toLocaleString()} sub="all-time total" icon="⭐" />
        <KpiCard label="Redemption Rate" value={redemptionRate} sub="pts redeemed vs issued" icon="🎁" />
        <KpiCard label="Avg Streak" value={`${avgStreak}d`} sub="across all members" icon="🔥" />
        <KpiCard label="Platinum Members" value={platCount} sub="top tier" icon="💎" />
      </div>

      {/* Tier breakdown + Activity feed */}
      <div className="lp-overview-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Tier Distribution */}
        <div style={{ ...s.card, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...s.label, marginBottom: 4 }}>Tier Distribution</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: "#1A1A1A" }}>
              Member Breakdown
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {tierBreakdown.map((tier) => {
              const pct = Math.round((tier.count / members.length) * 100);
              return (
                <div key={tier.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <TierBadge tier={tier} small />
                    <span style={{ fontFamily: MONO, fontSize: 11, color: "#666" }}>
                      {tier.count} member{tier.count !== 1 ? "s" : ""} · {pct}%
                    </span>
                  </div>
                  <div style={{ background: "#F0EDE8", borderRadius: 100, height: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: tier.color,
                        borderRadius: 100,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ ...s.card, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...s.label, marginBottom: 4 }}>Live Activity</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: "#1A1A1A" }}>
              Recent Transactions
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ACTIVITY.slice(0, 7).map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: a.type === "earn" ? "#F6FBF6" : "#FFF8F5",
                  borderRadius: 10,
                  border: `1px solid ${a.type === "earn" ? "#D4EDDA" : "#FFE5D8"}`,
                }}
              >
                <span style={{ fontSize: 16 }}>{a.type === "earn" ? "⬆️" : "⬇️"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1A1A1A",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {a.member}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: "#888" }}>{a.action}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: 700,
                      color: a.type === "earn" ? "#3A9E5A" : ACCENT,
                    }}
                  >
                    {a.pts > 0 ? "+" : ""}
                    {a.pts} pts
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: "#AAA" }}>
                    {relativeTime(a.minsAgo)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Leaderboard ─────────────────────────────────────────────────────────

function LeaderboardTab({ members }) {
  const sorted = [...members].sort((a, b) => b.points - a.points);
  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const podiumOrder = [podium[1], podium[0], podium[2]]; // 2nd, 1st, 3rd visual layout
  const podiumHeights = [80, 110, 60];
  const podiumRanks = [2, 1, 3];
  const podiumEmojis = ["🥈", "🥇", "🥉"];
  const podiumColors = ["#9E9E9E", "#E6B800", "#CD7F32"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Podium */}
      <div style={{ ...s.card, padding: "32px 24px" }}>
        <div style={{ ...s.label, marginBottom: 4, textAlign: "center" }}>Top Performers</div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 22,
            fontWeight: 600,
            color: "#1A1A1A",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          This Month's Leaderboard
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16 }}>
          {podiumOrder.map((m, i) => {
            if (!m) return null;
            const tier = getTier(m.points);
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: podiumRanks[i] === 1 ? 72 : 56,
                      height: podiumRanks[i] === 1 ? 72 : 56,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${podiumColors[i]}33, ${podiumColors[i]}66)`,
                      border: `3px solid ${podiumColors[i]}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: MONO,
                      fontSize: podiumRanks[i] === 1 ? 20 : 16,
                      fontWeight: 700,
                      color: podiumColors[i],
                      boxShadow: `0 4px 20px ${podiumColors[i]}40`,
                    }}
                  >
                    {m.avatar}
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      fontSize: 18,
                    }}
                  >
                    {podiumEmojis[i]}
                  </span>
                </div>

                {/* Name + pts */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1A1A1A",
                      marginBottom: 2,
                    }}
                  >
                    {m.name.split(" ")[0]}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: podiumColors[i], fontWeight: 700 }}>
                    {m.points.toLocaleString()} pts
                  </div>
                  <TierBadge tier={tier} small />
                </div>

                {/* Podium block */}
                <div
                  style={{
                    width: 80,
                    height: podiumHeights[i],
                    background: `linear-gradient(180deg, ${podiumColors[i]}22 0%, ${podiumColors[i]}44 100%)`,
                    border: `1px solid ${podiumColors[i]}44`,
                    borderRadius: "8px 8px 0 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: MONO,
                    fontSize: 22,
                    fontWeight: 800,
                    color: podiumColors[i],
                  }}
                >
                  {podiumRanks[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full table */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ ...s.label, marginBottom: 2 }}>Full Rankings</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: "#1A1A1A" }}>
            All Members
          </div>
        </div>

        {/* Header */}
        <div
          className="lp-table-header"
          style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 120px 80px 80px 160px",
            gap: 12,
            padding: "10px 24px",
            background: "rgba(0,0,0,0.02)",
            borderBottom: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          {["#", "Member", "Points", "Streak", "Classes", "This Week"].map((h) => (
            <div key={h} style={{ ...s.label }}>{h}</div>
          ))}
        </div>

        {sorted.map((m, i) => {
          const tier = getTier(m.points);
          const sparks = WEEKLY_SPARKS[m.id] || [0, 0, 0, 0, 0, 0, 0];
          const isTop3 = i < 3;
          return (
            <div
              key={m.id}
              className="lp-table-row"
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 120px 80px 80px 160px",
                gap: 12,
                padding: "14px 24px",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
                background: isTop3 ? `${tier.color}06` : "transparent",
                alignItems: "center",
                transition: "background 0.15s",
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 13,
                  fontWeight: 700,
                  color: isTop3 ? tier.color : "#CCC",
                }}
              >
                {i + 1}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: `${tier.color}22`,
                    border: `1.5px solid ${tier.color}55`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: 700,
                    color: tier.color,
                    flexShrink: 0,
                  }}
                >
                  {m.avatar}
                </div>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
                    {m.name}
                  </div>
                  <TierBadge tier={tier} small />
                </div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: ACCENT }}>
                {m.points.toLocaleString()}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: m.streak >= 5 ? "#E8730A" : "#666" }}>
                {m.streak > 0 ? `🔥 ${m.streak}d` : "—"}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: "#666" }}>{m.classes}</div>
              <SparkBar data={sparks} color={tier.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Rewards ─────────────────────────────────────────────────────────────

function RewardsTab() {
  const categories = [...new Set(REWARDS.map((r) => r.category))];
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? REWARDS : REWARDS.filter((r) => r.category === activeCategory);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ ...s.card, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ ...s.label, marginBottom: 4 }}>Rewards Catalog</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>
              {REWARDS.length} Available Rewards
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...s.pill,
                  background: activeCategory === cat ? ACCENT : "#F0EDE8",
                  color: activeCategory === cat ? "#fff" : "#666",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filtered.map((reward) => (
            <div
              key={reward.id}
              style={{
                background: ACCENT_LIGHT,
                border: `1px solid ${ACCENT}22`,
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${ACCENT}22`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 36 }}>{reward.icon}</div>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                  {reward.name}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: "#888", lineHeight: 1.4 }}>
                  {reward.desc}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 16,
                    fontWeight: 800,
                    color: ACCENT,
                  }}
                >
                  {reward.pts} pts
                </div>
                <span
                  style={{
                    background: "#fff",
                    border: `1px solid ${ACCENT}33`,
                    color: ACCENT,
                    borderRadius: 100,
                    padding: "3px 10px",
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {reward.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redemption stats */}
      <div className="lp-redemption-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total Redeemed", value: "247", icon: "🎁" },
          { label: "Most Popular", value: "Free Class", icon: "🎟️" },
          { label: "Pts Redeemed", value: "49,400", icon: "⭐" },
          { label: "Avg Redemption", value: "200 pts", icon: "📊" },
        ].map((stat) => (
          <div key={stat.label} style={{ ...s.card, padding: "18px 20px" }}>
            <div style={{ ...s.label, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{stat.icon}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Earning Rules ───────────────────────────────────────────────────────

function EarningRulesTab() {
  const categories = [...new Set(EARNING_RULES.map((r) => r.category))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {categories.map((cat) => {
        const rules = EARNING_RULES.filter((r) => r.category === cat);
        return (
          <div key={cat} style={{ ...s.card, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  width: 4,
                  height: 20,
                  background: ACCENT,
                  borderRadius: 2,
                }}
              />
              <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: "#1A1A1A" }}>
                {cat}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    background: "#FAFAF8",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.05)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_LIGHT)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FAFAF8")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{rule.icon}</span>
                    <div>
                      <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                        {rule.label}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <div
                      style={{
                        background: `${ACCENT}18`,
                        color: ACCENT,
                        border: `1px solid ${ACCENT}33`,
                        borderRadius: 100,
                        padding: "4px 14px",
                        fontFamily: MONO,
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      +{rule.points} pts
                    </div>
                    <div
                      style={{
                        width: 32,
                        height: 18,
                        background: "#3A9E5A",
                        borderRadius: 100,
                        position: "relative",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          right: 2,
                          top: 2,
                          width: 14,
                          height: 14,
                          background: "#fff",
                          borderRadius: "50%",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Summary table */}
      <div style={{ ...s.card, padding: 24 }}>
        <div style={{ ...s.label, marginBottom: 4 }}>Summary</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: "#1A1A1A", marginBottom: 16 }}>
          Maximum Earning Potential
        </div>
        <div className="lp-earning-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Per class (Platinum)", value: "20 pts" },
            { label: "Best streak bonus", value: "100 pts" },
            { label: "Referral", value: "150 pts" },
            { label: "Top daily potential", value: "~270 pts" },
            { label: "Top monthly potential", value: "~2,000+ pts" },
            { label: "Tier-up time (Bronze→Silver)", value: "~20 classes" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "14px 16px",
                background: ACCENT_LIGHT,
                borderRadius: 10,
                border: `1px solid ${ACCENT}18`,
              }}
            >
              <div style={{ ...s.label, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: ACCENT }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Tier Config ─────────────────────────────────────────────────────────

function TierConfigTab({ members }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="lp-tier-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {TIERS.map((tier) => {
          const tierMembers = members.filter((m) => getTier(m.points).id === tier.id);
          const nextTier = TIERS[TIERS.indexOf(tier) + 1];
          return (
            <div
              key={tier.id}
              style={{
                ...s.card,
                padding: 0,
                overflow: "hidden",
                border: `1px solid ${tier.color}33`,
              }}
            >
              {/* Header band */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${tier.color}18 0%, ${tier.color}0A 100%)`,
                  borderBottom: `1px solid ${tier.color}22`,
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <TierBadge tier={tier} />
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      color: "#888",
                      marginTop: 6,
                    }}
                  >
                    {tier.minPts === 0
                      ? `0 – ${(TIERS[1].minPts - 1)} pts`
                      : nextTier
                      ? `${tier.minPts} – ${nextTier.minPts - 1} pts`
                      : `${tier.minPts}+ pts`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: tier.color }}>
                    {tierMembers.length}
                  </div>
                  <div style={{ ...s.label }}>Members</div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: 24 }}>
                {/* Points rate */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#FAF6F1",
                    borderRadius: 10,
                    marginBottom: 16,
                    border: `1px solid ${tier.color}22`,
                  }}
                >
                  <span style={{ fontFamily: FONT, fontSize: 13, color: "#555" }}>Points per class</span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 18,
                      fontWeight: 800,
                      color: tier.color,
                    }}
                  >
                    {tier.classPoints} pts
                  </span>
                </div>

                {/* Perks */}
                <div style={{ ...s.label, marginBottom: 10 }}>Included Perks</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tier.perks.map((perk, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: FONT,
                        fontSize: 13,
                        color: "#444",
                      }}
                    >
                      <span style={{ color: tier.color, fontWeight: 700, fontSize: 16 }}>✓</span>
                      {perk}
                    </div>
                  ))}
                </div>

                {/* Member list preview */}
                {tierMembers.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ ...s.label, marginBottom: 8 }}>Members in tier</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {tierMembers.map((m) => (
                        <div
                          key={m.id}
                          title={m.name}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: `${tier.color}22`,
                            border: `1.5px solid ${tier.color}55`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: MONO,
                            fontSize: 9,
                            fontWeight: 700,
                            color: tier.color,
                          }}
                        >
                          {m.avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {nextTier && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "10px 14px",
                      background: "#F5F5F5",
                      borderRadius: 8,
                      fontFamily: FONT,
                      fontSize: 12,
                      color: "#888",
                    }}
                  >
                    Next tier: <strong>{nextTier.name}</strong> at {nextTier.minPts.toLocaleString()} pts (
                    {nextTier.classPoints} pts/class)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progression timeline */}
      <div style={{ ...s.card, padding: 24 }}>
        <div style={{ ...s.label, marginBottom: 4 }}>Tier Progression</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: "#1A1A1A", marginBottom: 24 }}>
          Points Milestones
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {TIERS.map((tier, i) => (
            <div key={tier.id} style={{ display: "flex", alignItems: "center", flex: i < TIERS.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `${tier.color}22`,
                    border: `3px solid ${tier.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: tier.color,
                    flexShrink: 0,
                  }}
                >
                  ◆
                </div>
                <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: tier.color }}>
                  {tier.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: "#AAA" }}>
                  {tier.minPts === 0 ? "Start" : `${tier.minPts} pts`}
                </div>
              </div>
              {i < TIERS.length - 1 && (
                <div style={{ flex: 1, height: 3, background: `linear-gradient(90deg, ${tier.color}, ${TIERS[i + 1].color})`, opacity: 0.4, margin: "0 4px", marginBottom: 40 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = ["Overview", "Leaderboard", "Rewards", "Earning Rules", "Tier Config"];

export default function LoyaltyProgram() {
  const [activeTab, setActiveTab] = useState("Overview");

  const members = useMemo(() => MEMBERS, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF6F1",
        fontFamily: FONT,
        padding: "32px 40px",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .lp-tier-grid { grid-template-columns: 1fr !important; }
          .lp-overview-grid { grid-template-columns: 1fr !important; }
          .lp-redemption-grid { grid-template-columns: 1fr 1fr !important; }
          .lp-earning-grid { grid-template-columns: 1fr !important; }
          .lp-table-header { display: none !important; }
          .lp-table-row { grid-template-columns: 40px 1fr auto !important; }
          .lp-table-row > *:nth-child(n+4) { display: none !important; }
          .lp-page { padding: 16px 12px !important; }
        }
        @media (max-width: 480px) {
          .lp-redemption-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>⭐</span>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontSize: 32,
              fontWeight: 700,
              color: "#1A1A1A",
              margin: 0,
            }}
          >
            Pilates Rewards
          </h1>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 14, color: "#888", margin: 0 }}>
          Loyalty program management · {members.length} enrolled members
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "2px solid rgba(0,0,0,0.06)",
          marginBottom: 28,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                borderBottom: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? ACCENT : "#888",
                padding: "10px 20px",
                marginBottom: -2,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && <OverviewTab members={members} />}
      {activeTab === "Leaderboard" && <LeaderboardTab members={members} />}
      {activeTab === "Rewards" && <RewardsTab />}
      {activeTab === "Earning Rules" && <EarningRulesTab />}
      {activeTab === "Tier Config" && <TierConfigTab members={members} />}
    </div>
  );
}
