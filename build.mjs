#!/usr/bin/env node
// Builds dist/index.html: a single self-contained study app with the whole
// question bank inlined. Also validates the bank and fails loudly on bad data.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const bankDir = join(root, "data", "questions");
const template = join(root, "src", "app.html");
const outDir = join(root, "dist");

const DOMAINS = {
  1: { name: "General Security Concepts", weight: 12 },
  2: { name: "Threats, Vulnerabilities & Mitigations", weight: 22 },
  3: { name: "Security Architecture", weight: 18 },
  4: { name: "Security Operations", weight: 28 },
  5: { name: "Security Program Management & Oversight", weight: 20 },
};

const errors = [];
const seen = new Map();
const questions = [];

const pbqPath = join(root, "data", "pbq.json");
const files = readdirSync(bankDir).filter((f) => f.endsWith(".json")).sort();
if (!files.length) errors.push("no question files found in data/questions");

for (const file of files) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(join(bankDir, file), "utf8"));
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`);
    continue;
  }
  if (!Array.isArray(parsed)) {
    errors.push(`${file}: expected a top-level array`);
    continue;
  }
  parsed.forEach((q, i) => {
    const at = `${file}[${i}] ${q.id ?? "(no id)"}`;
    if (!q.id) errors.push(`${at}: missing id`);
    else if (seen.has(q.id)) errors.push(`${at}: duplicate id, first seen in ${seen.get(q.id)}`);
    else seen.set(q.id, file);
    if (!DOMAINS[q.d]) errors.push(`${at}: domain must be 1-5, got ${q.d}`);
    if (!q.obj) errors.push(`${at}: missing objective`);
    if (!q.q || q.q.length < 15) errors.push(`${at}: question text missing or too short`);
    if (q.type === "order" || q.type === "match") { validatePbq(q, at); return; }
    if (!Array.isArray(q.opts) || q.opts.length < 3) errors.push(`${at}: needs at least 3 options`);
    if (!Array.isArray(q.a) || !q.a.length) errors.push(`${at}: missing answer array`);
    else {
      for (const idx of q.a) {
        if (!Number.isInteger(idx) || idx < 0 || idx >= (q.opts?.length ?? 0)) {
          errors.push(`${at}: answer index ${idx} out of range`);
        }
      }
      if (new Set(q.a).size !== q.a.length) errors.push(`${at}: repeated answer index`);
      const type = q.type || (q.a.length > 1 ? "multi" : "single");
      if (type === "single" && q.a.length !== 1) errors.push(`${at}: single-answer question has ${q.a.length} answers`);
      if (type === "multi" && q.a.length < 2) errors.push(`${at}: multi-answer question needs 2+ answers`);
      q.type = type;
    }
    if (!q.exp || q.exp.length < 40) errors.push(`${at}: explanation missing or too thin`);
    if (Array.isArray(q.opts) && new Set(q.opts).size !== q.opts.length) {
      errors.push(`${at}: duplicate option text`);
    }
    q.diff = q.diff || 2;
    questions.push(q);
  });
}

function validatePbq(q, at) {
  if (q.type === "order") {
    if (!Array.isArray(q.items) || q.items.length < 3) errors.push(`${at}: order item needs 3+ steps`);
    else if (new Set(q.items).size !== q.items.length) errors.push(`${at}: duplicate step text`);
  } else {
    if (!Array.isArray(q.cats) || q.cats.length < 2) errors.push(`${at}: match item needs 2+ categories`);
    if (!Array.isArray(q.pairs) || q.pairs.length < 3) errors.push(`${at}: match item needs 3+ pairs`);
    else {
      for (const [left, cat] of q.pairs) {
        if (!left || !cat) errors.push(`${at}: malformed pair`);
        else if (!q.cats.includes(cat)) errors.push(`${at}: pair category "${cat}" is not in cats`);
      }
      if (new Set(q.pairs.map((x) => x[0])).size !== q.pairs.length) errors.push(`${at}: duplicate pair prompt`);
      const used = new Set(q.pairs.map((x) => x[1]));
      for (const c of q.cats) if (!used.has(c)) errors.push(`${at}: category "${c}" is never the answer`);
    }
  }
  if (!q.exp || q.exp.length < 40) errors.push(`${at}: explanation missing or too thin`);
  q.diff = q.diff || 2;
  q.pbq = true;
  questions.push(q);
}

// performance-based items live in their own file but share the bank pipeline
{
  const pbqs = JSON.parse(readFileSync(pbqPath, "utf8"));
  pbqs.forEach((q, i) => {
    const at = `pbq.json[${i}] ${q.id ?? "(no id)"}`;
    if (!q.id) errors.push(`${at}: missing id`);
    else if (seen.has(q.id)) errors.push(`${at}: duplicate id`);
    else seen.set(q.id, "pbq.json");
    if (!DOMAINS[q.d]) errors.push(`${at}: domain must be 1-5`);
    if (!q.obj) errors.push(`${at}: missing objective`);
    if (q.type !== "order" && q.type !== "match") errors.push(`${at}: type must be order or match`);
    else validatePbq(q, at);
  });
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s) in the question bank:\n`);
  for (const e of errors.slice(0, 40)) console.error("  - " + e);
  if (errors.length > 40) console.error(`  … and ${errors.length - 40} more`);
  process.exit(1);
}

// ---- answer-length bias guard ----
// If the correct option is systematically the longest (or shortest), a student can
// score without reading the question and every readiness number the app reports is
// inflated. These bots must stay near the ~25% random baseline.
function lengthBot(pickLongest) {
  let hits = 0;
  for (const q of questions) {
    if (q.pbq) continue;
    const lens = q.opts.map((o) => o.length);
    const order = lens
      .map((l, i) => [l, i])
      .sort((a, b) => (pickLongest ? b[0] - a[0] : a[0] - b[0]))
      .map((x) => x[1]);
    const guess = order.slice(0, q.a.length).sort((a, b) => a - b);
    const ans = [...q.a].sort((a, b) => a - b);
    if (guess.length === ans.length && guess.every((v, i) => v === ans[i])) hits++;
  }
  return (hits / questions.filter((q) => !q.pbq).length) * 100;
}
const longBot = lengthBot(true);
const shortBot = lengthBot(false);
const BIAS_FAIL = 35;
if (longBot > BIAS_FAIL || shortBot > BIAS_FAIL) {
  console.error(
    `\n✗ answer-length bias too high (longest ${longBot.toFixed(1)}%, shortest ${shortBot.toFixed(1)}%).` +
      `\n  A bot that never reads the question should score near 25%. Rebalance option lengths.`
  );
  process.exit(1);
}

// ---- absolute-language bias guard ----
// Writers reach for "always / never / eliminates" when inventing wrong answers, which
// lets a student discard those options without knowing the material. "Impossible travel"
// and "always-on VPN" are real SY0-701 terms, so they are excluded from the heuristic.
const ABSOLUTE = /\b(always|entirely|guarantees?|guaranteed|eliminates?|impossible|cannot|never)\b/i;
function absoluteBot() {
  let wrong = 0;
  let right = 0;
  for (const q of questions) {
    if (q.pbq) continue;
    q.opts.forEach((o, i) => {
      if (!ABSOLUTE.test(o.replace(/impossible travel|always-on/gi, ""))) return;
      if (q.a.includes(i)) right++;
      else wrong++;
    });
  }
  return { wrong, right, pct: wrong + right ? (wrong / (wrong + right)) * 100 : 50 };
}
const absBot = absoluteBot();
if (absBot.wrong + absBot.right >= 10 && absBot.pct > 75) {
  console.error(
    `\n✗ absolute-language bias: ${absBot.pct.toFixed(1)}% of options containing an absolute are wrong answers.` +
      `\n  Eliminating every "always/never" option would score far above chance. Rewrite those distractors` +
      `\n  as plausible misconceptions instead.`
  );
  process.exit(1);
}

// ---- stem-keyword overlap guard ----
// If the correct option reliably repeats the most words from the question stem, a student
// can word-match their way to a pass.
const OVERLAP_STOP = new Set(
  ("which that this with from their them when what would should most best first following " +
    "scenario organization company security also into only each other after before been must " +
    "have does some").split(" ")
);
function overlapBot() {
  const words = (s) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
      .filter((w) => w.length > 3 && !OVERLAP_STOP.has(w));
  let hits = 0;
  let decidable = 0;
  for (const q of questions) {
    if (q.pbq || q.a.length !== 1) continue;
    const stem = new Set(words(q.q));
    const scores = q.opts.map((o) => words(o).filter((w) => stem.has(w)).length);
    const max = Math.max(...scores);
    const top = scores.map((v, i) => [v, i]).filter((x) => x[0] === max);
    if (top.length > 1) continue;
    decidable++;
    if (top[0][1] === q.a[0]) hits++;
  }
  return decidable ? (hits / decidable) * 100 : 25;
}
const overBot = overlapBot();
if (overBot > 45) {
  console.error(
    `\n✗ stem-keyword overlap bias: ${overBot.toFixed(1)}% (random ~25%).` +
      `\n  The correct option echoes the stem's wording too often. Vary the vocabulary.`
  );
  process.exit(1);
}

// ---- 80/20 core: tag a capped, curated slice of the bank as high-yield ----
const clusters = JSON.parse(readFileSync(join(root, "data", "high-yield.json"), "utf8"));
const hyErrors = [];
const byTopic = new Map();
for (const q of questions) {
  const key = q.d + "|" + q.topic;
  if (!byTopic.has(key)) byTopic.set(key, []);
  byTopic.get(key).push(q);
}
for (const c of clusters) {
  const pool = [];
  for (const t of c.topics) {
    const hit = byTopic.get(c.d + "|" + t);
    if (!hit) hyErrors.push(`${c.id}: topic "${t}" matches no question in domain ${c.d}`);
    else pool.push(...hit);
  }
  // hardest first, then by id, so the core is deterministic and front-loads the
  // questions most likely to expose a gap
  pool.sort((a, b) => b.diff - a.diff || a.id.localeCompare(b.id));
  if (pool.length < c.cap) hyErrors.push(`${c.id}: cap ${c.cap} exceeds available ${pool.length}`);
  for (const q of pool.slice(0, c.cap)) q.hy = c.id;
}
if (hyErrors.length) {
  console.error(`\n✗ ${hyErrors.length} problem(s) in the high-yield map:\n`);
  for (const e of hyErrors) console.error("  - " + e);
  process.exit(1);
}

const byDomain = {};
const hyDomain = {};
for (const q of questions) {
  byDomain[q.d] = (byDomain[q.d] || 0) + 1;
  if (q.hy) hyDomain[q.d] = (hyDomain[q.d] || 0) + 1;
}
const hyTotal = questions.filter((q) => q.hy).length;

const html = readFileSync(template, "utf8");
const marker = "/*__BANK__*/[]";
if (!html.includes(marker)) {
  console.error(`✗ template is missing the ${marker} injection marker`);
  process.exit(1);
}
// Escape < and the JSON line terminators so payloads like "</script>" inside a
// question body cannot close the script block or break the parser.
const inlined = JSON.stringify(questions)
  .replace(/</g, "\\u003C")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
const bcMarker = "/*__BC__*/{}";
const BC = JSON.parse(readFileSync(join(root, "data", "bootcamp.json"), "utf8"));
{
  // Every module's drill must be fillable from the bank, or the bootcamp
  // silently serves short sets.
  const bcErrors = [];
  const ids = new Set();
  for (const m of BC.modules) {
    if (ids.has(m.id)) bcErrors.push(`${m.id}: duplicate module id`);
    ids.add(m.id);
    if (!m.lesson || m.lesson.length < 3) bcErrors.push(`${m.id}: needs 3+ lesson blocks`);
    if (!m.terms || m.terms.length < 4) bcErrors.push(`${m.id}: needs 4+ key terms`);
    if (!BC.levels.some((l) => l.n === m.level)) bcErrors.push(`${m.id}: unknown level ${m.level}`);
    if (m.sel.exam) continue;
    let pool = questions.filter((q) => m.sel.obj.includes(q.obj));
    if (m.sel.topics) pool = pool.filter((q) => m.sel.topics.includes(q.topic));
    if (m.sel.maxDiff) pool = pool.filter((q) => q.diff <= m.sel.maxDiff);
    if (pool.length < m.sel.n) {
      bcErrors.push(`${m.id}: drill needs ${m.sel.n} questions, selector matches only ${pool.length}`);
    }
    m.pool = pool.length;
  }
  if (bcErrors.length) {
    console.error(`\n✗ ${bcErrors.length} problem(s) in the bootcamp curriculum:\n`);
    for (const e of bcErrors) console.error("  - " + e);
    process.exit(1);
  }
}

// ---- flashcard decks ----
const fcMarker = "/*__FC__*/{}";
const FC = JSON.parse(readFileSync(join(root, "data", "flashcards.json"), "utf8"));
{
  const errs = [];
  const seenDeck = new Set();
  for (const d of FC.decks) {
    if (!d.id || !d.name) errs.push(`deck ${d.id || "?"}: missing id or name`);
    if (seenDeck.has(d.id)) errs.push(`duplicate deck id ${d.id}`);
    seenDeck.add(d.id);
    if (!Array.isArray(d.cards) || !d.cards.length) errs.push(`${d.id}: no cards`);
    const fronts = new Set();
    for (const c of d.cards || []) {
      if (!Array.isArray(c) || c.length !== 2) { errs.push(`${d.id}: card must be [front, back]`); continue; }
      const [f, b] = c;
      if (!f || !b) errs.push(`${d.id}: card has an empty side`);
      if (fronts.has(f)) errs.push(`${d.id}: duplicate front "${f}"`);
      fronts.add(f);
      if (String(b).length < 12) errs.push(`${d.id}: back of "${f}" is too thin to teach anything`);
    }
  }
  if (errs.length) {
    console.error(`\n✗ ${errs.length} problem(s) in the flashcard decks:\n`);
    for (const e of errs) console.error("  - " + e);
    process.exit(1);
  }
}

const objMarker = "/*__OBJ__*/{}";
const OBJDOC = JSON.parse(readFileSync(join(root, "data", "objectives.json"), "utf8"));
if (!html.includes(bcMarker)) {
  console.error(`✗ template is missing the ${bcMarker} injection marker`);
  process.exit(1);
}
if (!html.includes(objMarker)) {
  console.error(`✗ template is missing the ${objMarker} injection marker`);
  process.exit(1);
}
const hyMarker = "/*__HY__*/[]";
if (!html.includes(hyMarker)) {
  console.error(`✗ template is missing the ${hyMarker} injection marker`);
  process.exit(1);
}
if (!html.includes(fcMarker)) {
  console.error(`✗ template is missing the ${fcMarker} injection marker`);
  process.exit(1);
}
const out = html
  .replace(marker, inlined)
  .replace(hyMarker, JSON.stringify(clusters).replace(/</g, "\\u003C"))
  .replace(objMarker, JSON.stringify(OBJDOC.objectives).replace(/</g, "\\u003C"))
  .replace(bcMarker, JSON.stringify(BC).replace(/</g, "\\u003C"))
  .replace(fcMarker, JSON.stringify(FC).replace(/</g, "\\u003C"));
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.html"), out);

const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
console.log(`✓ ${questions.length} questions validated from ${files.length} file(s)`);
for (const d of Object.keys(DOMAINS)) {
  const n = byDomain[d] || 0;
  const share = ((n / questions.length) * 100).toFixed(1);
  const hy = hyDomain[d] || 0;
  console.log(`   D${d} ${DOMAINS[d].name.padEnd(42)} ${String(n).padStart(3)}  ${share}% (exam ${DOMAINS[d].weight}%)  core ${String(hy).padStart(2)}`);
}
console.log(`✓ bootcamp: ${BC.modules.length} modules across ${BC.levels.length} levels, ` +
  `${BC.modules.reduce((n, m) => n + m.lesson.length, 0)} lessons, ` +
  `${BC.modules.reduce((n, m) => n + m.terms.length, 0)} key terms`);
console.log(`✓ flashcards: ${FC.decks.length} decks, ${FC.decks.reduce((n, d) => n + d.cards.length, 0)} cards`);
console.log(`✓ performance-based items: ${questions.filter((q) => q.pbq).length} (order + match)`);
console.log(`✓ length-bias bots: longest ${longBot.toFixed(1)}%, shortest ${shortBot.toFixed(1)}% (random ~25%)`);
console.log(`✓ tell bots: absolutes ${absBot.pct.toFixed(1)}% wrong-side, stem-overlap ${overBot.toFixed(1)}% (random ~25%)`);
console.log(`✓ 80/20 core: ${hyTotal} questions (${((hyTotal / questions.length) * 100).toFixed(1)}% of bank) across ${clusters.length} clusters`);
console.log(`✓ wrote dist/index.html (${kb} KB)`);
