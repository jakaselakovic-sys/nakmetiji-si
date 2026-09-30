# SELF-PROMPT: Episode 1, a complete analysis and the best version possible

> **Where to run it:** Claude Code (Opus 5.5) in `C:\Users\jakas\Documents\channel`.
> **Save a copy as:** `videos/ep01-tally-sticks/prompts/SELF-PROMPT-ep01-best-version.md`.
> **Read first:** `CLAUDE.md`, `HANDOFF-PROMPT.md` (the rules and the pipeline), `ANALYSIS-2026-09-30.md`, `STATE.md`, then the episode docs.
> **How this relates to HANDOFF §8:** this prompt **replaces and extends** §8. Where they differ, the stricter one wins.

---

## 0. The mission

Selaka's request: *"a complete analysis of this first video, and improve it, especially the visual part. Make this the best video possible."*

"Best possible" is not a feeling. It means, in this order:

1. **The viewer never has a reason to leave.** No window of 5 seconds or more is visually dead, confusing, or repetitive. The first 30 seconds are the strongest of the film.
2. **Every picture does a job.** It shows the thing being said, explains a mechanism, or proves a claim (a real document). Decoration that does no job gets cut.
3. **It looks and sounds made by one hand**, like an established documentary channel: consistent grade, typography, motion grammar and sound. Not "PowerPoint with Ken Burns", and **never AI slop** (no AI images or video, no stock standing in for history).
4. **Every fact on screen and in the narration is still true** after the changes.
5. **What we build is reusable.** Every improvement is a recipe, a library entry or a gate that episode 2 uses without rework (ANALYSIS §4).

**Hard constraints:**
- All the rules in `CLAUDE.md` and HANDOFF §3 apply, including licences, `rights.json` before placement, and Selaka publishing.
- **Deadline:** go/no-go on **Fri 9 Oct 2026**. v2 ships only if every gate passes and FACT-CHECK-3 is clean. Otherwise v1 ships on 15 Oct and v2's components go into episode 2.
- **ETAs:** give Selaka an ETA at the start of each phase and whenever it changes.

---

## Phase A: measure v1 as it is (no opinions yet)

**ETA:** estimate it after the smoke test (HANDOFF §0).

### A1. Build an audit tool once, and reuse it for every future episode

Write `studio/audit.py <video> [--edit edit-film.json --resolved out/resolved.json] --out audit/`. It produces:

- **Per-second metrics** (CSV + JSON):
  - motion (mean frame difference, the same method as the master gate);
  - **shot id** and **source picture**;
  - shot type (picture / document / map / diagram / plain ground / footage);
  - is text on screen (from the edit data);
  - luma and saturation;
  - the voice's words per minute over a 10 s window;
  - pause length before the line;
  - music level relative to the voice;
  - SFX events (zero for v1).
- **Shot statistics:**
  - the shot-length distribution (median, p90, longest 10);
  - how many shots in a row share a type or a picture;
  - picture reuse counts;
  - how many different camera moves are used (push-in / pull-out / pan / tilt / static / parallax), and how often each one repeats.
- **Contact sheets:**
  - one frame every 2 s (the whole film on ~6 sheets);
  - separately, the **first frame, middle and last frame of every shot**.
- **The dead-seconds map:** every run of ≥ 2 s where the picture changes less than a threshold AND there's no new information on screen. The motion gate misses "moving but boring" (a slow drift on the same picture). This map catches it.
- **The first 60 s dissection:** the time of each new visual idea, each new piece of information, the first question, the first stake, the first "today" hint.

### A2. Watch it like a viewer, then like an editor

1. **Watch the whole film once at 1× with sound, without pausing** (from frames + audio: extract frames at 2 fps and review them in order while reading the transcript timeline).
   - Write down every moment you'd be tempted to skip, with its timestamp.
   - That list is the **raw truth**; don't edit it later.
2. **Then go window by window (30 s each, ~20 windows).** Score each 1–5 on:
   - **Visual interest:** is something new happening?
   - **Picture-claim fit:** does the picture show what's being said?
   - **Clarity:** could a sound-off viewer follow it?
   - **Emotion or tension:** does anything raise the stakes?
   - **Craft:** is the framing, type, grade and timing clean?

   Note the single worst moment in each window.
3. **Look at every shot at 100%** for:
   - soft upscales;
   - parallax tearing;
   - text too small at 1080p;
   - captions covering important image parts;
   - colour mismatches between neighbouring shots;
   - unlabelled reconstructions.

**Output:** `videos/ep01-tally-sticks/analysis/EP01-AUDIT.md`, plus the CSV/JSON and contact sheets in `analysis/`.

---

## Phase B: benchmark against the best in the niche

The goal is to measure what "established channel quality" means in numbers, so that "best possible" has a target.

1. **Pick 5 reference videos.**
   - **Source:** long-form (8–25 min) economic or money-history documentaries by faceless channels that use archival art, maps and diagrams.
   - **Selection:** at least 3 of the 5 must be **outliers** (views ÷ subscribers ≥ 4× the channel's median), found with the cheap API path (`channels.list` → `playlistItems.list` → `videos.list`, never `search.list` in a loop).
   - **Documentation:** record why each one was chosen.
2. **Download them with yt-dlp for reference analysis only.**
   - Store them in `raw/reference/` (gitignored).
   - **They are never used in our video.**
   - Log them in `analysis/REFERENCES.md` with the URL and channel.
3. **Run `studio/audit.py` on each.** Extract:
   - the shot-length distribution;
   - motion share;
   - dead-seconds per minute;
   - camera-move variety;
   - text-on-screen share;
   - how often a new visual idea appears;
   - SFX density (from audio onsets that aren't the voice);
   - music changes per minute;
   - the first-60-s structure.
4. **Record the typical cold open:** how many seconds until the first question and the first stake, and how many different images appear in the first 30 s.

**Output:** a comparison table (v1 vs. the median of the 5 references vs. the best of the 5) in `EP01-AUDIT.md`. Wherever v1 is worse than the reference median, that gap becomes a target in Phase D.

---

## Phase C: diagnosis

Write `analysis/EP01-DIAGNOSIS.md`:

1. **The 20 weakest moments**, ranked by *retention risk × fixability*. Weight the first 60 s and each act start ×2.
2. **Root causes**, grouped. The likely candidates, to be confirmed or rejected with data:
   - one camera grammar used everywhere (slow drift);
   - picture reuse;
   - plain grounds;
   - no real motion inside the pictures;
   - no sound design;
   - diagrams that appear but don't *act*;
   - flat reveals in the voice;
   - music that doesn't follow the story;
   - weak transitions at act breaks;
   - a "today" section that's too abstract.
3. **What already works and must be protected:**
   - the document highlights;
   - the braided fire structure;
   - the fact discipline;
   - anything that scored ≥ 4 in A2.
4. **The first 30 s:** a separate verdict. Does it deliver the thumbnail's promise within 5 s? Is it the most visually striking part of the film?

---

## Phase D: the improvement plan

Write `videos/ep01-tally-sticks/EP01-V2-PLAN.md`:
- merge in `VISUAL-UPGRADE-PLAN.md`;
- give **every weak moment from Phase C its fix**, the reusable component it uses, the cost (render minutes + build hours) and the expected metric change;
- choose the fixes by impact per hour.

### D1. Visual levers (use the ones the diagnosis supports; the list isn't a quota)

**Camera and editing grammar:**
- **Vary shot scale:** wide → medium → detail within a scene, cut on the spoken word that names the detail.
- **Motivated moves:**
  - push in on a reveal;
  - pan along a line of text as it's read;
  - pull out to show consequence;
  - a hard cut on stressed words;
  - a hold (with in-picture motion) on emotional beats.
- **No move repeats more than twice in a row.** Add this to the edit gate.
- **Constant-speed camera moves** where the motion gate needs them; eased moves only when the ease itself has a purpose.

**Living pictures** (HANDOFF §8.1–8.2):
- depth parallax;
- **rack focus** using the depth map (blur foreground → background on cue);
- effects chosen by picture tags: fire, embers, smoke, water shimmer, fog, dust, candle flicker;
- a slow light sweep on objects.

Cap parallax at 3.5% of the frame width, and check depth edges at 100%.

**Documents:**
- paper texture, a subtle 3D page tilt with a shadow;
- the highlighter *writes* in time with the voice;
- a magnifier or loupe move on the key word;
- page-turn transitions between pages of the same source.

**Maps:**
- a 2.5D tilt;
- an animated route or spread (the fire front, reusable as "spreading front");
- a time-lapse light change (day → night for 16 Oct 1834).

**Reconstructions** (labelled "reconstruction"), each built as a reusable `mechanism` part (object-split, cross-section, spreading front, flow arrows, counting board):
- the notch cut;
- the split along the grain;
- the stock/foil match;
- the furnace and flue cross-section;
- the fire front with the clock rail and the wind change;
- the Exchequer counting board.

**Real footage** (HANDOFF §8.4):
- Pexels / Commons / CC BY YouTube from the original source's own channel;
- ≤ 15% combined, ≤ 15 s per clip, narrated over, never captioned as 1834.

**Transitions:**
- match cuts (tally split → two phone screens; Turner fire → furnace mouth);
- an ink or burn wipe at act breaks (one style, used consistently);
- a whip-pan with motion blur for time jumps.

**Grade and texture:**
- one look for the whole film: consistent black level, warm highlights, the accent colour #e8743b reserved for the thing that matters;
- subtle film grain + vignette as a *final* layer (deterministic seed), so pictures from different museums sit together.

**Typography:**
- one kinetic-type system: words land in sync with the voice;
- the numbers that matter are big;
- a clear hierarchy (kicker / headline / source chip);
- text readable on a phone (check it at 360 px wide);
- nothing important sits in the caption zone or the bottom-right end-screen area.

**The "today" section:**
- a fictional banking-app UI (never real branding);
- a match cut from the historical mechanism to the modern one;
- it has to feel as concrete as the 1834 fire.

**The cold open (0:00–0:30)** is rebuilt last but planned first. The most striking image comes within 1 s: fire + tally. Show the thumbnail's promise within 5 s, the question by 0:15 and the stake by 0:30. At least 6 different visual ideas in the first 30 s, measured against the benchmark.

### D2. Sound (the half of "visual" viewers feel)

- **The SFX system** (HANDOFF §8.3):
  - a tagged library + a cue-word → tag map, with automatic proposals and human veto;
  - 40–50 events;
  - never on a stressed word;
  - never a fact-asserting sound (no bells, crowds or voices).
- **Room tone and ambience beds** under every act, so there's never dead digital air.
- **Music edits that follow the story:**
  - music changes at act breaks;
  - swells under reveals, drops to near silence before the biggest line;
  - cuts land on musical beats where possible (detect beats with librosa).
- **The voice:**
  - auto-insert 0.3–0.8 s pauses after reveals and before punchlines, driven by punctuation plus a `beat` marker in `script.json`;
  - per-line speed variation within ±5% for emphasis;
  - **only re-voice lines when a fix needs it, and merge the takes** (lessons-learned #5).

### D3. Script and structure (only where the diagnosis says so)

- Cut repetition and any sentence over 22 words.
- Re-hook every 60–90 s (an open question, a callback to the fire).
- Make sure each act break ends on an open loop (it helps the mid-roll ads).
- Every changed or new line gets a claim id and goes through FACT-CHECK-3.
- Runtime stays **8:30–11:00**, so mid-roll ads remain possible.

### D4. Targets (all measured in Phase F; every one must pass)

| Measure | Target |
|---|---|
| Dead seconds (the A1 map) | **≤ 2% of runtime**, none in the first 60 s |
| In-picture motion (living plate, footage, animation) | **≥ 85%** of runtime |
| Master gate motion | **≥ 98%** of seconds, no second < 0.8 |
| Median shot length | within ±20% of the benchmark median |
| New visual idea | at least every **5 s** on average; ≥ 6 in the first 30 s |
| Same camera move in a row | **≤ 2** |
| Any one picture reused | **≤ 5×**; plain grounds **≤ 8** |
| Third-party footage | **8–15%** combined, clips ≤ 15 s, never the opening shot |
| SFX events | **40–50**, ≤ 1 per 5 s |
| Window scores (A2, re-scored) | **every window ≥ 3.5** on visual interest and fit; mean ≥ 4 |
| Loudness | −14 LUFS, true peak ≤ −1.0 dBTP **measured on the final AAC upload file** |
| Facts, licences, ledger | FACT-CHECK-3 clean; every asset has a `rights.json` row |

---

## Phase E: build (in this order, with a checkpoint after each)

1. **The infrastructure first, as reusable components:**
   - plate integration in `render.py` (deterministic, cached);
   - the SFX bus + library + cue map;
   - grain/grade as the final layer;
   - `mechanism` parts;
   - the new edit gates;
   - `studio/audit.py`.
2. **The first 60 seconds**, fully finished → render → audit → a self-review against D4.
   - **Checkpoint:** send Selaka a 60 s preview plus a before/after of the same 60 s.
   - Don't wait for his reply: continue, and apply his feedback when it comes.
3. **The act breaks and the 20 weakest moments** from Phase C, in ranked order.
4. **The rest of the film.**
5. **Full render**, overnight if needed, with the ETA stated.

**Rules while building:**
- Put new scene features behind spec flags so unchanged shots stay cached (HANDOFF §5 "Cache").
- Commit after each step, with `STATE.md` updated.
- **If something fails twice, stop, write down why in `incidents.md`, pick a simpler solution, and carry on.** Don't get stuck polishing one shot.

---

## Phase F: verify (nothing is "done" before this)

1. **All gates:** script / edit / master, plus the new ones.
2. **Re-run `audit.py` on v2.** Build the v1 vs. v2 vs. benchmark table, and check every D4 target.
3. **Re-score all windows** (A2) from the v2 contact sheets.
4. **A harsh-critic subagent:** give a subagent only the v2 contact sheets, the transcript and the benchmark table, with the instruction: *"You are a senior documentary editor. Find the 10 weakest moments and anything that looks cheap, repetitive, AI-made or misleading."* Fix everything it finds that's fixable, and write down anything you're leaving and why.
5. **FACT-CHECK-3** (an adversarial subagent) on every new caption, label, reconstruction, footage use, implied-event sound and re-voiced line. Fixes go into `fixes.json`. That includes the "97% bank deposits" wording (a 2014 figure; ANALYSIS §3.3).
6. **Listen** around every SFX event and every music change: no masking of stressed words.
7. **Look at 100%** at every living shot, reconstruction and document.
8. **Loudness** measured on the final AAC upload file.

---

## Phase G: deliver

- `final/ep01-v2-upload-1080p.mp4` + its full SHA-256.
- `final/ep01-v1-vs-v2.mp4`: the 60 most improved seconds, side by side or back to back.
- `final/ep01-v2-first60.mp4`: a small preview for his phone.
- Updated `captions.srt`, `packaging.md`:
  - chapters, ad breaks and end screen recomputed from `resolved.json`;
  - thumbnails re-checked at 120 px, and re-made from v2 frames if v2 has a stronger image.
- `analysis/EP01-AUDIT.md`, `EP01-DIAGNOSIS.md`, `EP01-V2-PLAN.md`, `FACT-CHECK-3.md`, the benchmark table.
- `STATE.md` + a commit.
- **One line: v1 or v2 for 15 Oct**, and why.

---

## Report to Selaka (every phase)

Short, in the language he wrote in:
1. **Outcome** (what's better, with numbers: dead seconds, motion, window scores, v1 vs. the benchmark).
2. **What's still weak.**
3. **What only he can do or judge:** a preview to watch, the Yale checks, the go/no-go.
4. **The next step + the ETA.**

Never say "the best possible" without the table that proves it against the benchmark. Be honest that YouTube performance can't be guaranteed; the metrics to watch after upload are retention at 30 s, CTR and average view duration.
