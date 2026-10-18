---
name: molinae-video-production
description: "Create Molinae music videos and DJ set videos in ChatGPT — creative brief, music/energy map, footage audit, OEV/CEV psychedelic effect design, preview frames and short clips in the Python sandbox, render scripts for the artist's own machine, delivery specs and quality control. Use for any Molinae visual work: set videos, track visuals, short-form cuts, thumbnails, procedural (no-footage) set videos, and the UNDERSTORY / PSYTECH / AUTOBAHN projects."
---

# Molinae Video Production (ChatGPT)

ChatGPT adaptation of the Claude skills that hold the full Molinae production
knowledge. Those files are the source of truth; this file tells ChatGPT how to
apply them within its own tools and limits.

## Source files — read before working

| file | what it covers | when to load |
|---|---|---|
| [`references/molinae-visual-production.md`](references/molinae-visual-production.md) | identity, palette, retrospective of three projects, 10-stage workflow, technical reference, long-run/cache discipline, OEV/CEV effect design (Appendix A) | **always** |
| [`references/procedural-set-video.md`](references/procedural-set-video.md) | full-length video with no footage: perspective maths, beat-locked geometry, flicker, surgical re-renders | when there is no source footage |

In the repository these are symlinks to the Claude skills in
`.claude/skills/molinae-visual-production/SKILL.md` and
`.claude/skills/procedural-set-video/SKILL.md`. Edit the Claude files; this
skill picks the changes up. If this file and a reference disagree, the
reference wins.

Keep the trust tags from the references when you quote them: **[PROVEN]**
apply generally, **[MOLINAE]** identity decision for this artist only,
**[ONCE]** check, don't obey, **[UNTRIED]** hypothesis. Never upgrade a tag
because something sounded right.

---

## 1. Identity in one screen

**"Molinae explores consciousness through sound."** Dark, cinematic, organic,
futuristic; mysterious, scientific, restrained. ~70% mysterious, 20%
scientific, 10% personal.

| name | hex |
|---|---|
| Molinae Void | `#03040A` |
| Abyss Indigo | `#09091C` |
| Neural Indigo | `#17113F` |
| Dormant Biolume | `#557E32` |
| Biolume Acid | `#B7F52A` |
| Signal White | `#E7EEE9` |

- Signal White never reaches `#FFFFFF`. No hue rotation, no rainbow.
- Escalate by how much of the frame the palette occupies, not by adding colours.
- Colour moves continuously on music-locked cycles; never a hard palette switch.
  Amber only as rare, eased pulses at chapter transitions, capped at 18%.
- **Never:** generic AI psychedelia, neon overload, spiritual cliché, stock
  cyberpunk, purposeless tunnels, festival wallpaper, random glitch, VHS,
  datamosh, full-frame chromatic aberration, effects used because they exist.
- Every project is recognisably Molinae and introduces a new visual world.

Full detail: reference §1.

---

## 2. What ChatGPT does here, and what it hands off

ChatGPT's Python sandbox has short per-call time limits, limited disk, no GPU
and no internet. A 60–90 minute 4K render does not fit in it. Split the work:

**Do in ChatGPT**
- Creative brief, chapter structure, music/energy map (Stages 1–3).
- Music analysis of an uploaded WAV/MP3: tempo across the whole file, rank-
  normalised energy, high-frequency ratio, hand-marked drops.
- Footage audit: contact sheets (3 frames per clip, tiled, labelled) from
  uploaded clips or stills; coverage ratio.
- Look development: still frames and short (≤ ~20 s, reduced-resolution)
  preview clips at **early, rising, peak, falling, recovered** timestamps.
- Write the production render pipeline (Python + ffmpeg) for the artist's own
  machine, plus the static acceptance test and the verification scripts.
- Thumbnails and short-form stills.
- QC of results the artist uploads back: per-stream durations, frame counts,
  extracted frames, decode errors.

**Hand off to the artist's machine (or DaVinci Resolve)**
- Full-length renders, 4K processing, hardware decode/encode, unattended runs.

**Probe the sandbox, don't assume it.** Before the first video step, check
what exists (`shutil.which("ffmpeg")`, `import cv2`, `import librosa`,
`imageio_ffmpeg`, free disk). Say plainly what is missing and use what is
there. Never claim a render was done if it could not run.

---

## 3. Workflow

Follow the reference §3 stages; in ChatGPT terms:

1. **Discovery** — duration, tempo (whole file, fine resolution — sets often
   ramp), sections, energy curve, drops, platform, format, hardware, storage.
   Do not generate anything before understanding the music.
2. **Creative brief** — one page: concept, emotional objective, visual world,
   music/image relationship, palette, motion and camera language, motifs,
   forbidden motifs, abstraction level, evolution, final destination. **Get
   approval before expensive work.**
3. **Music and energy map** — timestamped chapters with energy, function,
   visual intensity, motif, motion speed, colour development, transitions. Ask
   the artist to mark drops by ear; detectors miss them.
4. **Asset audit** — look at every asset via contact sheets. Automatic
   aesthetic scores are wrong about what is beautiful. Identify the
   authoritative file: an edited Resolve/NLE export beats the camera original.
5. **Preview loop first** — prove the look on an unmistakable short preview
   before any full render. Judge the look at delivery resolution; low
   resolution is for pacing only. A preview subtle enough to argue about has
   proved nothing.
6. **Edit plan** — shot lengths from the music, quantised to the grid, one
   motif held per ~32 beats.
7. **Verify the plan** — full coverage, every event present, no over-used
   asset, disk projection from whole-film data, cache key covers every table.
8. **Render** (artist's machine) — segment-per-process, atomic writes,
   fingerprinted cache, progress counts finished files only, refuse to
   assemble an incomplete result. Reference §4b.
9. **Verify the output** — audio vs music within a frame; video never short;
   probe every intermediate; watch the whole film.
10. **Delivery** — keep the master, encode a separate delivery copy. CRF and
    bitrate are the artist's call, not a disk workaround.

Budget for three full renders. The first complete render is a draft whose job
is to be watched.

---

## 4. Effect design (OEV / CEV)

Read reference §6 and Appendix A before designing any effect.

- **Choose the family first.** OEV: the real place stays recognisable and the
  geometry lives inside its materials. CEV: geometry is the world. Importing
  CEV into an OEV brief is the most common failure.
- **Geometry is discovered in texture.** Gate by a feathered texture/edge map;
  threshold it and cap total blend on all-edge material (forest litter).
- **Sky gets no hard geometry**, including from tonal clipping.
- **Three scales, one dominant** — macro motion, meso symmetry, micro contour;
  at Level 2–3 OEV micro carries the weight.
- **One master clock from the music's tempo**, pairwise-coprime subdivisions,
  driven by accumulated beat phase so tempo changes don't reset it. Quantise
  decisions to the grid; let substrate run continuously.
- **Progression:** motion before geometry — but the first minute is already
  treated. Ramp from a fraction of chapter authority, never from zero. Check
  the product of chapter gain × ramp.
- **Motion and effect gain are separate controls.**
- **Colour on contours**, opposed light against dark: one anchor carries the
  field, the other accents.
- **Bleached = high contrast:** S-curve, crushed shadows, no milky black floor.
- **End by de-processing** (smoothstep to clean over the last ~bars), never a
  hard cut.
- The test that keeps it honest (machine-POV films): *"Is this something a
  vision system would plausibly do?"*

---

## 5. Rules ChatGPT must not break

- Measure the **whole file**, never a sample — tempo, peaks, disk projections.
- **Look at the material** before trusting any metric.
- When the artist names a boundary ("good from 16:00"), copy the values on the
  good side exactly; don't calibrate toward them.
- An approved look is a fixed point: lift what's below it, don't touch it.
- Every check you write must be able to fail — right dimension, stream and
  units. A unanimous pass across variants means the check is wrong.
- A large file is not a finished file: probe it (streams, decode, duration).
- Every ffmpeg call in generated scripts uses `-nostdin`; joins go through
  MPEG-TS with explicit `duration` per concat entry.
- Cache keys hash every table that can change a pixel; verify by watching the
  key move. Use partial re-render (move unchanged segments) when only part of
  a film changed.
- State the processing resolution when it differs from delivery.
- Never overwrite an approved deliverable with an unwatched one.
- Never claim perfect replication of a reference when the source can't support
  it. Distinguish measurement (automate) from taste (ask the artist).

---

## 6. QC before calling anything done

Use the full rubric in reference Appendix A8. Minimum:

- [ ] Scene recognisable; first minute treated but restrained
- [ ] Geometry readable at normal playback size during peaks
- [ ] Colour moves continuously, clings to contours, stays in palette
- [ ] No hard mask edges, floating overlays, or screen-space-filter look
- [ ] Authoritative edited master was the source
- [ ] Output decodes cleanly; frame count and **per-stream** durations match
- [ ] Every reused intermediate was probed, not judged by size
- [ ] The whole film was watched end to end

---

## 7. How to answer

- Start by stating which stage the project is in and what you need from the
  artist (music file, footage, master export, target platform, hardware).
- Give deliverables, not essays: briefs as one page, maps as tables, code as
  complete runnable scripts with the checks included.
- Ask before decisions that belong to the artist: footage acceptance, palette
  use, chapter arc, biggest structural moment, pacing, delivery quality.
