// ============================================================
// Table Trivia — shared helpers (restaurant edition)
// Loaded by join.html, host.html, tv.html, tents.html.
// ============================================================
const TT = {
  ROOT: 'restaurant',          // Firebase namespace (separate from Quiz Night + Screen Test)
  QUESTION_SECONDS: 20,        // a bit longer than Screen Test — tables need time to talk
  REVEAL_SECONDS: 8,
  ROUND_SIZE: 5,
};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBoxCE9DY4VCHiq8beeaGmX5237KiPuFWA",
  authDomain: "screenshot-trivia-night.firebaseapp.com",
  databaseURL: "https://screenshot-trivia-night-default-rtdb.firebaseio.com",
  projectId: "screenshot-trivia-night"
};

let db = null;
try { firebase.initializeApp(FIREBASE_CONFIG); db = firebase.database(); }
catch (e) { console.warn('Firebase unavailable:', e && e.message); }

const $ = id => document.getElementById(id);
function ttRef(path){ return db.ref(`${TT.ROOT}/${path}`); }

// Server clock (corrects for devices with the wrong time)
let serverOffsetMs = 0;
if (db) db.ref('.info/serverTimeOffset').on('value', s => { serverOffsetMs = s.val() || 0; });
function serverNow(){ return Date.now() + serverOffsetMs; }

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function toast(msg, ms = 2400){
  const t = $('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}

// Email normalization — same rules as Screen Test
function normalizeEmail(raw){
  const lower = String(raw || '').trim().toLowerCase();
  const at = lower.indexOf('@');
  if (at < 0) return lower;
  let local = lower.slice(0, at);
  const domain = lower.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus >= 0) local = local.slice(0, plus);
  if (domain === 'gmail.com' || domain === 'googlemail.com') local = local.replace(/\./g, '');
  return local + '@' + domain;
}
// One-way hash so public paths never expose an email
function emailToPlayerId(email){
  let h1 = 0x811c9dc5, h2 = 0x9747b28c;
  for (let i = 0; i < email.length; i++) {
    const c = email.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 0x5bd1e995); h2 ^= h2 >>> 13;
  }
  return 'p' + (h1 >>> 0).toString(16).padStart(8,'0') + (h2 >>> 0).toString(16).padStart(8,'0');
}
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','tempmail.com','10minutemail.com','guerrillamail.com','throwaway.email',
  'yopmail.com','trashmail.com','sharklasers.com','getnada.com','maildrop.cc','dispostable.com',
  'fakeinbox.com','mintemail.com','mytrashmail.com','spam4.me','mohmal.com','temp-mail.org',
  'mailnesia.com','anonymbox.com','tempinbox.com',
]);
function isValidEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function tableLabel(t, names){
  const nick = names && names[t];
  const base = t === 'bar' ? 'The Bar' : 'Table ' + t;
  return nick ? `${nick} · ${base}` : base;
}
function tableShort(t){ return t === 'bar' ? 'Bar' : 'T' + t; }
function fmtPts(n){ return (Math.round((n || 0) * 10) / 10).toFixed(1); }

// Question timing incl. +15s extensions
function questionDurationSec(ev){
  return ((ev && ev.questionSeconds) || TT.QUESTION_SECONDS) + ((ev && ev.extraSeconds) || 0);
}
function secondsLeft(ev){
  if (!ev || !ev.questionStartedAt) return 0;
  if (ev.paused && ev.pausedAt) return Math.max(0, Math.ceil(questionDurationSec(ev) - (ev.pausedAt - ev.questionStartedAt) / 1000));
  return Math.max(0, Math.ceil(questionDurationSec(ev) - (serverNow() - ev.questionStartedAt) / 1000));
}

// Join URL (same folder as the current page). The TV's QR carries the room
// code so scanners never type it; table tents carry only the table.
function joinUrl(table, code){
  const u = new URL('join.html', location.href);
  u.search = ''; u.hash = '';
  if (table) u.searchParams.set('t', table);
  if (code) u.searchParams.set('c', code);
  return u.toString();
}

// Answer colours — identical on TV and phones so guests match by colour.
const OPTION_COLORS = ['#7C6EF6', '#FF5C8A', '#FFB740', '#2EC4D6'];
const OPTION_INK    = ['#ffffff', '#ffffff', '#1a1300', '#04232a'];

function haptic(ms = 25){ try { navigator.vibrate && navigator.vibrate(ms); } catch(e){} }
function ordinal(n){ if (!n) return '—'; const s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v-20)%10] || s[v] || s[0]); }
function tableName(t, names){ return (names && names[t]) || (t === 'bar' ? 'The Bar' : 'Table ' + t); }

// Connection watcher → calls cb(true|false) after the first connect
function watchConnection(cb){
  if (!db) return;
  let seen = false;
  db.ref('.info/connected').on('value', s => {
    const on = s.val() === true;
    if (on) seen = true;
    if (seen) cb(on);
  });
}
