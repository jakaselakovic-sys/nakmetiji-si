---
name: procedural-set-video
description: "Building a full-length music video procedurally — no footage, no 3D engine, just perspective maths and the music. Use for synthesised long-form visuals, beat-locked geometry, music-driven parameters, and surgical re-renders of a finished film."
---

# Procedural set video

Building ninety minutes of coherent picture out of nothing but a WAV, numpy and
perspective arithmetic. Derived from AUTOBAHN / 200: a 1:30:57 FPV night drive
for a hi-tech psytrance set, 163,725 frames at 1920x1080, generated with no
source footage and no 3D engine.

This is the sibling of `molinae-visual-production`, which covers projects built
from real footage. **Load that one too** for identity, palette, unattended-run
orchestration, cache-key discipline and delivery. This file covers only what is
different when there is no footage: making the picture itself, and changing it
after the film is finished.

## How to read this

Same trust tags as the sibling skill:

- **[PROVEN]** — measured on real material, safe to apply generally.
- **[ONCE]** — observed on one project only. Worth checking, not obeying.
- **[UNTRIED]** — reasoned through but never executed. Do not trust it.

A plausible diagnosis that has not been isolated against a control is a
hypothesis. Two entries below were demoted after measurement contradicted a
confident first explanation. Keep doing that.

---

## 1. Why procedural at all

[PROVEN] Offer it as a real option when the brief is a long, repetitive,
camera-continuous world — a drive, a flight, a corridor, a descent. Stock and
dashcam footage for ninety minutes is unobtainable, inconsistent, and cannot be
made to obey the music. Procedural generation gives you:

- every parameter locked to the audio, frame-exact, for the whole duration;
- perfect continuity, because there are no cuts to hide;
- the ability to change one thing after the film is finished and re-render only
  the seconds it touches.

The cost is that everything must be invented, including anti-aliasing.

---

## 2. The picture without a 3D engine

[PROVEN] A ground plane under a camera at height `h` with focal length `f`
needs no rasteriser. For a screen row `y` below the horizon row `y0`:

```
z  = h * f / (y - y0)                  # depth of that row
x  = (u - cx) * z / f                  # world x of that pixel
```

Precompute `z`, `x` and their derivatives once per camera. Everything —
markings, surface texture, reflectors, barriers — becomes an arithmetic
expression over two arrays. A 1080p frame is a handful of numpy ops.

[PROVEN] **Force float32 at the camera boundary.** `np.tan` returns float64,
and a single float64 scalar silently upcasts every derived array. That doubles
memory and halves speed for the entire render, and it will not show up as an
error — only as workers dying at high concurrency. Cast explicitly:

```python
self.f = float((H * 0.5) / np.tan(np.radians(fovy_deg) * 0.5))
f32 = np.float32
self.z = f32((self.h * self.f) / (yy - self.y0))
```

[PROVEN] **Anti-alias analytically, not by supersampling.** A dash pattern of
period `p` and mark length `m` sampled at position `s` with filter width `w`
has exact box-filtered coverage:

```python
def dash_cov(s, w, period, mark):
    def F(t):
        q = np.floor(t / period)
        return q * mark + np.minimum(t - q * period, mark)
    w = np.maximum(w, 1e-4)
    return np.clip((F(s + 0.5 * w) - F(s - 0.5 * w)) / w, 0.0, 1.0)
```

The filter width is the row's own depth extent. **Motion blur is the same
function with a wider filter** — add `speed * shutter` to the width and the
smear is exact and free. Supersampling would cost 4x for a worse result.

[PROVEN] Longitudinal lines (lane edges) need their own coverage function
against the per-row lateral scale, not the same one — a line is constant along
z and varying across x, the opposite of a dash.

[UNTRIED] Curved surfaces (banked road, crested hills) were never attempted.
The flat-plane inversion is what makes the whole approach cheap; a height field
would require solving per column and may not stay analytic.

---

## 3. Locking geometry to the music

[PROVEN] **Analyse the whole file, never a sample.** Tempo, accumulated beat
phase, RMS, sub and high-band energy, kick presence, drops and breaks, all at
analysis frame rate, saved once to an `.npz`. Everything downstream reads that
map. Re-deriving anything from the audio at render time is a correctness bug
waiting for a worker to disagree with another worker.

[PROVEN] **Beat-locked markings that survive a tempo ramp.** Do not place
dashes by distance. A point `z` metres ahead is *reached* at `t_at_dist(s0+z)`;
sample the accumulated beat phase there and every dash lands on a kick — and
keeps landing on it when the tempo changes, because the phase already carries
the change:

```python
pz  = ctx['phase_at'](ctx['t_at_dist'](s0 + z))
wph = (wz / ctx['speed']) * ctx['beats_per_sec']
pat = dash_cov(pz[:, None] * sub, wph * sub, 1.0, duty)
```

[PROVEN] **Variable speed needs the distance integral, not the speed.** Keep
`S(t) = ∫v dτ` and its exact inverse `t_at_dist(s)`. Every spatial thing in the
world is placed by distance and every temporal thing by time; the two functions
are the only bridge. Getting this right is what lets speed follow the music
without the markings drifting off the beat.

[PROVEN] **Drive intensity from measurement, not from a hand-written chapter
table.** A rank-normalised RMS over a ~90 s window gives a macro level that
tracks the actual set. A guessed table of chapter boundaries was tried first and
was wrong everywhere the DJ did something unexpected — which is most of a set.

[PROVEN] **Escalate by technique count, not by gain.** At higher intensity, turn
on more distinct treatments; do not turn the same one up. Gain escalation
saturates, clips, and reads as "brighter", which is not the same as "more
intense". Keep non-zero floors on the base treatments so the opening never reads
as untreated.

---

## 4. Scheduling anything the viewer watches move

[PROVEN] **Schedule in screen rows, not world metres.** This is the single most
transferable lesson of the project. With a 1.15 m camera and a 46° vertical
FOV, the ground 4 m ahead is ~370 px below the horizon and 40 m ahead is ~37 px.
A reveal that sweeps evenly in *distance* therefore spends nineteen of its
twenty seconds invisible near the horizon. Convert:

```python
def D_at(row):          # world distance for a screen row
    return h * f / max(row - y0, 0.35)
```

then animate the row linearly and derive the distance. The eye reads screen
position; the world coordinate is an implementation detail.

[PROVEN] The same mistake in miniature: a "leading edge" band defined with a
fixed width in metres floods the entire foreground when the front is close and
vanishes when it is far. Define it as a Gaussian in **rows** around the row that
corresponds to the front's distance.

[PROVEN] A gate that hides the world beyond distance D can never remove the
bottom row of the frame, because that row has a finite depth (~2.5 m here). If
the world must go completely, drive the row target *past* the bottom of the
frame (~1.4x frame height), not to it.

---

## 5. Text lying on the ground

[PROVEN] Text painted on a ground plane, seen from a low camera, is **only ever
large for an instant**. The geometry is unforgiving and worth doing on paper
before rendering anything. For a word of world width `w` and length `L` whose
near edge is at `z0`:

```
screen width  = f * w / z0
screen height = h * f * (1/z0 - 1/(z0+L))
screen aspect = w * (z0 + L) / (h * L)
taper (near:far width) = (z0 + L) / z0
```

To make it *look* like the artwork, set the aspect equal to the bitmap's own
aspect. That gives `w = aspect * h * (T-1)/T` for taper `T`. Taper 2 is what
real road stencils use; it forces the word to be surprisingly narrow (a 5:1
wordmark at taper 2 with a 1.15 m eye height is 2.9 m wide) and `L = z0`.

[PROVEN] Four attempts, in order, and why each failed — do not repeat them:

1. **Natural proportions (14 m long).** Legible for 0.3 s. Useless.
2. **Longer (68 m).** Big only in the last half second; small and near the
   horizon the rest of the time.
3. **Much longer (110 m).** Taper 5:1 — the vertical strokes splay into
   radiating lanes and the word is unreadable as a word.
4. **Correct aspect, held.** Taper 2, sized from the formula above, and *held at
   a fixed distance ahead* while the road streams beneath it, then released so
   the car runs it over. Legible for three seconds and still diegetic — it
   curves with the road and foreshortens correctly, it just does not drift
   until let go.

[PROVEN] Build the letterforms from thick line segments on a unit grid rather
than rasterising a font. It is deterministic on any machine, has no font
dependency, and stencil-like squared strokes suit machine-vision material. Round
caps on segments mean an `O` drawn as four overlapping strokes needs its
verticals spanning the full height, not inset, or the caps bulge past the bar.

[PROVEN] Keep painted colour well under the clip point. `ACID * 0.92 +
SIGNAL * 0.26` times a near-field falloff exceeded 1.0 in two channels and the
word blew out to yellow-white. `ACID * 0.62 + SIGNAL * 0.20` with the falloff
clamped to 1.0 stays acid green.

---

## 6. Flicker: diagnose before fixing

[PROVEN] **Measure flicker as a map, not a number.** Render ~20 consecutive
frames, take the mean absolute frame-to-frame difference per pixel, then reduce
to a coarse grid:

```python
a = np.stack(frames)                       # T,H,W  (luma)
d = np.abs(np.diff(a, axis=0)).mean(axis=0)
grid = d.reshape(6, H//6, 8, W//8).mean(axis=(1, 3))
```

This names the region instantly. On AUTOBAHN the user reported flashing "at the
bottom edges"; the map put it unambiguously in the top third at ~100/255 per
frame. Trust the map over the description of where it is, and over your own
first theory of what it is.

[PROVEN] **Aliasing and fast motion look identical in a still and need opposite
fixes.** The first hypothesis was temporal aliasing — the box filter narrower
than the per-frame motion. Widening the filter to a full frame of travel moved
the measurement from 106 to 104. It was not aliasing. The strips were genuinely
sweeping the frame about seven times a second, clipped to pure white. Correct
for 200 km/h, and a strobe.

[PROVEN] When the motion is real, the only lever is **contrast**, not the
filter. What worked, in order of effect: light the surface underneath so the
pattern modulates something instead of alternating with black; halve the
spatial rate so the temporal frequency halves; widen the mark duty; cut the
highlight gain below clipping. Combined: 106 → 40, and the image improved —
it reads as lit concrete with light panels rather than black with white bars.

[PROVEN] High-contrast full-width patterns between 3 and 30 Hz are a
photosensitivity concern regardless of whether they are physically accurate.
Treat a measured amplitude in that band as a defect to fix, and say so plainly
rather than defending the physics. If the user offers to accept a degraded
safer version, fix it properly first and only fall back if you cannot.

---

## 7. Making anything appear

[PROVEN] **Nothing may switch on.** A tunnel facade with a hard visibility
cutoff at 430 m replaced a large patch of sky with a near-black wall in a single
frame — a visible flash seven seconds before every tunnel, twelve times in the
film. Two changes fix it: extend the range well past where it is noticeable
(900 m) and **blend** rather than stamp:

```python
app = 1.0 - smoothstep(540.0, 880.0, d_a)   # presence
if app >= 0.998:
    np.copyto(img, colour_broadcast, where=mask)
else:
    np.copyto(img, img * (1 - app) + colour * app, where=mask)
```

Scale every associated element (rim highlights, marker lights) by the same
`app`, or the trimmings pop in while the wall fades.

[PROVEN] Detect this class of bug numerically: sample the mean frame-to-frame
difference across the approach and look for a step. A jump from 0.000 to 4.7 in
one 0.2 s interval is a pop, however subtle it looks in a still.

---

## 8. Symmetric structure (mandalas, rosettes)

[PROVEN] Build radial structure from the same noise the rest of the film uses,
not from drawn primitives. Mirrored wedge coordinates give N-fold symmetry with
a reflection inside each sector:

```python
a2 = np.abs(((N * (ang + rot) / np.pi) % 2.0) - 1.0)
field = tex[(r * k) % TN, (a2 * 620) % TN]
body  = smoothstep(0.66, 0.93, field)
```

[PROVEN] **Concentric rings alone are a printed target.** The first attempt was
a bullseye — geometrically symmetric, visually dead, and an instance of the
"rigid full-frame lattice" failure the sibling skill names. Fixes that worked:
wobble the ring radius by the noise field (`r/period + field * 0.85`), multiply
the rings by a second field so they break into arcs, drop their weight to a
third of the contour bands, and scallop the leading rim by the same field so it
is not a drawn circle.

[PROVEN] Two coprime radial scales and two different symmetry orders give depth.
One scale reads as a single printed layer.

[PROVEN] Compute the polar arrays once at half resolution and `np.repeat` the
result. Full-resolution `hypot` and `arctan2` per frame is the difference
between a 40 ms and a 120 ms frame.

[PROVEN] Growing structure to full frame does **not** have to flicker: measured
1–7 mean frame-to-frame change against the tunnel's 106. Smooth radius growth
plus contour bands that move with the field is inherently calm.

---

## 9. Changing a finished film

This is the part worth the most. A ninety-minute render is five hours; a
request to change the intro must not cost five hours.

[PROVEN] **Confine the change, then prove the confinement.** Before
re-rendering anything, render the same frames with the old and the new code and
diff them:

```python
a = old_renderer.frame(t, ctx).astype(np.int32)
b = new_renderer.frame(t, ctx).astype(np.int32)
print(np.abs(a - b).max(), int((np.abs(a-b).max(2) > 0).sum()))
```

Zero on frames outside the affected region is what licenses reusing the other
segments byte for byte. Do this on at least half a dozen frames spread across
the film, including ones near the boundary. It takes two minutes and it is the
difference between a confident splice and a film that is half one thing.

[PROVEN] **Make the joins exact rather than dissolved.** Design the change so
the last seconds before the splice point and the first seconds after it are
produced by unmodified code — taper every added parameter to identity before
the boundary. Then verify the boundary frames are pixel-identical to the
existing master. A cross-dissolve is the fallback when you cannot; an exact cut
is better and is usually achievable if you are willing to shape the schedule
around the segment grid.

[PROVEN] **Do not move a physical quantity if you can move a drawn one.** The
new intro wanted to "arrive". Changing the speed would have changed accumulated
distance and thrown every beat-locked marking out of phase at the splice.
Instead the car keeps its exact speed schedule and the *world is not drawn yet* —
an identical distance integral, a pixel-exact join, and a better idea.

[PROVEN] **Composite over the renderer, do not edit it.** Effects that only
exist in one region of the film belong in a subclass that calls the normal
pipeline and adds passes using the camera's own geometry. The base engine stays
untouched, so the segments that do not need the effect stay valid, and the
fingerprint of the untouched work does not move.

[PROVEN] **Compute the affected segment list, do not guess it.** Walk the
timeline at coarse resolution, ask the score whether the feature is in view, and
emit the segment indices. For twelve tunnels this gave 38 of 228 segments; hand
reasoning would have over-covered by a wide margin or missed the long approach.

[PROVEN] **Locate the base film by completeness, not by fingerprint.** Once the
engine changes, the current fingerprint no longer matches the folder that built
the existing master — which is the protection working. Find the segment folder
that contains a full set and read the fingerprint from its name. Correspondingly,
any cleanup step must refuse to delete a *complete* segment folder whatever its
fingerprint says; deleting five hours of render because a name did not match is
a real and easy mistake.

[PROVEN] **Locate the master by name and mtime, not by fingerprint,** for the
same reason — and because the spliced master carries a suffix.

[ONCE] **Code can be swapped under a running render, safely, if you prove it.**
A segment-per-process renderer imports the effect module fresh in each child.
Overwriting that module mid-run means every segment launched afterwards uses the
new code. This is only safe if you have shown that the frames already in flight
render identically under both versions — which is the same pixel-diff as above.
It saved an hour and a half of duplicated work. It would have split the film if
the diff had not been run first.

[PROVEN] **Gate the expensive tail of a pipeline behind a file.** When a second
pass is coming, a marker file read at the top of the verify/encode/cleanup stage
lets the first pass stop after the join instead of spending 35 minutes encoding
a deliverable that is about to be replaced, and stops it deleting the join
intermediates the next pass reuses.

---

## 10. Working through a device bridge

[ONCE] The shell on the user's machine can be unavailable while file access
still works. When mounts fail, `device_list_dir`, `device_stage_files` and
`device_commit_files` still function. Adapt rather than stall:

- **Monitor by filesystem.** Segment mtimes and sizes are a better progress
  signal than console output, and they survive the console being unreadable.
- **Verify arithmetically what you cannot open.** A 5.34 GB master could not be
  staged. The 228 segments summed to 5.119 GB; AAC at 320 kbit/s across 91
  minutes is 208 MB; the 228 MB difference confirmed the audio track was present
  without touching the file.
- **Ship a script, not instructions.** Everything the user cannot watch you do
  should arrive as one double-clickable file that verifies its own result.

[ONCE] Computer use can start the job when the shell cannot. File Explorer is
granted at click-only tier — enough to navigate and double-click a `.bat`.
Read coordinates in the **reported coordinate frame**, not in the pixels of a
scaled screenshot; mixing them up sends every click to the wrong place. Consoles
are masked, so plan to monitor through files from the start.

---

## 11. Failure catalogue

Every one of these cost real time on this project.

| symptom | cause | fix |
|---|---|---|
| workers die at high concurrency | `np.tan` float64 upcast the whole pipeline | cast the camera arrays to float32 explicitly |
| memory exhaustion with N workers | each x264 sizes its thread pool from the whole machine | `-threads 1 -x264-params threads=1:lookahead-threads=1:sliced-threads=0` and `OMP/OPENBLAS/MKL_NUM_THREADS=1` |
| launcher aborts on a healthy run | OOM scan counted errors from previous runs in append-mode logs | per-run log filenames, scan only this run |
| orphan workers after an abort | launcher exited without stopping children | `stop_all()` on abort, `kill_orphans()` on launch |
| ETA prints `228000000 min` | division by a zero rate before any segment finished | print "(measuring rate…)" until a real rate exists |
| concat silently mangles paths | ffmpeg's demuxer treats `\` as an escape inside quotes | forward slashes; test with a path containing spaces |
| video 0.1 s shorter than audio | duration derived from the analysis rather than the file | pin to the measured audio duration, `np.ceil` the frames, assert never short |
| delivery clips on AAC encode | peak measured on a sample read −2.2 dBFS; the file is 0.0 | measure the whole file; apply flat gain, never a limiter |
| worker dies rarely, at random | float modulo returned exactly the texture size for tiny negative input | clamp every texture index |
| whole methods vanish | a text replacement spanned past the intended method | splice by explicit method boundaries and re-verify the file parses and the class still has its members |
| binary transfer corrupts | parts named `.p00` were treated as text | name parts so a known binary extension is last (`sNNNNN_pNN.mp4`) |

---

## 12. Order of work

1. Analyse the whole audio to a map. Never re-derive at render time.
2. Build the camera and one frame. Look at it.
3. Build a 30–45 s preview at the most interesting moment. Get approval on the
   look before anything else. **The approved look is a fixed point** — do not
   move it while fixing something unrelated.
4. Derive the parameter schedule from the measured map.
5. Verify the plan: coverage with no gaps, duration on the audio, opening not
   untreated, features inside the timeline.
6. Render segment-per-process with a fingerprint cache, frame-count each segment
   before promoting it, join through MPEG-TS with explicit durations.
7. Verify video and audio separately, then decode the whole file for seam
   corruption. The container duration is only the longer of the two and cannot
   say where a fault lives.
8. Deliver a single transcode from the CRF-15 master. Never upload the master.

When a change lands after step 8, go to §9 — not back to step 6.