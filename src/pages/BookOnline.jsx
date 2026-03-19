import { useState, useEffect, useMemo, useRef } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import {
  getServices, getProviders, getLocations, getAppointments,
  addAppointment, getSettings, subscribe,
} from '../data/store';

const fmt = (cents) => cents === 0 ? 'Complimentary' : `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

const CATEGORIES = ['All', 'Reformer', 'Mat', 'Barre', 'Stretch', 'Private', 'Wellness', 'Packages', 'Consultation'];

// Merge similar categories for display
const DISPLAY_CATEGORIES = [
  { label: 'All', match: () => true },
  { label: 'Reformer', match: (c) => c === 'Reformer' },
  { label: 'Mat', match: (c) => c === 'Mat' },
  { label: 'Barre', match: (c) => c === 'Barre' },
  { label: 'Stretch', match: (c) => c === 'Stretch' },
  { label: 'Private', match: (c) => c === 'Private' },
  { label: 'Wellness', match: (c) => c === 'Wellness' },
  { label: 'Packages', match: (c) => c === 'Packages' || c === 'Consultation' },
];

/* --- keyframe injection (once) --- */
const ANIM_ID = 'book-online-anims';
if (!document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes bookFadeInUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes bookSlideIn {
      from { opacity: 0; transform: translateX(30px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes bookSlideOut {
      from { opacity: 1; transform: translateX(0); }
      to   { opacity: 0; transform: translateX(-30px); }
    }
    @keyframes bookPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }
    @keyframes bookConfetti {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(-120px) rotate(720deg); opacity: 0; }
    }
    @keyframes bookCheckmark {
      0% { stroke-dashoffset: 40; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes bookScaleIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes bookOrb1 {
      0%,100% { transform: translate(0,0) scale(1); }
      50%     { transform: translate(30px,-20px) scale(1.1); }
    }
    @keyframes bookOrb2 {
      0%,100% { transform: translate(0,0) scale(1); }
      50%     { transform: translate(-40px,20px) scale(1.08); }
    }
    .book-fadeInUp { animation: bookFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
    .book-slideIn { animation: bookSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) both; }
    .book-scaleIn { animation: bookScaleIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }
    .book-stagger-1 { animation-delay: 0.03s; }
    .book-stagger-2 { animation-delay: 0.06s; }
    .book-stagger-3 { animation-delay: 0.09s; }
    .book-stagger-4 { animation-delay: 0.12s; }
    .book-stagger-5 { animation-delay: 0.15s; }
    .book-stagger-6 { animation-delay: 0.18s; }
    .book-stagger-7 { animation-delay: 0.21s; }
    .book-stagger-8 { animation-delay: 0.24s; }
    @keyframes bookCardHover {
      from { transform: translateY(0) scale(1); }
      to   { transform: translateY(-2px) scale(1.005); }
    }
    .book-cats::-webkit-scrollbar { display:none; }
    .book-days::-webkit-scrollbar { display:none; }
    .book-cal-strip::-webkit-scrollbar { display:none; }
    .book-svc-card {
      transition: transform 0.22s cubic-bezier(0.16,1,0.3,1),
                  box-shadow 0.22s cubic-bezier(0.16,1,0.3,1);
    }
    .book-svc-card:hover {
      transform: translateY(-2px) scale(1.005);
      box-shadow: 0 14px 44px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05) !important;
    }
    .book-svc-card:active {
      transform: scale(0.99);
    }
    .book-cal-day {
      transition: transform 0.2s cubic-bezier(0.16,1,0.3,1),
                  background 0.2s ease,
                  box-shadow 0.2s ease;
    }
    .book-cal-day:hover {
      transform: translateY(-2px);
    }
    @media (max-width: 768px) {
      .book-container { padding: 24px 14px 48px !important; }
      .book-step-card { padding: 20px 16px !important; }
      .book-provider-grid { grid-template-columns: 1fr !important; }
      .book-form-name-row { flex-direction: column !important; }
      .book-form-name-row > div { width: 100% !important; }
    }
  `;
  document.head.appendChild(sheet);
}

export default function BookOnline() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  // Step state
  const [step, setStep] = useState(1);
  const [animDir, setAnimDir] = useState('in');

  // Step 1
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [calendarDay, setCalendarDay] = useState(null); // null = show all (no date filter on step 1)
  const calendarRef = useRef(null);

  // Step 2
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Step 3
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});

  // Success
  const [booked, setBooked] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const containerRef = useRef(null);

  // Data
  const services = getServices();
  const providers = getProviders();
  const locations = getLocations();
  const settings = getSettings();
  const appointments = getAppointments();

  const businessName = settings.businessName || 'Pilates';
  const tagline = settings.tagline || '';

  // Build 14 days from today
  const days = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      arr.push({
        date: d.toISOString().slice(0, 10),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
      });
    }
    return arr;
  }, []);

  // Auto-select today and scroll calendar into view on mount
  useEffect(() => {
    if (days.length > 0 && calendarDay === null) {
      setCalendarDay(days[0].date);
    }
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (calendarRef.current && calendarDay) {
      const el = calendarRef.current.querySelector('[data-cal-active="true"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [calendarDay]);

  // Derive difficulty from service name/category
  function getDifficulty(svc) {
    const name = (svc.name || '').toLowerCase();
    const cat  = (svc.category || '').toLowerCase();
    if (
      name.includes('burn') || name.includes('cardio') || name.includes('fusion') ||
      name.includes('advanced') || name.includes('trx') || cat.includes('trx')
    ) return 'Advanced';
    if (
      name.includes('private') || name.includes('semi-private') ||
      name.includes('apparatus') || name.includes('prenatal') ||
      name.includes('youth') || cat.includes('specialty') || cat.includes('private')
    ) return 'Intermediate';
    if (
      name.includes('intro') || name.includes('consultation') ||
      name.includes('restore') || name.includes('stretch') ||
      cat.includes('intro') || cat.includes('consultation') || cat.includes('wellness')
    ) return 'Beginner';
    return 'Intermediate';
  }

  const DIFFICULTY_STYLES = {
    Beginner:     { bg: '#E8F2E9', color: '#3D6B42', label: 'Beginner' },
    Intermediate: { bg: '#FDF0E8', color: '#8C4A25', label: 'Intermediate' },
    Advanced:     { bg: '#FAE8ED', color: '#8B3555', label: 'Advanced' },
  };

  // Format calendar header date
  function fmtCalHeader(dateStr) {
    if (!dateStr) return '';
    const today = days[0]?.date;
    const tomorrow = days[1]?.date;
    const dt = new Date(dateStr + 'T12:00:00');
    const weekday = dt.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    if (dateStr === today) return `Today, ${monthDay}`;
    if (dateStr === tomorrow) return `Tomorrow, ${monthDay}`;
    return `${weekday}, ${monthDay}`;
  }

  // Which days have any service that could be scheduled
  // (since services aren't date-specific, we just show all days as having classes)
  const daysWithClasses = useMemo(() => new Set(days.map(d => d.date)), [days]);

  // Filter services
  const filteredServices = useMemo(() => {
    let list = services;
    if (activeCategory !== 'All') {
      const cat = DISPLAY_CATEGORIES.find(c => c.label === activeCategory);
      if (cat) list = list.filter(svc => cat.match(svc.category));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(svc =>
        svc.name.toLowerCase().includes(q) ||
        (svc.description || '').toLowerCase().includes(q) ||
        (svc.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [services, activeCategory, searchTerm]);

  // Active categories (only show categories that have services)
  const activeCategories = useMemo(() => {
    const cats = new Set(services.map(svc => svc.category));
    return DISPLAY_CATEGORIES.filter(dc =>
      dc.label === 'All' || services.some(svc => dc.match(svc.category))
    );
  }, [services]);

  // Providers that can do the selected service
  const eligibleProviders = useMemo(() => {
    if (!selectedService) return [];
    return providers.filter(p => {
      if (!p.specialties || p.specialties.length === 0) return true;
      // Check if any specialty loosely matches the service name or category
      return p.specialties.some(sp =>
        selectedService.name.toLowerCase().includes(sp.toLowerCase()) ||
        sp.toLowerCase().includes(selectedService.name.toLowerCase()) ||
        (selectedService.category || '').toLowerCase().includes(sp.toLowerCase()) ||
        sp.toLowerCase().includes((selectedService.category || '').toLowerCase())
      );
    });
  }, [selectedService, providers]);

  // If no providers match specialties, show all (fallback)
  const displayProviders = eligibleProviders.length > 0 ? eligibleProviders : providers;

  // Generate time slots (9am-6pm, 30-min increments) minus already-booked
  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedProvider) return [];
    const slots = [];
    for (let h = 9; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        // Check if this slot conflicts with an existing appointment
        const conflict = appointments.some(a =>
          a.date === selectedDate &&
          a.providerId === selectedProvider.id &&
          a.time === time &&
          a.status !== 'cancelled'
        );
        slots.push({ time, label: formatTime(time), available: !conflict });
      }
    }
    return slots;
  }, [selectedDate, selectedProvider, appointments]);

  function formatTime(t) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function goToStep(n) {
    setAnimDir(n > step ? 'in' : 'out');
    setStep(n);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBook() {
    const errors = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.email.trim() || !form.email.includes('@')) errors.email = true;
    if (!form.phone.trim()) errors.phone = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const apt = addAppointment({
      patientName: form.name,
      patientEmail: form.email,
      patientPhone: form.phone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      date: selectedDate,
      time: selectedTime,
      duration: selectedService.duration || 30,
      status: 'pending',
      location: locations[0]?.id || 'LOC-1',
      notes: form.notes,
      source: 'online-booking',
    });

    setBooked(apt);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }

  function generateICS() {
    if (!booked) return;
    const dateStr = booked.date.replace(/-/g, '');
    const [h, m] = booked.time.split(':');
    const startTime = `${dateStr}T${h}${m}00`;
    const dur = selectedService?.duration || 30;
    const endH = parseInt(h) + Math.floor((parseInt(m) + dur) / 60);
    const endM = (parseInt(m) + dur) % 60;
    const endTime = `${dateStr}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pilates//Booking//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${selectedService?.name} at ${businessName}`,
      `DESCRIPTION:Provider: ${selectedProvider?.name}`,
      `LOCATION:${locations[0]?.address || ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-${booked.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetBooking() {
    setStep(1);
    setSelectedService(null);
    setSelectedProvider(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setForm({ name: '', email: '', phone: '', notes: '' });
    setFormErrors({});
    setBooked(null);
  }

  // Shared glass style
  const glass = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.7)',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 1.5px 4px rgba(0,0,0,0.03)',
    transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
  };

  const fmtDateLong = (d) => {
    if (!d) return '';
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // ── Confetti particles ──
  const confettiColors = [s.accent, '#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#F97316'];
  const confettiParticles = showConfetti ? Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${1 + Math.random() * 1.5}s`,
    color: confettiColors[i % confettiColors.length],
    size: 6 + Math.random() * 6,
    rotation: Math.random() * 360,
  })) : [];

  // ══════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh', background: s.bg, fontFamily: s.FONT,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Fixed home button */}
      <button onClick={() => window.location.href = '/'} style={{
        position: 'fixed', top: 16, left: 16, zIndex: 100,
        padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)',
        font: `400 12px ${s.FONT}`, color: '#888', cursor: 'pointer',
      }}>← Home</button>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: -100, right: -100, width: 350, height: 350,
        borderRadius: '50%', background: `${s.accent}08`,
        animation: 'bookOrb1 20s ease-in-out infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -80, left: -80, width: 300, height: 300,
        borderRadius: '50%', background: `${s.accent}06`,
        animation: 'bookOrb2 25s ease-in-out infinite', pointerEvents: 'none',
      }} />

      {/* Confetti overlay */}
      {showConfetti && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000,
          overflow: 'hidden',
        }}>
          {confettiParticles.map(p => (
            <div key={p.id} style={{
              position: 'absolute',
              bottom: -20,
              left: p.left,
              width: p.size,
              height: p.size,
              borderRadius: p.size > 9 ? '50%' : 2,
              background: p.color,
              animation: `bookConfetti ${p.duration} ${p.delay} cubic-bezier(0.16,1,0.3,1) both`,
              transform: `rotate(${p.rotation}deg)`,
            }} />
          ))}
        </div>
      )}

      {/* Main container */}
      <div className="book-container" style={{
        maxWidth: 700, margin: '0 auto', padding: '40px 20px 60px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div className="book-fadeInUp" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontSize: 11, fontFamily: s.MONO, textTransform: 'uppercase',
            letterSpacing: 3, color: s.accent, marginBottom: 12, fontWeight: 600,
          }}>
            Book Your Experience
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 300, color: s.text, margin: 0,
            letterSpacing: -0.5,
          }}>
            {businessName}
          </h1>
          {tagline && (
            <p style={{
              fontSize: 14, color: s.text3, marginTop: 6, fontWeight: 400,
              fontStyle: 'italic',
            }}>
              {tagline}
            </p>
          )}
        </div>

        {/* Step indicator */}
        {!booked && (
          <div className="book-fadeInUp book-stagger-1" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, marginBottom: 36,
          }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  onClick={() => { if (n < step) goToStep(n); }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600, fontFamily: s.MONO,
                    cursor: n < step ? 'pointer' : 'default',
                    background: n === step ? s.accent : n < step ? `${s.accent}18` : 'rgba(255,255,255,0.5)',
                    color: n === step ? s.accentText : n < step ? s.accent : s.text3,
                    border: n === step ? 'none' : `1.5px solid ${n < step ? `${s.accent}30` : 'rgba(0,0,0,0.06)'}`,
                    boxShadow: n === step ? `0 4px 16px ${s.accent}40` : 'none',
                    transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  {n < step ? '\u2713' : n}
                </div>
                {n < 3 && (
                  <div style={{
                    width: 40, height: 2,
                    background: n < step ? `${s.accent}30` : 'rgba(0,0,0,0.06)',
                    borderRadius: 1,
                    transition: 'background 0.35s',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step labels */}
        {!booked && (
          <div style={{
            textAlign: 'center', marginBottom: 28,
            fontSize: 11, fontFamily: s.MONO, textTransform: 'uppercase',
            letterSpacing: 1.5, color: s.text3, fontWeight: 500,
          }}>
            {step === 1 && 'Choose Your Service'}
            {step === 2 && 'Select Instructor & Time'}
            {step === 3 && 'Confirm Your Booking'}
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/*  STEP 1: Choose Service                 */}
        {/* ════════════════════════════════════════ */}
        {step === 1 && (
          <div className="book-slideIn" key="step1">
            {/* Search */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    ...s.input,
                    paddingLeft: 44,
                    borderRadius: 100,
                    background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(16px)',
                    fontSize: 14,
                  }}
                  onFocus={e => { e.target.style.borderColor = `${s.accent}40`; e.target.style.boxShadow = `0 0 0 3px ${s.accent}12`; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.06)'; e.target.style.boxShadow = 'none'; }}
                />
                <span style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 16, opacity: 0.35, pointerEvents: 'none',
                }}>
                  {'\u2315'}
                </span>
              </div>
            </div>

            {/* Category pills */}
            <div className="book-cats" style={{
              display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
              marginBottom: 24, scrollbarWidth: 'none',
            }}>
              {activeCategories.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  style={{
                    ...s.pill,
                    flexShrink: 0,
                    background: activeCategory === cat.label ? s.accent : 'rgba(255,255,255,0.5)',
                    color: activeCategory === cat.label ? s.accentText : s.text2,
                    border: activeCategory === cat.label ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    boxShadow: activeCategory === cat.label ? `0 2px 12px ${s.accent}33` : 'none',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ── Calendar Strip ── */}
            <div style={{ marginBottom: 8 }}>
              <div
                ref={calendarRef}
                className="book-cal-strip"
                style={{
                  display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8,
                  scrollbarWidth: 'none', scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {days.map((day, i) => {
                  const active = calendarDay === day.date;
                  const hasClasses = daysWithClasses.has(day.date);
                  return (
                    <div
                      key={day.date}
                      data-cal-active={active ? 'true' : 'false'}
                      className="book-cal-day"
                      onClick={() => setCalendarDay(day.date)}
                      style={{
                        flexShrink: 0, scrollSnapAlign: 'start',
                        width: 54, padding: '10px 0 8px',
                        borderRadius: 14, textAlign: 'center',
                        cursor: 'pointer',
                        background: active
                          ? s.accent
                          : day.isToday
                            ? `${s.accent}14`
                            : 'rgba(255,255,255,0.55)',
                        border: active
                          ? 'none'
                          : day.isToday
                            ? `1.5px solid ${s.accent}30`
                            : '1px solid rgba(0,0,0,0.05)',
                        boxShadow: active
                          ? `0 4px 16px ${s.accent}30`
                          : 'none',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                      {/* Day name */}
                      <div style={{
                        fontSize: 9, fontFamily: s.MONO,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        color: active ? `${s.accentText}CC` : s.text3,
                        fontWeight: 600, marginBottom: 4,
                      }}>
                        {day.dayName}
                      </div>
                      {/* Date number */}
                      <div style={{
                        fontSize: 18, fontWeight: 700,
                        color: active ? s.accentText : day.isToday ? s.accent : s.text,
                        lineHeight: 1,
                      }}>
                        {day.dayNum}
                      </div>
                      {/* Month */}
                      <div style={{
                        fontSize: 9, fontFamily: s.MONO,
                        color: active ? `${s.accentText}AA` : s.text3,
                        marginTop: 3, fontWeight: 500,
                      }}>
                        {day.monthName}
                      </div>
                      {/* Dot indicator */}
                      <div style={{
                        marginTop: 6, display: 'flex', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: active
                            ? `${s.accentText}99`
                            : hasClasses
                              ? `${s.accent}60`
                              : 'transparent',
                          transition: 'background 0.2s',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Date Section Header ── */}
            {calendarDay && (
              <div className="book-fadeInUp" style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginBottom: 16, marginTop: 4,
              }}>
                <div style={{
                  fontSize: 17, fontWeight: 600, color: s.text,
                  letterSpacing: -0.3,
                }}>
                  {fmtCalHeader(calendarDay)}
                </div>
                <div style={{
                  fontSize: 11, fontFamily: s.MONO, fontWeight: 500,
                  color: s.text3, textTransform: 'uppercase', letterSpacing: 1,
                }}>
                  {filteredServices.length} {filteredServices.length === 1 ? 'class' : 'classes'} available
                </div>
              </div>
            )}

            {/* Service cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredServices.length === 0 && (
                <div style={{
                  ...glass, padding: 40, textAlign: 'center', color: s.text3,
                  fontSize: 14,
                }}>
                  No services found. Try a different search.
                </div>
              )}
              {filteredServices.map((svc, i) => {
                const selected = selectedService?.id === svc.id;
                const difficulty = getDifficulty(svc);
                const diffStyle = DIFFICULTY_STYLES[difficulty];
                // Instructor avatar: pick a lead provider by category match or just the first one
                const leadProvider = providers.find(p =>
                  p.specialties?.some(sp =>
                    sp.toLowerCase().includes((svc.category || '').toLowerCase()) ||
                    (svc.category || '').toLowerCase().includes(sp.toLowerCase())
                  )
                ) || providers[i % (providers.length || 1)];
                const avatarGrad = leadProvider ? getAvatarGradient(leadProvider.name) : getAvatarGradient(svc.name);
                const avatarInitials = leadProvider
                  ? leadProvider.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                  : svc.name.slice(0, 2).toUpperCase();
                // Spots: use svc.capacity if defined, otherwise don't show
                const totalSpots = svc.capacity || null;
                const bookedSpots = totalSpots
                  ? appointments.filter(a =>
                      a.serviceId === svc.id &&
                      a.date === calendarDay &&
                      a.status !== 'cancelled'
                    ).length
                  : 0;
                const spotsLeft = totalSpots ? totalSpots - bookedSpots : null;
                const spotsLow = spotsLeft !== null && spotsLeft <= 4;

                return (
                  <div
                    key={svc.id}
                    className={`book-fadeInUp book-svc-card book-stagger-${Math.min(i + 1, 8)}`}
                    onClick={() => setSelectedService(selected ? null : svc)}
                    style={{
                      ...glass,
                      padding: '18px 20px',
                      cursor: 'pointer',
                      border: selected
                        ? `2px solid ${s.accent}`
                        : '1px solid rgba(255,255,255,0.7)',
                      boxShadow: selected
                        ? `0 8px 32px ${s.accent}20, 0 1.5px 4px rgba(0,0,0,0.03)`
                        : glass.boxShadow,
                      background: selected
                        ? `${s.accent}08`
                        : glass.background,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Selected check */}
                    {selected && (
                      <div style={{
                        position: 'absolute', top: 14, right: 14,
                        width: 22, height: 22, borderRadius: '50%',
                        background: s.accent, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 8px ${s.accent}40`,
                      }}>
                        <span style={{ color: s.accentText, fontSize: 12, fontWeight: 700 }}>{'\u2713'}</span>
                      </div>
                    )}

                    {/* Card body */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {/* Instructor avatar */}
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: avatarGrad,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 14, fontWeight: 700, color: '#fff',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                        letterSpacing: 0.5,
                      }}>
                        {avatarInitials}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0, paddingRight: selected ? 28 : 0 }}>
                        {/* Name */}
                        <div style={{
                          fontSize: 15, fontWeight: 600, color: s.text,
                          marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {svc.name}
                        </div>

                        {/* Pills row */}
                        <div style={{
                          display: 'flex', gap: 6, flexWrap: 'wrap',
                          alignItems: 'center', marginBottom: 6,
                        }}>
                          {/* Category */}
                          <span style={{
                            font: `500 10px ${s.MONO}`,
                            textTransform: 'uppercase', letterSpacing: 1,
                            color: s.accent,
                          }}>
                            {svc.category}
                          </span>
                          <span style={{ color: s.text3, fontSize: 10 }}>·</span>
                          {/* Duration pill */}
                          <span style={{
                            font: `500 10px ${s.MONO}`,
                            textTransform: 'uppercase', letterSpacing: 1,
                            background: 'rgba(0,0,0,0.04)',
                            color: s.text2,
                            padding: '2px 8px', borderRadius: 100,
                          }}>
                            {svc.duration} min
                          </span>
                          {/* Difficulty pill */}
                          <span style={{
                            font: `500 10px ${s.MONO}`,
                            textTransform: 'uppercase', letterSpacing: 1,
                            background: diffStyle.bg,
                            color: diffStyle.color,
                            padding: '2px 8px', borderRadius: 100,
                          }}>
                            {diffStyle.label}
                          </span>
                          {/* Spots left */}
                          {spotsLeft !== null && (
                            <span style={{
                              font: `500 10px ${s.MONO}`,
                              textTransform: 'uppercase', letterSpacing: 1,
                              background: spotsLow ? '#FDF0E8' : 'rgba(0,0,0,0.03)',
                              color: spotsLow ? '#8C4A25' : s.text3,
                              padding: '2px 8px', borderRadius: 100,
                            }}>
                              {spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {svc.description && (
                          <div style={{
                            fontSize: 12.5, color: s.text3, lineHeight: 1.5,
                          }}>
                            {svc.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price row */}
                    <div style={{
                      display: 'flex', gap: 12, marginTop: 12,
                      alignItems: 'center', paddingLeft: 56,
                    }}>
                      <span style={{
                        fontSize: 15, fontWeight: 700, color: s.accent,
                      }}>
                        {fmt(svc.price)}
                      </span>
                      {svc.unit && (
                        <span style={{
                          fontSize: 11, color: s.text3, fontStyle: 'italic',
                        }}>
                          {svc.unit}
                        </span>
                      )}
                      {leadProvider && (
                        <span style={{
                          marginLeft: 'auto', fontSize: 11, color: s.text3,
                        }}>
                          with {leadProvider.name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue button */}
            {selectedService && (
              <div className="book-scaleIn" style={{ marginTop: 28, textAlign: 'center' }}>
                <button
                  onClick={() => goToStep(2)}
                  style={{
                    ...s.pillAccent,
                    padding: '14px 48px',
                    fontSize: 15,
                    fontWeight: 600,
                    boxShadow: `0 4px 20px ${s.accent}40`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 28px ${s.accent}50`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 20px ${s.accent}40`;
                  }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/*  STEP 2: Provider & Time                */}
        {/* ════════════════════════════════════════ */}
        {step === 2 && (
          <div className="book-slideIn" key="step2">
            {/* Selected service summary */}
            <div style={{
              ...glass,
              padding: '14px 20px',
              marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: s.text }}>
                  {selectedService?.name}
                </span>
                <span style={{ fontSize: 13, color: s.text3, marginLeft: 12 }}>
                  {selectedService?.duration} min &middot; {fmt(selectedService?.price || 0)}
                </span>
              </div>
              <button
                onClick={() => goToStep(1)}
                style={{
                  ...s.pillGhost,
                  padding: '6px 14px', fontSize: 12,
                }}
              >
                Change
              </button>
            </div>

            {/* Provider selection */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...s.label, marginBottom: 12 }}>Choose Instructor</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {displayProviders.map(prov => {
                  const sel = selectedProvider?.id === prov.id;
                  return (
                    <div
                      key={prov.id}
                      onClick={() => {
                        setSelectedProvider(sel ? null : prov);
                        setSelectedTime(null);
                      }}
                      style={{
                        ...glass,
                        padding: '16px 20px',
                        cursor: 'pointer',
                        flex: '1 1 200px',
                        minWidth: 180,
                        border: sel ? `2px solid ${s.accent}` : '1px solid rgba(255,255,255,0.7)',
                        background: sel ? `${s.accent}08` : glass.background,
                        boxShadow: sel ? `0 8px 32px ${s.accent}18` : glass.boxShadow,
                      }}
                      onMouseEnter={e => {
                        if (!sel) e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        if (!sel) e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Avatar circle */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: sel ? s.accent : `${s.accent}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 10, fontSize: 16,
                        color: sel ? s.accentText : s.accent,
                        fontWeight: 600,
                      }}>
                        {prov.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: s.text }}>
                        {prov.name}
                      </div>
                      <div style={{
                        fontSize: 12, color: s.text3, marginTop: 2,
                      }}>
                        {prov.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date picker */}
            {selectedProvider && (
              <div className="book-fadeInUp" style={{ marginBottom: 24 }}>
                <div style={{ ...s.label, marginBottom: 12 }}>Select Date</div>
                <div className="book-days" style={{
                  display: 'flex', gap: 8, overflowX: 'auto',
                  paddingBottom: 4, scrollbarWidth: 'none',
                }}>
                  {days.map(day => {
                    const sel = selectedDate === day.date;
                    return (
                      <div
                        key={day.date}
                        onClick={() => { setSelectedDate(day.date); setSelectedTime(null); }}
                        style={{
                          flexShrink: 0,
                          width: 64, padding: '12px 0',
                          borderRadius: 16, textAlign: 'center',
                          cursor: 'pointer',
                          background: sel ? s.accent : 'rgba(255,255,255,0.5)',
                          border: sel ? 'none' : '1px solid rgba(0,0,0,0.05)',
                          boxShadow: sel ? `0 4px 16px ${s.accent}35` : 'none',
                          transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                          backdropFilter: 'blur(8px)',
                        }}
                        onMouseEnter={e => {
                          if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                        }}
                        onMouseLeave={e => {
                          if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                        }}
                      >
                        <div style={{
                          fontSize: 10, fontFamily: s.MONO, textTransform: 'uppercase',
                          letterSpacing: 1, color: sel ? s.accentText : s.text3,
                          marginBottom: 4, fontWeight: 500,
                        }}>
                          {day.dayName}
                        </div>
                        <div style={{
                          fontSize: 20, fontWeight: 600,
                          color: sel ? s.accentText : s.text,
                        }}>
                          {day.dayNum}
                        </div>
                        <div style={{
                          fontSize: 10, color: sel ? `${s.accentText}BB` : s.text3,
                          marginTop: 2,
                        }}>
                          {day.monthName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time slots */}
            {selectedDate && selectedProvider && (
              <div className="book-fadeInUp" style={{ marginBottom: 24 }}>
                <div style={{ ...s.label, marginBottom: 12 }}>Available Times</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: 8,
                }}>
                  {timeSlots.map(slot => {
                    const sel = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        style={{
                          padding: '10px 0',
                          borderRadius: 12,
                          border: sel ? `2px solid ${s.accent}` : '1px solid rgba(0,0,0,0.05)',
                          background: sel
                            ? `${s.accent}12`
                            : slot.available
                              ? 'rgba(255,255,255,0.5)'
                              : 'rgba(0,0,0,0.03)',
                          color: sel ? s.accent : slot.available ? s.text : s.text3,
                          fontSize: 13,
                          fontWeight: sel ? 600 : 500,
                          fontFamily: s.FONT,
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          opacity: slot.available ? 1 : 0.4,
                          backdropFilter: 'blur(8px)',
                          transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                          textDecoration: slot.available ? 'none' : 'line-through',
                        }}
                        onMouseEnter={e => {
                          if (slot.available && !sel) e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                        }}
                        onMouseLeave={e => {
                          if (slot.available && !sel) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                        }}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Continue */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'center' }}>
              <button
                onClick={() => goToStep(1)}
                style={{ ...s.pillGhost, padding: '12px 28px', fontSize: 14 }}
              >
                Back
              </button>
              {selectedProvider && selectedDate && selectedTime && (
                <button
                  className="book-scaleIn"
                  onClick={() => goToStep(3)}
                  style={{
                    ...s.pillAccent,
                    padding: '14px 48px',
                    fontSize: 15,
                    fontWeight: 600,
                    boxShadow: `0 4px 20px ${s.accent}40`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 28px ${s.accent}50`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 20px ${s.accent}40`;
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/*  STEP 3: Your Info & Confirm            */}
        {/* ════════════════════════════════════════ */}
        {step === 3 && !booked && (
          <div className="book-slideIn" key="step3">
            {/* Summary card */}
            <div style={{
              ...glass,
              padding: 24,
              marginBottom: 28,
              background: `linear-gradient(135deg, rgba(255,255,255,0.65), ${s.accent}06)`,
            }}>
              <div style={{
                fontSize: 11, fontFamily: s.MONO, textTransform: 'uppercase',
                letterSpacing: 1.5, color: s.text3, marginBottom: 16, fontWeight: 500,
              }}>
                Appointment Summary
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: s.text3 }}>Service</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: s.text }}>{selectedService?.name}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(0,0,0,0.04)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: s.text3 }}>Instructor</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: s.text }}>{selectedProvider?.name}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(0,0,0,0.04)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: s.text3 }}>Date</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: s.text }}>{fmtDateLong(selectedDate)}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(0,0,0,0.04)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: s.text3 }}>Time</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: s.text }}>{formatTime(selectedTime)}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(0,0,0,0.04)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: s.text3 }}>Duration</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: s.text }}>{selectedService?.duration} min</span>
                </div>
                <div style={{ height: 1, background: 'rgba(0,0,0,0.04)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: s.text3 }}>Price</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: s.accent }}>{fmt(selectedService?.price || 0)}</span>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div style={{ ...glass, padding: 24, marginBottom: 28 }}>
              <div style={{
                fontSize: 11, fontFamily: s.MONO, textTransform: 'uppercase',
                letterSpacing: 1.5, color: s.text3, marginBottom: 20, fontWeight: 500,
              }}>
                Your Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={s.label}>Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    style={{
                      ...s.input,
                      borderColor: formErrors.name ? '#DC2626' : undefined,
                    }}
                    onFocus={e => { e.target.style.borderColor = `${s.accent}40`; e.target.style.boxShadow = `0 0 0 3px ${s.accent}12`; }}
                    onBlur={e => { e.target.style.borderColor = formErrors.name ? '#DC2626' : 'rgba(0,0,0,0.06)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={s.label}>Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@email.com"
                    style={{
                      ...s.input,
                      borderColor: formErrors.email ? '#DC2626' : undefined,
                    }}
                    onFocus={e => { e.target.style.borderColor = `${s.accent}40`; e.target.style.boxShadow = `0 0 0 3px ${s.accent}12`; }}
                    onBlur={e => { e.target.style.borderColor = formErrors.email ? '#DC2626' : 'rgba(0,0,0,0.06)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={s.label}>Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 555-0100"
                    style={{
                      ...s.input,
                      borderColor: formErrors.phone ? '#DC2626' : undefined,
                    }}
                    onFocus={e => { e.target.style.borderColor = `${s.accent}40`; e.target.style.boxShadow = `0 0 0 3px ${s.accent}12`; }}
                    onBlur={e => { e.target.style.borderColor = formErrors.phone ? '#DC2626' : 'rgba(0,0,0,0.06)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={s.label}>Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any allergies, concerns, or special requests..."
                    rows={3}
                    style={{
                      ...s.input,
                      resize: 'vertical',
                      minHeight: 80,
                    }}
                    onFocus={e => { e.target.style.borderColor = `${s.accent}40`; e.target.style.boxShadow = `0 0 0 3px ${s.accent}12`; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.06)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {Object.keys(formErrors).length > 0 && (
                <div style={{
                  marginTop: 12, fontSize: 12, color: '#DC2626',
                  background: '#FEF2F2', padding: '8px 14px', borderRadius: 10,
                }}>
                  Please fill in all required fields.
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => goToStep(2)}
                style={{ ...s.pillGhost, padding: '12px 28px', fontSize: 14 }}
              >
                Back
              </button>
              <button
                onClick={handleBook}
                style={{
                  ...s.pillAccent,
                  padding: '14px 48px',
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: `0 4px 20px ${s.accent}40`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 28px ${s.accent}50`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${s.accent}40`;
                }}
              >
                Book Appointment
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/*  SUCCESS                                */}
        {/* ════════════════════════════════════════ */}
        {booked && (
          <div className="book-scaleIn" key="success" style={{ textAlign: 'center' }}>
            {/* Success checkmark */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `${s.accent}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke={s.accent} strokeWidth="2" opacity="0.3" />
                <path
                  d="M11 18 L16 23 L25 13"
                  fill="none" stroke={s.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    strokeDasharray: 40,
                    animation: 'bookCheckmark 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both',
                  }}
                />
              </svg>
            </div>

            <h2 style={{
              fontSize: 26, fontWeight: 300, color: s.text, margin: 0,
              letterSpacing: -0.3,
            }}>
              You're All Set
            </h2>
            <p style={{ fontSize: 14, color: s.text3, marginTop: 8, marginBottom: 32 }}>
              Your appointment has been requested. We'll confirm shortly.
            </p>

            {/* Confirmation card */}
            <div style={{
              ...glass,
              padding: 28,
              textAlign: 'left',
              marginBottom: 28,
              background: `linear-gradient(135deg, rgba(255,255,255,0.7), ${s.accent}06)`,
            }}>
              <div style={{
                fontSize: 11, fontFamily: s.MONO, textTransform: 'uppercase',
                letterSpacing: 1.5, color: s.accent, marginBottom: 20, fontWeight: 600,
              }}>
                Confirmation #{booked.id}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  ['Service', selectedService?.name],
                  ['Instructor', selectedProvider?.name],
                  ['Date', fmtDateLong(booked.date)],
                  ['Time', formatTime(booked.time)],
                  ['Duration', `${selectedService?.duration || 30} minutes`],
                  ['Price', fmt(selectedService?.price || 0)],
                ].map(([label, value], i) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: s.text3 }}>{label}</span>
                      <span style={{
                        fontSize: 14,
                        fontWeight: label === 'Price' ? 700 : 500,
                        color: label === 'Price' ? s.accent : s.text,
                      }}>
                        {value}
                      </span>
                    </div>
                    {i < 5 && <div style={{ height: 1, background: 'rgba(0,0,0,0.04)', marginTop: 16 }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              alignItems: 'center',
            }}>
              <button
                onClick={generateICS}
                style={{
                  ...s.pillAccent,
                  padding: '14px 40px',
                  fontSize: 14,
                  fontWeight: 600,
                  width: '100%',
                  maxWidth: 320,
                  boxShadow: `0 4px 20px ${s.accent}40`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 28px ${s.accent}50`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${s.accent}40`;
                }}
              >
                Add to Calendar
              </button>
              <a
                href="/portal"
                style={{
                  ...s.pillOutline,
                  padding: '12px 40px',
                  fontSize: 14,
                  fontWeight: 500,
                  width: '100%',
                  maxWidth: 320,
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block',
                  boxSizing: 'border-box',
                }}
              >
                Create Account
              </a>
              <button
                onClick={resetBooking}
                style={{
                  ...s.pillGhost,
                  padding: '12px 40px',
                  fontSize: 14,
                  width: '100%',
                  maxWidth: 320,
                }}
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: 48,
          fontSize: 11, color: s.text3,
          fontFamily: s.MONO, letterSpacing: 0.5,
        }}>
          {locations[0]?.address && (
            <div style={{ marginBottom: 4 }}>{locations[0].address}</div>
          )}
          {settings.phone && (
            <div>{settings.phone}</div>
          )}
        </div>
      </div>
    </div>
  );
}
