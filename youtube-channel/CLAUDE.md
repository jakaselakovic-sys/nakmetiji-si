# CLAUDE.md: read this first, every session

This repo is **Selaka's YouTube channel "How money actually worked"**: faceless, rights-clean, 8–12 minute money-history documentaries. The live status is in `STATE.md`; the current episode is `videos/ep01-tally-sticks/`.

## How Selaka wants you to work (standing rules)
1. **Plan first.** For every request, write a detailed plan-prompt for yourself first (save it as `videos/<slug>/prompts/SELF-PROMPT-<topic>.md`), then execute it.
2. **Decide, don't ask.** Decide by analysis and research, pick, and proceed. Ask only when a choice is irreversible *and* truly his.
3. **Self-review before every reply**, against the questions he always asks:
   - Is it quality, not slop and not PowerPoint?
   - Is it safe for YouTube's rules and monetisation?
   - Is it fact-checked?
   - Is it automated?
   - Is it realistic?
   - Does it serve engagement and CPM?
   - Have you troubleshot it in advance?
4. **Plan only what can actually be executed**, and prove it with a test before promising it.
5. **Check existing files before inventing new ones.** Fixes are delivered as code or data files, not as instructions for him.
6. **Keep replies concise.** Give him the outcome, what's weak, and what only he can do.

## Hard rules (never break, even if asked)
- **Downloading from YouTube is allowed** (yt-dlp is fine).
  - Allowed uses: reference and research material; the Audio Library; and videos marked CC BY
    that the uploader actually owns. Check that the uploader is the original source (for
    example an archive's or museum's own channel).
  - Every clip you use gets a row in `rights.json` with: video URL, channel, licence,
    a screenshot of the licence, and the credit in the description.
  - Keep YouTube-sourced footage short and transformed (narrated over, cropped, graded).
    It must never make up most of the episode, so the channel isn't flagged as "reused content".
  - Never use: videos with a standard YouTube licence, music videos, TV or news broadcasts,
    or other creators' documentaries.
- **Licence allow-list:** PD, CC0, CC BY, CC BY-SA; plus the **Pexels licence** for atmosphere footage only (≤ 15% of runtime, save a terms snapshot per clip); the **Sonniss #GameAudioGDC licence** and **YouTube Audio Library** for sound effects.
  - Runtime shares (Pexels ≤ 15%, YouTube-sourced footage) are computed from `rights.json` by `studio/check.py`. If that check doesn't exist yet, add it before the next render.
- **Blocked:** NC, ND, British Museum images, Getty, Alamy, Pixabay, and the **Depth Anything V2 Base/Large/Giant** models (CC-BY-NC). Only **Small** (Apache-2.0) is allowed: `tools/models/depth_anything_v2_vits.onnx`, SHA-256 `d2b11a11c1d4a12b47608fa65a17ee9a4c605b55ee1730c8e3b526304f2562be`.
  - Check it with `Get-FileHash tools\models\depth_anything_v2_vits.onnx -Algorithm SHA256`. Refuse to run depth if the file's hash doesn't match.
- **Every asset gets a row in `videos/<slug>/rights.json`** before it's placed.
- **Never fabricate.**
  - Every claim traces to a source.
  - Fact-check fixes live in `fixes.json` and are enforced by `studio/check.py script`.
  - Anything new on screen or in the narration gets a fact pass before release.
  - Stock footage is never captioned as a historical event.
  - No AI-generated "historical footage".
  - No sound that asserts a fact (a bell ringing, a crowd presented as the real crowd).
- **Synthetic voice (Kokoro af_heart):** disclose it in the description, and tick the altered-content box.
- **Selaka uploads, runs the Private → Content ID check, and presses Public.** Never publish, email or post on his behalf without his explicit OK in chat.
- Commits end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```

## Pipeline (all commands run from the episode folder)
PowerShell (this PC):
```powershell
cd videos/ep01-tally-sticks
python build/edit_film.py                                        # shots as data -> edit-film.json
$env:EPISODE="."; python ../../studio/render.py edit-film.json out  # renders changed shots only (cache), mixes, masters
python ../../studio/check.py edit out/resolved.json               # rhythm gate
python ../../studio/check.py master out/master.mp4 --json out/check.json   # motion, stills, loudness, black, silence
python ../../studio/check.py script script.json --fixes fixes.json          # fact gate
python build/make_packaging.py                                    # titles, description, chapters, thumbnails
```
In WSL / bash, the render line is `EPISODE=. python ../../studio/render.py edit-film.json out`.

- **The episode folder holds:**
  - `script.json`, `voice/` (takes.json + wavs), `a/` (graded stills, fonts, depth maps), `audio/` (music and sfx), `ocr/`;
  - media is gitignored, and the originals are in `raw/`.
- **Cues are spoken words:** `@word`, `@word#2`, `@word+0.4`, `end`. Every `*In` / `*Out` field is resolved as a cue.
- **The render cache** is keyed on a shot's pixels (its spec minus its position in the film) plus a hash of `studio/scene.html`. Editing `scene.html` re-renders everything; gate new features behind a spec flag.
- **Living plates:** `studio/plate.py` + `studio/depth.py` (parallax, fire, smoke, embers, burst events). The proof is `build/proof/render_proof.py`.
- **Gates:**
  - motion ≥ 0.5 mean difference in ≥ 90% of seconds, no still run > 3 s;
  - −14 LUFS, true peak ≤ −1 dB;
  - shots ≤ 9 s unless animated (≤ 13 s).

## Setup on a new machine (cloud or local PC)
Follow `studio/SETUP-CLOUD.md` (Kokoro and ASR weights from GitHub releases; the steps apply to a local PC too), then:
```
pip install opencv-python onnxruntime scipy soundfile numpy pillow playwright yt-dlp && python -m playwright install chromium
```
Before the first render, verify each of these and fix any that fail:
```powershell
python --version
ffmpeg -version            # must be on PATH
yt-dlp --version
python -c "import cv2, onnxruntime, scipy, soundfile, numpy, PIL, playwright"
python build/proof/render_proof.py        # short test render, run from the episode folder
```
On Windows, native Python works, and so does WSL. If paths break, search `build/` and `studio/` for the old cloud path `/home/claude/`.

## What's next
Build `videos/ep01-tally-sticks/VISUAL-UPGRADE-PLAN.md`:
1. living plates wired into `render.py`;
2. depth maps and effect settings for all pictures;
3. a cue-driven SFX track (~45 events);
4. **on this PC you can download the Pexels / Commons / CC BY YouTube clips and the Sonniss SFX directly** (verify each licence page, snapshot the terms, add ledger rows);
5. reconstructions (knife cut, split, flue cross-section, fire front);
6. cut repetition.

Then re-render, run the gates, do a second fact pass on anything new, and update `STATE.md`.
