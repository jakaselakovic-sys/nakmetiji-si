---
name: "molinae-visual-production"
description: "Visual production for Molinae music videos and DJ set videos — creative direction, footage curation, music-driven editing, psychedelic and environmental effect design (OEV/CEV), rendering, unattended long-run orchestration, cache-key and partial-re-render discipline, and quality control. Use when starting or continuing any Molinae visual project: set videos, track visuals, short-form cuts, thumbnails, or any video built from music plus footage. Also use for environmental psychedelic effect design on real footage — material-bound geometry, symmetry systems, temporal coherence, intensity progression — and for the UNDERSTORY and PSYTECH set video projects."
---

# Molinae Visual Production

Workflow for building Molinae visuals — set videos, track videos, short-form,
artwork. Derived from three completed projects: a 78-minute hi-tech set from 4K
drone footage; UNDERSTORY, a 61-minute one-shot from iPhone HEVC; and PSYTECH, a
61-minute flowing-contour treatment rendered from a corrected DaVinci Resolve
master. Failures are recorded as carefully as successes.

## How to read this

Findings are marked by how much they are trusted:

- **[PROVEN]** — measured on real material, safe to apply generally.
- **[MOLINAE]** — an identity decision, not a technical fact. Applies to this
  artist; do not export it elsewhere.
- **[ONCE]** — observed on one project only. Worth checking, not obeying.
- **[UNTRIED]** — reasoned through but never executed. Do not trust it.

Do not convert an accidental decision into a rule because it happened to work.
The same applies to a plausible diagnosis: if it has not been isolated against
a control, it is a hypothesis, and labelling it [PROVEN] makes the next person
trust something that may be false. One entry in §4 had to be demoted for
exactly this reason. One was promoted from [ONCE] to [PROVEN] because the same
note arrived, in the same words, on a second project.

---

## 1. Identity

**"Molinae explores consciousness through sound."** One long-term artistic
universe, not a channel or a folder of psychedelic clips.

**[MOLINAE] Character:** dark, cinematic, organic, futuristic. Mysterious,
intelligent, scientific. Emotionally intense. Precise, but capable of controlled
chaos. Original rather than trend-driven. Restrained rather than influencer-like.
Roughly 70% mysterious, 20% scientific, 10% personal.

**[MOLINAE] Visual territory:** black and deep indigo; controlled acid-green
accents; restrained white. Microscopic nature, cells, biological structures,
neural networks, organic geometry, fractals, particles, liquid physics, strange
organisms. Consciousness, perception, time, complexity, transformation. The
tension between natural and synthetic systems.

**[MOLINAE] Palette anchors** (established v1, permanent):

| name | hex |
|---|---|
| Molinae Void | `#03040A` |
| Abyss Indigo | `#09091C` |
| Neural Indigo | `#17113F` |
| Dormant Biolume | `#557E32` |
| Biolume Acid | `#B7F52A` |
| Signal White | `#E7EEE9` |

Signal White must never reach pure `#FFFFFF`. No hue rotation — escalate by how
much of the frame the palette occupies, never by changing which colours exist.

**Never:** generic AI psychedelia, neon overload, rainbow spectrum, spiritual
cliché, stock cyberpunk, purposeless tunnel shots, complexity without meaning,
festival wallpaper, influencer branding, effects used because they exist.

**Each project should be recognisably Molinae while introducing a new visual
world.** The anchors are identity, not a template to repeat.

---

## 2. Retrospective from projects one, two and three

### What definitely worked

**[PROVEN] Contact sheets before any curation decision.** Three frames per clip,
tiled, labelled. Automatic aesthetic scoring ranked the misty autumn footage
*lowest* — mist suppresses green detection — and that was the most atmospheric
material in the project. Looking at the footage reversed the algorithm's verdict
on the best assets.

**[PROVEN] Rank-normalise the energy envelope.** Flat-mastered music sits near
0.8 of full scale throughout. Absolute loudness pinned 68% of a 78-minute set at
maximum visual intensity. Ranking each moment against the rest of the same piece
restores usable contrast.

**[PROVEN] Find a second musical dimension beyond loudness.** High-frequency
content correlated only −0.32 with loudness and moved far more. It drove cut
speed and effect character in ways loudness alone never could.

**[PROVEN] Hold one visual motif across a block of beats, not per shot.** One
primary motif per ~32 beats, with shots changing inside it, was the single
largest improvement in perceived quality.

**[PROVEN] Segment-per-process rendering.** One encoder invocation per shot,
joined by stream copy. Resumable after a crash, cheap to re-render part of, and
the only reason multi-hour jobs were survivable. On project two it also made a
**partial re-render** possible — see §4b, which is the highest-value single
technique in this document.

**[PROVEN] Atomic segment writes.** Render to `name.tmp.mp4`, then
`os.replace()`. A killed worker never leaves a partial file that later looks
complete. See §4b for how this interacts badly with naive globbing.

**[PROVEN] A static acceptance test on the render graph.** Checked structural
rules before any pixels were produced. Caught four regressions on project one
and five more on project two. Wire it into the launcher so it runs before any
worker starts.

**[MOLINAE] Reserving scarce material for specific moments.** Four minutes of
the strongest footage spent deliberately on drops rather than scattered.

**[PROVEN] The edited master is the timeline authority, not the camera original.**
On project three the DaVinci Resolve export carried the artist's cuts and the
removal of errors; the original iPhone footage is a recovery and reference asset
only. Processing the camera original by mistake happened, and produced a film
with the removed errors back in it. Corollary: never double-process already
treated footage, and keep video and audio mappings together when re-muxing.

**[MOLINAE, project three] Continuous music-locked colour movement beats palette
switching.** A hard palette change reads as a cut in a film that has none. The
approved solution was two independent, phase-continuous cycles — a 32-bar Signal
White to Biolume Acid cycle carrying lighter material, and a 24-bar Neural Indigo
to Dormant Biolume cycle carrying darker material — driven by accumulated beat
phase so both survive the tempo ramp. Molinae amber appears only as rare eased
bell pulses around major chapter transitions, capped at 18%. Never as a switch.

**[MOLINAE, project three] An adaptive contour/posterisation treatment keyed to
local luminance structure, not a fixed global grade.** The look is decided
per-region by what the image contains; a global colour grade was explicitly not
the approved direction.

### What definitely failed

**[PROVEN] Trusting automatic aesthetic judgement.** Every metric — focus,
exposure, "nature content" — was useful for *ranking within* a category and
actively wrong at deciding what was beautiful.

**[PROVEN] Per-pixel expressions in a hot path.** One filter expression measured
**33× slower** than its static equivalent and added six hours to a render before
anyone benchmarked it.

**[PROVEN] Aggressive parallelism at high resolution.** Three concurrent 4K
processes exhausted memory and killed 1315 of 1516 segments. Memory bandwidth,
not core count, is the limit at 4K. Project two hit the same lesson in a
different resource — see §4b, VRAM.

**[PROVEN] Any measurement taken on a sample rather than the whole file.** This
has now caused four separate failures across two projects: a spectral check at
the wrong sample rate; a peak measurement that under-read by 3.7 dB; and twice
on project two, a **disk projection built from three segments** — see §4b.

**[PROVEN] Progress counters that increment on failure.** Reported 100% complete
while most work was dying. A progress figure must count only successes. Project
two reintroduced this exact bug through a glob — see §4b.

**[PROVEN] Verifications that can only pass — and their twin, verifications that
can only fail.** Project two produced three instances in one week, all of them a
check aimed at the wrong quantity. They are catalogued together in §4b under
"Aim the check at the quantity that can actually be wrong", because the pattern
matters more than any individual bug.

**[PROVEN — promoted from [ONCE], it happened twice] Uniform low-intensity
passages read as dead.** Project one's client note: nothing should be untreated.
Project two's artist note on the finished film: *"the effects are weak to around
the 15th minute, then it's ok."* Both times the opening was technically clean
and perceptually absent.

On project two the cause was compounded and worth knowing in detail:

- the opening chapter had the lowest gain in the ladder (0.35 contour against
  0.72 for the first chapter that read), **and**
- that gain was multiplied by a ramp running from **literal zero** across the
  chapter's first 55%

so the film opened on completely untreated footage and did not reach even its
own low authority until 5:35 into an hour. Two individually defensible decisions
— "start restrained" and "ramp in" — multiplied into nothing at all.

**"Motion before geometry" does not mean "nothing at all first."**

**[PROVEN] The floor is what gets noticed, not the peak.** Every artist note
across both projects was about the weakest passage. Nobody has ever complained
that a peak was insufficient.

**[PROVEN] When the artist names a boundary, match the value on the good side of
it exactly — do not calibrate toward it.** Project two took three renders to fix
one opening: 0.35 with a ramp from zero, then 0.60 with a ramp from 0.45, then
finally the value that had been known to work since the first viewing. After the
first render the artist had already said the film read correctly from 16:00
onward. 16:00 was a chapter boundary; the chapter on its far side had known
values; copying them on the second attempt would have saved a full render and
half a day. **A boundary in an artist's note is a data point, not a vague
impression — find what changes there and take it literally.**

### What required unnecessary repetition

**[ONCE] Four complete renders on project one**, because most defects were only
discoverable by rendering. Every iteration cost 1.5–14 hours.

**[PROVEN] For effects-heavy work, prove the look with an unmistakable short
preview before committing to a full render — then preserve the approved
parameters exactly when scaling to the master.** Project three approved a v3
preview because it separated contour layers more clearly while keeping forest
detail; an abrupt-colour version and a milder version were both rejected on
minutes of preview instead of hours of render. A preview subtle enough to argue
about has not proved anything.

**[PROVEN] No fast preview loop existed.** The single biggest process failure of
project one, repeated on project two. Every creative idea cost hours to
evaluate, so changes were batched and their effects could not be attributed.
Three of project two's renders existed only because nobody could see a parameter
change without committing four hours to it. **This is the strongest argument for
the Resolve hybrid in §8.**

**[PROVEN] Analysis caches keyed loosely.** Adding a metric invalidated
everything, repeatedly. Project two had the opposite and far more dangerous
version — see §4b, cache keys.

### Technically correct but creatively weak

**[MOLINAE] Full-spectrum hue rotation.** Sophisticated, smooth, entirely
off-brand. Discarded after a full render.

**[MOLINAE] Kaleidoscope replacing the frame.** A true radial fold that
destroyed the footage — an abstract flower with no nature left in it. Blending
it *over* the straight shot at 30–55% kept both.

### Creatively strong but hard to produce reliably

**[ONCE] Liquid colour drip.** Depended on exact displacement-map handling — a
supposedly neutral map silently applied a 1-pixel shift for four renders.

**[PROVEN] Frame-accurate events on drops.** Effective, but frame indexing in
compositing filters is easy to get wrong by one. Verify against extracted
frames.

**[PROVEN] Structured glitch beats random noise.** Random noise reads as broken
equipment; banded, coherent displacement reads as designed. The difference is
entirely in the structure, not the intensity.

### Automate

Music analysis. Footage measurement. Shot-to-moment matching. Render
orchestration with resume. All verification — duration, coverage, colour, frame
counts, disk.

### Requires artistic approval

Which footage is acceptable at all. The palette. Chapter structure and emotional
arc. What happens at the biggest structural moment. How fast it should feel.
Whether a look is *this artist*.

**Delivery bitrate and CRF belong here too.** On project two a disk shortfall
made "just lower CRF 15 to 18" look like a technical fix, when it is a reduction
in exactly the fine contour detail the film was built from. Free the disk
instead; if that is impossible, put the tradeoff to the artist with the
measurement attached.

**An approved look is a fixed point.** When an artist signs off on a peak, do
not move it while fixing something else. Lift the chapters below it and leave
the global gains alone.

### Decide earlier next time

Identity constraints before generating anything. Whether there is enough
footage. Deliverable format and resolution. **Whether the disk can hold the
job.** **What is in the cache key.** The last two are five-minute decisions that
cost a day each when made wrong.

---

## 3. Workflow

### Stage 1 — Discovery

Establish from the music: total duration; tempo and whether it changes; sections
and transitions; energy curve; breakdowns, buildups, climaxes; recurring sounds
that could carry motifs; where continuity matters. Then: platform, format,
available time, hardware, storage.

**Never begin mass generation before understanding the music.** Verify what the
analysis can and cannot supply — on project one, downbeat detection was found
unreliable at 1.1% confidence before anything was built on it.

### Stage 2 — Creative brief

One page: central concept; emotional objective; visual world; relationship
between music and image; palette; contrast and brightness rules; texture, motion
and camera language; recurring motifs; forbidden motifs; level of abstraction;
continuity rules; planned evolution; final emotional destination.

**Show it for approval before expensive generation begins.**

### Stage 3 — Music and energy map

A timestamped map: chapter start and end; musical energy; emotional function;
visual intensity; dominant motif; motion speed; camera behaviour; colour
development; transition; whether the section needs continuity or can be
abstract.

Mark by ear anything the detector misses. On project one six of the most
important drops were hand-marked; the detector had found none.

### Stage 4 — Asset audit

Inventory and **look at** every asset. Contact sheets. Classify by hand into
families with intent. Identify scarce material and decide where it is spent.
Compute the coverage ratio; below about 1.2× expect visible repetition and say
so before starting.

**Establish which file is the authority.** If the artist has edited in Resolve or
any NLE, the exported master is the source of truth — see §2.

### Stage 5 — Build a preview loop first

**Before any full render.** A representative sample must be viewable in under a
minute. Without this, every creative decision costs hours and cannot be
attributed. Skipped on both projects; the most expensive process mistake made,
twice.

**Build it on the machine that will run the final render**, against the real
source. Note the resolution caveat: on project two, 720p was measured **not
look-faithful** for contour work — the 1080p contour is finer and more etched.
Use reduced resolution for pacing and structure; judge the look at delivery
resolution.

### Stage 6 — Edit

Derive shot lengths and placements from the music. Quantise to the musical grid.
Hold motifs across blocks. Prefer fresh material. Score for continuity across
joins — brightness especially.

### Stage 7 — Verify before rendering

Static checks on the whole plan: full coverage of the duration; every marked
event present; no asset over-used; structural rules satisfied.

**Also project the disk and check the cache key.** The two cheapest checks in
the project and the two nobody remembers to write.

### Stage 8 — Render

Segment-per-process, resumable, cached under a settings fingerprint. Progress
counts successes only. Failures retried under different conditions. **Refuse to
assemble an incomplete result.** Orchestration rules in §4b.

### Stage 9 — Verify the output

Duration against the authoritative source — **per stream, not the container**.
Frame count and rate. Colour tagging. Sampled frames across every chapter.

### Stage 10 — Delivery

Use the platform's documented standard format. Keep the master; make a separate
delivery encode — see §4, Delivery.

---

## 4. Technical reference

**[PROVEN] Measurement**
- Measure across the **whole file**, never a sample. This rule has been broken
  four times across two projects and cost something every time.
- Verify any transformation by differencing against the source.
- Benchmark before assuming cost.
- Know your measurement's noise floor before trusting a small difference.

**[PROVEN] Rendering**
- Per-pixel expressions are catastrophically slower than static parameters. A
  `pow` across 921,600 pixels became a 1024-entry lookup table with no visible
  difference.
- Timeline-gated filters cost nothing when inactive.
- Colour-convert *after* downscaling where the output is smaller than the source.
- Feathered masks carry no high-frequency information: compute at quarter
  resolution and upsample — 21 ms/frame became 2 ms.
- At high resolution, memory bandwidth limits parallelism, not cores.
- A Python effect stack is mostly single-threaded, so throughput scales with
  worker *processes*. Pin OpenCV to one thread each or they oversubscribe.
- **Throughput scales sublinearly with workers; measure the gain.** 4 → 6
  workers raised per-segment time from 638 s to 787 s under CPU contention:
  throughput improved 1.22×, not the 1.5× the worker count implied.

**[PROVEN] Source and environment**

- **Always `-nostdin` on every ffmpeg call, with stdin closed.** ffmpeg reads
  stdin for interactive commands and `q` quits. This produced two separate
  mystery failures on project two — a filter chain that "produced no stream" and
  a `0xC0000005` access violation — **and was the actual fix for crashes
  initially blamed on the codec.**
- **Identify codec, bit depth and colour metadata early.** HEVC Main 10 with
  Dolby Vision is not 8-bit H.264 and will behave differently somewhere.
- **[ONCE] `format=yuv420p` before vidstab filters.** Harmless insurance. Noted
  honestly: this was *hypothesised* as a crash cause and a controlled test later
  showed the command crashed neither with nor without it. Keep it; do not
  believe it fixed anything.
- **Probe hardware decode, never assume it.**
- **vidstabtransform consumes its transform file sequentially from frame 1** and
  has no idea the decoder was seeked, so a single global transform file cannot
  serve independently seeked segments — and segment 0 looks fine, which hides
  it. Detect per window instead. Verified at mean 2.06/255.
- **Do not write code that parses transform files.** Binary in some builds,
  ASCII in others.
- **Join segments through MPEG-TS, not MP4.** The concat demuxer with stream
  copy fails rewriting H.264 headers between MP4 parts. TS carries Annex-B
  natively, is a copy, and joins reliably. TS also has no end-of-file index, so
  an interrupted TS degrades gracefully where an interrupted MP4 does not exist
  at all — see §4b.
- **Write an explicit `duration` for every entry in the concat list.** See §4b.
- **Do not stream TS segments into the joiner to save disk.** See §4b.
- **Set the correct interpreter/library path explicitly** when a project keeps
  its own OpenCV or numpy build alongside the system one. Project three carried a
  `.python_libs` directory prepended to `sys.path`; forgetting it silently picked
  up a different build.
- Resolution is not a free parameter for an effect stack: every spatial value
  must scale with frame height, or changing resolution changes the look.

**[PROVEN] Music analysis**
- Track tempo locally; verify confidence before relying on any structural
  estimate.
- **Verify tempo across the whole file at fine resolution.** A set described as
  one tempo was two — 129.199 and 132.512 with a 14-second ride. The wrong grid
  drifted 11 bars by the end of the hour.
- Where tempo changes, drive oscillators by **accumulated phase**.
- Rank-normalise loudness on heavily compressed material.

**[PROVEN] Delivery**
- Check true peak, not sample peak.
- Prefer flat gain over dynamics processing — a limiter on limited material
  altered the waveform by 138%.
- Verify a gain change by inverse-gain null, not raw difference.
- Stream-copy the video when only the audio changes.
- **Adjacent-frame differencing cannot verify a segment join.** Render an
  overlap window continuously, render it again through the production segments,
  align by absolute timestamp and difference those.
- **If the effect is computed at a lower resolution than the delivery, say so.**
  Project three's practical path calculated the contour look at 1920x1080 and
  encoded directly to 3840x2160 HEVC at ~50 Mb/s (VBR, maxrate 65M, p7/hq) with
  audio stream-copied from the corrected master. That preserves the approved look
  and is **not** native-4K effects processing — disclose it rather than letting
  "4K" imply otherwise. For maximum quality, process natively at 3840x2160 or
  rebuild the look in Resolve/Fusion, accepting substantially longer render time
  and storage.
- **Keep the master and encode a delivery copy separately.** CRF 15 on
  high-detail foliage with an added contour layer, plus a one-second GOP,
  produced ~84 Mbps and a 37 GB hour. That is a correct master and an absurd
  upload. A single transcode off the finished file — no re-render — gives a
  normal delivery file. Check the GOP length too: a keyframe every second costs
  real bitrate and segment-per-process rendering already guarantees a keyframe
  at every segment start.

---

## 4b. Unattended long runs, cache discipline, and partial re-renders

Everything here is [PROVEN] and every item actually happened. Multi-hour renders
fail characteristically: **silently, while reporting health.**

### The cache key must cover everything that changes a pixel

The most dangerous item in this document, because it produces a wrong film that
passes every check.

On project two the fingerprint hashed the config dict only. The chapter tables —
per-chapter intensity ladder, chapter boundaries, per-chapter push limits, accent
windows — lived at module level and were **not hashed**. Changing an intensity
ladder invalidated nothing.

The render skips any segment whose output already exists. So a re-render after a
gain change would have **kept every old segment and rendered only the missing
ones**, producing one film containing two intensity ladders with a hard step
wherever the cache happened to be populated. Segment counts, duration and decode
validation would all have been clean.

- **Hash every table the effect stack reads.** If a value can change a pixel, it
  belongs in the key.
- **Verify by watching the key move.** After the fix the fingerprint changed and
  the launcher reported `0/117 segments already rendered`. That observation is
  the proof; the code change alone is not.
- Accept the cost: correct invalidation means a parameter change triggers a full
  re-render — unless you migrate, below.

### Partial re-render: migrate unchanged segments across a fingerprint change

**The highest-value technique in this document.** When an artist approves part of
a film and rejects another part, you do not have to re-render the approved part.

On project two the note was "perfect from 16 minutes onward, bland before it."
Only the first two chapters' gains changed. Segment boundaries derive from the
config and chapter *boundaries*, neither of which moved — so every segment
starting at or after the boundary renders to identical pixels under the new
fingerprint. 84 of 117 segments were **moved** into the new fingerprint's
directory and 33 were re-rendered. Four hours became seventy minutes, and the
approved 45 minutes stayed bit-identical rather than being reproduced and
re-judged.

Rules that make it safe:

- **Move, don't copy.** Same volume, so a rename is instant and costs no disk. A
  copy needs another full set you probably do not have room for.
- **Check the boundary-equality assumption, don't assume it.** The new plan must
  contain exactly as many segments as the old directory holds. If it doesn't,
  refuse — the assumption the whole operation rests on cannot be verified.
- **Test overlap explicitly.** A segment is changed if it *overlaps* the changed
  region, not if it starts in it. The segment straddling the boundary contains
  changed frames and must be re-rendered.
- **Refuse to run while a render is alive.**
- Delete the old directory afterward: it now holds only stale segments and dead
  TS copies, and the next assemble needs the room.

### Editing engine code mid-render

The assemble usually launches as a **fresh process** after the workers exit, so
it picks up whatever is in the file at that moment. A syntax error introduced
mid-render surfaces only after the last segment, having wasted the run's tail.

After any mid-render edit, run two checks: **does it still compile**, and **is
the fingerprint unchanged**. The second matters more — if an edit accidentally
moves the key, every segment rendered so far is orphaned into a directory
nothing will look at again.

### The orchestrator must prove work started

- **Worker exit codes are usually meaningless.** A worker that failed every
  segment still exits 0 if the return value is discarded. **Finished output on
  disk is the only truth.**
- **Failure prints are buffered; success prints often are not.** One project had
  `flush=True` on `[ok]` and not on `[FAIL]`, so a completely failing worker
  produced an empty log for 21 minutes. Run workers unbuffered.
- **Every long unattended run needs a check that its work *started*.** A run
  reported `0/12 workers finished` for 5.5 hours with no such check.

### A progress counter must count finished work, and globs do not

`len(glob("seg_*.mp4"))` also matches `seg_00003.mp4.tmp.mp4` — the temp file
written before the atomic replace. The count rose as workers *opened* outputs.

The run reported 3 → 8 → 16 segments in four minutes then sat at 16 for 27
minutes. **Nothing had completed.** Twelve workers all died on VRAM, and the
number went into the handoff document as real progress, where it survived a day.

- Temp names should not end in the real extension, **or** the counter must
  exclude them. Prefer both.
- Purge stale temp files at launch.
- Treat any number a counter prints as a published figure — it will be copied
  into documents and believed.

### VRAM, not RAM, is the concurrency limit for hardware decode

Twelve workers exhausted an 8 GB card: `Failed to transfer data to output frame:
-12`. Segments then fail silently because atomic writes leave no file at all.

- Scan worker logs for OOM markers in the first three minutes and abort.
- **Measure the ceiling.** Query the GPU during the real workload, divide free
  VRAM by measured per-worker cost, keep two workers in reserve. This gave 6 on
  a card where 12 had failed. Prefer an over-attributed per-worker figure —
  erring high is the safe direction.
- Check the CPU at the same time; more workers only help if both have room.
- Record which *resource* any inherited limit was about. A note reading "two
  concurrent processes maximum" was about system RAM and actively misled the
  next project.

### A launcher that cannot see another launcher is a loaded gun

A 12-worker run was written up in the past tense — "12 workers exhausted VRAM" —
which everyone read as "and then it stopped". **It had not stopped.** An hour
later it still held twelve CUDA 4K decoders. A second run was launched with 4
workers on top. Sixteen concurrent decoders took the GPU driver down and the
machine with it.

- **Enumerate running processes before launching and refuse if any are alive.**
  Provide `--force` for the operator who has checked personally.
- **Open run logs in append mode, never truncate.** Two launchers in `"w"` mode
  write at their own offsets into a file each has truncated, producing a log with
  one run's header, a block of NUL bytes, and another run's lines. The evidence
  eats itself exactly when it is needed.
- **Log the process id in the header.**
- The overlap was detectable from the log alone: a run whose header was 36
  seconds old reported `(57 min)` elapsed. **Impossible numbers in a log deserve
  more attention than plausible ones.**

### Project the disk from whole-film data, not from a sample

Measure bytes-per-second and multiply out, counting everything that coexists:

```
segments   28.9 GB
TS remuxes 28.9 GB   made during assemble, and kept
final mp4  28.9 GB
PEAK       86.7 GB   all three coexist
```

**That projection was 24% low**, because it measured the first three segments —
the film's opening, which is its *least treated* material and therefore its
cheapest to encode. The film came in at 35.72 GB and the segment directory at
41.3 GB against 29 GB projected. The same rule broken in §4 broke here, in the
project's own tooling. Sample from across the film, or from the busiest part.

Rendering alone would have fitted; the assemble tripled the requirement. Say so
*before* the render. The previous run's TS directory is regenerable and
reclaiming it releases a third of the requirement.

**On Windows, deleting to the Recycle Bin frees nothing** — it lives on the same
volume. Shift+Delete, or empty the bin, and then re-check free space rather than
assuming.

### Aim the check at the quantity that can actually be wrong

Project two produced **three** of these in one week. Individually they look like
sloppy bugs; together they are the single most repeated failure in this
document, and worth recognising as a category.

**1. A check that could not fail — wrong dimension.** Concat seams were tested
for frame count and muxer warnings. Five variants were tried and **all five
passed**, including the broken one:

```
target                    2677 frames   89.2333s
baseline                  2677 frames   89.1667s   <- -2 frames of timeline
-fflags +genpts           2677 frames   89.1667s
-avoid_negative_ts        2677 frames   89.1667s
explicit duration lines   2677 frames   89.2333s   <- correct
```

Without a declared `duration`, the concat demuxer derives each file's start
offset from the previous file's **last dts** rather than last dts plus one
frame, so every seam overlaps by a frame. No picture is lost — the frame count
is right either way — but the timeline is short by one frame per seam. Across
116 seams that is 3.87 seconds of picture drifting ahead of the music.
**Confirmed at full scale:** with explicit durations the finished 117-segment
film decoded clean, zero dts warnings across all 116 seams.

**2. A check that could not pass — wrong stream.** The length check compared the
**container** duration to the music within 0.05 s. On a correct 117-segment join
it reported +0.086 s and declared "DURATION IS WRONG — do not ship this file."
That is 2.59 frames: every segment is encoded to a whole number of frames, so
117 rounded durations land a couple of frames off. The tolerance was 1.5 frames,
which no correct render of that film could ever meet.

Measure the streams **separately**, because the container is just the longer of
the two and cannot say where an error lives:

- **audio must match the music to within a frame** — it is the authority, and
  real drift shows up here first
- **video must never be short** — short means lost picture
- **video a few frames long is inert** — trailing image after the music ends

Measured on the first correct assemble: audio −0.00 frames, video +2.59 frames,
all of it at the tail. Opposite problems, opposite responses; the container
number could distinguish neither.

**3. A check that could not fail — wrong units.** A disk-space guard compared
free space in **bytes** against a requirement in **gigabytes** and printed "fits,
with about 1513207727434 GB spare". It reached the right conclusion by luck and
would have printed "fits" for any disk however full.

**The general rule:** before trusting a green result, ask what a red one would
look like. If you cannot construct the failing case, the check is decoration.
And treat a unanimous pass across variants as evidence the criterion is wrong,
not that everything works.

### A file's size is not evidence that a file exists

**The most expensive single hour of project three.** A long render was
interrupted. A 6.33 GB MP4 was left behind and — because it was large, and
because the frames in it had genuinely been computed — was treated as a valid
preserved segment. It was not a file. MP4 writes its `moov` index at the end, so
an interrupted MP4 has no index at all: it is unseekable, undecodable and
unconcatenatable. The error surfaced only at final concatenation, **after the
remaining 43 minutes had rendered successfully**, wasting the entire recovery
run.

- **Never treat partial progress as reusable on the strength of its size.** Probe
  it: streams present, decodable, and reported duration matching the frames you
  believe are in it. Size is the one property a broken MP4 still has.
- **Long renders must be built from short, finalised, atomic segments.** A
  segment that has been `os.replace()`d into place after its encoder exited
  cleanly is a file. Anything a live encoder still owns is not.
- **Assemble through MPEG-TS**, which has no end-of-file index and therefore
  degrades gracefully — see §4, Source and environment.
- **Recover by re-rendering only the invalid interval**, not from the last known
  good byte offset.
- A single-process whole-film render with a `.partial` name and a checkpoint file
  is the tempting shortcut here, and it is what failed. If you use one anyway:
  check free space *before* starting, render to `name.partial.mp4`, rename only
  after a clean exit code **and** a successful probe, then verify duration, both
  streams, decode integrity, audio continuity, representative frames and
  black-edge events before calling it done.
- A resume checkpoint recovered from a log by regex is only as trustworthy as
  the bytes on disk it points into. Validate the file, not the number.

### An exact count is not evidence of an intact picture

To save 28.9 GB, TS segments were piped into the joiner instead of written. The
result was frame-exact *and* length-exact — and the demuxer logged `Packet
corrupt` at every seam, because byte-adjacent TS streams start mid-continuity.
It recovered every frame, which is precisely why the counts could not see it.

**Rejected.** Counting artefacts cannot detect damage *inside* an artefact, so
any tool output mentioning corruption disqualifies a variant regardless of the
counts. Recorded as tested-and-refused so it is not re-derived.

### Never overwrite an approved deliverable with an unwatched one

Write output to a name containing the fingerprint. The previous film was four
hours of work and approved-except-for-one-note; the new one had been seen by
nobody. They should coexist until someone chooses.

### Batch files, and any tool that rewrites what is running

- **`cmd.exe` tracks its position in a batch file by byte offset** and restores
  it when a `call :label` returns. With LF-only endings the restore lands short
  and the read position drifts until whole blocks are skipped — no error, no
  non-zero exit. One file drifted past its own worker-launch loop and reported
  `0/12` for 5.5 hours.
- **A linear batch file is immune** regardless of line endings. Keep launchers
  linear — no labels, no `call`, no `goto`.
- **Never let a repair tool rewrite the file currently executing it.** A
  line-ending fixer launched from a `.bat` converted that same `.bat` mid-run,
  shifted every subsequent offset, and cmd resumed mid-line. The tool written to
  cure the byte-offset hazard caused an instance of it.
- Consequence: **a result judged only by "it didn't error" may not have executed
  what it claimed.**

---

## 5. Working principles

**Look at the material.** Every automatic aesthetic judgement in project one was
wrong about the best assets. On project two, sixteen frames overturned three
assumptions the brief was built on — including that the footage was shot at dusk.

**Exercise the real path early.** Proxies hide the bugs that live in what you
proxied away. Every effect test on project two ran on 8-bit mezzanines, so the
real pipeline's failures stayed invisible until the full render — while a
collaborator working against the actual source hit them in minutes.

**A document is not a process. Verify live state before acting on it.** The worst
failure on project two — a machine crash — came from reading a handoff that
described a run in the past tense and never checking whether the processes were
alive. They were. Prose describes what someone believed when writing; a process
query describes what is true now.

**Distrust inherited numbers.** The same handoff carried "16/117 segments, all
valid" as settled fact. The real figure was 3. Re-derive state from the
filesystem before planning against it.

**Read the code that decides what to skip.** Two of project two's worst defects —
the tmp-counting glob and the incomplete cache key — were four lines each, in
plain sight, in files everyone had already run many times.

**Isolate before believing a diagnosis.** A crash was confidently attributed to
10-bit frames, a fix written, documented and recorded as proven — and a
controlled test later showed the command did not crash either way. The real
cause was an unrelated stdin problem fixed in the same change. **Change one
thing, or test the control.**

**Measure before believing — and check what you measured.** A confident
diagnosis about clipped highlights was wrong: measurement showed 0.01% of pixels
near the ceiling. The tone curve was the cause.

**Design the check so it can fail, in the dimension, stream and units that
matter.** See §4b. Three instances in one week.

**A code comment asserting a quality claim is not evidence.** Project two's
ladder carried the comment "the floor is now high enough that every chapter has
real geometry." The artist watched it and the first sixteen minutes were weak.
Comments record intent; only viewing records outcome.

**Own errors precisely.** Several problems were introduced by the attempted fix.
Saying which change caused what is more useful than apologising.

**A large file is not a finished file.** Project three lost a recovery run to a
6.33 GB MP4 with no `moov` atom. Probe artefacts; never infer validity from
`ls -l`.

**Watch the disk before it stops you.** Project the peak, not the total, from
whole-film data.

**Know when to stop rebuilding something.** A gesture rebuilt four times that
still lands on a named failure mode does not belong in the film. Record rejected
engineering the same way — a tested-and-refused note costs a paragraph and saves
an evening.

**Budget for three full renders.** Project one took four; project two took three
before the opening was right; project three lost one to a recovery that could not
be assembled. Most defects are only findable by rendering.

**Refuse to ship silently broken output.** Verification is not optional polish.

**Distinguish measurement from taste.** Automate the first completely. Never
automate the second — and notice when a resource constraint is quietly
presenting a taste decision as an engineering one.

---

## 6. Environmental psychedelic effects — OEV and CEV

Full detail in **Appendix A**; read it before designing any effect pass.

### Choose the family before touching a parameter

**OEV (open-eye visual)** — the viewer recognises the real environment *and*
perceives it as reorganised. The source stays the dominant reality and geometry
appears to live inside physical materials. Correct for real footage of a real
place.

**CEV (closed-eye visual)** — the geometry *is* the world. Full-field darkness,
neon line work, tunnels, entities, recursive depth, mandalas.

**[PROVEN] Importing full-strength CEV composition into an OEV request is a
category error**, and the single most common way environmental work fails.

### Geometry is discovered inside texture

Detailed regions support repetition; **flat sky, blank walls and smooth surfaces
expose procedural overlay immediately.** Gate everything through a feathered
texture/edge confidence map. Any effect applied full-frame reads as a
screen-space filter no matter how well built.

**But gating is not enough where material is all edge.** Forest litter is
entirely edges, so a contour pass gated only by texture covered 79% of the frame
and saturated 42% — the layer stopped marking the image and started replacing
it. Threshold the edge map so only real edges register, and cap the total blend.

### Three spatial scales, one dominant at a time

**Macro** camera drift, optical push, breathing, global pulse · **Meso** local
bilateral symmetry, dihedral rosettes, repeated structures · **Micro** crawling
contours, fine tessellation, etched filigree, narrow chromatic fringes.

At Level 2–3 OEV, **micro carries the most weight**. Large mandalas must be
local, temporary and subordinate.

### Material awareness

Segment into sky, distant terrain, dense organic texture, water/reflective,
subject, fixation object; give each different behaviour. Sky gets near-zero
displacement and no hard geometry, ever.

**Sky protection applies to tonal operations too.** A hard clip boundary is
synthetic structure — relax highlight hardening toward a soft shoulder wherever
the sky mask is confident.

### One master clock

Derive displacement, geometry contrast, colour energy and camera motion from a
single clock of a few slow non-identical oscillations with small phase offsets.
Bands: **0.15–0.30 Hz** drift, **0.35–0.50 Hz** breathing, **0.7–1.0 Hz**
secondary.

**[PROVEN] Derive the clock from the music's own tempo.** At 129.2 BPM, 8/5/3
beats gave 0.2692 / 0.4307 / 0.7178 Hz — one per band, pairwise coprime,
recombining only every 30 bars. This couples picture to music at the substrate
level rather than only at cut points. Carry phase across any tempo change.

**Stepped versus continuous.** Quantise *decisions* to the beat grid — cuts,
layer switches, motif changeovers. Let *substrate* run continuously —
displacement, breathing, optical push, contour envelope, **and colour cycling**.
Grid-quantising everything produces machine-like stepping with no life in it.

### Intensity progression

Motion before geometry, always.

```
clean → optical breathing → edge enhancement and narrow colour separation
→ fine patterning in detailed materials → local meso symmetry
→ brief peak with several compatible scales → meso recedes
→ micro and colour release → ordinary footage with continuing motion
```

**Recover by reversing the build.** Large geometry first, micro next, breathing
lasts longest.

**Escalate by technique count, not only by gain.** Once a mid-film gain is close
to the peak, raising everything flattens the arc. Introduce new behaviours late
— persistence, then geometry, then everything.

**But do not let "start restrained" multiply into "start absent."** See §2. Ramp
from a fraction of chapter authority, never from nothing — and if an artist says
a later section reads correctly, copy that section's values rather than
approaching them.

**Ending: de-process rather than stop.** Project three smoothstepped effect
authority from 1.0 to 0.0 across the last ~49 seconds so the final eight bars
play exactly as edited. A hard cut to clean footage at the end reads as a bug.

### Motion and effect gain must be separately controllable

**[PROVEN] Increasing overall intensity must never disturb approved camera or
surface motion.** Wiring both to one control reproduces "everything got messier
when I asked for stronger visuals".

### Named failure modes

| failure | correction |
|---|---|
| Complete fractal replacement — scene disappears, generic CEV | preserve object boundaries, depth, lighting, stable regions |
| **No readable geometry** — repetition invisible because neighbouring textures share colours | reinforce repeated contours with an edge pass; inspect at normal playback size |
| **Contour layer replaces the image** on all-edge material | threshold the edge map, cap total blend |
| **Opening reads as untreated** — lowest gain times a ramp from zero | ramp from a fraction of chapter authority; lift the floor, not the peak |
| **Colour jolts** — palette changes as a step | interpolate continuously on a music-locked cycle; reserve accents for eased bell pulses |
| Isolated circular portals | broaden material-aware integration, vary shapes, connect regions with contours |
| **Static geometry over moving footage** | share camera motion, displacement, pulse and phase. A held analysis map drifts out of register within three frames |
| Rigid full-frame lattice | bend it, clip to materials, modulate by source edges |
| Intensity raised by increasing all parameters | separate motion from symmetry, contour, geometry and colour gains |
| Uniform psychedelic colour grade | attach colour to contours and transformed materials |

**The low-contrast trap.** Dark, near-monochrome footage is where "no readable
geometry" is most likely and least visible in preview.

**The high-key trap is the inverse.** On bright material geometry becomes *too*
legible and reads as overlay.

### Colour language

Contour-attached opposed-hue separation is the *principle*; the specific hues in
reference work are not a licence. **[MOLINAE]** the legal version is two palette
anchors on contours only.

**Opposed means light against dark.** Two dark anchors on dark material produce
nothing readable; two near-equal weights on bright material turn the frame the
lighter colour. One anchor carries the field, the other is an accent.

**Let the two anchors themselves move, slowly and independently.** Project
three's approved scheme cycled the light anchor over 32 bars and the dark anchor
over 24, from accumulated beat phase — so the film never repeats a colour state
exactly and never steps. Amber enters only as a capped, eased pulse at chapter
transitions.

### Bleached is high contrast, not low

**[PROVEN]** Build overexposure as an S-curve: highlights driven up hard,
shadows crushed *down* toward the darkest anchor, midpoint held. A gamma lift
with a raised black floor produces milk — no blacks, no depth — and takes the
texture the geometry depends on with it. Desaturate by luma so the blown band
goes neutral while shadows keep their colour.

### The digital look, specifically

**[PROVEN, project two]** What made UNDERSTORY read as a machine rather than a
graded nature film was five decisions, not one effect:

1. **Quantised re-metering.** Exposure moves in discrete steps — 12 per stop,
   0.62 stops of authority — instead of drifting. This reads as an algorithm
   making decisions rather than a colourist making choices. Nobody consciously
   notices it and it does most of the work.
2. **A hard clip boundary instead of a film shoulder.** Knee at 0.70, ceiling at
   0.925 luma, nothing at pure white. Film rolls off; sensors clip.
3. **Colour on contours only.** Edge-detection output composited over the world
   is literally what machine vision looks like. Never global aberration.
4. **Geometry only where texture confidence is high.** The machine elaborates
   where it has data. This is what makes effects diegetic rather than applied.
5. **Persistence** — classifications outliving their evidence, short decay,
   gated to material.

**The question that keeps it honest: "is this something a vision system would
plausibly do?"** It rules out most of what makes psytrance visuals generic —
datamosh, VHS artefacts, random glitch, full-frame aberration — and converts
parameter choices into story choices.

### Before rendering

Staged previews at **early, rising, peak, falling and recovered** timestamps,
compared against the clean source. Render only after approval. Then
decode-validate the encoded output and inspect frames extracted from the final
file.

**The early preview is the one that gets skipped and the one that matters.**
Both projects shipped a full render before anyone saw the opening at delivery
quality, and both got the same note back.

---

## 7. Worked example — UNDERSTORY (project two)

A 60:43 psytech set video: machine POV, one continuous handheld iPhone 4K60 take
walking through summer forest, environmental OEV throughout.

**Measure the music before designing anything.** Whole-file analysis found true
peak at +1.4 dBFS (would have clipped on encode), loudness +0.925 correlated
with low-band energy and therefore useless, and HF ratio with 6.4× spread as the
only dimension worth driving effects from. It also found the tempo was not
constant.

**When the music has no arc, the picture must supply one.** Novelty segmentation
found no boundaries anywhere in the hour and ten kick-returns scored identical
maximum lift. The response was to give the film a subject — a machine whose
cognitive state degrades and then lets go — so the chapters had something real
underneath them.

**Let the location force the structure — but verify it.** The plan assumed the
walk moved monotonically from closed canopy to open field. Measurement showed
texture flat at 0.98–1.00 for fifty-seven minutes. The real structure was
better: the walk breaks cover twice and returns, giving two false arrivals
before the real one.

**Find the concept that makes effects diegetic.** Once the POV was a machine,
every treatment had to answer "is this something a vision system would plausibly
do?"

**A one-shot changes the engineering.** With no cuts, novelty must come from
optical attention, speed and effect progression, and every parameter must be a
pure function of absolute timeline time — or segment boundaries become the only
discontinuity on screen.

**The first complete render is a draft whose job is to be watched.** It produced
one note — the first fifteen minutes were weak — worth more than every parameter
discussion preceding it. Acting on it also exposed the cache-key defect, because
it required changing a table nobody had ever changed.

**The opening took three renders and should have taken two.** 0.35 with a ramp
from zero; then 0.60 with a ramp from 0.45; then finally COLONISATION's own
values, flat, no ramp. The artist had identified the boundary — "perfect from 16
minutes onward" — after the *first* render. See §2.

**The third pass was a partial re-render.** 84 segments moved, 33 re-rendered,
seventy minutes instead of four hours, and the approved 45 minutes stayed
bit-identical. See §4b.

**The last stretch of a long project is orchestration, not art.** By the time the
look was approved, every remaining failure was a rendering or bookkeeping
failure: a lying progress counter, a launcher blind to another launcher, a
concat list missing durations, a disk projection nobody had run, a cache key
that would have shipped two films spliced together, and three checks aimed at
the wrong quantity. Budget attention for this phase.

---

## 7b. Worked example — PSYTECH (project three)

A 60:43 set video built as a flowing contour treatment over forest footage,
delivered at 4K HEVC.

**The Resolve master was the authority.** The artist had already cut and
error-corrected in DaVinci; the camera original existed only for recovery. This
inverted the previous projects' assumption that the raw source is the ground
truth, and processing the original by mistake put the removed errors back in.

**The look was adaptive, not graded.** Contour/posterisation derived from local
luminance structure, gated by texture confidence and sky mask, thresholded and
capped so the layer marks the image rather than replacing it — the §6 failure
mode project two had already found on all-edge forest litter. Opposed light and
dark contour offsets, rescaled whenever their sum exceeds the cap.

**Colour flowed instead of switching.** Two coprime, phase-accumulated cycles —
128 beats light, 96 beats dark — plus amber bell pulses around chapter
transitions capped at 18%. Phase carried across the tempo change at the chapter
boundary (1.8576 s/bar before, 1.811157 s/bar after).

**The film de-processes rather than stopping.** Authority holds at 1.0, then
smoothsteps to zero over the last ~49 seconds so the final eight bars play
exactly as edited in Resolve.

**Preview proved the look before the render.** Three candidate treatments; v3
approved because contour separation was unmistakable while forest detail
survived. Its parameters were carried to the master unchanged.

**The delivery path was honest about itself.** Effects computed at 1080p,
encoded straight to 2160p HEVC ~50 Mb/s with audio copied from the master.
Approved look, not native-4K processing, and stated as such.

**The failure was orchestration, again.** A whole-film single-process render with
a `.partial` file and a log-derived resume checkpoint. An interruption left 6.33
GB with no `moov` atom; it was believed valid because it was big; the 43-minute
remainder rendered fine and the concatenation then failed on the half that had
never been a file. **Third project in a row where the last defect was
bookkeeping, not picture.** See §4b.

---

## 8. DaVinci Resolve — [UNTRIED] plan for the next project

Reasoned through at the end of project two, **never executed**. Treat as a
hypothesis to test, not a recipe. Project three raised the stakes: Resolve is now
where the authoritative edit already lives, so the round trip out to Python and
back is itself a cost.

**Why consider it at all:** the most expensive repeated failure across both
projects is the absence of a fast preview loop. Resolve's viewer solves that for
free, and three of project two's renders existed only because nobody could see a
parameter change without committing four hours.

**Likely better in Resolve.** The grade — the bleached S-curve, the hard clip
with its knee and ceiling — is a custom curve plus wheels, judged live, with
scopes that *show* nothing touching 255 instead of measuring it in code. Sky and
material segmentation via Magic Mask and depth map should beat a hand-rolled
blur-and-threshold texture map. Contour work is a small Fusion graph: edge detect
→ threshold → dilate → colour with two palette anchors → merge at capped
opacity. HEVC 10-bit Dolby Vision is handled natively, which would have avoided
several hours of decoder crashes.

**Likely worse or awkward.** Band-split stabilisation — keep below ~1.15 Hz
because that is body sway, remove above because that is jitter, feed the residual
to the effects — has no direct equivalent. Persistence needs frame feedback and
Fusion resists it. Quantised re-metering needs a per-frame luminance measurement
fed back through a `floor()`, which has no clean path.

**Missing entirely.** Tempo-locked automation: phase-accumulated oscillators at
musical subdivisions, carried across a tempo ramp. Also gone: a fingerprinted,
resumable cache — there is no equivalent of "117 segments, rerun and it renders
only what's missing", which is the reason a machine crash cost nothing.

**The hybrid worth testing:** build the *look* interactively in Resolve, generate
the *automation* in Python exactly as now — beat grid, master clock, chapter
ladder, event list — and script it into the comp through Resolve's Python/Fusion
API as keyframes or expressions. Viewer and GPU for the look; reproducibility and
cache discipline for the timing.

**The trap:** Resolve's OFX library offers Glitch, Analog Damage, Chromatic
Aberration. All produce the generic version — broken-equipment glitch rather
than designed structure, full-frame aberration rather than contour-attached
separation. Both are named failure modes in §6.

**Before committing a project to it,** rebuild one known passage — an approved
one — and compare against the existing render frame by frame. If the look cannot
be reproduced, that is the answer.

---

# Appendix A — Environmental psychedelic video effects, full reference

Design and engineering framework for psychedelic treatment of real footage.
A framework, not a preset, and not an instruction to recreate prior work —
analyse each new source independently.

---

## A1. Family and level come first

### OEV — open-eye visual

The viewer must **simultaneously recognise the original environment and perceive
it as unstable or geometrically reorganised.** Priorities, in order:

1. Scene recognition
2. Material-bound deformation
3. Temporal coherence
4. Geometry discovered in texture
5. Controlled chromatic contour energy
6. Selective stability of subjects, sky and horizon

### CEV — closed-eye visual

The geometry itself is the world. Source preservation is not a constraint.

### The category error

**Do not import full-strength CEV composition into an OEV request merely because
both are "psychedelic."** Use CEV material only as inspiration for topology,
cadence or restrained colour accents.

### Levels

**Level 1** almost neutral edge breathing · **Level 2** narrow warm/cool fringe,
fine patterning in detailed materials · **Level 3** visible contour energy, local
meso symmetry, cellular fields · **Level 4** full CEV. Environmental work usually
lives at Level 2 rising to Level 3.

---

## A2. Visual language families

**Symmetric Vision language.** High-detail materials — gravel, bark, roots, leaf
litter, dense foliage. Reorganises existing detail into local bilateral, dihedral
or radial order. Micro-repetition before large geometry. Important silhouettes
stay recognisable.

**Loka Vision language.** Organic, low-contrast morphing and architectural
pareidolia. Roots, caves, trunks, walls and shadows breathe or melt. Symmetry may
first appear in silhouette and negative space. Explicit ornament arrives late.

**Wooodfield language.** Fine woven, etched or engraved patterning emerges
*inside* material while large boundaries are preserved. Pattern colour cycles
locally without turning the image rainbow. **The family that survives being
subtle over long durations.**

**Cellular / posterised OEV.** Small glyphs, cells, eye-like units and liquid
contours across dense regions. The source stays visible through the field.

**CEV / Level-4.** Dark backgrounds, luminous topology, recursive tunnels,
mirrored entities, neon filigree, impossible depth. Never a default overlay.

---

## A3. Shared environmental grammar

### Geometry is discovered inside texture

Use a texture/edge confidence map to decide where geometry may become visible.
Geometry should be strongest where local spatial frequency, contrast or
segmentation confidence is high.

### Three spatial scales — one dominant at a time

**Macro:** camera drift or optical push, breathing perspective, slow lens bulge,
a global pulse shared by all effects.

**Meso:** local bilateral symmetry, dihedral rosettes, repeated roots or stones,
patterned borders and peripheral clusters.

**Micro:** crawling edge contours, fine tessellation, etched filigree, cellular
units, narrow chromatic fringes.

### Material awareness

| class | behaviour |
|---|---|
| sky / atmosphere | low displacement, **no hard geometry**, optional soft colour breathing |
| distant terrain or architecture | restrained symmetry, low-frequency displacement |
| dense foliage, granular organic | strongest micro-patterning, contour crawl, local repeats |
| water / reflective | flow-aligned displacement, reflection-aware repetition |
| faces and bodies | protect identity unless transformation is explicitly requested |
| central subject | usually more stable than the peripheral field |

Feather all masks generously. Hard geometry must never reveal rectangular or
oval compositing regions.

### Temporal coherence — one master clock

One clock, a few slow non-identical oscillations, small phase offsets. Bands:
**0.15–0.30 Hz** long drift, **0.35–0.50 Hz** slow breathing, **0.7–1.0 Hz**
secondary. What matters is that all layers appear coupled.

**Derive the clock from the music where there is music**, choosing subdivisions
that are pairwise coprime so the combined pattern takes a long time to recombine.
Drive them from accumulated beat phase so a tempo change does not reset them.

### Perceptual intensity progression

```
1. normal footage and camera motion
2. subtle optical breathing or surface displacement
3. edge enhancement and narrow colour separation
4. fine patterning becomes visible in detailed materials
5. local meso-scale symmetry appears in selected clusters
6. brief peak organisation with several compatible scales
7. meso geometry recedes
8. fine patterning and colour energy release
9. ordinary footage remains, often with continuing camera motion
```

**Motion exists before geometry, always.** Equally: stage 1 is a stage, not a
plateau — if it lasts minutes it reads as an unfinished film, not as restraint.
Stage 9 should be reached by a smooth ramp, not a switch.

---

## A4. Implementation blueprint

**1. Prepare the source.** Start from the authoritative edited master, not the
camera original. Preserve a clean colour-managed copy. Fix output dimensions and
frame rate. Stabilise only where instability conflicts with the effect — organic
handheld motion is often useful.

**2. Build analysis maps.** Edge magnitude, local texture energy or entropy,
material segmentation masks, saliency mask, optional depth and optical flow.
Feather generously.

**3. Surface displacement.** Combine two or more spatial waves or flow fields.
Modulate amplitude by material and depth. Keep within a few pixels at HD until
the strongest passage.

**4. Local symmetry.** Choose centre and orientation from scene structure. Mirror
or fold *source pixels*. Compress, bow or deform the axis so it isn't a perfect
digital mirror. Use several spatially separated fields.

**5. Source-derived dihedral geometry.** Convert to radius and angle, fold the
angle into a dihedral sector, optionally repeat radius, sample the source through
those coordinates. **Use the geometry's own edge map to expose the repeated
topology** — without it, similar foliage colours conceal the transform entirely.

**6. Fine tessellation.** Two wave families, phase bent by slower spatial noise,
crossings converted into thin cell boundaries, multiplied by texture confidence.
Low opacity, wide coverage. Organised surface detail, not a HUD.

**7. Contour energy.** Offset the source edge map slightly in opposite directions
for warm and cool channels. Restrict to detailed physical surfaces. Threshold the
map and cap the summed blend, rescaling both offsets together where the cap is
exceeded. **Never uniform chromatic aberration.**

**8. Composite in a light-aware space.** Linear-light or gamma-aware blending
beats naive byte-space interpolation. Preserve exposure and lighting direction.

**9. Unified camera motion.** Apply the final camera transform *after* the layers
combine, so footage and geometry stay locked.

**10. Recover cleanly.** Reverse the perceptual build. Large geometry disappears
before micro-patterning; subtle breathing remains longest. Ramp effect authority
to zero over seconds, never in a single frame.

---

## A5. Parameter relationships

- **Motion strength and visual-effect gain must be separately controllable.**
- Meso geometry opacity should be lower when its spatial scale is larger.
- Micro-pattern opacity can be lower because it covers more area.
- Edge colour rises near the intensity peak and recedes quickly afterwards.
- Sky protection stays strong unless the reference explicitly treats atmosphere.
- Different local fields share a master pulse but use phase offsets.
- **The most intense frame is not necessarily the most saturated frame.**
- **A per-chapter gain and a within-chapter ramp multiply.** Check the product,
  not the two factors separately — that is how an opening reaches zero.
- **Palette-cycle periods should be coprime** so the two anchors never lock into
  a repeating combined state.

---

## A6. Failure modes

**Complete fractal replacement.** → Preserve object boundaries, depth, lighting
and stable regions.

**No readable geometry.** → Reinforce repeated contours, add a restrained
geometric skeleton, and **inspect at normal playback size.** Most likely on dark,
low-contrast footage, where it is also least visible in preview.

**The contour layer replacing the image.** → Threshold the edge map, cap the
total blend.

**An opening that reads as untreated.** → Ramp from a fraction of chapter
authority; lift the floor rather than the peak.

**Colour that jolts.** → Interpolate the palette continuously on a music-locked
cycle; reserve accent hues for eased, capped pulses at structural moments.

**Isolated circular portals.** → Broaden material-aware integration, add
surface-wide microstructure, vary geometry shapes.

**Static geometry with moving footage.** → Share camera motion, displacement,
pulse and temporal phase.

**Rigid full-frame lattice.** → Bend the tessellation, clip it to materials,
modulate by source edges.

**Intensity changed by increasing all parameters.** → Separate displacement and
camera controls from symmetry, contour, geometry and colour gains.

**Uniform psychedelic colour grade.** → Attach colour primarily to contours and
transformed materials.

---

## A7. Analysing a new reference

1. Confirm whether it is one work, a compilation or a montage.
2. Record duration, chapters, credits, transitions.
3. Sample the complete timeline at regular intervals.
4. Build denser contact sheets for long or visually diverse chapters.
5. Sample short sequences at ~1 fps to study accumulation and release.
6. **Separate camera motion from generated surface motion.**
7. Classify every technique by spatial scale, material dependency, symmetry
   family, colour behaviour, temporal cadence and compositing relationship.
8. Identify which techniques serve the user's source and which must be excluded.
9. Build previews at early, rising, peak, falling and recovered timestamps.
10. Compare against both the clean source and the reference.
11. Render only after preview approval.
12. Decode-test the complete output and inspect frames from the encoded file.

---

## A8. Quality-assurance rubric

- [ ] The original scene is instantly identifiable
- [ ] Motion exists before explicit geometry
- [ ] **The first minute is already treated** — restrained, but not absent
- [ ] Geometry is visible at normal playback speed during its peak
- [ ] Geometry follows physical materials and scene depth
- [ ] Several spatial scales coexist without fighting
- [ ] Central subjects and important silhouettes remain readable when intended
- [ ] Colour energy clings to contours rather than tinting everything uniformly
- [ ] Colour moves continuously — no step changes in palette
- [ ] There are no hard mask boundaries or floating overlays
- [ ] All effects appear temporally related
- [ ] The effect releases naturally
- [ ] The source processed was the authoritative edited master
- [ ] The encoded output plays and decodes without errors
- [ ] Frame count **and** per-stream durations match the authoritative source
- [ ] Every intermediate reused during assembly was probed, not judged by size
- [ ] The whole film was watched end to end before it was called finished

---

## A9. Working rules

- Start from the new source and desired intensity, never from a prior
  composition.
- Ask or infer whether the target is OEV, CEV or a controlled transition.
- Produce a source-specific effect plan before implementation.
- Preserve approved qualities; adjust only the dimensions requested — including
  when scaling an approved preview up to the master.
- Use staged previews and visual comparison, not parameter guessing.
- Prefer source-derived structure over imported generic fractals for OEV work.
- Keep motion, geometry, colour and intensity independently controllable.
- **Never claim perfect replication when the source lacks the depth, motion or
  information the reference required.**
- **State the processing resolution when it differs from the delivery
  resolution.**
- Deliver both the result and a reusable, clearly documented implementation.

