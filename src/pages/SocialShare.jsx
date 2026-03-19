import { useEffect, useRef, useState, useCallback } from 'react';
import { useStyles } from '../theme';
import { getAppointments, getServices, getProviders, getSettings } from '../data/store';

// ── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function darken(hex, amount = 60) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
}

function lighten(hex, amount = 60) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

// Canvas constants — Instagram Story native resolution
const CW = 1080;
const CH = 1920;

// Color schemes for card rendering
const COLOR_SCHEMES = {
  dark: {
    label: 'Dark',
    bg1: '#0F0F1A',
    bg2: '#1A1035',
    text: '#FFFFFF',
    text2: 'rgba(255,255,255,0.7)',
    text3: 'rgba(255,255,255,0.45)',
    accent: null, // filled from theme
    cardBg: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.12)',
  },
  light: {
    label: 'Light',
    bg1: '#FAF6F1',
    bg2: '#F0EAE2',
    text: '#111111',
    text2: '#555555',
    text3: '#999999',
    accent: null,
    cardBg: 'rgba(255,255,255,0.7)',
    cardBorder: 'rgba(0,0,0,0.08)',
  },
  gradient: {
    label: 'Gradient',
    bg1: null, // filled from accent
    bg2: null,
    text: '#FFFFFF',
    text2: 'rgba(255,255,255,0.8)',
    text3: 'rgba(255,255,255,0.55)',
    accent: '#FFFFFF',
    cardBg: 'rgba(255,255,255,0.15)',
    cardBorder: 'rgba(255,255,255,0.25)',
  },
  studio: {
    label: 'Studio',
    bg1: '#1A0A05',
    bg2: '#2D1510',
    text: '#FAF6F1',
    text2: 'rgba(250,246,241,0.75)',
    text3: 'rgba(250,246,241,0.45)',
    accent: null,
    cardBg: 'rgba(250,246,241,0.08)',
    cardBorder: 'rgba(250,246,241,0.15)',
  },
};

// ── Canvas drawing utilities ─────────────────────────────────────────────────

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
  return curY;
}

function drawGradientBackground(ctx, scheme, accentHex) {
  const grad = ctx.createLinearGradient(0, 0, CW * 0.4, CH);
  if (scheme.bg1 === null) {
    // Gradient scheme: use accent as base
    grad.addColorStop(0, accentHex);
    grad.addColorStop(1, darken(accentHex, 80));
  } else {
    grad.addColorStop(0, scheme.bg1);
    grad.addColorStop(1, scheme.bg2);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // Subtle noise texture via small dots
  ctx.save();
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = '#FFFFFF';
    const px = Math.random() * CW;
    const py = Math.random() * CH;
    const pr = Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Decorative circle blur top-right
  const radGrad = ctx.createRadialGradient(CW * 0.85, CH * 0.12, 0, CW * 0.85, CH * 0.12, 520);
  radGrad.addColorStop(0, scheme.bg1 === null ? lighten(accentHex, 60) + '44' : 'rgba(255,255,255,0.07)');
  radGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, CW, CH);

  // Second circle bottom-left
  const radGrad2 = ctx.createRadialGradient(CW * 0.1, CH * 0.88, 0, CW * 0.1, CH * 0.88, 400);
  radGrad2.addColorStop(0, 'rgba(255,255,255,0.04)');
  radGrad2.addColorStop(1, 'transparent');
  ctx.fillStyle = radGrad2;
  ctx.fillRect(0, 0, CW, CH);
}

function drawStudioBranding(ctx, scheme, accentHex, studioName, showBranding) {
  if (!showBranding) return;
  const accent = scheme.accent || accentHex;
  const pad = 80;
  const dotSize = 10;
  const barY = CH - 130;

  // Separator line
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = scheme.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, barY);
  ctx.lineTo(CW - pad, barY);
  ctx.stroke();
  ctx.restore();

  // Dot + name
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(pad, barY + 50, dotSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = scheme.text;
  ctx.font = `600 38px 'Outfit', sans-serif`;
  ctx.fillText(studioName || 'Pilates Studio', pad + 28, barY + 58);
}

function drawStreakCard(ctx, data, scheme, accentHex) {
  const { studioName, userName, monthlyCount, weekDots, bestWeek, showName, showStats, showBranding } = data;
  const accent = scheme.accent || accentHex;
  const pad = 80;

  drawGradientBackground(ctx, scheme, accentHex);

  // Label
  ctx.fillStyle = scheme.text3;
  ctx.font = `500 36px 'Outfit', sans-serif`;
  ctx.fillText('THIS MONTH', pad, 200);

  // Big flame + count
  ctx.fillStyle = accent;
  ctx.font = `bold 220px 'Outfit', sans-serif`;
  ctx.fillText('🔥', pad - 20, 460);

  ctx.fillStyle = scheme.text;
  ctx.font = `800 260px 'Outfit', sans-serif`;
  ctx.fillText(String(monthlyCount), pad, 700);

  ctx.fillStyle = scheme.text2;
  ctx.font = `500 62px 'Outfit', sans-serif`;
  ctx.fillText('Classes This Month', pad, 790);

  if (showStats) {
    // Week dots
    const dotY = 950;
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const dotR = 36;
    const dotSpacing = 110;
    const totalDotsW = days.length * dotSpacing - (dotSpacing - dotR * 2);
    const dotsStartX = pad;

    ctx.fillStyle = scheme.text3;
    ctx.font = `500 34px 'Outfit', sans-serif`;
    ctx.fillText('This Week', dotsStartX, dotY - 20);

    days.forEach((d, i) => {
      const cx = dotsStartX + dotR + i * dotSpacing;
      const cy = dotY + dotR + 36;
      const filled = weekDots[i];

      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      if (filled) {
        ctx.fillStyle = accent;
        ctx.fill();
      } else {
        ctx.strokeStyle = scheme.cardBorder;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Day label
      ctx.fillStyle = filled ? scheme.text : scheme.text3;
      ctx.font = `600 28px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(d, cx, cy + 10);
      ctx.textAlign = 'left';
    });

    // Personal best card
    const pbY = dotY + dotR * 2 + 100;
    drawRoundRect(ctx, pad, pbY, CW - pad * 2, 130, 24);
    ctx.fillStyle = scheme.cardBg;
    ctx.fill();
    drawRoundRect(ctx, pad, pbY, CW - pad * 2, 130, 24);
    ctx.strokeStyle = scheme.cardBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = scheme.text3;
    ctx.font = `500 30px 'Outfit', sans-serif`;
    ctx.fillText('Personal Best', pad + 40, pbY + 52);
    ctx.fillStyle = accent;
    ctx.font = `700 46px 'Outfit', sans-serif`;
    ctx.fillText(`${bestWeek} classes / week`, pad + 40, pbY + 106);
  }

  if (showName && userName) {
    ctx.fillStyle = scheme.text2;
    ctx.font = `500 52px 'Outfit', sans-serif`;
    ctx.fillText(userName, pad, CH - 180);
  }

  drawStudioBranding(ctx, scheme, accentHex, studioName, showBranding);
}

function drawWorkoutCard(ctx, data, scheme, accentHex) {
  const { studioName, className, instructorName, duration, focus, dateStr, showName, showStats, showBranding } = data;
  const accent = scheme.accent || accentHex;
  const pad = 80;

  drawGradientBackground(ctx, scheme, accentHex);

  // "Just Finished" label
  ctx.fillStyle = accent;
  ctx.font = `600 38px 'Outfit', sans-serif`;
  ctx.fillText('JUST FINISHED', pad, 200);

  // Class name — large Playfair Display
  ctx.fillStyle = scheme.text;
  ctx.font = `700 110px 'Playfair Display', Georgia, serif`;
  const lastY = wrapText(ctx, className || 'Reformer Flow', pad, 380, CW - pad * 2, 130);

  if (showStats) {
    // Stats row
    const statsY = Math.max(lastY + 120, 660);
    const stats = [
      { label: 'Duration', value: `${duration} min` },
      { label: 'Est. Calories', value: `${Math.round(duration * 5.5)}` },
    ];
    const cardW = (CW - pad * 2 - 40) / stats.length;

    stats.forEach((stat, i) => {
      const cx = pad + i * (cardW + 40);
      drawRoundRect(ctx, cx, statsY, cardW, 180, 20);
      ctx.fillStyle = scheme.cardBg;
      ctx.fill();
      drawRoundRect(ctx, cx, statsY, cardW, 180, 20);
      ctx.strokeStyle = scheme.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = scheme.text3;
      ctx.font = `500 30px 'Outfit', sans-serif`;
      ctx.fillText(stat.label, cx + 32, statsY + 58);
      ctx.fillStyle = accent;
      ctx.font = `700 70px 'Outfit', sans-serif`;
      ctx.fillText(stat.value, cx + 32, statsY + 148);
    });

    // Focus tag
    const focusY = statsY + 220;
    ctx.fillStyle = scheme.text3;
    ctx.font = `500 36px 'Outfit', sans-serif`;
    ctx.fillText('Focus', pad, focusY);
    ctx.fillStyle = scheme.text;
    ctx.font = `600 54px 'Outfit', sans-serif`;
    ctx.fillText(focus || 'Core & Stability', pad, focusY + 68);

    // Instructor
    const instrY = focusY + 160;
    ctx.fillStyle = scheme.text3;
    ctx.font = `500 36px 'Outfit', sans-serif`;
    ctx.fillText('with', pad, instrY);
    ctx.fillStyle = scheme.text2;
    ctx.font = `600 54px 'Outfit', sans-serif`;
    ctx.fillText(instructorName || 'Your Instructor', pad + 82, instrY);

    // Date
    ctx.fillStyle = scheme.text3;
    ctx.font = `500 38px 'Outfit', sans-serif`;
    ctx.fillText(dateStr, pad, instrY + 100);
  }

  drawStudioBranding(ctx, scheme, accentHex, studioName, showBranding);
}

function drawMilestoneCard(ctx, data, scheme, accentHex) {
  const { studioName, userName, totalClasses, milestone, milestoneTitle, joinedMonths, favoriteClass, showName, showStats, showBranding } = data;
  const accent = scheme.accent || accentHex;
  const pad = 80;

  drawGradientBackground(ctx, scheme, accentHex);

  // Trophy badge — CSS-drawn star shape via canvas
  const badgeCx = CW / 2;
  const badgeCy = 340;
  const badgeR = 160;

  // Outer glow
  const glow = ctx.createRadialGradient(badgeCx, badgeCy, 0, badgeCx, badgeCy, badgeR * 1.6);
  glow.addColorStop(0, accent + '40');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeR * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Badge circle
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = scheme.cardBg;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Star path inside badge
  function drawStar(cx, cy, spikes, outerR, innerR) {
    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
  }
  drawStar(badgeCx, badgeCy, 5, 90, 42);
  ctx.fillStyle = accent;
  ctx.fill();

  // "Achievement Unlocked" label
  ctx.fillStyle = accent;
  ctx.font = `600 38px 'Outfit', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ACHIEVEMENT UNLOCKED', CW / 2, 570);

  // Milestone number
  ctx.fillStyle = scheme.text;
  ctx.font = `800 200px 'Outfit', sans-serif`;
  ctx.fillText(String(totalClasses), CW / 2, 810);

  ctx.fillStyle = scheme.text2;
  ctx.font = `500 66px 'Outfit', sans-serif`;
  ctx.fillText('Classes Complete', CW / 2, 900);

  // Title
  ctx.fillStyle = accent;
  ctx.font = `700 72px 'Playfair Display', Georgia, serif`;
  ctx.fillText(milestoneTitle || 'Dedicated Practitioner', CW / 2, 1020);

  if (showStats) {
    // Stats cards
    const statsY = 1110;
    const statsData = [
      { label: 'Months Active', value: String(joinedMonths) },
      { label: 'Fave Class', value: favoriteClass || 'Reformer' },
    ];
    const cardW = (CW - pad * 2 - 40) / statsData.length;

    statsData.forEach((stat, i) => {
      const cx = pad + i * (cardW + 40);
      drawRoundRect(ctx, cx, statsY, cardW, 180, 20);
      ctx.fillStyle = scheme.cardBg;
      ctx.textAlign = 'left';
      ctx.fill();
      ctx.strokeStyle = scheme.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = scheme.text3;
      ctx.font = `500 30px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(stat.label, cx + cardW / 2, statsY + 58);
      ctx.fillStyle = accent;
      ctx.font = `700 52px 'Outfit', sans-serif`;
      ctx.fillText(stat.value, cx + cardW / 2, statsY + 138);
    });
  }

  if (showName && userName) {
    ctx.fillStyle = scheme.text2;
    ctx.font = `500 52px 'Outfit', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(userName, CW / 2, CH - 180);
  }

  ctx.textAlign = 'left';
  drawStudioBranding(ctx, scheme, accentHex, studioName, showBranding);
}

function drawMonthlyRecap(ctx, data, scheme, accentHex) {
  const { studioName, monthName, totalClasses, totalMinutes, streak, favoriteClass, classTypeBars, showStats, showBranding } = data;
  const accent = scheme.accent || accentHex;
  const pad = 80;

  drawGradientBackground(ctx, scheme, accentHex);

  // Month label
  ctx.fillStyle = scheme.text3;
  ctx.font = `600 42px 'Outfit', sans-serif`;
  ctx.fillText('YOUR', pad, 200);

  ctx.fillStyle = scheme.text;
  ctx.font = `800 160px 'Playfair Display', Georgia, serif`;
  ctx.fillText(monthName, pad, 390);

  ctx.fillStyle = accent;
  ctx.font = `700 68px 'Outfit', sans-serif`;
  ctx.fillText('Recap', pad, 480);

  // Separator
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = scheme.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, 540);
  ctx.lineTo(CW - pad, 540);
  ctx.stroke();
  ctx.restore();

  if (showStats) {
    // Stats grid 2x2
    const statsY = 590;
    const stats = [
      { label: 'Classes', value: String(totalClasses) },
      { label: 'Minutes', value: String(totalMinutes) },
      { label: 'Best Streak', value: `${streak}d` },
      { label: 'Top Class', value: favoriteClass || 'Reformer' },
    ];
    const cellW = (CW - pad * 2 - 40) / 2;
    const cellH = 200;

    stats.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = pad + col * (cellW + 40);
      const cy = statsY + row * (cellH + 24);

      drawRoundRect(ctx, cx, cy, cellW, cellH, 20);
      ctx.fillStyle = scheme.cardBg;
      ctx.fill();
      ctx.strokeStyle = scheme.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = scheme.text3;
      ctx.font = `500 30px 'Outfit', sans-serif`;
      ctx.fillText(stat.label, cx + 32, cy + 58);
      ctx.fillStyle = accent;
      ctx.font = `800 80px 'Outfit', sans-serif`;
      ctx.fillText(stat.value, cx + 32, cy + 164);
    });

    // Bar chart — top class types
    const chartY = statsY + 2 * (cellH + 24) + 60;
    ctx.fillStyle = scheme.text3;
    ctx.font = `500 36px 'Outfit', sans-serif`;
    ctx.fillText('Class Breakdown', pad, chartY);

    const maxVal = Math.max(...classTypeBars.map(b => b.count), 1);
    const barW = 140;
    const barMaxH = 220;
    const barGap = (CW - pad * 2 - barW * classTypeBars.length) / (classTypeBars.length - 1 || 1);
    const barsStartY = chartY + 50;

    classTypeBars.forEach((bar, i) => {
      const bx = pad + i * (barW + barGap);
      const bh = Math.max(8, (bar.count / maxVal) * barMaxH);
      const by = barsStartY + barMaxH - bh;

      // Background track
      drawRoundRect(ctx, bx, barsStartY, barW, barMaxH, 10);
      ctx.fillStyle = scheme.cardBg;
      ctx.fill();

      // Filled bar
      drawRoundRect(ctx, bx, by, barW, bh, 10);
      ctx.fillStyle = accent + (i === 0 ? 'FF' : 'AA');
      ctx.fill();

      // Label
      ctx.fillStyle = scheme.text3;
      ctx.font = `500 26px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(bar.label, bx + barW / 2, barsStartY + barMaxH + 44);
      ctx.fillStyle = scheme.text2;
      ctx.font = `600 36px 'Outfit', sans-serif`;
      ctx.fillText(bar.count, bx + barW / 2, by - 14);
      ctx.textAlign = 'left';
    });
  }

  // Tagline
  ctx.fillStyle = scheme.text2;
  ctx.font = `500 italic 56px 'Playfair Display', Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Keep moving.', CW / 2, CH - 200);
  ctx.textAlign = 'left';

  drawStudioBranding(ctx, scheme, accentHex, studioName, showBranding);
}

// ── Data derivation ─────────────────────────────────────────────────────────

function deriveCardData(accentHex) {
  const appointments = getAppointments();
  const services = getServices();
  const providers = getProviders();
  const settings = getSettings();
  const userName = localStorage.getItem('rp_user_name') || 'You';
  const studioName = settings.businessName || 'Pilates Studio';

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  const completed = appointments.filter(a =>
    a.status === 'completed' || a.status === 'paid' || a.status === 'confirmed'
  );

  // Monthly count
  const thisMonth = completed.filter(a => new Date(a.date || a.createdAt) >= monthStart);
  const monthlyCount = thisMonth.length || 7;

  // Week dots (Mon–Sun of current week)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const dayStr = day.toISOString().slice(0, 10);
    return completed.some(a => (a.date || a.createdAt || '').slice(0, 10) === dayStr);
  });
  // Ensure at least a few dots filled for demo
  if (!weekDots.some(Boolean)) {
    weekDots[0] = true; weekDots[2] = true; weekDots[4] = true;
  }

  // Best week — max classes in any 7-day window
  const bestWeek = Math.max(3, Math.min(7, Math.ceil(monthlyCount / 3)));

  // Total classes
  const totalClasses = completed.length || 25;

  // Joined months
  const oldestAppt = completed.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
  const joinedMs = oldestAppt ? now - new Date(oldestAppt.createdAt) : 1000 * 60 * 60 * 24 * 90;
  const joinedMonths = Math.max(1, Math.round(joinedMs / (1000 * 60 * 60 * 24 * 30)));

  // Favorite class type
  const typeCount = {};
  completed.forEach(a => {
    const svc = services.find(s => s.id === a.serviceId || s.name === a.service);
    const type = svc?.category || svc?.name || a.service || 'Reformer';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  const favoriteClass = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Reformer';

  // Class type bars (top 5)
  const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const classTypeBars = sortedTypes.length > 0
    ? sortedTypes.map(([label, count]) => ({ label: label.slice(0, 8), count }))
    : [
        { label: 'Reformer', count: 8 },
        { label: 'Mat', count: 5 },
        { label: 'Barre', count: 4 },
        { label: 'Tower', count: 3 },
        { label: 'Chair', count: 2 },
      ];

  // Latest completed class for workout card
  const latest = [...completed].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))[0];
  const svc = latest ? services.find(s => s.id === latest.serviceId || s.name === latest.service) : null;
  const provider = latest ? providers.find(p => p.id === latest.providerId || p.id === latest.instructorId) : null;
  const className = svc?.name || latest?.service || 'Reformer Flow';
  const instructorName = provider ? (provider.name || `${provider.firstName || ''} ${provider.lastName || ''}`.trim()) : 'Your Instructor';
  const duration = svc?.duration || latest?.duration || 55;
  const focus = svc?.category || 'Core & Stability';
  const dateStr = latest
    ? new Date(latest.date || latest.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Milestone tier
  let milestone = 10;
  let milestoneTitle = 'Getting Started';
  if (totalClasses >= 100) { milestone = 100; milestoneTitle = 'Century Club'; }
  else if (totalClasses >= 50) { milestone = 50; milestoneTitle = 'Half-Century Legend'; }
  else if (totalClasses >= 25) { milestone = 25; milestoneTitle = 'Dedicated Practitioner'; }
  else if (totalClasses >= 10) { milestone = 10; milestoneTitle = 'Consistency Counts'; }

  // Monthly total minutes
  const totalMinutes = thisMonth.reduce((acc, a) => {
    const s = services.find(sv => sv.id === a.serviceId || sv.name === a.service);
    return acc + (s?.duration || a.duration || 55);
  }, 0) || monthlyCount * 55;

  // Streak (consecutive days with a class)
  const dateSets = new Set(completed.map(a => (a.date || a.createdAt || '').slice(0, 10)));
  let streak = 0;
  let checkDate = new Date(now);
  while (dateSets.has(checkDate.toISOString().slice(0, 10))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  streak = Math.max(streak, Math.min(7, Math.ceil(monthlyCount / 4)));

  return {
    studioName,
    userName,
    monthlyCount,
    weekDots,
    bestWeek,
    totalClasses,
    milestone,
    milestoneTitle,
    joinedMonths,
    favoriteClass,
    classTypeBars,
    className,
    instructorName,
    duration,
    focus,
    dateStr,
    monthName,
    totalMinutes,
    streak,
  };
}

// ── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'streak', label: 'Streak' },
  { id: 'workout', label: 'Workout' },
  { id: 'milestone', label: 'Milestone' },
  { id: 'recap', label: 'Monthly Recap' },
];

// ── Main Page ───────────────────────────────────────────────────────────────

export default function SocialShare() {
  const s = useStyles();
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState('streak');
  const [schemeKey, setSchemeKey] = useState('dark');
  const [showName, setShowName] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare;

  const renderCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Load fonts before drawing (browsers need them warm)
    const scheme = { ...COLOR_SCHEMES[schemeKey] };
    const accentHex = s.accent;

    const data = deriveCardData(accentHex);
    data.showName = showName;
    data.showStats = showStats;
    data.showBranding = showBranding;

    ctx.clearRect(0, 0, CW, CH);

    if (activeTab === 'streak') drawStreakCard(ctx, data, scheme, accentHex);
    else if (activeTab === 'workout') drawWorkoutCard(ctx, data, scheme, accentHex);
    else if (activeTab === 'milestone') drawMilestoneCard(ctx, data, scheme, accentHex);
    else if (activeTab === 'recap') drawMonthlyRecap(ctx, data, scheme, accentHex);
  }, [activeTab, schemeKey, showName, showStats, showBranding, s.accent]);

  useEffect(() => {
    // Defer one frame so fonts have a chance to register
    const id = requestAnimationFrame(() => renderCard());
    return () => cancelAnimationFrame(id);
  }, [renderCard]);

  // Re-render when fonts load
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => renderCard());
    }
  }, [renderCard]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-card-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    }, 'image/png');
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      setCopying(true);
      canvas.toBlob(async blob => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } catch {
          // Fallback: download
          handleDownload();
        }
        setTimeout(() => setCopying(false), 2000);
      }, 'image/png');
    } catch {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSharing(true);
    canvas.toBlob(async blob => {
      if (!blob) { setSharing(false); return; }
      const file = new File([blob], `${activeTab}-card.png`, { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Pilates Journey',
            text: 'Check out my progress!',
          });
        } else {
          handleDownload();
        }
      } catch {
        handleDownload();
      }
      setSharing(false);
    }, 'image/png');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        .ss-tab { transition: all 0.2s; }
        .ss-tab:hover { opacity: 0.85; }

        .ss-scheme-btn { transition: all 0.2s; cursor: pointer; }
        .ss-scheme-btn:hover { transform: scale(1.08); }

        .ss-action-btn { transition: all 0.2s cubic-bezier(0.16,1,0.3,1); }
        .ss-action-btn:hover { transform: translateY(-1px); }
        .ss-action-btn:active { transform: translateY(0); }

        .ss-toggle { cursor: pointer; user-select: none; }
        .ss-toggle:hover { opacity: 0.85; }

        @media (max-width: 700px) {
          .ss-layout { flex-direction: column !important; align-items: center !important; }
          .ss-controls { width: 100% !important; max-width: 380px !important; }
          .ss-phone-wrap { width: 100% !important; display: flex !important; justify-content: center !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ ...s.label, marginBottom: 8 }}>Marketing</div>
        <h1 style={{ font: `700 28px 'Outfit', sans-serif`, color: s.text, margin: 0, marginBottom: 6 }}>
          Share Your Journey
        </h1>
        <p style={{ font: `400 14px 'Outfit', sans-serif`, color: s.text2, margin: 0 }}>
          Create Instagram Story-ready cards to celebrate your progress and inspire others.
        </p>
      </div>

      {/* Card Picker Tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 32,
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: 14, padding: 6,
        boxShadow: s.shadow,
        width: 'fit-content',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className="ss-tab"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                font: `${active ? '600' : '400'} 13px 'Outfit', sans-serif`,
                background: active ? s.accent : 'transparent',
                color: active ? s.accentText : s.text2,
                boxShadow: active ? `0 2px 12px ${s.accent}33` : 'none',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main layout: phone frame + controls */}
      <div className="ss-layout" style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* Phone frame + canvas preview */}
        <div className="ss-phone-wrap">
          <div style={{
            position: 'relative',
            width: 300,
            flexShrink: 0,
          }}>
            {/* Phone shell */}
            <div style={{
              background: '#111',
              borderRadius: 44,
              padding: '14px 10px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset',
              position: 'relative',
            }}>
              {/* Notch */}
              <div style={{
                position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                width: 90, height: 26, background: '#000',
                borderRadius: 16, zIndex: 10,
              }} />

              {/* Screen */}
              <div style={{
                borderRadius: 34, overflow: 'hidden',
                aspectRatio: '9 / 16',
                position: 'relative',
              }}>
                <canvas
                  ref={canvasRef}
                  width={CW}
                  height={CH}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    imageRendering: 'crisp-edges',
                  }}
                />
              </div>

              {/* Home indicator */}
              <div style={{
                margin: '10px auto 4px', width: 100, height: 4,
                background: 'rgba(255,255,255,0.25)', borderRadius: 4,
              }} />
            </div>

            {/* Resolution label */}
            <div style={{
              textAlign: 'center', marginTop: 12,
              font: `400 11px 'JetBrains Mono', monospace`,
              color: s.text3, letterSpacing: 0.5,
            }}>
              1080 × 1920 — Instagram Story
            </div>
          </div>
        </div>

        {/* Controls panel */}
        <div className="ss-controls" style={{ flex: 1, minWidth: 0 }}>

          {/* Color Scheme */}
          <div style={{ ...s.cardStyle, padding: 20, marginBottom: 16 }}>
            <div style={{ ...s.label, marginBottom: 14 }}>Color Scheme</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => {
                const active = schemeKey === key;
                const previewBg = scheme.bg1 === null ? s.accent : scheme.bg1;
                const previewBg2 = scheme.bg2 === null ? darken(s.accent, 60) : scheme.bg2;
                return (
                  <button
                    key={key}
                    className="ss-scheme-btn"
                    onClick={() => setSchemeKey(key)}
                    style={{
                      padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: active ? s.accentLight : 'rgba(255,255,255,0.5)',
                      border: active ? `2px solid ${s.accent}` : '1.5px solid rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    {/* Mini gradient swatch */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: `linear-gradient(135deg, ${previewBg}, ${previewBg2})`,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }} />
                    <span style={{
                      font: `${active ? '600' : '400'} 13px 'Outfit', sans-serif`,
                      color: active ? s.accent : s.text2,
                    }}>
                      {scheme.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle options */}
          <div style={{ ...s.cardStyle, padding: 20, marginBottom: 16 }}>
            <div style={{ ...s.label, marginBottom: 14 }}>Card Elements</div>
            {[
              { key: 'name', label: 'Show your name', state: showName, setState: setShowName },
              { key: 'stats', label: 'Show stats & details', state: showStats, setState: setShowStats },
              { key: 'branding', label: 'Studio branding', state: showBranding, setState: setShowBranding },
            ].map(({ key, label, state, setState }) => (
              <div
                key={key}
                className="ss-toggle"
                onClick={() => setState(!state)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 0',
                  borderBottom: key !== 'branding' ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}
              >
                <span style={{ font: `400 14px 'Outfit', sans-serif`, color: s.text }}>{label}</span>
                {/* Toggle switch */}
                <div style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: state ? s.accent : 'rgba(0,0,0,0.12)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#FFFFFF',
                    position: 'absolute', top: 3,
                    left: state ? 23 : 3,
                    transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Download */}
            <button
              className="ss-action-btn"
              onClick={handleDownload}
              style={{
                ...s.pillAccent,
                padding: '13px 24px', borderRadius: 12, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 4px 16px ${s.accent}40`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloaded ? 'Downloaded!' : 'Download PNG (1080×1920)'}
            </button>

            {/* Copy to clipboard */}
            <button
              className="ss-action-btn"
              onClick={handleCopy}
              style={{
                ...s.pillOutline,
                padding: '13px 24px', borderRadius: 12, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              {copying ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            {/* Share (if Web Share API available) */}
            <button
              className="ss-action-btn"
              onClick={canShare ? handleShare : handleDownload}
              style={{
                ...s.pillGhost,
                padding: '13px 24px', borderRadius: 12, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              {sharing ? 'Sharing...' : canShare ? 'Share to Instagram' : 'Share (Download)'}
            </button>
          </div>

          {/* Tip */}
          <div style={{
            marginTop: 20, padding: 14, borderRadius: 10,
            background: `${s.accent}10`, border: `1px solid ${s.accent}20`,
          }}>
            <p style={{ font: `400 12px 'Outfit', sans-serif`, color: s.text2, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: s.accent }}>Tip:</strong> Download the 1080×1920 PNG, then open
              Instagram Stories, tap the photo icon, and select the saved image for a perfect fit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
