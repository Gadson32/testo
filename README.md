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

## Modes

- **Practice** — pick domains, length, and selection strategy. *Smart* mode prioritizes questions
  you have never seen and ones you have missed. Instant feedback after each answer.
- **Exam simulation** — 90 questions in the real domain weighting, 90-minute countdown,
  no feedback until you submit. A 45-question half exam is also available.
- **Weak drill** — Leitner spaced repetition. Miss a question and it enters box 1 and returns
  immediately; each correct answer promotes it (1 day → 3 days → 7 days) and a miss knocks it
  back to box 1. Items graduate out after box 4.
- **Flagged** — anything you marked with `F` during a set.
- **History** — every completed set with per-domain breakdown.

Keyboard: `1`–`6` select an answer, `Enter` submit/next, `F` flag. Outside a quiz, `1`–`7`
switch pages.

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
