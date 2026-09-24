# Security+ Range — SY0-701 exam trainer

A self-contained study app for the **CompTIA Security+ SY0-701** exam: 520 original,
scenario-driven questions plus 16 performance-based items, full explanations, a bootcamp
curriculum, 134 recall flashcards, an exam simulator, and spaced repetition on everything
you miss.

Open `dist/index.html` in any browser. No server, no build step required to use it, no network
calls except the web font.

## Why SY0-701

SY0-701 is the live exam version. SY0-801 is not expected to reach general availability until
roughly November 2026, with 701 retiring around six months after that, so 701 is what you sit
today.

## The question bank

520 questions, weighted to the real objective domains:

| Domain | Questions | Exam weight |
|---|---:|---:|
| 1 · General Security Concepts | 70 | 12% |
| 2 · Threats, Vulnerabilities & Mitigations | 120 | 22% |
| 3 · Security Architecture | 95 | 18% |
| 4 · Security Operations | 145 | 28% |
| 5 · Security Program Management & Oversight | 90 | 20% |

Every question carries:

- a **scenario stem** in CompTIA's style (BEST / MOST / FIRST phrasing, plausible distractors)
- the **objective number** (e.g. `2.4`) and topic, so a miss maps straight back to the syllabus
- an **explanation** that justifies the right answer *and* rules out each wrong one
- an **exam tip** with the pattern, mnemonic, or trap that question is testing

Difficulty is tagged `core` / `applied` / `hard`. Multi-select items ("choose two/three") are
included, matching the real exam format.

## Bootcamp — beginner to advanced

A taught path, not just a question bank. `data/bootcamp.json` holds **17 modules across 4 levels**
with **85 written lesson blocks and 116 key terms**, and the build fails if any module's drill
selector cannot be filled from the bank.

| Level | Name | Tag | Modules |
|---|---|---|---:|
| 1 | Foundations | Beginner | 4 |
| 2 | Building Blocks | Beginner+ | 4 |
| 3 | Operations | Intermediate | 4 |
| 4 | Architecture & Governance | Advanced | 5 |

Each module is **lesson → key terms → prove it**: 3–6 teaching blocks written in plain language,
a term table, then a drill of 8–12 real questions pulled from the objectives that module covers.
**Score 80% and the next module unlocks**; fail and it stays locked with a prompt to re-read.
Level 4 ends in a **capstone**: a timed 45-question half exam with PBQs first, cleared at 83%.

**Test out.** Already know a level? One 12-question check at 85% marks that level's modules passed
and jumps you forward — the lessons stay readable if you want them later.

Progress lives in `S.bc` alongside everything else, so it exports and imports with the rest.

## The 80/20 Core

118 of the 520 questions (22.7%) are tagged as the **high-yield core** — 30 clusters covering the
concepts that recur most across the exam. Each cluster has a hard cap, so the core stays a short
list rather than quietly growing into "most of the bank". Within a cluster the hardest questions
are selected first.

Core size per domain tracks the exam blueprint: D1 14, D2 26, D3 21, D4 33, D5 24.

The **80/20 Core** page shows per-cluster mastery, why each cluster pays off, and a plain
pros/cons panel on the strategy itself. The honest version: 80/20 is a study heuristic, not a
published CompTIA statistic. It is a priority order for a short runway, not a substitute for
breadth — a 750/900 pass leaves little slack, and performance-based questions draw from the long
tail the core deliberately skips. Core first, breadth second.

`data/high-yield.json` defines the clusters (`topics`, `cap`, and the `why` text shown in-app).
The build tags matching questions with `hy` and fails if a listed topic matches nothing.

## Modes

- **80/20 Core** — drill the high-yield clusters, individually or as one 118-question run.
- **Practice** — pick domains, length, and selection strategy. *Smart* mode prioritizes questions
  you have never seen and ones you have missed, *core only* restricts to the high-yield set.
  Instant feedback after each answer.
- **Exam simulation** — 90 questions in the real domain weighting, 90-minute countdown,
  no feedback until you submit. A 45-question half exam is also available.
- **Weak drill** — Leitner spaced repetition. Miss a question and it enters box 1 and returns
  immediately; each correct answer promotes it (1 day → 3 days → 7 days) and a miss knocks it
  back to box 1. Items graduate out after box 4. Each set also mixes in unseen questions from
  the same objectives as what's due, so recall has to transfer to different wording, not just
  the memorized phrasing of the one item you got wrong.
- **Flashcards** — five self-graded decks (ports & protocols, acronyms, crypto quick recall,
  frameworks/laws/roles, sequences & numbers) covering the recall-only facts the exam expects
  verbatim. 134 cards. Weakest-first ordering, missed cards repeat before the deck ends, and
  per-card mastery persists between sessions.
- **Flagged** — anything you marked with `F` during a set.
- **History** — every completed set with per-domain breakdown.

Keyboard: `1`–`6` select an answer, `Enter` submit/next, `F` flag, `Esc` closes the exam review
modal. Outside a quiz, `0`–`9` switch pages (`0` is Flashcards).

## Explanation depth

Every graded answer — practice or exam review — now shows more than the one-paragraph
explanation:

- **Objective context.** The exact CompTIA outline text for that question's objective code
  (e.g. *"1.4 — Explain the importance of using appropriate cryptographic solutions"*), pulled
  straight from `data/objectives.json` so it can never drift out of sync with the real exam
  blueprint or be paraphrased inaccurately.
- **Inline glossary.** Any acronym from the flashcard decks that appears in the question,
  explanation, or exam tip (AES, RSA, PKI, GDPR, ...) becomes a clickable chip. Click it to see
  the definition inline, without leaving the question. Matching is exact-case and whole-word
  only against a curated set of unambiguous acronyms — no bare port numbers or multi-word terms,
  to avoid false hits in ordinary prose. About 23% of questions surface at least one term.
- **Practice more on this objective.** A one-click button starts an 8-question set filtered to
  the same objective code, using the same never-seen-first weighting as Smart practice — so a
  shaky answer turns immediately into more reps on exactly that objective instead of waiting
  for it to resurface on its own.

## Progress that actually persists

If progress seems to vanish between visits, it is almost never the app losing data — the save
path writes to `localStorage` after every single answer and that has been tested to survive a
reload. The two real causes are both about *where* the page is running:

1. **An embedded preview** (for example, a hosted Artifact link opened inside another site's
   iframe) can be handed a fresh, unpersisted storage area on every load, or have its storage
   blocked by the embedding page's sandbox. Progress written there can vanish the next time you
   open the link, through no fault of the save code.
2. **The browser is blocking local storage outright** — strict privacy settings, private
   browsing, or an extension that clears site data.

The app now detects both conditions on load (`isEmbedded()` checks whether it is running inside
a frame, `storageWorks()` does a real read/write roundtrip) and shows a banner explaining what is
happening, with two one-click fixes: **Download this app** saves the current page as a
self-contained `.html` file you open directly — a real, stable origin under your control, not an
embedded preview — and **Copy my progress now** puts your current progress on the clipboard so
you can paste it into Import after opening that downloaded copy. Settings also shows a live
storage-status line (✓ working / ⚠ embedded / ⚠ blocked) so you can check at any time rather than
finding out only after progress is gone.

## Red-team findings

The bank and the app were attacked deliberately. What that found, and what was done:

**Answer-length bias (severe).** 72.3% of questions had the correct answer as the longest
option, against a ~25% random baseline. A bot that never reads the question and always picks
the longest option scored **74.6%** — just under the app's own 83% pass line, meaning every
readiness number was inflated by a tell that has nothing to do with knowing security.

313 questions were rewritten: bundled correct answers trimmed to their core claim, distractors
made equally specific, and eight flippant throwaway options replaced. The first pass
over-corrected (correct answers became the *shortest*, handing a shortest-option bot 52.9%), so
a second pass of 83 questions rebalanced the option lengths.

| Attacker | Before | After | Random baseline |
|---|---:|---:|---:|
| Always picks longest option | 74.6% | **24.0%** | ~25% |
| Always picks shortest option | — | **40.0%** | ~25% |

`build.mjs` now runs both bots on every build and fails if either exceeds 35%.

**Second pass, two more tells found.** Measuring differently surfaced two tells the length
bots didn't catch:

- **Absolute language.** Distractors reached for words like *always*, *never*, *eliminates*,
  *guarantees*, and *cannot*. Across 50 hits, 92.6% were wrong answers — a bot that discards
  every option containing one of those words, without reading the question, scored 92.6%.
  37 distractors were rewritten as plausible misconceptions instead of straw men (a few
  legitimate exam terms — *impossible travel*, *always-on VPN* — are excluded from the
  heuristic). The tell is now at 0%: none of the surviving hits are wrong answers.
- **Stem-keyword overlap.** The correct option echoing the most words from the question stem
  was right 34.9% of the time against decidable items (random ~25%). Not severe enough to
  rewrite wholesale, but a build guard now fails above 45% so it can't drift upward.

The shortest-option bot (40.0% after the first pass) was also revisited: 74 more questions had
their distractors rebalanced to match the correct answer's length and register.

| Attacker | Round 1 | Round 2 | Random baseline |
|---|---:|---:|---:|
| Always picks longest option | 74.6% → 24.0% | **23.8%** | ~25% |
| Always picks shortest option | — → 40.0% | **27.1%** | ~25% |
| Discards every absolute-language option | *(not measured)* | **0.0%** | n/a |
| Picks highest stem-keyword overlap | *(not measured)* | 34.9% (guarded < 45%) | ~25% |

`build.mjs` runs all four bots on every build and fails the build if any crosses its threshold.

**Code defects found and fixed (this round):**

- The exam review modal (`#navPanel`) had no keyboard dismissal — `Esc` now closes it.
- Re-drilling a missed question returned the *identical* item, which teaches the wording
  rather than the concept. Weak drill now pairs each due item with unseen questions on the
  same objective, so recall has to transfer to different phrasing.

**Earlier round — code defects found and fixed:**

- A set's countdown timer kept running after navigating away, and could yank you to a results
  screen from another page. Timers are now cleared on exit and on starting a new set.
- Leaving a set mid-flight discarded it silently. It now warns and saves.
- A refresh or crash mid-exam lost everything. In-progress sets persist and resume from the
  dashboard, including the remaining time; an expired timer scores on resume.
- Exam mode was forward-only. It now has back-navigation, changeable answers, and a review
  grid that jumps to any question and flags what is unanswered — matching how the real exam
  behaves. Grading and stat writes are deferred to submission, so revisiting costs nothing.
- `.navpanel{display:grid}` silently overrode the `hidden` attribute, leaving an invisible
  full-screen overlay that swallowed every click. `[hidden]{display:none !important}` now makes
  `hidden` authoritative.
- Finishing a set re-saved the session it had just cleared, resurrecting completed sets.
- The "45-question" half exam actually built 46. Domain allocation now uses largest-remainder
  and hits the target exactly at any size.
- Options were plain buttons with no semantics. They now carry `radio`/`checkbox` roles with
  `aria-checked`, and each question is announced through a live region.

Results now also show an approximate CompTIA-style scaled score (100–900, 750 to pass),
labelled as an estimate — the real exam weights items and includes unscored trial questions.

**Still open:** per-topic depth is thin — 96% of topics carry exactly one multiple-choice
question, so a student who wants a *different* question on the same narrow topic (as opposed
to the same topic's objective, which weak-drill siblings now cover) won't find one. Explanations
remain self-reviewed with no CompTIA-certified human validation — cross-check against
Professor Messer or an official study guide before trusting an explanation you're unsure of.

## Alignment with the live exam

Verified against CompTIA's published exam information: the SY0-701 exam is a **maximum of 90
questions in 90 minutes**, mixing multiple choice, multiple response, drag-and-drop, and
performance-based items, scored **100–900 with 750 to pass**.

**Objective coverage audit.** Every question carries an objective code, and the build validates
each one against the full 28-objective list in `data/objectives.json` (1.1–5.6). Result: zero
invalid codes and **no objective left uncovered or thin** — the lowest are 1.1 and 4.2 with 8
questions each, the highest is 2.4 with 40.

**Performance-based questions.** 16 PBQs in `data/pbq.json`, in the two formats the exam uses:

- `order` — arrange steps into the correct sequence (IR phases, order of volatility, vulnerability
  management lifecycle, certificate enrollment, change management, forensic acquisition)
- `match` — assign each item to a category (control types, control categories, ports, access
  control models, data states, agreements, cloud responsibility, log sources, attack
  identification, attack mitigation)

Ordering uses arrow controls and matching uses labelled selects, so both work on a phone and with
a keyboard. Grading is all-or-nothing for the score, but feedback marks each row so you see
exactly which placement was wrong. The exam simulator front-loads 4 PBQs before the
multiple-choice section, mirroring the real exam.

**On scaled scores.** 750/900 is not 75% correct — CompTIA weights items and PBQs can carry more
weight, so no practice tool can convert a raw percentage into a true scaled score. The app reports
raw percentage, labels its 100–900 figure as a linear reference only, and holds an 83% target so a
pass here means real margin.

## Readiness score

The dashboard gauge blends accuracy with coverage, weighted by the real exam percentages:

```
domain score = accuracy × min(1, coverage / 0.60)
readiness    = Σ (domain weight × domain score)
```

Coverage is capped at 60% of a domain's items, so you cannot show 90% readiness from ten lucky
answers. **Target: 85%+ overall with no domain below 80%.** The pass line used in the simulator
is 83% correct, deliberately stricter than the real 750/900 scaled cut score.

## Progress

Stored in browser `localStorage` only — nothing leaves the device. Settings → Export copies your
progress JSON to the clipboard; Import restores it on another browser or phone.

## Working on the bank

```
node build.mjs
```

Reads `data/questions/*.json`, validates every item (unique ids, in-range answer indices,
single vs multi consistency, explanation length, duplicate option text), inlines the bank into
`src/app.html`, and writes `dist/index.html`. The build fails loudly rather than shipping a
broken question.

Question shape:

```json
{
  "id": "2-041", "d": 2, "obj": "2.4", "topic": "Ransomware indicators",
  "diff": 2, "type": "single",
  "q": "…scenario…",
  "opts": ["…", "…", "…", "…"],
  "a": [0],
  "exp": "why the answer is right and the others are not",
  "tip": "the pattern to remember on exam day"
}
```

`d` is the domain (1–5), `a` holds the correct option indices, and `type` is `single` or `multi`.
Answer options are shuffled at runtime, so the correct answer's position in the file does not
matter.

## Self-test

```
node build.mjs && node tools/selftest.mjs
```

`build.mjs` guards the *content* — schema, coverage, and the four answer-bias bots above.
`tools/selftest.mjs` drives the *built app* end to end with Playwright: every page renders,
practice/exam/PBQ/bootcamp/flashcard sessions can be completed, the exam review modal opens,
warns on blanks, and closes on `Esc`, weak-drill siblings are distinct from the due items and
share an objective with them, every graded answer shows its objective context and offers a
working "practice more" jump, glossary chips reveal and collapse correctly, the embedded/blocked
storage banner appears and clears under the right conditions and its download button produces a
real file, progress survives a reload, the theme toggle works, and nothing throws. ~90–110
checks depending on which random items are drawn, run to run — all green, confirmed stable
across repeated runs.
