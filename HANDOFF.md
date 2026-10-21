# Handoff — testo

## Status
Branch `claude/github-model-customization-vxbmfe`, pushed to origin. Working tree clean as of this handoff. No PR opened (none was requested).

## What exists
- `README.md` — the build loop: open model → local inference → your code → MCP tool → Claude Code.
- `mcp_server/server.py` — minimal MCP server (`FastMCP`) with one tool, `ask_local_model`, that POSTs to a local Ollama instance (`OLLAMA_URL`, default `http://localhost:11434`) and returns the response.
- `mcp_server/requirements.txt` — `mcp`, `httpx`.
- `.mcp.json` — registers `testo-local-model` with Claude Code (`python mcp_server/server.py`).
- `docs/MODEL_SOURCING.md` — where weights vs. code actually live (Hugging Face vs. GitHub), how to fork/fine-tune, the router pattern for mixing models, and the path to packaging this as a paid API.

## Not done / not verified
- `server.py` has not been run — no Ollama instance was available in this session to test against. Before relying on it: `ollama pull llama3.2`, then `python mcp_server/server.py`, then confirm the tool is callable from a fresh Claude Code session (reload MCP servers after editing `.mcp.json`).
- No router/model-mixing code yet — `docs/MODEL_SOURCING.md` describes the pattern but `server.py` only calls one fixed model (`OLLAMA_MODEL` env var, default `llama3.2`).
- No hosted/API packaging — still local-only, single tool, no auth, no deployment config.
- No tests.

## Next steps (pick one, in order of leverage)
1. **Verify it runs** — pull a model, start the server, confirm Claude Code can call `ask_local_model`. This is the only thing standing between "scaffold" and "working."
2. **Add the router** — second tool or internal branch in `server.py` that picks a cheap vs. strong model per request (classification vs. generation). This is the actual differentiator described in `docs/MODEL_SOURCING.md`.
3. **Package as a service** — wrap the same logic in FastAPI, deploy to a GPU host (RunPod/Lambda Labs), add auth, charge per call.

## Key decisions already made (don't redo this analysis)
- Not training a model from scratch — commercially irrational at this stage.
- Ollama chosen over writing a custom inference server — don't rebuild what already exists.
- MCP chosen as the integration surface because it's what Claude Code speaks natively.
