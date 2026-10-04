# Table Trivia — Restaurant Edition

Host-led, room-wide trivia for restaurants (pilot: Chilitos). Separate from Quiz Night
(self-serve) and Screen Test (weekly online). Same Firebase project, `/restaurant/` namespace.

## How a night works
- Everyone plays on their own phone (name + email + room code). No app — QR → browser.
- Each player picks their **table** (or **The Bar**). Table tents pre-select the table.
- Everyone sees the same question on the TV and their phone at the same time.
- 4 rounds × 5 questions (~60 min). Round breaks show standings + a sponsor message.
- **Table prize:** highest table score. **Top player prize:** most correct (fastest breaks ties).

## Scoring
- Individual: 1 pt per correct answer. Tiebreak = total time on correct answers.
- Table: for each question, `correct players ÷ players seated before that question started`,
  summed over the night (max 20). Big tables don't win by size; late arrivals never drag a
  table down. The Bar is scored as one team.
- Bonus questions (`bonus:` field): first correct answer in the room wins the prize; the TV
  names the winner and their table at the reveal.
- Scoring is done by the host page only. Players never receive the answer key.

## Files
| File | Who | What |
|---|---|---|
| `join.html` | Guests | Pick table, join, answer, see results, WhatsApp share |
| `host.html` | Operator (laptop/tablet, signed in) | Create night, run rounds, pause/extend/skip, rename tables, sponsor message, export emails |
| `tv.html` | Restaurant TV (laptop → HDMI) | Lobby QR + room code, questions + countdown, reveals, standings, finale |
| `tents.html` | Print before the night | One QR card per table + bar |
| `tt-common.js` | All | Shared helpers + Firebase config |
| `database.rules.json` | Firebase console | Merged rules for Quiz Night + Screen Test + Table Trivia |

## Run of show
1. Host signs in on `host.html` → set tables, timings, sponsor message → **Create / Reset Night**.
2. Open `tv.html` on the TV laptop → click once (sound + full screen).
3. Guests scan the TV or table QR → join with the room code shown on the TV.
4. **Start Round 1**. Questions auto-advance (20s answer + 8s reveal). Pause / +15s / Reveal now.
5. Each round ends on a standings break → order window → **Start Round N**.
6. After Round 4 → **Show Final Results** (joining closes automatically).
7. **Export players + emails (CSV)** for the sponsor list.

## Firebase paths (`/restaurant/`)
- `current` → `{eventId}` — which night is live (host-only write)
- `events/{e}` — public game state (status, round, qIndex, liveSlot, timings, questions without answers, reveal, displayCode, sponsorMsg)
- `answerKeys/{e}`, `secrets/{e}` — host-only
- `players/{e}/{pid}` — private: email, name, table (write-once, room code required, closes when joining closes)
- `roster/{e}/{pid}` — public: name, table, joinedAt (no email)
- `tableNames/{e}/{t}` — first player at a table can name it; host can rename
- `answers/{e}/{pid}/{q}` — private: one pick per question, only while it's live
- `standings/{e}` — public, host-written: tables + players + order

`pid` is a one-way hash of the normalized email (same as Screen Test).

## Editing questions
Edit `ROUNDS` and `QUESTIONS` at the top of `host.html`. Fields: `round`, `q`, `o` (4 options),
`a` (correct index 0–3), optional `emoji` (picture round clue), `img` (image file in this
folder), `bonus` (prize text). Round 3 is the sponsored Chilitos Round — swap in menu questions.

## Not in the pilot (v2 candidates)
- Season leaderboard across weeks (needs persistent team names)
- Audio round, sound packs
- 3-second table answer lock
- Table-only mode switch
