import { useNavigate } from 'react-router-dom';

const ROLES = [
  { name: 'Kelly Snailum', role: 'owner', title: 'Owner & Master Trainer', color: '#C4704B', initials: 'KS' },
  { name: 'Megan Torres', role: 'instructor', title: 'Lead Reformer Instructor', color: '#6B8F71', initials: 'MT' },
  { name: 'Front Desk', role: 'front_desk', title: 'Front Desk Staff', color: '#5B7B8F', initials: 'FD' },
  { name: 'Client Portal', role: 'client', title: 'Client View', color: '#8B6B94', initials: 'CP' },
];

export default function SignIn() {
  const nav = useNavigate();

  function signIn(r) {
    localStorage.setItem('rp_user_name', r.name);
    localStorage.setItem('rp_user_role', r.role);
    if (r.role === 'client') {
      nav('/portal');
    } else {
      nav('/admin');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAF6F1',
      padding: 24,
    }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        {/* Logo / Brand */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 32, fontWeight: 300, letterSpacing: -1,
            color: '#2D2A26', fontFamily: "'Outfit', sans-serif",
            marginBottom: 4,
          }}>
            Remedy
          </div>
          <div style={{
            fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
            color: '#9C9488', fontFamily: "'Outfit', sans-serif",
          }}>
            Pilates & Barre
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: 18, fontWeight: 500, color: '#2D2A26',
          fontFamily: "'Outfit', sans-serif", marginBottom: 8,
        }}>
          Demo Sign In
        </h2>
        <p style={{
          fontSize: 13, color: '#9C9488', marginBottom: 32,
          fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
        }}>
          Choose a role to explore the platform
        </p>

        {/* Role Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ROLES.map(r => (
            <button
              key={r.role}
              onClick={() => signIn(r)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px', background: '#fff',
                border: '1px solid #E8E0D8', borderRadius: 12,
                cursor: 'pointer', transition: 'all 0.2s ease',
                textAlign: 'left', width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = r.color;
                e.currentTarget.style.boxShadow = `0 2px 12px ${r.color}20`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E8E0D8';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: r.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                flexShrink: 0,
              }}>
                {r.initials}
              </div>
              <div>
                <div style={{
                  fontSize: 15, fontWeight: 500, color: '#2D2A26',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {r.name}
                </div>
                <div style={{
                  fontSize: 12, color: '#9C9488', marginTop: 2,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {r.title}
                </div>
              </div>
              <div style={{
                marginLeft: 'auto', fontSize: 18, color: '#C4B5A4',
              }}>
                &rarr;
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p style={{
          fontSize: 11, color: '#C4B5A4', marginTop: 32,
          fontFamily: "'Outfit', sans-serif",
        }}>
          No passwords required — this is a demo environment
        </p>
      </div>
    </div>
  );
}
