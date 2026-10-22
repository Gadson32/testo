# Combined Handoff — CompTIA Prep App + Sentinel Field Stack + Model-Customization Scaffold

This file merges three separate Claude Code sessions into one so a single session can carry all three forward. The other three sessions are being archived once this one confirms it has everything.

Repo for all three: `github.com/Gadson32/testo`.

---

## 1. CompTIA Security+ exam prep app ("Security+ Range")

**What it is:** A self-contained SY0-701 Security+ exam trainer — "536 questions, bootcamp, flashcards, exam simulator, and spaced repetition," per its own artifact description.

**Repo / branch:** `Gadson32/testo`, branch `claude/security-plus-prep-app-445d5r` — pushed, clean, up to date as of last session.

**Source layout:**
- `src/app.html` — unminified HTML/CSS/JS source
- `data/` — all 536 questions, 16 PBQs (performance-based questions), bootcamp curriculum, and flashcard decks, as JSON
- `build.mjs` — build script; validates everything (including 4 "answer-bias bots" that check for answer-position/pattern bias) and compiles to `dist/index.html`
- `tools/selftest.mjs` — automated Playwright test suite
- `README.md` — full documentation of how it's built

**Features:** Dashboard, Bootcamp mode, exam simulator, Flashcards (nav key `0`), deep-dive explanations on each practice question (objective context, clickable glossary terms, "practice more on this objective"), and a per-domain accuracy/coverage score "weighted exactly like the real exam" — target is 85%+ overall with every domain above 80% before test day.

**Known fix already applied:** The in-artifact "Download this app" button was silently failing inside the Artifact preview viewer. Fixed by republishing with the `downloads` runtime capability declared (`capabilities: {downloads: true}`). Confirmed working; committed and pushed.

**Delivered artifacts (last session):**
- Live artifact: `https://claude.ai/artifact/51rLNpyxzmDZWTgyREZp13` (shared "anyone with the link")
- `security-plus-range.html` — standalone runnable file (download-and-open, no server, works offline — the recommended way to actually study, since the artifact preview's progress only lives in that browser tab)
- `security-plus-range-source.zip` — full source project (same contents as the repo)

**Status:** Complete and delivered. No open tasks recorded.

---

## 2. Sentinel Field tech stack (multi-tenant pest-control SaaS)

**What it is:** "Sentinel Field" — a multi-tenant SaaS platform for pest-control field service companies (customers, jobs, technicians, invoicing, treatment reports). Spec given by the user, built out as a full Next.js app.

**Repo / branch:** `Gadson32/testo`, branch `claude/sentinel-field-stack-osh6hg` — 53 files scaffolded and pushed; **PR #1 open** (not merged).

**Tech stack:**
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Multi-tenant architecture: every DB query is scoped by `tenantId`
- Prisma ORM over Supabase PostgreSQL (needs both `DATABASE_URL` — pooled, port 6543 — and `DIRECT_URL` — direct, port 5432 — for the Supabase pgbouncer setup)
- Clerk for auth (middleware-protected routes, webhook syncs `user.created` → Tenant+User records)
- Stripe for subscription billing (webhook handlers update tenant plan on subscription lifecycle events; API version `2026-06-24.dahlia`)
- Resend (email) + Twilio (SMS) for notifications
- Server Actions for CRUD, Zod + React Hook Form for validation, Playwright for e2e
- Deep-link map button (`src/components/ui/navigate-button.tsx`) to Apple/Google Maps — no Maps API key needed

**Schema:** `prisma/schema.prisma` — 10 models: Tenant, User, Customer, Service, Job, JobService, Photo, TreatmentReport, Invoice, InvoiceLineItem.

**Key files already written:** `src/lib/db.ts` (Prisma singleton), `src/lib/stripe.ts`, `src/lib/auth.ts` (`getCurrentUser`/`requireUser`/`requireOwner`), `src/middleware.ts` (Clerk), `src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/api/webhooks/clerk/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/server/actions/{customers,jobs,invoices}.ts`, `.env.example`, `CLAUDE.md`.

**Current blocker — exactly where this stalled:** User is setting up the project locally on Windows (couldn't build on their Mac). They got through:
- Node.js install via Chocolatey, PowerShell execution-policy fix (`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)
- `git fetch origin` + `git checkout claude/sentinel-field-stack-osh6hg` (had to delete a conflicting `package-lock.json` first)
- `npm approve-scripts @prisma/engines prisma sharp unrs-resolver` then `npm install` (553 packages installed OK)
- Reset their Supabase DB password after accidentally pasting the old one in chat (flag: **never ask the user to paste credentials in chat**)

They are stuck editing `.env.local` — pasted a `notepad ...` *command* into the file as literal text instead of running it, corrupting the file. VS Code was opened as the fix. **Next step for whoever picks this up:** walk the user through VS Code → File → Open Folder → `C:\Users\antho\Documents\testo` → open `.env.local` → select-all, delete, paste:
```
DATABASE_URL="postgresql://postgres.lufmsqbqxkubhvdsdpon:NEWPASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.lufmsqbqxkubhvdsdpon:NEWPASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```
(substituting their actual new Supabase password for `NEWPASSWORD`). After that: add Clerk keys, add Supabase API keys (`NEXT_PUBLIC_SUPABASE_URL`, anon key, service role key), run `npm run db:push`, then `npm run dev`. Stripe/Resend/Twilio keys can wait.

**Side note — unrelated artifacts surfaced in the same session:** The user later asked (unrelated to Sentinel Field) for the code of four other standalone HTML apps they'd previously had built. For completeness, these exist and were re-sent as files:

| File | App | Size | What it is |
|---|---|---|---|
| `security-plus-range.html` | Security+ Range | 595 KB | The CompTIA app above — quiz engine, bootcamp, flashcards |
| Gadson32 Playbook | — | 264 KB | Invoicing, quotes, money tools, knowledge base |
| Field Manual | — | 236 KB | Searchable IT/networking reference |
| Deutsch Playbook | — | 80 KB | AI German tutor, flashcards, speaking practice |

Each is a single self-contained `.html` file (no server needed). Two remix combos were suggested and are worth keeping on record:
1. **Tech Training App** = Security+ Range's quiz engine + Field Manual's knowledge base → one app that teaches IT concepts and quizzes on them.
2. **Business + Language App** = Gadson32 Playbook's invoicing/quoting tools + Deutsch Playbook's tutor → one app for running an IT business in Germany with German-language help built in.

**Status: blocked, mid-setup.** Sentinel Field itself is NOT done — code is scaffolded and PR #1 is open, but the user has not yet gotten the app running locally. This is the single most actionable open item across all three merged sessions.

---

## 3. GitHub workflow for model customization (this repo's MCP scaffold)

**What it is:** A working example of taking an open-weight model "foundation" (not training one), wrapping it in your own code, and exposing it as a tool Claude Code can call via MCP — the base pattern for building custom agents, games, or device integrations on top of someone else's model.

**Repo / branch:** `Gadson32/testo`, branch `claude/github-model-customization-vxbmfe` — pushed, clean.

**What's in the repo (root of `testo`, this branch):**
- `README.md` — the 5-step loop: pull a model via Ollama → run the MCP server → wire it into Claude Code via `.mcp.json` → (optionally) add a model-mixing router → package as a game/device/service layer.
- `mcp_server/server.py` — minimal `FastMCP` server exposing one tool, `ask_local_model(prompt)`, which POSTs to a local Ollama instance (`OLLAMA_URL`, default `http://localhost:11434`; `OLLAMA_MODEL`, default `llama3.2`) and returns the response.
- `mcp_server/requirements.txt` — `mcp`, `httpx`.
- `.mcp.json` — registers `testo-local-model` with Claude Code (`python mcp_server/server.py`).
- `docs/MODEL_SOURCING.md` — where foundations actually come from (Hugging Face = weights, GitHub = inference/training code), how to fork/fine-tune cheaply (LoRA/PEFT, hours not months), the router pattern for mixing a cheap model with a strong one, and how to package this as a paid hosted API.
- `HANDOFF.md` (superseded by this file) — prior handoff; not needed once this combined file exists.

**Not done / not verified (carry forward):**
- `server.py` has never actually been run — no Ollama instance was available to test against in-session. Before relying on it: `ollama pull llama3.2` → `python mcp_server/server.py` → confirm Claude Code can call `ask_local_model` after reloading MCP servers.
- No model-router code yet — only one fixed model is called; the router pattern is documented but not implemented.
- No hosted/API packaging yet — local-only, single tool, no auth.
- No tests.

**Already-settled decisions (don't redo this analysis):** not training a model from scratch (irrational cost at this stage); Ollama over a hand-rolled inference server; MCP as the integration surface because Claude Code speaks it natively.

**Status: scaffold complete, unverified.** Working example exists; running it end-to-end is the next concrete step.

---

## Cross-cutting notes for whoever picks this up

- All three projects live in the same repo (`Gadson32/testo`) on **different branches** — don't assume `main` has any of this; check out the specific branch named in each section.
- Security constraint carried over from the Sentinel session: **never ask the user to paste database passwords, API keys, or other credentials into chat.** If one is pasted accidentally, tell the user to rotate it immediately.
- Of the three, Sentinel Field is the only one with a live human waiting mid-task (stuck editing `.env.local` on Windows) — if this session gets picked back up by the user, that's almost certainly what they'll want to finish first.
