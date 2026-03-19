import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn as cognitoSignIn, signInDemo } from '../api/auth';

const API = import.meta.env.VITE_API_URL || '';

const DEMO_ROLES = [
  { name: 'Alex Morgan', role: 'owner', title: 'Owner & Master Trainer', color: '#C4704B', initials: 'AM' },
  { name: 'Sam Rivera', role: 'instructor', title: 'Lead Reformer Instructor', color: '#6B8F71', initials: 'SR' },
  { name: 'Front Desk', role: 'front_desk', title: 'Front Desk Staff', color: '#5B7B8F', initials: 'FD' },
  { name: 'Client Portal', role: 'client', title: 'Client View', color: '#8B6B94', initials: 'CP' },
];

export default function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(!!API);

  // Demo sign-in (no API configured or user clicks "Demo" tab)
  function demoSignIn(r) {
    signInDemo(r.role, r.name);
    nav(r.role === 'client' ? '/portal' : '/admin');
  }

  // Real Cognito sign-in
  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await cognitoSignIn(email, password);
      if (result.challenge === 'NEW_PASSWORD_REQUIRED') {
        setError('Password reset required. Please contact studio admin.');
        return;
      }
      const role = result.user?.role || 'client';
      nav(role === 'client' ? '/portal' : '/admin');
    } catch (err) {
      setError(err.message === 'NotAuthorizedException' ? 'Invalid email or password' : err.message);
    } finally {
      setLoading(false);
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
            Pilates
          </div>
          <div style={{
            fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
            color: '#9C9488', fontFamily: "'Outfit', sans-serif",
          }}>
            & Barre
          </div>
        </div>

        {/* Tab toggle */}
        {API && (
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid #E8E0D8' }}>
            <button
              onClick={() => setShowLogin(true)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                background: showLogin ? '#2D2A26' : '#fff', color: showLogin ? '#fff' : '#9C9488',
                fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 500,
              }}>
              Sign In
            </button>
            <button
              onClick={() => setShowLogin(false)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                background: !showLogin ? '#2D2A26' : '#fff', color: !showLogin ? '#fff' : '#9C9488',
                fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 500,
              }}>
              Demo
            </button>
          </div>
        )}

        {/* Login form */}
        {showLogin && API ? (
          <>
            <h2 style={{
              fontSize: 18, fontWeight: 500, color: '#2D2A26',
              fontFamily: "'Outfit', sans-serif", marginBottom: 24,
            }}>
              Sign in to your account
            </h2>
            <div onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                style={{
                  padding: '12px 16px', border: '1px solid #E8E0D8', borderRadius: 8,
                  fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: 'none',
                }}
              />
              <input
                type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                style={{
                  padding: '12px 16px', border: '1px solid #E8E0D8', borderRadius: 8,
                  fontSize: 14, fontFamily: "'Outfit', sans-serif", outline: 'none',
                }}
              />
              {error && <p style={{ color: '#c44', fontSize: 13, fontFamily: "'Outfit', sans-serif", margin: 0 }}>{error}</p>}
              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                style={{
                  padding: '14px 0', background: '#2D2A26', color: '#fff', border: 'none',
                  borderRadius: 8, cursor: loading ? 'wait' : 'pointer', fontSize: 14,
                  fontFamily: "'Outfit', sans-serif", fontWeight: 500,
                  opacity: loading || !email || !password ? 0.5 : 1,
                }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Demo role picker (original) */}
            <h2 style={{
              fontSize: 18, fontWeight: 500, color: '#2D2A26',
              fontFamily: "'Outfit', sans-serif", marginBottom: 8,
            }}>
              Sign In
            </h2>
            <p style={{
              fontSize: 13, color: '#9C9488', marginBottom: 32,
              fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
            }}>
              Welcome back
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEMO_ROLES.map(r => (
                <button
                  key={r.role}
                  onClick={() => demoSignIn(r)}
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
          </>
        )}

        <p style={{
          fontSize: 11, color: '#C4B5A4', marginTop: 32,
          fontFamily: "'Outfit', sans-serif",
        }}>
          {showLogin && API ? 'Use your studio email and password' : 'Select your account to continue'}
        </p>
      </div>
    </div>
  );
}
