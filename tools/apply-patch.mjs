#!/usr/bin/env node
// Applies an option-rewrite patch to the question bank.
// Patch shape: [{ "id": "2-019", "opts": ["...", "...", "...", "..."] }, ...]
// Answer indices are preserved, so a patch must keep options in the same order.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bankDir = join(root, "data", "questions");
const patchPath = process.argv[2];
if (!patchPath) {
  console.error("usage: node tools/apply-patch.mjs <patch.json>");
  process.exit(1);
}

const patch = new Map(JSON.parse(readFileSync(patchPath, "utf8")).map((p) => [p.id, p]));
let applied = 0;
const problems = [];

for (const file of readdirSync(bankDir).filter((f) => f.endsWith(".json"))) {
  const path = join(bankDir, file);
  const qs = JSON.parse(readFileSync(path, "utf8"));
  let touched = false;
  for (const q of qs) {
    const p = patch.get(q.id);
    if (!p) continue;
    if (p.opts.length !== q.opts.length) {
      problems.push(`${q.id}: patch has ${p.opts.length} options, question has ${q.opts.length}`);
      continue;
    }
    if (new Set(p.opts).size !== p.opts.length) {
      problems.push(`${q.id}: patch contains duplicate option text`);
      continue;
    }
    q.opts = p.opts;
    touched = true;
    applied++;
    patch.delete(q.id);
  }
  if (touched) writeFileSync(path, JSON.stringify(qs, null, 2) + "\n");
}

for (const id of patch.keys()) problems.push(`${id}: no question with this id`);
if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`✓ applied ${applied} option rewrites`);
