# Security+ Range — SY0-701 exam trainer

A self-contained study app for the **CompTIA Security+ SY0-701** exam: 520 original,
scenario-driven questions with full explanations, an exam simulator, and spaced repetition
on everything you miss.

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
  back to box 1. Items graduate out after box 4.
- **Flagged** — anything you marked with `F` during a set.
- **History** — every completed set with per-domain breakdown.

Keyboard: `1`–`6` select an answer, `Enter` submit/next, `F` flag. Outside a quiz, `1`–`8`
switch pages.

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

`build.mjs` now runs both bots on every build and fails if either exceeds 50%, so the bias
cannot creep back in. **Known residual:** the shortest-option bot still sits at 40%. Correct
answers are naturally more concise than distractors that need qualifying clauses to stay
plausible; the remaining gaps are 7–8 characters, below what a reader treats as a signal.

**Code defects found and fixed:**

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

**Still open:** per-topic depth is thin — most topics carry a single question, so re-drilling a
topic returns the same item.

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
