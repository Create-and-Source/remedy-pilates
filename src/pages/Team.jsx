// Team — public instructor bios page
import { useNavigate } from 'react-router-dom';
import { useStyles, useTheme, getAvatarGradient } from '../theme';
import { getProviders, getLocations, getSettings } from '../data/store';

export default function Team() {
  const s = useStyles();
  const { theme } = useTheme();
  const nav = useNavigate();
  const instructors = getProviders();
  const locations = getLocations();
  const settings = getSettings();
  const name = settings.businessName || 'Pilates & Barre';

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F1', color: '#2D2A26', overflow: 'hidden' }}>
      {/* Ambient */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.accent}10 0%, transparent 55%)`,
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 'env(safe-area-inset-top)', paddingBottom: '16px', paddingLeft: '32px', paddingRight: '32px',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(250,246,241,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div onClick={() => nav('/')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: theme.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: `700 14px ${s.FONT}`, color: theme.accentText,
          }}>{(settings.businessName || 'Pilates')[0]}</div>
          <span style={{ font: `600 16px ${s.FONT}`, color: '#2D2A26' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => nav('/book')} style={{
            padding: '8px 20px', borderRadius: 100, border: `1.5px solid ${theme.accent}40`,
            background: 'transparent', color: theme.accent, font: `500 13px ${s.FONT}`, cursor: 'pointer',
          }}>Book a Class</button>
          <button onClick={() => nav('/')} style={{
            padding: '8px 20px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)',
            background: 'transparent', color: '#6B6560', font: `400 13px ${s.FONT}`, cursor: 'pointer',
          }}>Home</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        textAlign: 'center', padding: '120px 24px 48px', position: 'relative', zIndex: 10,
      }}>
        <div style={{
          font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 4,
          color: theme.accent, marginBottom: 20,
        }}>Our Instructors</div>
        <h1 style={{
          font: `400 48px ${s.DISPLAY}`, color: '#2D2A26', marginBottom: 16,
          letterSpacing: '-0.5px', lineHeight: 1.15,
        }}>
          Meet the <span style={{ fontStyle: 'italic', color: theme.accent }}>team</span>
        </h1>
        <p style={{
          font: `300 17px ${s.FONT}`, color: '#8A847D',
          maxWidth: 520, margin: '0 auto', lineHeight: 1.7,
        }}>
          Every instructor at Pilates Studio is certified, experienced, and passionate about helping you move better.
        </p>
      </div>

      {/* Instructor Grid */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px',
        position: 'relative', zIndex: 10,
      }}>
        <div className="team-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24,
        }}>
          {instructors.map((inst, idx) => (
            <div key={inst.id} className="team-card" style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 20, padding: 32,
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              animation: `fadeIn 0.5s ease ${idx * 80}ms backwards`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: 80, height: 80, borderRadius: 20, flexShrink: 0,
                  background: getAvatarGradient(inst.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 28px ${s.FONT}`, color: '#fff',
                  boxShadow: `0 4px 16px ${inst.color || theme.accent}30`,
                }}>
                  {inst.name.split(' ').map(n => n[0]).join('')}
                </div>
                {/* Header */}
                <div style={{ flex: 1 }}>
                  <h2 style={{ font: `600 22px ${s.DISPLAY}`, color: '#2D2A26', marginBottom: 4 }}>
                    {inst.name}
                  </h2>
                  <div style={{ font: `500 13px ${s.FONT}`, color: theme.accent, marginBottom: 4 }}>
                    {inst.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {inst.yearsExperience && (
                      <span style={{
                        font: `500 10px ${s.MONO}`, color: '#8A847D', textTransform: 'uppercase', letterSpacing: 1,
                      }}>{inst.yearsExperience} years</span>
                    )}
                    {inst.location && (
                      <>
                        <span style={{ color: '#DDD' }}>·</span>
                        <span style={{
                          font: `500 10px ${s.MONO}`, color: '#8A847D', textTransform: 'uppercase', letterSpacing: 1,
                        }}>{inst.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {inst.bio && (
                <p style={{
                  font: `300 14px ${s.FONT}`, color: '#6B6560', lineHeight: 1.75,
                  marginTop: 20,
                }}>{inst.bio}</p>
              )}

              {/* Specialties */}
              <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {inst.specialties.map(sp => (
                  <span key={sp} style={{
                    padding: '4px 12px', borderRadius: 100,
                    font: `400 11px ${s.FONT}`, color: '#6B6560',
                    background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)',
                  }}>{sp}</span>
                ))}
              </div>

              {/* Certifications */}
              {inst.certifications && inst.certifications.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                    color: '#AAA', marginBottom: 8,
                  }}>Certifications</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {inst.certifications.map(cert => (
                      <div key={cert} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{ font: `400 12px ${s.FONT}`, color: '#6B6560' }}>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <button onClick={() => nav('/book')} style={{
                marginTop: 20, padding: '10px 24px', borderRadius: 100,
                border: `1.5px solid ${theme.accent}30`,
                background: 'transparent', color: theme.accent,
                font: `500 13px ${s.FONT}`, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${theme.accent}08`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Book with {inst.name.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>

        {/* Locations bar */}
        <div style={{
          marginTop: 48, padding: 32, borderRadius: 20,
          background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}>
          <div style={{
            font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 3,
            color: '#AAA', marginBottom: 16,
          }}>Our Studios</div>
          <div className="team-locations" style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {locations.map(loc => (
              <div key={loc.id} style={{ textAlign: 'center' }}>
                <div style={{ font: `600 16px ${s.DISPLAY}`, color: '#2D2A26', marginBottom: 4 }}>{loc.name}</div>
                <div style={{ font: `300 13px ${s.FONT}`, color: '#8A847D' }}>{loc.address}</div>
                <div style={{ font: `400 12px ${s.MONO}`, color: theme.accent, marginTop: 4 }}>{loc.phone}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Training CTA */}
        <div style={{
          marginTop: 32, padding: '40px 32px', borderRadius: 20,
          background: `linear-gradient(135deg, ${theme.accent}10, ${theme.accent}05)`,
          border: `1px solid ${theme.accent}15`,
          textAlign: 'center',
        }}>
          <div style={{ font: `400 28px ${s.DISPLAY}`, color: '#2D2A26', marginBottom: 8 }}>
            Want to <span style={{ fontStyle: 'italic', color: theme.accent }}>teach</span> Pilates?
          </div>
          <p style={{
            font: `300 15px ${s.FONT}`, color: '#8A847D', maxWidth: 500,
            margin: '0 auto 20px', lineHeight: 1.6,
          }}>
            Pilates Studio is a Pilates Sports Center training facility. Our 450+ hour comprehensive program prepares you to teach with confidence.
          </p>
          <button onClick={() => nav('/admin/training')} style={{
            padding: '12px 32px', borderRadius: 100, border: 'none',
            background: theme.accent, color: theme.accentText,
            font: `500 14px ${s.FONT}`, cursor: 'pointer',
            boxShadow: `0 4px 16px ${theme.accent}30`,
          }}>Learn About Teacher Training</button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .team-grid { grid-template-columns: 1fr !important; }
          .team-locations { flex-direction: column !important; gap: 16px !important; }
        }
      `}</style>
    </div>
  );
}
