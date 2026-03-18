import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getSocialPosts, addSocialPost, updateSocialPost, deleteSocialPost, getAppointments, getPatients, getServices, getSettings, subscribe } from '../data/store';

const PLATFORMS = ['Instagram', 'Facebook', 'TikTok', 'X', 'LinkedIn'];
const CONN_KEY = 'rp_social_connections';
const loadConns = () => { try { return JSON.parse(localStorage.getItem(CONN_KEY)) || { instagram: true, facebook: true, tiktok: false, x: false, linkedin: false }; } catch { return { instagram: true, facebook: true, tiktok: false, x: false, linkedin: false }; } };
const saveConns = (c) => localStorage.setItem(CONN_KEY, JSON.stringify(c));

const CONTENT_TYPES = [
  { id: 'service', label: 'Service Spotlight', desc: 'Highlight a session' },
  { id: 'before-after', label: 'Transformations', desc: 'Show transformation results' },
  { id: 'education', label: 'Educational', desc: 'Tips, myths, skincare advice' },
  { id: 'promo', label: 'Promotion', desc: 'Special offer or deal' },
  { id: 'team', label: 'Meet the Team', desc: 'Staff spotlight' },
  { id: 'testimonial', label: 'Testimonial', desc: 'Patient review' },
  { id: 'custom', label: 'Custom', desc: 'Write anything' },
];

const TONES = ['Professional', 'Friendly', 'Luxurious', 'Educational', 'Playful', 'Urgent'];

function generateCopy(type, platforms, tone, settings) {
  const name = settings.businessName || 'Remedy Pilates & Barre';
  const posts = [];
  const toneWord = tone === 'Luxurious' ? 'Indulge in' : tone === 'Friendly' ? 'We love helping you with' : tone === 'Urgent' ? 'Limited time:' : 'Discover';

  for (const p of platforms) {
    const pl = p.toLowerCase();
    let text = '';
    if (type === 'service') {
      if (pl === 'instagram') text = `${toneWord} the art of [Service Name]\n\nAt ${name}, every session is personalized to your unique skin goals.\n\n[Describe the session and its benefits]\n\nBook your consultation — link in bio\n\n#Remedy #Aesthetics #[ServiceHashtag] #Skincare #Beauty #SelfCare`;
      else if (pl === 'facebook') text = `${toneWord} our [Service Name] session\n\n[Describe the session, benefits, and what makes it special]\n\nResults you can see. Confidence you can feel.\n\nBook online: ${settings.email || 'remedypilates.com'}`;
      else if (pl === 'tiktok') text = `POV: You just got [Service] and your skin is GLOWING ✨\n\n#Remedy #Aesthetics #GlowUp #SkinCare #Beauty`;
      else if (pl === 'x') text = `${toneWord} [Service] at ${name}.\n\n[One-liner about the session]\n\nBook now: ${settings.email || ''}\n\n#Remedy #Aesthetics`;
      else if (pl === 'linkedin') text = `At ${name}, we combine advanced medical aesthetics with personalized care.\n\n[Describe the session and its clinical benefits]\n\nOur team of certified providers delivers results backed by science.\n\n#MedicalAesthetics #Remedy #Skincare`;
    } else if (type === 'before-after') {
      if (pl === 'instagram') text = `The results speak for themselves ✨\n\nBefore → After\n[Treatment Name]\n[Number] sessions\n\nEvery journey is unique. Book your consultation to create your personalized plan.\n\nLink in bio\n\n#BeforeAndAfter #Remedy #Results #Transformation #${name.replace(/\s/g, '')}`;
      else text = `Real results from real clients.\n\n[Treatment] — [number] sessions\n\nSee what is possible at ${name}.\n\n#BeforeAndAfter #Remedy`;
    } else if (type === 'promo') {
      if (pl === 'instagram') text = `SPECIAL OFFER ✨\n\n[Offer details — e.g., 20% off Reformer this month]\n\nValid through [end date]\nBook now — link in bio\n\nLimited spots available.\n\n#Remedy #SpecialOffer #Beauty #${name.replace(/\s/g, '')}`;
      else text = `Special offer at ${name}!\n\n[Offer details]\n\nBook by [end date] to save.\n\n${settings.phone || ''}`;
    } else if (type === 'education') {
      if (pl === 'instagram') text = `DID YOU KNOW? 💡\n\n[Educational fact about skincare/session]\n\n[2-3 sentences expanding on the topic]\n\nHave questions? Drop them in the comments 👇\n\n#SkincareTips #Remedy #Education #SkinHealth #Beauty`;
      else text = `Skincare tip from ${name}:\n\n[Educational content]\n\nYour skin deserves science-backed care.`;
    } else {
      text = `[Your custom post for ${p}]\n\n#Remedy #${name.replace(/\s/g, '')}`;
    }
    posts.push({ platform: pl, text });
  }
  return posts;
}

export default function SocialMedia() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [tab, setTab] = useState('create');
  const [connections, setConnections] = useState(loadConns);
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState(null);
  const [platforms, setPlatforms] = useState(['Instagram', 'Facebook']);
  const [tone, setTone] = useState('Professional');
  const [posts, setPosts] = useState([]);
  const [activePreview, setActivePreview] = useState('');
  const [publishing, setPublishing] = useState(null);
  const [published, setPublished] = useState(new Set());
  const [scheduleDate, setScheduleDate] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');

  const allPosts = getSocialPosts();
  const settings = getSettings();

  const toggleConn = (p) => {
    const next = { ...connections, [p]: !connections[p] };
    setConnections(next);
    saveConns(next);
  };

  const togglePlatform = (p) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const updatePostText = (platform, text) => setPosts(prev => prev.map(p => p.platform === platform ? { ...p, text } : p));

  const goToStep2 = () => {
    if (!contentType) return;
    const generated = generateCopy(contentType, platforms, tone, settings);
    setPosts(generated);
    if (generated.length) setActivePreview(generated[0].platform);
    setStep(2);
  };

  const goToStep3 = () => {
    if (posts.length) setActivePreview(posts[0].platform);
    setStep(3);
  };

  const publishTo = async (platform) => {
    setPublishing(platform);
    await new Promise(r => setTimeout(r, 1500));
    setPublished(prev => new Set([...prev, platform]));
    setPublishing(null);
  };

  const publishAll = async () => {
    const connected = posts.filter(p => connections[p.platform]).map(p => p.platform);
    for (const p of connected) await publishTo(p);
    savePost('published');
  };

  const savePost = (status = 'draft') => {
    addSocialPost({
      contentType, platforms: platforms.map(p => p.toLowerCase()), posts, status,
      scheduledAt: status === 'scheduled' ? scheduleDate : null,
      publishedAt: status === 'published' ? new Date().toISOString() : null,
    });
    if (status !== 'draft') setTab('history');
  };

  const activePost = posts.find(p => p.platform === activePreview);
  const filteredHistory = allPosts.filter(p => historyFilter === 'all' || p.status === historyFilter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Social Media</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Create, schedule, and publish across platforms</p>
        </div>
        <div style={{ display: 'flex', gap: 0, background: '#F0F0F0', borderRadius: 8, overflow: 'hidden' }}>
          {[['create', 'Create Post'], ['history', 'Drafts & History']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '8px 18px', background: tab === k ? '#fff' : 'transparent', border: 'none',
              font: `500 12px ${s.FONT}`, color: tab === k ? s.text : s.text3, cursor: 'pointer',
              borderRadius: tab === k ? 8 : 0, boxShadow: tab === k ? s.shadow : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Connected Accounts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 24 }}>
        {PLATFORMS.map(p => {
          const key = p.toLowerCase();
          const connected = connections[key];
          return (
            <div key={p} style={{ ...s.cardStyle, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ font: `600 12px ${s.FONT}`, color: s.text }}>{p}</div>
                <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{connected ? 'Connected' : 'Not connected'}</div>
              </div>
              {connected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.success }} />
                  <button onClick={() => toggleConn(key)} style={{ background: 'none', border: 'none', font: `400 9px ${s.FONT}`, color: s.text3, cursor: 'pointer', textDecoration: 'underline' }}>Disconnect</button>
                </div>
              ) : (
                <button onClick={() => toggleConn(key)} style={{ ...s.pillOutline, padding: '3px 10px', fontSize: 10 }}>Connect</button>
              )}
            </div>
          );
        })}
      </div>

      {/* CREATE TAB */}
      {tab === 'create' && (
        <div>
          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div onClick={() => n < step && setStep(n)} style={{
                  width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= n ? s.accent : '#E5E5E5', color: step >= n ? s.accentText : s.text3,
                  font: `600 11px ${s.FONT}`, cursor: n < step ? 'pointer' : 'default',
                }}>{n}</div>
                {n < 3 && <div style={{ width: 24, height: 2, background: step > n ? s.accent : '#E5E5E5' }} />}
              </div>
            ))}
            <span style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginLeft: 8 }}>
              {['Content', 'Write', 'Preview'][step - 1]}
            </span>
          </div>

          {/* Step 1: Content Type */}
          {step === 1 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.id} onClick={() => setContentType(ct.id)} style={{
                    ...s.cardStyle, padding: '16px', textAlign: 'left', cursor: 'pointer',
                    borderColor: contentType === ct.id ? s.accent : '#E5E5E5',
                    borderWidth: contentType === ct.id ? 2 : 1,
                  }}>
                    <div style={{ font: `600 13px ${s.FONT}`, color: contentType === ct.id ? s.accent : s.text, marginBottom: 4 }}>{ct.label}</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{ct.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Platforms</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => togglePlatform(p)} style={{
                      ...s.pill, padding: '6px 14px', fontSize: 12,
                      background: platforms.includes(p) ? s.accent : 'transparent',
                      color: platforms.includes(p) ? s.accentText : s.text2,
                      border: platforms.includes(p) ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                    }}>{p}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Tone</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TONES.map(t => (
                    <button key={t} onClick={() => setTone(t)} style={{
                      ...s.pill, padding: '6px 14px', fontSize: 12,
                      background: tone === t ? s.accent : 'transparent',
                      color: tone === t ? s.accentText : s.text2,
                      border: tone === t ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {contentType && <button onClick={goToStep2} style={s.pillAccent}>Next — Generate Copy</button>}
            </div>
          )}

          {/* Step 2: Write */}
          {step === 2 && (
            <div className="social-write-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ font: `600 15px ${s.FONT}`, color: s.text }}>Post Copy</h3>
                  <button onClick={() => { const r = generateCopy(contentType, platforms, tone, settings); setPosts(r); }} style={{ ...s.pillOutline, padding: '5px 12px', fontSize: 10 }}>Regenerate</button>
                </div>
                {posts.map(p => (
                  <div key={p.platform} style={{ ...s.cardStyle, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ font: `600 11px ${s.MONO}`, color: s.accent, textTransform: 'uppercase' }}>{p.platform}</span>
                      <button onClick={() => { navigator.clipboard.writeText(p.text); }} style={{ ...s.pillGhost, padding: '3px 8px', fontSize: 9 }}>Copy</button>
                    </div>
                    <textarea value={p.text} onChange={e => updatePostText(p.platform, e.target.value)} rows={Math.min(8, Math.max(3, p.text.split('\n').length + 1))} style={{ ...s.input, fontSize: 12, lineHeight: 1.5, resize: 'vertical' }} />
                    {p.platform === 'x' && <div style={{ font: `400 10px ${s.FONT}`, color: p.text.length > 280 ? s.danger : s.text3, marginTop: 3 }}>{p.text.length}/280</div>}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(1)} style={s.pillGhost}>Back</button>
                  <button onClick={goToStep3} style={s.pillAccent}>Preview</button>
                </div>
              </div>
              <div>
                <h3 style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 14 }}>Media</h3>
                <div style={{
                  border: '2px dashed #E5E5E5', borderRadius: 12, padding: 40, textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }} onMouseEnter={e => e.currentTarget.style.borderColor = s.accent} onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E5E5'}>
                  <div style={{ font: `400 24px ${s.FONT}`, color: s.text3, marginBottom: 8 }}>📷</div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>Drag & drop or click to upload</div>
                  <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 4 }}>Supports images and video</div>
                </div>
                <p style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 10, textAlign: 'center' }}>Media upload connects to your AWS backend</p>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Publish */}
          {step === 3 && (
            <div className="social-publish-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
              <div>
                <h3 style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 14 }}>Publish</h3>
                {posts.map(p => {
                  const connected = connections[p.platform];
                  const isPublished = published.has(p.platform);
                  return (
                    <div key={p.platform} style={{ ...s.cardStyle, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ font: `600 13px ${s.FONT}`, color: s.text, textTransform: 'capitalize' }}>{p.platform}</span>
                        {!connected && <span style={{ font: `400 10px ${s.FONT}`, color: s.warning }}>Not connected</span>}
                      </div>
                      {isPublished ? (
                        <span style={{ font: `500 12px ${s.FONT}`, color: s.success }}>Published ✓</span>
                      ) : (
                        <button onClick={() => publishTo(p.platform)} disabled={!connected || publishing} style={{
                          ...s.pillAccent, padding: '6px 14px', fontSize: 11,
                          opacity: !connected || publishing ? 0.5 : 1,
                        }}>
                          {publishing === p.platform ? 'Publishing...' : 'Publish'}
                        </button>
                      )}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setStep(2)} style={s.pillGhost}>Back</button>
                  <button onClick={publishAll} disabled={publishing} style={s.pillAccent}>Publish All Connected</button>
                  <button onClick={() => savePost('draft')} style={s.pillOutline}>Save Draft</button>
                  <button onClick={() => setShowSchedule(!showSchedule)} style={s.pillGhost}>Schedule</button>
                </div>
                {showSchedule && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={s.input} />
                    <button onClick={() => { if (scheduleDate) savePost('scheduled'); }} style={s.pillAccent}>Schedule</button>
                  </div>
                )}
              </div>

              {/* Phone preview */}
              <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                  {posts.map(p => (
                    <button key={p.platform} onClick={() => setActivePreview(p.platform)} style={{
                      ...s.pill, padding: '5px 10px', fontSize: 10, textTransform: 'capitalize',
                      background: activePreview === p.platform ? s.accent : 'transparent',
                      color: activePreview === p.platform ? s.accentText : s.text3,
                      border: activePreview === p.platform ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                    }}>{p.platform}</button>
                  ))}
                </div>
                <div style={{ width: 300, background: '#F8F8F8', borderRadius: 28, padding: '40px 14px 28px', border: '1px solid #E5E5E5' }}>
                  <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: s.shadow }}>
                    <div style={{ height: 200, background: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>
                      [Image/Video]
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ font: `600 12px ${s.FONT}`, color: s.text, marginBottom: 4 }}>{settings.businessName || 'yourstudio'}</div>
                      <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
                        {activePost?.text || 'Select a platform'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['all', 'draft', 'scheduled', 'published'].map(f => (
              <button key={f} onClick={() => setHistoryFilter(f)} style={{
                ...s.pill, padding: '6px 14px', fontSize: 12, textTransform: 'capitalize',
                background: historyFilter === f ? s.accent : 'transparent',
                color: historyFilter === f ? s.accentText : s.text2,
                border: historyFilter === f ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
              }}>{f} ({f === 'all' ? allPosts.length : allPosts.filter(p => p.status === f).length})</button>
            ))}
          </div>
          {filteredHistory.length === 0 ? (
            <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>No posts yet</div>
          ) : filteredHistory.map(post => (
            <div key={post.id} style={{ ...s.cardStyle, padding: '16px 20px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{post.contentType || 'Post'} — {post.platforms?.join(', ')}</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                  {post.status === 'scheduled' && post.scheduledAt ? `Scheduled: ${new Date(post.scheduledAt).toLocaleString()}` : new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 100, font: `500 10px ${s.FONT}`, textTransform: 'uppercase',
                  background: post.status === 'published' ? '#F0FDF4' : post.status === 'scheduled' ? '#FFF7ED' : '#F5F5F5',
                  color: post.status === 'published' ? s.success : post.status === 'scheduled' ? s.warning : s.text3,
                }}>{post.status}</span>
                <button onClick={() => deleteSocialPost(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3, fontSize: 14 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .social-write-grid {
            grid-template-columns: 1fr !important;
          }
          .social-publish-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
