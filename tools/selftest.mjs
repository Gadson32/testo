#!/usr/bin/env node
// End-to-end self-test for the built app.
//
//   node build.mjs && node tools/selftest.mjs
//
// build.mjs guards the CONTENT (schema, coverage, answer-bias bots). This guards the
// BEHAVIOUR: that every page renders, every study mode can be driven to completion,
// progress survives a reload, and nothing throws along the way.
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist", "index.html");
if (!existsSync(dist)) {
  console.error("✗ dist/index.html is missing — run `node build.mjs` first");
  process.exit(1);
}

const results = [];
let failures = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail && !ok ? "  — " + detail : ""}`);
}
function section(t) { console.log(`\n${t}`); }

// ---------- static checks, no browser needed ----------
section("static");
const html = readFileSync(dist, "utf8");
{
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  check("no duplicate element ids", dupes.length === 0, dupes.join(", "));

  const leftover = ["/*__BANK__*/", "/*__HY__*/", "/*__OBJ__*/", "/*__BC__*/", "/*__FC__*/"]
    .filter((m) => html.includes(m + "[]") || html.includes(m + "{}"));
  check("all data markers were replaced", leftover.length === 0, leftover.join(", "));

  // A stray </script> inside inlined JSON terminates the script block early.
  const opens = (html.match(/<script\b/gi) || []).length;
  const closes = (html.match(/<\/script>/gi) || []).length;
  check("script tags balanced", opens === closes, `${opens} open / ${closes} close`);

  check("hidden attribute is enforced", /\[hidden\]\{display:none !important\}/.test(html));

  // The file is meant to be opened offline, so every webfont needs a local fallback.
  const stacks = [...html.matchAll(/font-family:\s*([^;}]+)/g)].map((m) => m[1].trim());
  const bare = stacks.filter((s) => !/(sans-serif|serif|monospace|system-ui|inherit)/.test(s));
  check("every font stack has a local fallback", bare.length === 0, bare.slice(0, 3).join(" | "));
}

// ---------- browser checks ----------
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
// The app uses native confirm() for destructive steps; headless auto-dismisses them.
const dialogs = [];
page.on("dialog", (d) => { dialogs.push(d.message()); d.accept(); });
// Resource-load failures are environment noise (this sandbox blocks the Google Fonts
// CDN); the app declares fallback families for every face. Only script errors matter.
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const t = m.text();
  if (/Failed to load resource|ERR_CERT|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/.test(t)) return;
  errors.push(t);
});
await page.goto("file://" + dist);
await page.waitForTimeout(300);

const go = async (name) => { await page.click(`.navbtn[data-go="${name}"]`); await page.waitForTimeout(160); };
const visible = (sel) => page.isVisible(sel);

// Answers whatever kind of item is currently showing — MC, order, or match — so any
// loop that walks through a mixed set (practice's default "smart" mode includes PBQs
// alongside multiple choice) can't stall on a question type it doesn't know how to fill.
async function answerCurrentItem(p = page){
  const opt = await p.$("#qOpts .optbtn:not([disabled])");
  if (opt) { await opt.click(); return true; }
  const sels = await p.$$("#qOpts select");
  if (sels.length) {
    for (const s of sels) {
      const opts = await s.$$eval("option", (os) => os.map((o) => o.value).filter(Boolean));
      if (opts.length) await s.selectOption(opts[0]);
    }
    return sels.length > 0;
  }
  return false;
}

section("data reached the page");
{
  const d = await page.evaluate(() => ({
    bank: typeof BANK !== "undefined" ? BANK.length : -1,
    hy: typeof HY !== "undefined" ? HY.length : -1,
    bc: typeof BC !== "undefined" ? (BC.modules || []).length : -1,
    fc: typeof FC !== "undefined" ? (FC.decks || []).length : -1,
    cards: typeof FC !== "undefined" ? (FC.decks || []).reduce((n, x) => n + x.cards.length, 0) : -1,
  }));
  check("question bank loaded", d.bank >= 500, `${d.bank} items`);
  check("high-yield clusters loaded", d.hy > 0, `${d.hy}`);
  check("bootcamp modules loaded", d.bc > 0, `${d.bc}`);
  check("flashcard decks loaded", d.fc > 0, `${d.fc} decks / ${d.cards} cards`);
}

section("every page renders");
for (const p of ["home", "bootcamp", "core", "practice", "exam", "drill", "flash", "flagged", "history", "settings"]) {
  await go(p);
  const on = await visible(`#page-${p}`);
  const txt = (await page.textContent(`#page-${p}`)) || "";
  check(`${p} page visible and populated`, on && txt.trim().length > 40);
}

section("no invisible overlay swallows clicks");
{
  await go("home");
  const blocker = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, 300);
    const panel = document.getElementById("navPanel");
    return panel && panel.contains(el) ? "navPanel" : null;
  });
  check("nothing intercepts pointer events", blocker === null, blocker || "");
}

section("flashcards");
{
  await go("flash");
  const decks = await page.$$("#fcGrid .fcdeck");
  check("deck grid rendered", decks.length > 0, `${decks.length} decks`);
  await decks[0].click();
  await page.waitForTimeout(150);
  check("session opens", await visible("#fcSession"));
  const front = (await page.textContent("#fcFront")) || "";
  check("card front shown", front.trim().length > 0);
  check("answer hidden before reveal", !(await visible("#fcBack")));
  await page.click("#fcShow");
  await page.waitForTimeout(120);
  check("answer revealed on demand", await visible("#fcBack"));
  check("grade buttons appear", await visible("#fcGot"));

  // Drive a whole deck, always answering "missed" — this is the path that used to loop.
  const total = await page.evaluate(() => FCS.total);
  let guard = total * 3 + 20;
  while ((await visible("#fcSession")) && guard-- > 0) {
    if (!(await visible("#fcGot"))) await page.click("#fcShow");
    await page.click("#fcMiss");
    await page.waitForTimeout(8);
  }
  check("all-missed run terminates (no infinite repeat)", guard > 0, `ran out after ${total * 3 + 20} steps`);
  check("summary shown at the end", await visible("#fcDone"));
  const stored = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("secplus.range.v1") || "{}").cards || {}).length);
  check("card results persisted", stored > 0, `${stored} cards recorded`);
}

section("practice set end to end");
{
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);
  await go("practice");
  await page.selectOption("#pCount", "10");
  await page.click("#startPractice");
  await page.waitForTimeout(200);
  check("quiz page opened", await visible("#page-quiz"));
  let answered = 0;
  for (let i = 0; i < 40; i++) {
    if (await visible("#page-result")) break;
    if (await answerCurrentItem()) answered++;
    await page.waitForTimeout(20);
    const sb = await page.$("#submitBtn");
    if (sb && (await sb.isVisible()) && !(await sb.isDisabled())) await sb.click();
    await page.waitForTimeout(80);
    const nb = await page.$("#nextBtn");
    if (nb && (await nb.isVisible())) await nb.click();
    await page.waitForTimeout(80);
  }
  check("answered questions", answered > 0, `${answered}`);
  check("reached the results page", await visible("#page-result"));
  const st = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("secplus.range.v1") || "{}").stats || {}).length);
  check("answers recorded to stats", st > 0, `${st} items`);
}

section("deep-dive: objective context, glossary, practice-more");
{
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);
  await go("practice");
  await page.selectOption("#pCount", "10");
  await page.click("#startPractice");
  await page.waitForTimeout(200);
  // Click through until a question shows at least one glossary chip, or we run out.
  let found = false;
  for (let i = 0; i < 10 && !found; i++) {
    await answerCurrentItem();
    const sb = await page.$("#submitBtn");
    if (sb && (await sb.isVisible()) && !(await sb.isDisabled())) await sb.click();
    await page.waitForTimeout(90);
    const hasObjline = await visible("#qExp .objline");
    check("objective context shown for every graded item", hasObjline);
    const objText = hasObjline ? (await page.textContent("#qExp .objline")) || "" : "";
    check("objective line names the objective code", /Objective \d\.\d/.test(objText), objText || "(no .objline rendered)");
    const moreBtn = await page.$("#qExp .btn.ghost.small");
    check("practice-more-on-objective button offered", !!moreBtn);
    const chips = await page.$$("#qExp .glosschip");
    if (chips.length) {
      found = true;
      await chips[0].click();
      await page.waitForTimeout(80);
      const def = await page.$(".glossdef");
      check("glossary chip reveals a definition on click", !!def && (await def.isVisible()));
      const defText = (def && (await def.textContent())) || "";
      check("glossary definition is non-trivial", defText.trim().length > 15, defText);
      await chips[0].click();
      await page.waitForTimeout(80);
      const stillThere = await page.$(".glossdef");
      check("glossary chip collapses on second click",
        !stillThere || !(await stillThere.isVisible()));
    }
    const nb = await page.$("#nextBtn");
    if (nb && (await nb.isVisible())) await nb.click();
    await page.waitForTimeout(90);
    if (await visible("#page-result")) break;
  }
  if (!found) {
    // Only ~23% of questions carry a glossary term, so a 10-question random draw can
    // legitimately miss one. Force a known hit directly rather than resampling.
    await page.evaluate(() => {
      const q = BANK.find((x) => glossaryHits(x.q + " " + x.exp + " " + (x.tip || "")).length);
      startQuiz([q], { label: "glossary check" });
    });
    await page.waitForTimeout(150);
    await answerCurrentItem();
    await page.click("#submitBtn");
    await page.waitForTimeout(120);
    found = (await page.$$("#qExp .glosschip")).length > 0;
  }
  check("at least one question in the run surfaced a glossary chip", found);
}

section("weak drill mixes in unseen siblings");
{
  // The preceding practice run answers randomly, so it can legitimately score 100% and
  // leave nothing due — that is not a defect. Force one deterministic miss so this
  // section tests the actual mechanism instead of hoping the random run got one wrong.
  await page.evaluate(() => { recordStat(BANK[0], false); save(); });
  const info = await page.evaluate(() => {
    const due = drillQueue();
    if (!due.length) return { due: 0 };
    const sib = drillSiblings(due.slice(0, 30), 10);
    return {
      due: due.length,
      sib: sib.length,
      overlap: sib.filter((s) => due.some((d) => d.id === s.id)).length,
      sameObj: sib.every((s) => due.some((d) => d.obj === s.obj)),
    };
  });
  check("drill queue populated after a miss", info.due > 0, `${info.due} due`);
  if (info.due) {
    check("siblings are distinct from the due items", info.overlap === 0);
    check("siblings share an objective with a due item", info.sib === 0 || info.sameObj === true);
  }
}

section("exam simulation");
{
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);
  await go("exam");
  await page.click("#startExam45");
  await page.waitForTimeout(250);
  check("exam started", await visible("#page-quiz"));
  const n = await page.evaluate(() => Q.items.length);
  check("half exam builds exactly 45 items", n === 45, `${n}`);
  check("exam mode defers grading", await page.evaluate(() => Q.mode === "exam"));

  // Answer the first item, move on, then go back — exam mode must allow changes.
  const first = await page.$("#qOpts .optbtn");
  if (first) await first.click();
  await page.click("#submitBtn");
  await page.waitForTimeout(100);
  check("no instant feedback in exam mode", !(await visible("#qExp")) || (await page.textContent("#qExp")).trim() === "");
  // In exam mode the submit button reads "Save & next" and advances; nextBtn stays hidden.
  const label = await page.textContent("#submitBtn");
  check("submit is labelled for exam flow", /Save/.test(label || ""), label || "");
  check("advanced to question 2", (await page.evaluate(() => Q.i)) === 1);
  const prevBtn = await page.$("#prevBtn");
  const prevVisible = prevBtn && (await prevBtn.isVisible());
  check("back navigation available in exam mode", !!prevVisible);
  if (prevVisible) {
    await prevBtn.click();
    await page.waitForTimeout(100);
    check("returned to question 1", (await page.evaluate(() => Q.i)) === 0);
    check("previous answer still selected", await page.evaluate(() => !!Q.responses[0]));
  }

  await page.click("#reviewBtn");
  await page.waitForTimeout(150);
  check("review navigator opens", await visible("#navPanel"));
  const cells = await page.$$("#navGrid .navcell");
  check("review grid has a cell per question", cells.length === 45, `${cells.length}`);
  const summary = (await page.textContent("#navSummary")) || "";
  check("review warns about blanks", /left blank/.test(summary), summary);
  await page.click("#navClose");
  await page.waitForTimeout(120);
  check("review closes", !(await visible("#navPanel")));

  await page.click("#reviewBtn");
  await page.waitForTimeout(120);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  check("Escape dismisses the review modal", !(await visible("#navPanel")));

  // Jump to the end and submit, confirming stats are written only at submission.
  const statsMid = await page.evaluate(() => Object.keys(S.stats).length);
  check("no stats written mid-exam", statsMid === 0, `${statsMid} written early`);
  await page.evaluate(() => { goTo(Q.items.length - 1); });
  await page.waitForTimeout(150);
  const lastLabel = await page.textContent("#submitBtn");
  check("last exam question offers save, not finish", /Save answer/.test(lastLabel || ""), lastLabel || "");
  const lastOpt = await page.$("#qOpts .optbtn");
  if (lastOpt) await lastOpt.click();
  await page.click("#submitBtn");
  await page.waitForTimeout(200);
  check("saving the last answer opens review", await visible("#navPanel"));
  const before = dialogs.length;
  await page.click("#navSubmit");
  await page.waitForTimeout(300);
  check("submitting with blanks warns first", dialogs.length > before,
    "no confirm shown for unanswered questions");
  check("exam reaches results", await visible("#page-result"));
  const statsEnd = await page.evaluate(() => Object.keys(S.stats).length);
  check("stats written at submission", statsEnd > 0, `${statsEnd}`);
}

section("performance-based questions");
{
  await go("practice");
  await page.click('input[name="pmode"][value="pbq"]');
  await page.waitForTimeout(80);
  await page.click("#startPractice");
  await page.waitForTimeout(250);
  const kinds = await page.evaluate(() => Q.items.map((x) => x.q.type));
  check("PBQ-only set contains only PBQs", kinds.every((t) => t === "order" || t === "match"), kinds.slice(0, 5).join(","));
  let sawOrder = false, sawMatch = false;
  for (let i = 0; i < kinds.length && i < 20; i++) {
    const t = await page.evaluate(() => Q.items[Q.i].q.type);
    if (t === "order") {
      sawOrder = sawOrder || (await page.$$("#qOpts .ordrow")).length > 0 || (await page.$$("#qOpts button")).length > 0;
    } else if (t === "match") {
      sawMatch = sawMatch || (await page.$$("#qOpts select")).length > 0;
    }
    // Matching items deliberately refuse to submit until every row is assigned
    // outside exam mode, so fill them the way a student would.
    if (t === "match") {
      const sels = await page.$$("#qOpts select");
      for (const s of sels) {
        const opts = await s.$$eval("option", (os) => os.map((o) => o.value).filter(Boolean));
        if (opts.length) await s.selectOption(opts[0]);
      }
      await page.waitForTimeout(40);
    }
    const sb = await page.$("#submitBtn");
    if (sb && (await sb.isVisible())) {
      if (await sb.isDisabled()) {
        check("submit enabled after answering " + t + " item", false, "still disabled");
        break;
      }
      await sb.click();
    }
    await page.waitForTimeout(70);
    const nb = await page.$("#nextBtn");
    if (nb && (await nb.isVisible())) await nb.click();
    await page.waitForTimeout(70);
    if (await visible("#page-result")) break;
  }
  check("ordering items render controls", sawOrder);
  check("matching items render selects", sawMatch);
  check("PBQ set completes", await visible("#page-result"));
}

section("bootcamp");
{
  await go("bootcamp");
  const cards = await page.$$("#bcList .modcard, .modcard");
  check("module cards render", cards.length > 0, `${cards.length}`);
  await page.evaluate(() => openModule(BC.modules[0].id));
  await page.waitForTimeout(200);
  check("module page opens", await visible("#page-module"));
  const lesson = (await page.textContent("#modLesson")) || "";
  check("lesson content renders", lesson.trim().length > 200, `${lesson.trim().length} chars`);
  const terms = await page.$$("#modTerms tr");
  check("key terms render", terms.length > 0, `${terms.length}`);
  await page.click("#modStart");
  await page.waitForTimeout(250);
  check("module check starts a quiz", await visible("#page-quiz"));
  check("quiz is tagged to the module", await page.evaluate(() => !!Q.bcModule));
  await page.evaluate(() => { Q.done = true; go("bootcamp"); });
  await page.waitForTimeout(150);
}

section("persistence across reload");
{
  const before = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("secplus.range.v1") || "{}").stats || {}).length);
  await page.reload();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => Object.keys(S.stats).length);
  check("stats survive a reload", after === before && after > 0, `${before} → ${after}`);
}

section("storage health detection (the reported \"progress disappears\" bug)");
{
  // Top-level (non-embedded) page with working storage: no warning shown.
  await go("home");
  check("banner hidden on a normal top-level page", !(await visible("#storageBanner")));
  await go("settings");
  let status = (await page.textContent("#storageStatus")) || "";
  check("settings reports storage OK on a normal page", /working normally/.test(status), status);

  // Simulate the actual failure mode (embedded in a sandboxed preview) by driving the
  // same isEmbedded()/storageWorks() code path the app itself calls, rather than trying
  // to get a real cross-origin sandboxed iframe past Chromium's file:// restrictions,
  // which is a browser security wall, not something the app can be blamed for.
  await page.evaluate(() => { window.__realIsEmbedded = isEmbedded; window.isEmbedded = () => true; checkStorageHealth(); });
  await page.waitForTimeout(80);
  check("embedding trips the storage warning banner", await visible("#storageBanner"));
  const bannerText = (await page.textContent("#storageBannerText")) || "";
  check("banner explains the risk in plain language", /progress|storage/i.test(bannerText), bannerText);
  check("banner offers a download-this-app escape hatch", await page.$("#bannerDownload") !== null);
  check("banner offers a copy-progress escape hatch", await page.$("#bannerCopy") !== null);

  await go("settings");
  status = (await page.textContent("#storageStatus")) || "";
  check("settings status line reflects the embedded warning", /embedded preview/.test(status), status);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#bannerDownload"),
  ]);
  check("download button produces a real file", /\.html$/.test(download.suggestedFilename()), download.suggestedFilename());

  await page.click("#bannerDismiss");
  await page.waitForTimeout(80);
  check("dismiss hides the banner for this view", !(await visible("#storageBanner")));

  // Restore real detection and confirm it goes back to clean on a genuinely healthy page.
  // (A plain `delete` doesn't work here: `isEmbedded` is a function declaration, which
  // makes its global-object property non-configurable — the assignment above only
  // shadowed its value, so it has to be reassigned back explicitly, not deleted.)
  await page.evaluate(() => { window.isEmbedded = window.__realIsEmbedded; checkStorageHealth(); });
  await page.waitForTimeout(80);
  check("banner clears once the embedded condition is gone", !(await visible("#storageBanner")));
}

section("theme");
{
  await go("settings");
  const t = await page.$("#themeBtn");
  if (t) {
    const bgBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await t.click();
    await page.waitForTimeout(150);
    const bgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check("theme toggle changes the background", bgBefore !== bgAfter, `${bgBefore} → ${bgAfter}`);
  } else {
    check("theme toggle present on settings", false, "#themeBtn not found");
  }
}

section("runtime errors");
check("no uncaught errors during the run", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();

const passed = results.length - failures;
console.log(`\n${failures ? "✗" : "✓"} ${passed}/${results.length} checks passed`);
if (failures) {
  console.log("\nfailed:");
  for (const r of results.filter((x) => !x.ok)) console.log(`  - ${r.name}${r.detail ? ": " + r.detail : ""}`);
}
process.exit(failures ? 1 : 0);
