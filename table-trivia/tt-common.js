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

// Keep the screen on during the game (phones dim/lock otherwise).
// Wake Lock API where supported (Android Chrome, iOS 16.4+); a tiny silent looping
// video as a fallback for older phones. Needs one tap first — call from any click.
const WAKE_MP4 = 'data:video/mp4;base64,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b21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0wIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTAgd2VpZ2h0cD0wIGtleWludD0yNTAga2V5aW50X21pbj0xIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAADmWIhAW///8PRQABT3+AARggBwEYIAcBGCAHARggBwEYIAcBGCAHARggBwEYIAcAAAAGQZo4CvqAARggBwEYIAcBGCAHARggBwEYIAcBGCAHARggBwEYIAc=';
let _wake = null, _wakeVid = null;
async function keepAwake(){
  if (document.visibilityState !== 'visible') return;
  try {
    if ('wakeLock' in navigator) {
      if (!_wake) { _wake = await navigator.wakeLock.request('screen'); _wake.addEventListener('release', () => { _wake = null; }); }
      return;
    }
  } catch (e) { /* fall through to video */ }
  try {
    if (!_wakeVid) {
      _wakeVid = document.createElement('video');
      _wakeVid.setAttribute('playsinline', ''); _wakeVid.setAttribute('muted', ''); _wakeVid.muted = true; _wakeVid.loop = true;
      _wakeVid.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0';
      _wakeVid.src = WAKE_MP4; document.body.appendChild(_wakeVid);
    }
    if (_wakeVid.paused) await _wakeVid.play();
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });
['click', 'touchend'].forEach(t => document.addEventListener(t, keepAwake, { passive: true }));

// Rounds can hold any number of questions (host can add questions live), so positions are
// worked out from each question's `round` instead of a fixed size. Questions stay sorted by round.
function roundIdx(qs, r){ const out = []; (qs || []).forEach((q, i) => { if (q && q.round === r) out.push(i); }); return out; }
function roundStart(qs, r){ const i = (qs || []).findIndex(q => q && q.round === r); return i; }
function roundLen(qs, r){ return roundIdx(qs, r).length; }
function posInRound(qs, qi){ const q = (qs || [])[qi]; return q ? qi - roundStart(qs, q.round) : 0; }
function isLastInRound(qs, qi){ qs = qs || []; return qi + 1 >= qs.length || !qs[qi + 1] || qs[qi + 1].round !== (qs[qi] || {}).round; }

// One table label everywhere a player's table is shown: "Taco Bout It · Table 3", "Table 3", "The Bar"
function tableSub(t, names){
  const num = t === 'bar' ? 'The Bar' : 'Table ' + t, nick = names && names[t];
  return nick && nick !== num ? `${nick} · ${num}` : num;
}
