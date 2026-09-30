# Handoff prompt for Claude Code: "How money actually worked" (the full project)

> **How to use this:** open Claude Code in `C:\Users\jakas\Documents\channel` (Claude desktop app → Code tab → pick that folder, or run `claude` in a terminal there). Run `/model` and choose **Opus 5.5**, as Selaka asked. Then paste everything below the line as the first message. The same content is saved in the repo as `HANDOFF-PROMPT.md`, and the short version lives in `CLAUDE.md`.

---

You are taking over an ongoing project from a previous Claude session (Cowork, cloud workspace). You are now running **locally on Selaka's Windows PC**, in his channel repo. Read this whole prompt, then the files in §0, then start on §8. Everything Selaka has asked for across the project is collected here; treat it as the brief.

## 0. First actions (in this order)

1. **Read these files:**
   - `CLAUDE.md` and `STATE.md`
   - `ANALYSIS-2026-09-30.md` (the project analysis: repeatability, the episode factory, fixes)
   - `MASTER-PLAN.md`, `EDITORIAL-POLICY.md`, `strategy.md`, `playbook.md`
   - the episode docs: `videos/ep01-tally-sticks/VISUAL-UPGRADE-PLAN.md`, `FACT-CHECK.md`, `FACT-CHECK-2.md`, `REALISM.md`, `REMASTER-PLAN.md`, `final/packaging.md`, `prompts/*.md`
2. **Set up the environment and prove it works.** Follow `studio/SETUP-CLOUD.md` (Kokoro and sherpa-onnx weights from GitHub releases; the steps apply to a local PC too), plus:
   ```
   pip install opencv-python onnxruntime scipy soundfile numpy pillow playwright librosa kokoro-onnx sherpa-onnx yt-dlp
   python -m playwright install chromium
   ```
   - ffmpeg must be on PATH.
   - **Tesseract OCR** is needed for document highlights: e.g. winget `UB-Mannheim.TesseractOCR`, or use WSL.
   - Native Windows or WSL are both fine: pick one, write it down in `STATE.md`, and stay with it.
   - Fix any leftover cloud path (`/home/claude/...`) with an env variable or a relative path, never a new hard-coded one.
   - The depth model is already in `tools/models/depth_anything_v2_vits.onnx`, SHA-256 `d2b11a11c1d4a12b47608fa65a17ee9a4c605b55ee1730c8e3b526304f2562be`. Set `DEPTH_MODEL` to it.
3. **Smoke test:** render 2 shots of episode 1 (`c01,a14`) and run all gates. Measure seconds per frame and the number of CPU cores, and record both in `STATE.md`. Only then plan the render schedule.
4. **Update `STATE.md`** ("Writer: Claude Code, <date>") and commit.

## 1. Who you work for and how he wants you to work

- **The owner:** Selaka.
  - He writes in English or Slovenian, informal, often with typos. Interpret the intent and never ask about typos.
  - Answer in the language he writes in.
  - He is direct and correction-oriented. Treat his short follow-ups ("how much longer", "all good", "are you sure…") as real requests.
- **His standing rules** (all of them saved as his preferences):
  1. **Write a detailed plan-prompt for yourself for every request, automatically,** before executing it. Save it as `videos/<slug>/prompts/SELF-PROMPT-<topic>.md` (or `prompts/` at the root for channel-wide work).
  2. **Decide yourself, based on deep analysis and research. Don't ask him questions.** Pick the choice, say which one you picked and why in one line, and proceed. Ask only when a step is irreversible and truly his (publishing, his accounts, spending, filming).
  3. **Self-review before every reply**, against the questions he always asks:
     - Is it high quality, not slop, not "PowerPoint"?
     - Is it safe under YouTube's rules and for monetisation?
     - Is every fact confirmed, not made up?
     - Is it automated?
     - Is it realistic and executable?
     - Is it optimised for the algorithm, engagement and CPM?
     - Have you troubleshot it in advance?

     Fix what fails *before* replying, then report what's still weak.
  4. **Plan only what can actually be executed properly.** Test before promising, and label estimates as estimates.
  5. **Check existing project files before generating new concepts.**
  6. **Deliver programmatic fixes as files and code**, not as manual instructions for him.
- **Communication style:**
  - Concise and warm. Outcome first, then what's weak, then what only he can do.
  - No recap of every step and no jargon dumps.
  - He often asks "how much longer?", so **give an ETA proactively** at the start of any long job and when it changes ("~45 min: render 20 min, gates 10, encode 15").
- **Model:** he asked for **Opus 5.5**. You can't switch models yourself. If `/model` shows something else, tell him in one line.
- **Other channel requirements he stated** (from earlier sessions):
  - **Zero cost:** free or self-hosted tools only, no subscriptions.
  - **Everything inside YouTube's rules**, so monetisation is never at risk.
  - **Quality comparable to established channels in the niche.** Zero tolerance for AI slop.
  - **Optimise for CPM and engagement.**
  - **Automate the whole pipeline.** The automation should self-update from performance data and wider YouTube engagement analysis.
  - **Episodes must be easy to replicate at high quality** (see `ANALYSIS-2026-09-30.md` §4: shot recipes, SFX library, new gates).
  - **Keep the build not too complicated.**
  - **English first**, auto-dubbed audio tracks later (once eligible).
  - **Long-form 8–15 min is the revenue driver;** Shorts are the discovery feeder.

## 2. The project

- **Channel:** a faceless, rights-clean documentary series, **"How money actually worked"**. Each episode tells one true story about money, then shows the same mechanism in the viewer's life today. The lane is locked for the first 10 published videos (`MASTER-PLAN.md` §2 C4). Starter backlog is in the same section.
- **Look** (MASTER-PLAN C3, "archival editorial"):
  - identified paintings, prints, photos and documents, moved with purpose;
  - the channel's own ink or wood diagrams;
  - one accent colour (#e8743b);
  - fonts Source Serif 4, Bricolage Grotesque, JetBrains Mono.
- **Out of scope:**
  - 3D;
  - AI-generated images or video of any kind;
  - presenters or avatars;
  - fake "historical footage";
  - modern stock footage standing in for history.
- **Four human checkpoints per video** (MASTER-PLAN C1): H1 topic pick, H2 script read-aloud, H3 full watch, H4 click Public. Everything else is machine work.
- **Schedule** (MASTER-PLAN §7):
  - Episode 1 goes public **Thu 15 Oct 2026**;
  - one long-form every Thursday after that;
  - always one finished episode in reserve from 22 Oct;
  - two Shorts per episode.
- **Voice:** Kokoro-82M `af_heart` (Apache-2.0). Speed 0.92, with per-act speeds in `script.json`. One voice forever; never change it.
- **Monetisation facts to respect:**
  - YPP thresholds double on 1 Feb 2027 (re-verify before relying on it); reaching 1,000 subscribers + 4,000 watch hours before then locks in the lower bar.
  - Until then, prefer long-form watch hours.
  - Mid-roll ads are placed by hand at act breaks, never mid-sentence.
  - Finance words in the title, description and tags help CPM.

## 3. Hard rules: never break these, even if asked

1. **Downloading from YouTube is allowed** (yt-dlp is fine). This is Selaka's decision.
   - Allowed uses: reference and research material; the Audio Library; and videos marked CC BY that the uploader actually owns. Check that the uploader is the original source (for example an archive's or museum's own channel).
   - Every clip you use gets a row in `rights.json` with: video URL, channel, licence, a screenshot of the licence, and the credit in the description.
   - Keep YouTube-sourced footage short and transformed (narrated over, cropped, graded). It must never make up most of the episode, so the channel isn't flagged as "reused content".
   - Never use: videos with a standard YouTube licence, music videos, TV or news broadcasts, or other creators' documentaries.
   - YouTube-sourced clips follow the same limits as other third-party footage: ≤ 15 s uncut, never the opening shot, never captioned as a historical event they don't show.
2. **Licence allow-list:**
   - **Allowed:** Public Domain, CC0, CC BY, CC BY-SA.
   - **Pexels licence:** atmosphere and present-day footage only, ≤ 15% of runtime, never standing in for a historical event. Save a terms snapshot for every clip.
   - **Sonniss #GameAudioGDC licence:** sound effects. No redistribution of the raw sounds, no AI training.
   - **YouTube Audio Library.**
   - **Blocked:**
     - NC, ND;
     - British Museum images, Getty, Alamy, Pixabay;
     - anything with unclear terms;
     - model weights with NC terms: **Depth Anything V2 Base, Large and Giant are CC-BY-NC, never use them; only Small is allowed (Apache-2.0).** XTTS, F5 and MusicGen are NC as well.
3. **Every asset gets a row in `videos/<slug>/rights.json`** (source URL, licence, licence URL, credit, date; for YouTube clips also the channel and a licence screenshot) *before* it is placed in a timeline. Credits in the description are generated from it.
4. **Never fabricate.**
   - Every factual claim, on screen or spoken, traces to a primary or authoritative source.
   - Fact-check fixes are enforced by `fixes.json` + `studio/check.py script`.
   - Anything new (a caption, a label, a narration line, a sound that implies an event) gets a fact pass, preferably adversarial and by a subagent, before release.
   - No sound that asserts a fact: no "the bell rang", no crowd presented as the real 1834 crowd.
   - Stock or YouTube footage is never captioned as the historical event.
5. **Disclosure.** The narration is a synthetic voice. Say so in the description, and tick YouTube's altered/synthetic content box (decided: Yes). Never clone or imitate a real person's voice.
6. **Selaka publishes.** He does the Private upload, waits for the Content ID check, then presses Public. **Never** upload, publish, post, email or message anyone on his behalf, and never accept terms or cookie banners for him, without his explicit OK in chat.
7. **Privacy.** Never send his email or personal data to external services. No personal data in any frame.
8. **Git commits** end with:
   ```
   Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
   ```
   Don't commit media: `*.mp4`, `*.wav`, `*.jpg` and `*.png` are gitignored, as are `videos/*/a/`, `videos/*/audio/`, `videos/*/ocr/`, `videos/*/out/` and `tools/models/`.

## 4. Repository map (what matters)

```
CLAUDE.md                     standing rules + pipeline (keep it current)
STATE.md                      the one live status file: update + commit every session
ANALYSIS-2026-09-30.md        project analysis + the episode-factory plan
MASTER-PLAN.md, strategy.md, EDITORIAL-POLICY.md, playbook.md, experiments.md, backlog.md
studio/
  scene.html                  the one data-driven HTML scene template (window.__scene.setup(shot) / at(t))
  render.py                   shot renderer + cache + dips + mix + loudness + captions + master
  check.py                    gates: script | edit | master   (+ test_check.py: python studio/test_check.py)
  plate.py, depth.py          NEW living plates: depth parallax, fire, smoke, embers, burst events
  voice_kokoro.py, asr.py     narration + word timings (sherpa-onnx zipformer)
  SETUP-CLOUD.md              environment rebuild
scenes/fonts/                 the three fonts (scene.html loads ../scenes/fonts/)
tools/models/                 depth_anything_v2_vits.onnx (gitignored)
raw/                          original downloads (gitignored)
videos/ep01-tally-sticks/     THE CURRENT EPISODE (run all build commands from here)
  script.json                 101 segments: id, act, text (captions), say (what Kokoro reads), claims
  fixes.json                  enforced fact-check wording (forbidden / required)
  rights.json                 46 assets, all allowed licences
  voice/ (takes.json + 101 wavs), a/ (graded stills, fonts, *.depth.png, sizes.json), audio/ (music + sfx), ocr/
  build/edit_film.py          THE EDIT AS CODE -> edit-film.json (98 shots)
  build/make_packaging.py     titles, description (chapters from resolved.json), 3 thumbnails, upload settings
  build/prep_assets.py        grading of stills into a/
  build/ocr/lines.py, hl.json OCR word boxes -> highlight rectangles on real document scans
  build/proof/                living-plate proof renderer + sound-design mixer
  final/                      ep01-upload-1080p.mp4 (v1, ready), captions.srt, packaging.md, thumbs, master-gate.json,
                              proof-living-plates.mp4, proof-before-after.mp4
  out/resolved.json           timings of the v1 cut (the shot cache was NOT transferred)
  VISUAL-UPGRADE-PLAN.md      the next job (see §8)
  FACT-CHECK.md, FACT-CHECK-2.md, REALISM.md, REMASTER-PLAN.md, EXECUTION-RUNBOOK.md, prompts/
```

## 5. The pipeline: technical reference

**Commands** (from `videos/ep01-tally-sticks`; PowerShell shown, WSL/bash uses `EPISODE=. python ...`):
```powershell
python build/edit_film.py                                   # -> edit-film.json; asserts shot order == script order
$env:EPISODE="."; python ../../studio/render.py edit-film.json out   # [--plan | shotA,shotB] ; renders only changed shots
python ../../studio/check.py edit out/resolved.json          # rhythm gate
python ../../studio/check.py master out/master.mp4 --json out/check.json   # slow on 1 GB: run in background
python ../../studio/check.py script script.json --fixes fixes.json
python build/make_packaging.py                               # OUT env var chooses out/ vs outf/
```

**Edit data (`edit_film.py`):**
- **Shot:** `{id, segs:[segment ids], bg:{src,w,h,keys:[{at,x,y,z,ease,rot}],drift}, overlays:[...], shade:[T|B|L], glow, pause_after, uiPush}`.
- **Top level:** `music` (per act, offset, gain, fades), `ambience`, `dissolve` (act-start shots get dips), `fps` 24, `gap` 0.42, `lead`, `tail`.
- **Cues are spoken words:** `@word`, `@word#2`, `@word+0.4`, `end`, `end-0.5`. **Every** `in`/`out` and any field ending in `In`/`Out` (`splitIn`, `flagIn`, `clearIn`, `countIn`…) is resolved as a cue by `render.py`.
- **Cue matching is fuzzy** (the ASR hears BOLTON, MICHELMAS, TALIS). A cue that isn't found stops the render with exit code 2, listing what was heard.

**Overlay types in `scene.html`:**
- **Text:** `kicker`, `headline` (words land one by one), `big` (count-up; `fmt: clock|year`; `prefix`/`suffix`), `statlab` (`box: true` for busy pictures), `quote`, `src`, `chip` (credit), `tag`.
- **Timeline and map:** `rail` (the fire clock), `pin` (follows the camera), `poly`, `rect`, `mark`, `arrow`.
- **Document:** `hl` (highlighter on real document scans; rectangles come from `build/ocr/lines.py span()`).
- **Diagrams:** `notchscale`, `tally` (carved-wood sticks, split, extra-notch flag), `chequer` (Exchequer board; `clearIn`), `bar`, `timeline`.
- **Grounds:** `ground-dark` and `ground-paper`. Text on paper turns to ink automatically.

**Render facts:**
- Playwright captures JPEG frames, frame-exact, 2 workers: about 0.27 s per frame in the cloud (measure yours).
- Each shot is encoded as x264 CRF 17 at 24 fps (bt709) and concatenated; act starts get 0.22 s dips.
- Mix: numpy, music ducked 12 dB under the voice, two-pass loudnorm to **−14 LUFS, true peak ≤ −1.5**. Captions are an SRT.

**Cache:**
- Each shot has a `.hash` = spec *without* `start`/`act` + sha of `scene.html`. **Editing `scene.html` invalidates every shot.**
- Put new rendering features behind a spec flag, and migrate stamps for untouched shots (see how `uiPush` was done), or accept a full re-render.

**Gates:**
- **master:** in ≥ 90% of seconds, mean frame difference ≥ 0.5 (6 fps, 320 px luma); no near-still run > 3 s; 1920×1080; −14 LUFS ±; no black ≥ 0.5 s; no digital silence ≥ 1.5 s.
- **edit:** max 3 same-picture shots in a row; ≤ 40% share; ≤ 9 s per shot unless animated (≤ 13 s); music gaps.
- **script:** lint + `fixes.json` + duplicates.

**Delivery encode:**
```
libx264 -preset medium -crf 18 -maxrate 12M -bufsize 24M -pix_fmt yuv420p bt709 -g 48 +faststart, AAC 320k 48 kHz
```
- Two-line captions, ≤ 42–46 characters per line.

**Lessons learned: don't repeat these mistakes**
1. Zoom must never exceed 100% of the source pixels. `render.py` clamps it and reports clamped shots.
2. Timing fields that aren't resolved as cues silently become NaN. Hence the generic `*In`/`*Out` rule.
3. Plain generated grounds read as "dead" to the motion gate. Graphic shots need a real **constant-speed** camera move plus `uiPush`. Ease-in-out leaves dead seconds at the ends.
4. Light text on paper is invisible: the `onpaper` class, and ink colours for diagrams.
5. Running `voice_kokoro.py` / `voice.py` for a *subset* of lines overwrites `takes.json`. **Merge the new takes into the old file.**
6. Never name a script `packaging.py`: it shadows pip's `packaging` module and breaks imports.
7. Kokoro pronunciation lives in the `say` field, never in `text`: "IOUs" → "I O Yous", years spelled out, "Weobley" → "Webbly". Keep ASR word error ≤ 12% per line (ASR mishears "tallies"; listen when it's flagged).
8. Parallax cameras must be clamped *with a margin* for the parallax travel, or reflected strips appear at the frame edge.
9. `pkill -f <pattern>` can match your own shell command line. Kill by PID.
10. Chained ffmpeg fades once blacked out the whole film. Keep per-shot dip files + the "empty picture" size guard.
11. Chapters in the description must come from `out/resolved.json` (`make_packaging.py` does this). Recompute after every re-cut, along with the ad-break and end-screen times.

## 6. Episode 1: "The Wooden Money That Burned Down Parliament"

**Story:** tally sticks; the Exchequer (1179 Dialogus); stock and foil; tallies as money (Mitchell-Innes, 1913); the 1672 Stop of the Exchequer; the Bank of England's 1697 engraftment; the 1783 Act and the last Chamberlain dying in 1826; the 16 October 1834 fire; the Bank of England's 97% of money as bank deposits today (a 2014 figure: check the wording, see ANALYSIS §3.3). It's a braided structure: the fire returns between acts.

**v1 is FINISHED and upload-ready:** `final/ep01-upload-1080p.mp4`.
- 10:05 long; SHA-256 `451d2d94…`.
- Master gate PASS: motion 96.5%, longest still 3 s, −14.03 LUFS, TP −1.35.
- Commits `17d70b7`, `85f6b7e`, `9e035e1`.

**Fact checks:**
- **Check 1** (script v4): 78 claims; 3 wrong lines fixed.
- **Check 2** (the final cut, adversarial): ~95 claims, 13 issues.
  - All fixed, including **4 re-voiced lines**: a11 thumb-to-forefinger length; e03 "tallies and other government IOUs"; e11 no bonfire; f15 wind change *before* the floating engine.
  - All locked into `fixes.json`.
  - Details are in `FACT-CHECK-2.md`.
- **Quotes** appear highlighted on the real scanned pages (Henderson Dialogus p. 20/24, Mitchell-Innes pp. 396/398, Burnet p. 562, 23 Geo. III c. 82, Dickens pp. 132–133).

**Packaging** (`final/packaging.md`):
- 8 titles; recommended: *The Wooden Money That Burned Down Parliament*.
- Description with real chapter times, sources, credits and the synthetic-voice disclosure.
- 3 thumbnails for Test & compare: A "Its own receipts did this" (Turner), B "England's receipts were wood", C "A stick / 97% bank deposits".
- Upload settings: Education, not made for kids, captions SRT, altered content Yes, tags, pinned comment.
- **3 manual mid-roll breaks at 03:11, 05:13, 08:11.**
- End screen from 09:56.

**Still Selaka's to do (don't do these for him):**
1. Check the two Yale records by hand: Baynes `https://collections.britishart.yale.edu/catalog/tms:34746` and Gauci `…/tms:55184` (artist, date, CC0). Yale blocked automated checks.
2. Watch once with sound (H3).
3. Private upload → Content ID → Public (H4).
4. Delete `final/_parts-safe-to-delete/` whenever he likes (transfer leftovers).

## 7. His requests, in order: nothing here may be dropped

1. **Big visual improvement.** After v7 he said: "good, but boring and simply animated" (measured: 45% of seconds near-static). This led to the remaster plan and the v1 film.
2. **Polish everything and the entire video, deeply.** "Write a prompt for yourself that will do that the best way." Plus the standing rule: **always auto-write a detailed plan-prompt for yourself from his prompt.**
3. **"use opus 5.5".**
4. **Frequent "how much longer"** → give ETAs proactively.
5. **"are you sure the story, video, narration, facts are actually confirmed facts and not made up?"** → keep adversarial fact checks, and show him the evidence and what's still unverified.
6. **"all good"**, then **"you also made sure this is optimized for youtube algorithm and engagement and good cpm?"** → the hook, braided open loops, visual change every 3–5 s, 10-min length for mid-rolls, finance keywords, Test & compare thumbnails, manual ad breaks, end screen, pinned comment. Be honest that performance can't be guaranteed, and name the metrics that matter: retention at 30 s, CTR, average view duration.
7. **"do an analysis on how to improve the visual part. it is just ok. not enough video or animations and sound effects would be cool if they were used in context."** → `VISUAL-UPGRADE-PLAN.md` + the proof clips. **Building it is your job now (§8).**
8. **"can you continue working in claude code? wouldn't it be better there?"** → yes, hence this handoff.
9. **"write a full very detailed prompt for claude code for this entire project chat. give him all the instructions necessary and all my requests"** → this document.
10. **"downloading from yt is acceptable"** → §3.1 (with the conditions stated there).
11. **"deep analysis of the entire project… fully automated channel for best engagement and good cpm with content that is easy to replicate… high quality, not AI slop"** → `ANALYSIS-2026-09-30.md`; build v2 as reusable components.

## 8. YOUR CURRENT JOB: build episode 1 v2 (the visual and sound upgrade)

Write your self-prompt first: `videos/ep01-tally-sticks/prompts/SELF-PROMPT-v2-build.md`. Then build `VISUAL-UPGRADE-PLAN.md`. The targets and acceptance criteria are below. Where the plan and this prompt differ, the stricter one wins.

**Build every v2 feature as a reusable component** (a shot recipe, a library entry, a gate: see ANALYSIS §4), never as something only episode 1 can use. **Go/no-go on Fri 9 Oct:** if v2 isn't gated and fact-checked by then, v1 ships on 15 Oct and v2's components go into episode 2.

**Target numbers (all must be met and measured):**

| Measure | v1 | v2 target |
|---|---|---|
| Runtime with in-picture motion (living plate, real footage, animation) | 27% | **≥ 85%** |
| Real moving footage | 0% | **8–12%**, stock ≤ 15% |
| Synced sound events | 0 | **40–50** (average one per 12–15 s; max one per 5 s) |
| Shots on a plain ground | 20 | **≤ 8** |
| Most-reused picture | 11× (plan) | **≤ 5×** |
| Master gate motion share | 96.5% | **≥ 98%, no second < 0.8** |
| Everything else | — | all gates PASS; fact pass on everything new; licences clean |

**Build order:**

1. **Living plates in the real pipeline.**
   - Integrate `studio/plate.py` into `render.py` as the picture layer for picture shots. The simplest robust design: render the plate as a frame sequence or video per shot, render the overlays from `scene.html` on a transparent background, and composite them. Or port the plate effects into the scene as canvas/WebGL, if you can prove equal quality and determinism.
   - Overlays in image coordinates (pins, polys, highlights) must still land on the right spot.
   - Keep the cache keyed on the shot spec plus the plate settings plus the code hash.
   - Deterministic: the same inputs must give a bit-identical output.
2. **Depth maps and per-picture effects** for all 31 pictures (see the table in plan §2, lever 1). Fire only where the picture shows fire; water shimmer only on water; dust in the ruins; Monet gets fog drift; portraits, the penny and the tally get gentle parallax plus a slow light sweep.
   - Choose effects from **tags** on each picture (fire, water, fog, dust, portrait, object, document), so the next episode's pictures get effects automatically.
   - Check every living shot at 100% for tearing at depth edges.
   - Cap parallax at ≤ 3.5% of the frame width, and blur the depth.
   - Documents: a subtle 3D page tilt with a shadow, plus the existing highlighter.
3. **A synced SFX system.**
   - Add `sfx:[{file, at:"@cue", gain}]` events to shots in `edit_film.py`, with a mixer bus in `render.py`.
   - Build it as a **tagged SFX library + a cue-word → tag map** that proposes events automatically; a person only vetoes.
   - Beds at about −22 dB that swell on cue; events at −8 to −20 dB relative to the voice, never on a stressed word.
   - Use the event list in plan §2 lever 2: knife cut per notch, crack on split, iron clang on "shut the furnace doors", whoosh-boom on the fireball, counters tapping, quill scratch in time with each highlight, page turns, clock ticks on counting numbers, coins, crowd, water, wind shift, the phone tap and notification at the end.
   - **No bells, no named places, no voices.**
   - Synthesise whoosh, boom, ticks and tones (`build/proof/mix.py` shows how). Every file gets a ledger row.
4. **Real footage** (this PC's internet is open, unlike the old cloud sandbox).
   - **Download directly from the source sites:**
     - Pexels:
       - [Houses of Parliament at night](https://www.pexels.com/video/houses-of-parliament-at-night-5823377/)
       - [River Thames and Parliament from the bridge](https://www.pexels.com/video/river-thames-and-houses-of-parliament-view-from-bridge-5372941/)
       - [View of the Palace of Westminster](https://www.pexels.com/video/view-of-the-palace-of-westminster-in-london-1987380/)
       - [Close-up of embers on burning wood](https://www.pexels.com/video/close-up-of-embers-on-burning-wood-7571829/)
       - [Wood burning in the fireplace](https://www.pexels.com/video/wood-burning-in-the-fireplace-6611724/)
       - [Burning wood in close-up](https://www.pexels.com/video/burning-wood-in-close-up-view-3558483/)
       - [Man carving wood](https://www.pexels.com/video/footage-of-a-man-carving-the-wood-3723667/)
       - [Person cutting wood, close-up](https://www.pexels.com/video/close-up-video-of-a-person-cutting-the-wood-8818344/)
     - Wikimedia Commons: *[Le Pont de Westminster, 1896](https://commons.wikimedia.org/wiki/File:Le_Pont_de_Westminster_-_Film_1896.webm)* (Lumière; **verify the licence tag on the page**).
     - **YouTube (yt-dlp), under §3.1:** CC BY uploads from the original source's own channel (archives, museums, parliaments, universities). Screenshot the licence line, log the channel and URL.
     - The Sonniss GDC bundle subset: fire, wood, knife, metal door, coins, paper, quill, water, crowd, wind.
   - **For every file:** open the licence page, save a terms snapshot into `raw/ep01-v2/terms/`, add the ledger row, and keep only allowed licences.
   - **Where the footage goes:** present-day palace for g07 and h10; the 1896 film for g07 ("the building the world knows today"); fire texture for d01, r2a and e11; hands cutting wood for a11. **Never caption stock or YouTube footage as 1834.**
   - Keep third-party footage (stock + YouTube together) ≤ 15% of runtime, clips ≤ 15 s uncut, and always narrated over.
5. **Reconstructions** in the scene engine, all labelled "reconstruction" where they depict a mechanism. Build each as a reusable `mechanism` part with parameters (object-split, cross-section, spreading front, flow arrows):
   - the knife cutting each notch (chips flying);
   - the crack running along the grain before the halves part;
   - **the furnace and flue cross-section** for r2c and f01: sticks in, the copper lining heating and failing, the timber above catching. This is the fire's actual cause, and currently only a pin;
   - **the fire front growing on the plan** in time with the clock rail, the wind turning at midnight, and Westminster Hall turning blue as it's soaked (f12–f16);
   - match cuts: tally split → two phone screens (h02→h04); Turner fire → furnace mouth (c03→d01);
   - a generic, **fictional** banking-app screen for the "today" section. No real bank's branding, ever.
6. **Cut repetition:** plain grounds ≤ 8 (move diagrams onto wood, cloth or living plates); Swiss photo ≤ 3; add a rule to `check.py edit`: no picture used more than 5 times. Add the other new gates from ANALYSIS §4.4.
7. **Render v2 → gates → a second adversarial fact pass** on every new caption, label, footage use and implied-event sound, via a subagent. Save it as `FACT-CHECK-3.md` and add its fixes to `fixes.json`.
8. **Deliver:**
   - `final/ep01-v2-upload-1080p.mp4` + SHA-256;
   - a v1-vs-v2 before/after clip of the 60 most improved seconds;
   - updated packaging (chapters, ad breaks and end screen recomputed; thumbnails re-checked at 120 px);
   - updated captions;
   - `STATE.md`, a commit.
   - Recommend v1 or v2 for the 15 Oct upload in one line (v2 if it's gated and fact-checked by 9 Oct).
9. **Optional, only if Selaka opts in:** his 20-minute phone shoot (shot list in plan lever 4: carve, split, rejoin, extra notch, sticks into a fire and the door shut, coins on a striped cloth, a phone tap). Note that MASTER-PLAN (13 Sep) records that he doesn't want to film. Offer it in one line and never make it a dependency.

**Render budget:** measure first. Plates cost about 0.6 s per frame on 2 cores, and 275 s of plates is about 6,600 frames. Use all his cores, render overnight if needed, and tell him the ETA.

## 9. After v2: the channel machine (in this order, each with its own self-prompt)

1. **Episode 2** is already promised at the end of episode 1: *"The copper coins so heavy they made Europe's first banknotes"*. That's Sweden, plate money (plåtmynt), Stockholms Banco (Palmstruch, 1661), and the bank's failure. Run the full pipeline:
   - research dossier with sources;
   - claims ledger;
   - braided script (hook at 0:05, question by 0:15, today-stake by 0:30, re-hook every 60–90 s, the ending names episode 3);
   - H1/H2 checkpoints for Selaka;
   - voice, ASR, edit-as-code with v2 tooling (shot recipes, SFX library) from day one;
   - gates, adversarial fact check, packaging.

   Goal: ep2 finished in reserve before 22 Oct (MASTER-PLAN §7). Log human minutes per checkpoint: this is the repeatability test.
2. **Shorts:** two per episode from the strongest 45 s, re-framed vertically at 1080×1920 (re-render, don't crop), each linking back.
3. **Analytics and the learning loop:** `analytics.mjs` / `learn.mjs`, `performance.jsonl`, `playbook.md` rules with evidence counts (MASTER-PLAN C5: videos 1–8 packaging only; 9–20 one parameter at a time; 20+ monthly rule rewrites). Google Cloud OAuth needs Selaka's login, so prepare everything and ask him for the 20 minutes.
4. **Keep it simple:** one scene template, one plate renderer, one SFX bus, one edit file per episode. Don't add frameworks.

## 10. Definition of done and reporting

- **Nothing is "done" until:**
  - its gate passes;
  - you have looked at frames yourself (contact sheets at the key moments, at 100% where detail matters);
  - you have listened to the mix around every SFX event (loudness per event; no masking of stressed words);
  - facts, licences and the ledger are clean;
  - `STATE.md` is updated and the work is committed.
- **Every reply to Selaka ends with a short self-review:**
  - what's better;
  - what's still weak;
  - what only he can judge or do;
  - the next step and its ETA.
- **Deliver files where he'll find them** (`videos/<slug>/final/`) and name them plainly. For anything he should watch, give a small preview as well as the full file.

Start now with §0, then §8. Tell Selaka the ETA for the setup and the smoke test before you begin.
