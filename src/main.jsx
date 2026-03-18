import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const GLOBAL_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { min-height: 100vh; }
body {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #FAF6F1;
  color: #111;
}
input, textarea, select, button { font-family: inherit; }
::selection { background: rgba(0,0,0,0.06); }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(var(--accent-rgb, 0,0,0), 0.1); } 50% { box-shadow: 0 0 30px rgba(var(--accent-rgb, 0,0,0), 0.2); } }
@keyframes orb1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -20px) scale(1.05); } 66% { transform: translate(-20px, 15px) scale(0.95); } }
@keyframes orb2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-25px, 20px) scale(0.95); } 66% { transform: translate(15px, -25px) scale(1.05); } }

/* Glass card base */
.glass-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.glass-card:hover {
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.03);
  transform: translateY(-1px);
}


/* Table rows */
table tbody tr {
  transition: background 0.15s ease;
}
table tbody tr:hover {
  background: rgba(0, 0, 0, 0.015) !important;
}

/* Inputs focus glow */
input:focus, textarea:focus, select:focus {
  border-color: var(--accent-color, #111) !important;
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb, 0,0,0), 0.08) !important;
}

/* Buttons */
button { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; }
button:active { transform: scale(0.97) !important; }

/* Modal backdrop */
.modal-backdrop {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Stagger children animations */
.stagger-in > * {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
.stagger-in > *:nth-child(1) { animation-delay: 0ms; }
.stagger-in > *:nth-child(2) { animation-delay: 60ms; }
.stagger-in > *:nth-child(3) { animation-delay: 120ms; }
.stagger-in > *:nth-child(4) { animation-delay: 180ms; }
.stagger-in > *:nth-child(5) { animation-delay: 240ms; }
.stagger-in > *:nth-child(6) { animation-delay: 300ms; }
.stagger-in > *:nth-child(7) { animation-delay: 360ms; }
.stagger-in > *:nth-child(8) { animation-delay: 420ms; }
`;

const style = document.createElement('style');
style.textContent = GLOBAL_CSS;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker for PWA + push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
