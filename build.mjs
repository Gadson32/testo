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

if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s) in the question bank:\n`);
  for (const e of errors.slice(0, 40)) console.error("  - " + e);
  if (errors.length > 40) console.error(`  … and ${errors.length - 40} more`);
  process.exit(1);
}

const byDomain = {};
for (const q of questions) byDomain[q.d] = (byDomain[q.d] || 0) + 1;

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
const out = html.replace(marker, inlined);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.html"), out);

const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
console.log(`✓ ${questions.length} questions validated from ${files.length} file(s)`);
for (const d of Object.keys(DOMAINS)) {
  const n = byDomain[d] || 0;
  const share = ((n / questions.length) * 100).toFixed(1);
  console.log(`   D${d} ${DOMAINS[d].name.padEnd(42)} ${String(n).padStart(3)}  ${share}% (exam ${DOMAINS[d].weight}%)`);
}
console.log(`✓ wrote dist/index.html (${kb} KB)`);
