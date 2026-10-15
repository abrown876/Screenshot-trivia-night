# Table Trivia — Restaurant Edition

Host-led, room-wide trivia for restaurants (pilot: Chilitos). Separate from Quiz Night
(self-serve) and Screen Test (weekly online). Same Firebase project, `/restaurant/` namespace.

## How a night works
- Everyone plays on their own phone. No app — QR → browser.
- **Sign-in:** "Continue with Google" (one tap, verified email, name pre-filled) is the main
  button; "Use email instead" is the fallback. Players also enter the room code from the TV.
  Google sign-in is hidden inside WhatsApp/Instagram in-app browsers (Google blocks it there).
- The export marks each email `Verified (Google)` Yes/No. Rules only allow `verified: true` when
  the signed-in Google account's verified email matches the record, so it can't be faked.
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

## Polish notes
- The TV's QR carries the room code (`join.html?c=CODE`) so scanners never type it. Table cards carry only the table (`?t=7`); those players type the code from the TV.
- Answer colours are the same on TV and phones: A purple, B coral, C gold, D teal.
- **Auto / Manual switch** (host panel, or press A): Auto = answer shows when time runs out and the next question follows. Manual = time running out locks answers; the host clicks to show the answer and again for the next question. "Reopen 15 sec" re-opens a locked question. Round breaks are always manual. Default is set when creating the game.
- **Timing (live, host panel):** seconds per question, seconds on the answer (gap between questions), round break length in minutes. Changes apply from the next question. In Auto with a break > 0, the next round starts itself when the break countdown ends (shown on TV + phones); 0 = host starts rounds. Manual mode always waits.
- **Sponsor message:** also appears on every answer reveal and round break.
- **The Bar** is always just "The Bar" — no team naming (rules block it). Its prize is separate from the table prize; both are set when creating the game (Bar prize defaults to "a round of shots 🥃"). Prizes show in the TV lobby and on the winner's card.
- **Winners reveal:** "Show final results" runs a ~13s sequence on the TV — drumroll, 3rd, drumroll, 2nd, 1st with confetti cannons and fanfare, then the top player. Phones show "Eyes on the TV" until 1st place lands, then winners get confetti + buzz. "Replay the winners reveal" re-runs it.
- **Round intro:** every round (including Round 1) opens with a 9-second takeover on the TV and phones. "Round N" slams in over floating A/B/C/D tiles, question marks and trivia icons. Then come the round's icon, title and tagline, a live hype line ("Table 4 is out in front…"; phones say where *your* table stands), and a 3-2-1-Go countdown with drumroll, cymbal, ticks and confetti. Question 1 opens right after Go. The last round is billed as "Final round", and the Chilitos Round shows "Presented by Chilitos". The host's main button reads "Skip intro" during it. Turn intros off at creation or live with the "Round intro animation" checkbox. Timed from `introAt`, so a reloaded TV, phone or host stays in step. Sponsor pushes wait until it's over.
- **Restart a round** (host → Rounds timeline, under the main controls): each round shows as done / live / up next; played and live rounds have a ↺ button that opens an inline confirm. Restarting clears every answer from that round onward, rolls standings back to the end of the previous round, and replays the round from its intro. Phones forget their local picks for those questions (`resetSeq` / `resetFrom`), so guests can answer again.
- **New game** lives in the "End of the night" card next to "End game & show results". During a game it opens a dialog with Cancel and a warning showing how many players and which round would be cleared; the first game of the night is set up in the Tonight's game card.
- **Leaderboard on demand** (host button or L): puts the live standings on the TV and phones (`board: true`) any time except during a live question; the next question clears it automatically.
- **Round break countdown:** any break length > 0 shows a big countdown on the TV and phones in both modes. Auto starts the next round at zero; Manual shows "Starting any moment…" and waits for the host.
- **Sponsor push with duration:** "Push to screens now" shows the message on the TV and phones immediately, at any point (including mid-question — phones get a slim top banner so answers stay tappable), for the number of seconds set beside it (`sponsorPushSecs`). "Take it down now" ends it early.
- **Screens stay on:** phones and the TV keep the screen awake (Wake Lock API, with a tiny silent looping video as a fallback for older phones) after the first tap.
- **Confetti** drifts slowly and fills the whole screen (side cannons + a full-width shower); clears in ~10 seconds.
- **Phones at the end** show the full table standings and the top 10 players (plus your own row if you're outside the top 10).
- **Fresh start every game:** each game gets a unique `gameId`. Phones remember joins and picks per game, so a new game — even one reusing the same name — drops the old join and any locked answers, and guests join again.
- **Score corrections** (host → Standings, Tables / Players tabs): tap any score to type the right number (Enter saves, Esc cancels). Corrections are stored as adjustments (`events/{e}/adjust`), shown as a small +/− tag, and carried through every later question. "Reset all scores" clears every answer, score and correction and returns to the lobby with players still joined.
- **Sponsor push never fires empty:** pushing with an empty box asks for a message instead of clearing it. "Clear message from screens" removes it on purpose. Pushes show on every phone with the page open, joined or not.
- **Timing for every phase** (host → Timing): lobby countdown (minutes), answer time, time between questions, time between rounds. Each countdown shows on the TV, phones and host. The live clock's −15s / +15s / +1 min changes whatever is counting down right now: lobby, question (also reopens a locked question), between questions, or the round break. In Auto, the game moves on when a countdown ends; Manual shows "starting any moment" and waits.
- **Question set** (host, full-width card at the bottom): every round with every question, its correct answer (green) and the other options. ✎ edits any question; fixing the answer of a played question re-scores everyone. 🗑 (tap twice) deletes a question that hasn't been played. "＋ Add question" / "＋ Add to Round N" adds to the end of a round that hasn't finished. "⚡ Add a question to play next" slots a new question straight after the current one. Rounds can hold any number of questions. "💾 Save set for future games" stores the set in `restaurant/bank` (host-only), and new games start from it.
- **Sponsor labels:** Chilitos keeps its banner logo, "Presented by Chilitos" on the Chilitos Round, and the table cards. Every other sponsor slot (pushes, reveal/break cards, TV footer message) is labelled SPONSOR unless the host types a label for a paying sponsor.
- **Phone header** shows the table name and table number ("Taco Bout It / Table 1").
- **Standings line up:** TV table and player columns share one row layout, and a player's table reads the same everywhere ("Taco Bout It · Table 1").
- **Image pushes:** "🖼 Add an image" in the sponsor card picks a picture — square 1080×1080, portrait 1080×1350 and story 1080×1920 all work (landscape too); each keeps its own shape. The host shrinks it in the browser (short side up to 1080 px, long side up to 1920 px, JPEG kept under ~400 KB) and stores it at `restaurant/promo/{e}`, so the game state stays small. Pushing shows it as a full-screen pop-up on the TV and a centred pop-up on phones for the chosen seconds, with the text as an optional caption. During a question, phones show a thumbnail banner so answers stay tappable.
- **Spreadsheet import / export** (Question set → ⬆ Import spreadsheet / ⬇ Export): columns Round, Round title, Question, A, B, C, D, Correct (A–D, 1–4 or the answer text), Category, Emoji, Bonus. Save from Excel or Google Sheets as CSV; comma, semicolon and tab files all work. The preview shows each round and lists any rows it skipped and why. Replace or Add, and optionally save as the set for future games. Allowed before the game or in the lobby; during play use ＋ / ⚡. Export writes the current set in the same layout, so it doubles as the template. `chilitos-night-1.csv` is a ready-to-run 4-round night.
- **QR slideshow (`qr.html`)** replaces the printable table cards. A full-screen loop: the general join QR (any table), then one big QR per table + The Bar (table name, room code and prize on each). The general slide repeats every 4 tables. Controls appear on mouse move: ◀ ❚❚ ▶, 5/8/12/20s per slide, "Join QR only", full screen; arrow keys and Space work too. It follows the live game, so codes, tables and table names update by themselves. The host links section is now TV screen / QR slideshow / Join link (the join link is the same as the TV's QR).
- **TV readability:** bigger question (4.4vw) and answers (3vw, larger letter tiles). The Chilitos banner spans the full footer width, with the SPONSOR line on its own strip above it. The break screen leads with a large countdown and a featured offer card (the sponsor image, if one is loaded, plus the sponsor line).
- **Phones:** sponsor pushes appear at the bottom of the screen (compact during questions, full image otherwise). The break screen shows the countdown and the offer card first.
- **Removing the sponsor image** in the host (×) deletes it from `promo/{e}`, takes it off every screen, and it doesn't come back on reload.
- **Table tablets** (`join.html?t=N&tab=1`; host → Links → 📟 Table tablets, with Open / Copy / Copy all). The tablet becomes that table's own screen: table name, a live status line ("Round 2 is live — scan or tap Play"), a big QR for phones (room code built in) and "▶ Play on this tablet" for one guest. On a shared device: email only (no Google), no remembered emails, room code filled in automatically, table locked. A "Switch player" button (tap twice) clears the tablet for the next guest, and their score stays on the board. Built for 1200 × 1920 portrait (the phone layout is scaled up). Links carry no room code, so they work for every game: set them once per tablet.
- Host has one main button that always does the next step (Start round → Show answer → Next question → Round standings → Next round → Final results). Shortcuts: Space = main button, P = pause, E = +15 sec.
- TV reveal shows how the room voted on each option; round breaks show ▲▼ movement vs the previous round; the final is a top-3 podium.
- Phones show a "Reconnecting…" banner if the connection drops and buzz when an answer locks in.

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
- `events/{e}` — public game state (status: lobby → intro → question → reveal → break → … → final; introAt/introSeconds, round, qIndex, liveSlot, timings, questions without answers, reveal, displayCode, sponsorMsg)
- `answerKeys/{e}`, `secrets/{e}` — host-only
- `players/{e}/{pid}` — private: email, name, table (write-once, room code required, closes when joining closes)
- `roster/{e}/{pid}` — public: name, table, joinedAt (no email)
- `tableNames/{e}/{t}` — first player at a table can name it; host can rename
- `answers/{e}/{pid}/{q}` — private: one pick per question, only while it's live
- `standings/{e}` — public, host-written: tables + players + order

`pid` is a one-way hash of the normalized email (same as Screen Test).

## Editing questions
Edit `ROUNDS` (title, optional `icon` and `tag` line for the round intro, `sponsored`) and `QUESTIONS` at the top of `host.html`. Question fields: `round`, `q`, `o` (4 options),
`a` (correct index 0–3), optional `emoji` (picture round clue), `img` (image file in this
folder), `bonus` (prize text). Round 3 is the sponsored Chilitos Round — swap in menu questions.

## Not in the pilot (v2 candidates)
- Season leaderboard across weeks (needs persistent team names)
- Audio round, sound packs
- 3-second table answer lock
- Table-only mode switch
