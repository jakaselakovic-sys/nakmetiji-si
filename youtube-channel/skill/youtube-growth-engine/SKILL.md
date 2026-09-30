---
name: youtube-growth-engine
description: "Operate Selaka's tech/AI YouTube channel end to end on a zero-cost stack — idea selection, original footage manufacture, narration, automated assembly, packaging, compliance gating, analytics and the self-updating playbook. Use for any channel task."
---

# YouTube Growth Engine

Architect, producer, editor, analyst and manager for the channel: 8–15 minute tech/AI
explainers in English, plus a Shorts feeder derived from each long-form video.

Two things define how this works.

**It is a learning system, not a content mill.** Every video is an experiment that writes a
row of evidence; every review turns evidence into rules. `playbook.md` is the real product —
the videos are how it gets trained.

**It costs nothing to run.** Narration, music, capture, assembly, thumbnails, analytics and
scheduling are all free and commercially licensed. There is no subscription to lapse and no
vendor who can reprice mid-project.

---

## 0. Non-negotiables — read before every task

Hard gates. If a step cannot pass one, stop and say so; never route around it.

**N1 — Downloading from YouTube is allowed (owner's decision); reusing it is gated.**
yt-dlp is fine. Allowed uses: reference and research material; the Audio Library; and videos
marked CC BY that the uploader actually owns — check that the uploader is the original source
(for example an archive's or museum's own channel). Every clip used gets a ledger row with
video URL, channel, licence, a screenshot of the licence, and the credit in the description.
Keep YouTube-sourced footage short and transformed (narrated over, cropped, graded); it must
never make up most of the episode, so the channel isn't flagged as "reused content". Never
use: videos with a standard YouTube licence, music videos, TV or news broadcasts, or other
creators' documentaries. Mine YouTube for *what to cover and what is working* too.

**N2 — No clip enters a timeline without a rights record.**
Every asset gets a row in `rights-ledger.csv` before it is placed. No row, no clip. Foundry
captures write their own row automatically — capture time is the only moment provenance is
still certain.

**N3 — The transformation standard in §4 is a publish gate, not an aspiration.**
YouTube's inauthentic-content policy bars "short videos you compiled from other social media
websites" and "content downloaded or copied from another online source without any
substantive modifications", while permitting "edited footage from other creators where you
add a storyline and commentary". The difference is measurable. Measure it.

**N4 — Original thesis per video.** The video must argue something no single source argues.
If the script could be replaced by a link, it is a repost, not a video.

**N5 — Disclose synthetic media.** Tick the altered-content box in Studio if any
photorealistic footage, voice or imagery is AI-generated or meaningfully altered. Stylised
graphics, charts and animation do not require it; a TTS narrator over graphics does not
strictly require the photorealism disclosure — say it on-channel anyway. **Never clone a real
person's voice**, and never let the narrator be mistaken for someone it isn't; that is a
separate violation no later disclosure repairs.

**N6 — Never fabricate.** No invented quotes, benchmarks, funding numbers or attributions.
Every factual claim traces to a line in `sources.md`. This binds the Foundry: a scripted
terminal session is *presentation*, never invention — run the command for real and paste its
true output. Tech news is a niche where one fabricated benchmark ends the channel.

**N7 — Metadata must match the video.** Title and thumbnail promise exactly what the first
90 seconds deliver.

**N8 — Licence-check every model and asset.** Open weights and an open licence are not the
same thing. See §3.6 for the specific trap.

---

## 1. State — the channel repo

One folder (default `~/youtube-channel/`, confirm on first run). Read what is relevant at the
start of a task, write back at the end. Nothing important lives only in a conversation.

```
channel/
  strategy.md          # positioning, pillars, non-goals, 90-day objective
  playbook.md          # THE LEARNED RULES. Rewritten by §10. Read before every creative step.
  performance.jsonl    # one row per video: features + outcomes
  experiments.md       # open tests, hypotheses, results
  backlog.md           # scored idea queue
  rights-ledger.csv    # every asset: source, licence, URL, attribution, date
  competitors.jsonl    # tracked channels + outlier snapshots
  incidents.md         # claims, strikes, demonetizations, resolutions
  music/bed.mp3        # from YouTube's Audio Library
  capture.mjs terminal.mjs assemble.mjs thumbnail.mjs analytics.mjs
  lib/engine.mjs  voice/narrate.py  voice/models/
  shots/  sessions/  scenes/  out/
  .github/workflows/channel.yml
  videos/<slug>/
    brief.md  script.md  sources.md  packaging.md  postmortem.md
    narration.wav  narration.json  final.mp4  thumb-*.png
```

**`playbook.md` format** — every rule carries status and evidence:

```
[CONFIRMED n=14] Titles with a concrete number in position 1–3: +1.9pp CTR
[TESTING  n=4 ] Cold-open on the failure case before the reveal — retention@30s +6pp so far
[RETIRED  n=11] Face-in-thumbnail. No CTR lift on this channel. Stop paying for it.
```

Promote TESTING → CONFIRMED at n≥8 with a consistent direction; retire after 3 consecutive
contradictions. Never write a rule from one video — one video is noise wearing a conclusion's
clothes.

---

## 2. Signal harvest — what to make

Weekly. Ten scored candidates into `backlog.md`.

- **Search demand** — prefer durable intent over news spikes. A news video decays in 5 days;
  an explainer earns for 18 months. Aim roughly one-third news, two-thirds evergreen.
- **Outlier mining** — for each tracked channel compute `views ÷ subscribers` per recent
  video; anything ≥ 4× that channel's median is an outlier. The *format and framing* are the
  signal, not the topic.
- **Comment mining** — unanswered questions under popular videos are pre-validated titles.
- **Release calendar** — model launches, earnings, conferences, deprecations.

**Quota discipline (important).** Get competitor videos via `channels.list` →
`playlistItems.list` → `videos.list` — **1 unit each**. Never use `search.list` in a loop: it
costs **100 units** against a 10,000/day budget, so twenty channels would spend 2,000 units
for data the cheap path returns for about 60.

**Score each candidate 1–5:**

| Axis | Question |
|---|---|
| Demand | Are people actively looking for this? |
| Durability | Will this earn in 12 months, or is it dead in a week? |
| Shootability | Is there something to *show*? Can the Foundry film it? |
| Angle strength | Do we have a thesis, or only a summary? |
| RPM | Does this attract software buyers, or a low-value audience? |
| Fit | Does it compound the channel's existing authority? |

Drop anything ≤2 on Shootability however good the topic — a subject with nothing to put on
screen becomes a stock-footage video, which is what this channel exists in order not to be.
Slate at **70% proven / 20% controlled variation / 10% deliberate swing**. The 10% is how the
playbook discovers rules it does not yet have; without it the loop hits a local maximum in
about two months.

**The format to own:** the crowded lane is *news reaction* — fast, disposable, universally
contested. The thin lane is **verification**: vendor claims tested on screen with the method
visible. More work per video, which is why fewer people do it, and the one format where
Foundry output is the product rather than decoration. It also ages well.

---

## 3. Rights-gated sourcing

**Tier 1 — Own material, manufactured on demand.** Screen recordings of public web apps,
docs, benchmarks, papers, repos and dashboards; scripted terminal sessions; generated motion
graphics. **The backbone — the majority of frame time.** Unlimited, free, unclaimable, and
the only footage no competitor has. §3.5 makes it.

**Tier 2 — Public domain and open archives.** Archive.org (check each item's rights
statement), NASA, NOAA, government media, Wikimedia Commons (check per-file licence).

**Tier 3 — Licensed stock.** **Connective tissue, not backbone** — atmosphere, transitions, a
cutaway when the screen would be boring. If a video is mostly stock, the format failed. Free
tiers: Pexels, Pixabay, Videvo, Mixkit. Record the terms as of the download date.

**Tier 4 — Corporate press kits and newsrooms.** Read the terms page; some are editorial-use
only, some forbid implying endorsement. Log the terms URL.

**Tier 5 — Direct permission.** Ask for the source file plus written permission. Slow, but it
is how you get footage no competitor has.

**Tier 6 — CC BY YouTube videos.** Download with yt-dlp under the N1 conditions. Never trust
a CC BY tag on its own — uploaders mislabel constantly and a mislabelled source transfers the
claim to you, so confirm the uploader is the original source and screenshot the licence.

**Ledger row:** `asset_id, video_slug, source_name, source_url, license, license_url,
attribution_string, acquired_date, terms_snapshot_path, commercial_use_ok, modification_ok`.
Generate the description's attribution block from it automatically. Credit even when not
required — one line, cheapest insurance available.

**Music — use the YouTube Audio Library.** Free, cleared for monetization by YouTube itself,
and structurally incapable of generating a Content ID claim because YouTube owns the
clearance. Check the attribution column. Never music from a source video; music is the most
common cause of claims on otherwise clean videos. Do not generate music with open models
without reading the licence — MusicGen's weights are CC-BY-NC and unusable here.

---

## 3.5 Footage manufacture — the B-Roll Foundry

Run during scripting, not after — the shot list should shape the script as much as the script
shapes the shot list.

**Doctrine.** The highest-value footage is not a clip of someone talking about the thing. It
is **the thing itself, on screen, moving**. This is also what the fastest-growing tech
channels actually do — almost all of them are screen-recording-led.

| What the viewer sees | Rig |
|---|---|
| The model answering; the benchmark table on the vendor's page; the paper scrolled and highlighted; the repo, diff, issue thread | `capture.mjs` |
| The install and the run | `terminal.mjs` |
| The number that is the point of the video; title cards, chapter markers, lower-thirds | `scenes/*.html` |

**Why frame-stepping.** A screen recorder inherits every stutter the page has and records at
whatever framerate the machine managed. The engine sets the page to an exact state,
screenshots, advances one frame, repeats — motion computed, not performed. Constant framerate
guaranteed, eased camera moves, and 2× supersampled text that stays legible at 1080p.

**Virtual camera.** Page renders at 1920×1080 CSS px, `deviceScaleFactor: 2` (3840×2160 raw).
A camera `{x, y, zoom}` crops and scales to 1080p: zoom 1.0 is a 4× supersample, zoom 2.0 is
native 1:1. Nothing is ever upscaled — do not exceed 2.0 unless the source is vector-crisp.

```bash
node capture.mjs shots/*.json --profile proof   # fast proofs while choosing the move
node capture.mjs shots/hero.json                # edit-grade H.264 CRF 14
node terminal.mjs sessions/bench.json           # scripted shell session
```

Moves: `hold`, `scrollTo`, `scrollBy`, `moveTo`, `zoom`, `spotlight`, `cursorTo`, `type`,
`drive`. Easing defaults to `inOutCubic` — the one that reads as "operated".

**The `__scene.at(t)` contract.** Any page exposing `window.__scene.at(t)` for `t` in 0–1 is
rendered by a `drive` move: the page owns its animation, the engine steps `t`. This is how the
terminal rig works and how every title card, stat reveal, quote card, code reveal and chart
animation should work. `scenes/stat-card.html` is the reference — it reads its numbers from
the query string, so one file serves every video.

**Three lines not crossed:** YouTube material only under N1; nothing behind a paywall or
a login whose terms forbid it; never present a capture as something it isn't (N6).

**Capture QC — reject a clip failing any of these:**
- 1920×1080 minimum, constant framerate, no dropped frames
- No scrollbar, cookie banner, consent modal or browser chrome
- No personal data in frame — real name, email, tokens, other tabs, notifications
- Target element fully inside frame throughout the move
- Text legible at delivered resolution, checked at 100%
- Motion eased, never linear, except `drive` scenes that ease internally
- Ledger row written

Capture runs about 5 frames/sec (10s at 60fps ≈ 2 min). Slate overnight renders; use
`--profile proof` while still deciding the move.

---

## 3.6 Narration and assembly — the zero-cost pipeline

```bash
python3 voice/narrate.py videos/<slug>/script.md --voice am_michael --out videos/<slug>/
node assemble.mjs videos/<slug> --shots out --music music/bed.mp3
node thumbnail.mjs --title "..." --big "142.7" --frame out/<shot>.mp4 --out videos/<slug>/
```

**Voice: Kokoro-82M via ONNX.** Apache 2.0 — commercial use permitted, no key, no
per-character billing, no vendor who can change terms. Runs on CPU at 2–4× real time, so a
ten-minute video narrates in about four minutes. Weights (~340 MB) come from GitHub releases
on first run; keep a local copy.

**N8, concretely — the licence trap.** Some of the best-sounding open models ship weights
that forbid commercial use, and the quality makes it an easy mistake:

| Safe | Not safe for a monetized video |
|---|---|
| Kokoro-82M (Apache 2.0), Chatterbox (MIT), Orpheus (Apache 2.0) | XTTS-v2, F5-TTS, Fish Speech |

Chatterbox scores higher but needs a GPU and embeds a watermark. Kokoro is the default.

**One voice, never changed.** With no face on screen, voice *is* the channel's identity;
switching resets audience familiarity to zero.

**The timing manifest is the mechanism.** `narrate.py` writes `narration.json` beside the
audio — every segment's exact start, end and bound shot. Because cut points are then already
decided, assembly needs no timeline work: consecutive segments sharing a shot become a scene,
each clip is fitted to that scene's exact duration, ffmpeg does the rest. This manifest is
what makes free unattended editing possible at all.

**Script format** — `#` lines are structure notes, never spoken; `>> shot-id` binds the
following lines to a Foundry shot; everything else is one narration segment per line.

**Assembly details that matter:**
- Clip shorter than its scene → ping-pong loop (forward then reversed), because a hard loop
  shows a visible jump on the seam.
- Music is **sidechain-ducked** under the voice, not laid underneath quietly — that is the
  difference between a mix and "music playing behind a voice".
- No shot bound → an orange slate saying so. A silent black gap ships; a loud slate gets fixed.
- Output 1920×1080 / 30fps / stereo, −14 LUFS integrated, true peak ≤ −1 dBTP.

**Pace check:** `narrate.py` reports words per minute. 150–165 reads as confident; over 180
is rushing.

---

## 4. The transformation standard

Score in `postmortem.md` before publish. **All six must pass.**

| # | Gate | Threshold |
|---|---|---|
| T1 | Runtime carrying original narration | ≥ 90% |
| T2 | Runtime that is third-party footage | ≤ 40%; Tier 1 own-material ≥ 40% |
| T3 | Longest uncut third-party clip | ≤ 15 s, never the opening shot |
| T4 | Third-party clips spoken over or annotated | 100% |
| T5 | Original graphics, charts or animations | ≥ 3 |
| T6 | Thesis absent from any single source | required |

Fix the video, never the gate. Enforcement lands at the **channel** level: one lazy video
risks the whole channel's monetization. With the Foundry running properly T2 and T5 pass
without effort — if they are tight, the video is leaning on borrowed material it did not need.

---

## 5. Script — retention architecture

1,300–1,900 words for 8–12 minutes. Growth is multiplicative — views = impressions × CTR, and
watch hours = views × AVD — so packaging and hook compound against each other. A 4%→5% CTR
plus a 4.0→4.8 min AVD is +50% watch hours from the same impressions.

**0:00–0:15 Cold open.** No logo, no "hey guys", no intro. Ever. Open on the sharpest concrete
image or claim — usually a Foundry capture of the thing itself. State the stakes, open a loop
the viewer needs closed. Thirty seconds is 5% of runtime and decides the other 95%.

**0:15–0:45 Contract.** Exactly what the viewer gets and why this video over the other ten.
Name the thesis. Do not summarise the ending.

**0:45–end Body, 3–5 beats.** Each: claim → evidence → visual → consequence. Close the previous
loop and open the next at every seam. Re-hook every 40–60 seconds.

**Pacing**
- Visual change every 3–5 seconds; 10 seconds on one frame is a dropped viewer.
- No narration sentence over 22 words. Read it aloud; if you run out of breath, cut it.
- Cut every sentence that does not advance the argument — retention is a subtraction problem.
- Never announce structure; it invites skipping.
- No subscribe ask before the 60% mark, and only if the video earned it.

**Ending.** Close the loop, deliver the payoff, hand off to one specific next video by name in
the last 15 seconds. Session watch time compounds harder than any single video's retention.

**Sources.** Every factual claim gets a line in `sources.md` with a URL, checked against
primary sources — vendor blogs and papers, not aggregators.

---

## 6. Assembly

- The script *is* the edit decision list: `>> shot-id` bindings plus `narration.json` produce
  the cut. Asset ids match Foundry shot ids, so a re-render drops straight back in.
- Narration first, visuals to narration. Never the reverse.
- **Re-render rather than crop.** Wrong framing → fix the shot JSON and re-run. Scaling up a
  mis-framed capture is what makes footage look soft.
- Captions burned or platform-side — roughly 40% of tech viewing is sound-off in feed.
- 1080p is sufficient; 4K costs render time and buys nothing at this scale.
- Keep the shot JSONs and script — re-cuts, Shorts and next year's updated version all derive
  from them.

---

## 7. Packaging — title, thumbnail, description

Packaging sets the ceiling; the video determines how much of it you keep. The highest-leverage
hour in the week.

**Thumbnail.** `thumbnail.mjs` generates three variants from three *different* archetypes —
annotated frame grab, number card, contradiction pair — never three versions of one idea.
Rendered at 2× (2560×1440) to survive recompression. Backgrounds come from Foundry clips, so
the thumbnail shows what the video shows, which is what makes the click honest. Rules:
readable at 120px wide (check it there before choosing); ≤ 4 words; one focal point; high
local contrast; must not duplicate the title's words — thumbnail and title are two halves of
one sentence.

**Title.** Write 8, pick 1. 45–60 characters. Front-load the concrete noun. Specificity beats
cleverness. Avoid all-caps, excessive punctuation, vague superlatives, and any promise the
video does not keep.

**Description.** First 150 characters do the search work. Then a 2-paragraph summary, chapter
timestamps, the generated attribution block, source links, next-video link.

**Test.** YouTube's Test & Compare where available; otherwise change **one** packaging
variable at a time and log it in `experiments.md`.

**Targets** (calibrate after 15 videos): CTR 4–8%, APV ≥ 45% at 10 min, retention@30s ≥ 70%.

---

## 8. Pre-publish compliance gate

Ten minutes; protects the entire revenue stream.

1. All six transformation gates (§4) pass.
2. `rights-ledger.csv` has a row for every asset. Attribution block generated.
3. **Content ID pre-check** — upload Private, wait for the copyright scan, open Restrictions,
   resolve or replace anything claimed, *then* go public. Never publish public and hope.
4. Advertiser-friendly — no profanity in the first 30 s, no shock imagery, no sensitive-events
   footage; controversial topics in a news/educational register.
5. Altered-content disclosure set if photorealistic synthetic media is present (N5).
6. Title/thumbnail match the first 90 seconds (N7).
7. Every factual claim traced in `sources.md` (N6).
8. Music from the Audio Library, logged.
9. **No personal data in any frame** — scrub the timeline once at 100%, looking only for tabs,
   tokens, emails and notifications.
10. Category, language, captions, chapters, end screen, next-video link, playlist.
11. Multi-language audio enabled *once eligible* (see §13); titles and descriptions translated
    for the top 3 non-English markets in analytics.

Anything fails → it does not publish. There is always another slot.

---

## 9. Distribution and Shorts

- **Shorts are derived, never separate.** Each long-form yields 2–3 Shorts from its strongest
  60-second segments, re-hooked for a cold audience, designed to loop.
- **Shorts views do not count toward YPP watch hours** — they run on a separate track. Shorts
  recruit subscribers; long-form qualifies the channel.
- Re-render key shots at 1080×1920 rather than cropping the 16:9 master — the shot JSON only
  needs `width`/`height` swapped.
- Publish Shorts between long-form uploads.
- Pin a comment asking a specific question; comment velocity in the first hour matters.
- Reply to every comment for the first 2 hours.
- Playlists per pillar, ordered as a curriculum, so session watch time chains.

---

## 10. Measure → Learn — the self-updating loop

```bash
node analytics.mjs pull                 # -> performance.jsonl
node analytics.mjs diagnose             # funnel verdict per video
node analytics.mjs retention <videoId>  # curve + the five steepest drops
```

**Row schema** — ~25 production features against 8 outcomes:

```json
{"slug":"","published":"","pillar":"","topic_cluster":"",
 "title":"","title_pattern":"","title_len":0,"has_number":false,
 "thumb_archetype":"","thumb_word_count":0,
 "hook_type":"","cold_open_subject":"","duration_s":0,
 "clip_density":0.0,"own_material_share":0.0,"visual_cuts_per_min":0.0,
 "n_foundry_shots":0,"n_original_graphics":0,"wpm":0,"voice":"",
 "publish_dow":"","publish_hour_local":0,"news_or_evergreen":"",
 "impressions":0,"ctr":0.0,"views":0,"avd_s":0,"apv":0.0,
 "ret_30s":0.0,"ret_50pct":0.0,"subs_gained":0,"rpm":0.0,
 "comments":0,"shares":0,"traffic_browse_pct":0.0,"traffic_search_pct":0.0,
 "suggested_pct":0.0,"top_geo":"","notes":""}
```

**Diagnose by stage — "it flopped" is four different diseases:**

| Symptom | Stage | Fix |
|---|---|---|
| Low impressions | Topic | Wrong subject or no demand — §2 |
| Impressions high, CTR low | Packaging | Thumbnail/title — §7 |
| CTR fine, retention@30s low | Hook | Cold open broke its promise — §5 |
| Good start, mid-video cliff | Structure | `retention <id>` gives the timestamp — go watch it |
| Good retention, few subs | Payoff | Satisfied but did not earn the follow |
| Good views, low RPM | Audience | Wrong advertiser audience or geo mix |

A packaging failure and a retention failure look identical in a view count and need opposite
repairs — which is how weeks get spent rewriting hooks when the thumbnail was the problem.

**Weekly (30 min):** last 7 days → biggest funnel gap → **one** change, logged as a hypothesis
with an expected direction. Four changes at once teaches nothing about any of them.

**Monthly:** group by each feature, compare medians of `ctr`, `apv`, `ret_30s`,
`subs_gained`, `rpm`. Consistent effect across ≥8 videos → CONFIRMED rule. Contradicted rules
retired. Then **rewrite `playbook.md`** and note in `experiments.md` what changed and why.
Refresh `competitors.jsonl` outliers — your own data only contains formats you already tried.

**Overfitting guard.** Under 8 observations is a hunch. With ~30 videos and ~25 features,
spurious correlations are not a risk but a certainty. Prefer rules with a mechanism you can
explain over correlations you cannot.

**Quarterly:** re-read `strategy.md`. Kill pillars without sentiment.

---

## 11. Cadence and where it runs

- **Mon** — signal harvest → 10 scored candidates *(scheduled)*
- **Tue** — brief, script, source verification, shot list; queue captures *(2h, human)*
- **Wed** — narrate, assemble, captions; 3 thumbnails, 8 titles *(2.5h)*
- **Thu** — compliance gate, private upload, Content ID check, publish; derive Shorts
- **Fri** — `pull` + `diagnose`, one change committed to `experiments.md` *(scheduled)*
- **1st of month** — deep review + `playbook.md` rewrite
- **Quarterly** — strategy review

About seven hours per video, of which four are irreducibly human: thesis, script, hook,
thumbnail. That is the honest shape of "automated" — the machine manufactures, judgment stays
yours. Any plan promising otherwise describes the channel the inauthentic-content policy
exists to catch.

**Infrastructure: GitHub Actions, free.** Public repo = unlimited minutes; private = 2,000
Linux minutes/month, of which the weekly analytics job spends ~2. Rendering costs 20–45 min
per video, so render on a public repo or locally and keep scheduled jobs on Actions either way.

**The 60-day trap:** GitHub disables scheduled workflows on repos with no activity for 60
days — exactly what happens to a channel running smoothly. The analytics job commits its own
results *even when nothing changed*, and that commit counts as activity, keeping the schedule
alive. Do not remove that behaviour.

**Trade to make deliberately:** a public repo buys unlimited minutes and makes
`performance.jsonl` public. If early view counts should stay private, use a private repo and
render locally.

**Uploading stays manual.** `videos.insert` costs 1,600 of 10,000 daily units, so the ceiling
is six uploads a day and one script bug spends the day. Ten minutes by hand also keeps the
Content ID pre-check honest.

Create scheduled tasks with the remote scheduled-task tools, never local cron.

Realistic sustainable rate: 1–2 long-form + 3–6 Shorts per week. Do not chase volume — the
inauthentic-content policy targets unsustainable upload speed paired with templated output.

---

## 12. Risk register

| Risk | Prevention | If it happens |
|---|---|---|
| Content ID claim | Tier 1 backbone, Audio Library music, private-upload pre-check | Replace the asset, re-upload; dispute only with documentation |
| Copyright strike | YouTube material only under N1 (CC BY, uploader-owned, screenshot); ledger discipline | Do not re-upload; review the failed ledger row; log in `incidents.md` |
| Reused-content demonetization | §4 gates every video | Audit the last 20 against §4, fix or unlist the worst, reapply |
| Inauthentic-content flag | No templated mass output; genuine per-video thesis | Diversify formats, slow cadence, raise Tier 1 share |
| Non-commercial model licence | N8 — check weights, not just the repo | Re-narrate with a compliant model; do not leave it published |
| AI-disclosure violation | N5 on every upload | Add disclosure retroactively; not a strike if corrected |
| Personal data on screen | Capture QC §3.5 + gate 9 | Unlist immediately, re-render the shot, re-upload |
| Free tooling drifts | Keep local copies of model weights; nothing load-bearing on one free tier | Swap the component; the pipeline is modular by design |
| Cadence collapse (~week 6) | Design the workload for the tired version of you | One video a week that ships beats two that don't |
| Platform dependency | Email list from video one | — |

Log every incident with cause and resolution — the highest-information data the channel will
ever produce.

---

## 13. Standing strategic context

- **YPP entry thresholds double on 1 February 2027** (8,000 watch hours / 20M Shorts views for
  new applicants). Existing partners are grandfathered. Reaching 1,000 subscribers + 4,000
  watch hours *before* that date locks in the lower bar — the channel's first hard objective.
  Plan the slate backwards from it.
- Until acceptance, **every trade-off between reach and revenue resolves toward long-form
  watch hours.** Afterwards it flips.
- **Auto-dubbing requires 1,000+ subscribers**, so it is not available at launch — it unlocks
  around the same time as YPP. Treat it as a phase-three multiplier, not a sprint tactic.
  Dubbed geos have lower CPMs, so it moves watch hours more than revenue.
- From Feb 2027 Shorts ad revenue requires 10M qualified Shorts views per 90 days. Shorts are
  a feeder, not the business.
- Premium Lite pays creators 60% of subscription revenue; subscriber watch time is worth more
  than the ad RPM alone suggests.
- **Revenue metrics return nothing before YPP** even with the monetary scope authorised — not
  a bug, expected for the first five months.
- **Ads are the smallest of four lines.** At ~10k views/video: ads ~$100, affiliate $150–600,
  sponsor integration $280–550 (AI tools command $28–55 CPM). Affiliate links from video one;
  sponsor outreach at ~5k subs or 10k average views. Only recommend what you actually use —
  a technical audience detects an uninstalled recommendation faster than any other kind.
- Sponsorship pricing is formulaic: recent average views × niche CPM × format multiplier
  (dedicated 1.3–1.5×, Shorts 0.4–0.6×). Negotiable on top: usage rights +25–100%, category
  exclusivity +25–50%, rush +25–50%.

Re-verify before any decision that depends on these — YouTube's policies move, and a stale
rule in this file is worse than no rule.