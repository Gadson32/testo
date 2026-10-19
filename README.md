# testo — Build-Your-Own-Agent Starter

Take an open-weight model (foundation), wrap it in your own code, expose it as a tool Claude Code can call via MCP. This is the whole pattern — games, devices, and services are just different wrappers around the same loop.

## The loop
```
open model weights (Hugging Face)
    -> local inference (Ollama)
    -> your code calls it (mcp_server/server.py)
    -> exposed as an MCP tool
    -> Claude Code / any agent calls your tool
    -> YOU own this layer, sell it as a service
```

## 1. Get a foundation model running (5 min)
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2        # swap for qwen2.5, mistral, etc.
ollama run llama3.2 "hello" # sanity check
```

## 2. Run your own MCP server (wraps the model as a tool)
```bash
cd mcp_server
pip install -r requirements.txt
python server.py
```

## 3. Connect it to Claude Code
Add to `.mcp.json` in your project root (already included here):
```json
{
  "mcpServers": {
    "testo-local-model": {
      "command": "python",
      "args": ["mcp_server/server.py"]
    }
  }
}
```
Restart Claude Code / reload MCP servers. Your custom tool (`ask_local_model`) is now callable like any built-in tool.

## 4. Mix models (the actual moat)
`mcp_server/server.py` has a single model call. To mix models, add a router: cheap/fast model for classification or filtering, a stronger model only when needed. That router logic is yours — that's the product, not the weights.

## 5. Where this goes next
- **Games**: swap the tool for a game-state function; the model becomes an NPC brain or content generator.
- **Devices**: swap `ollama.chat()` for a call to your device's control API; the model becomes the decision layer.
- **Services**: wrap this MCP server as a hosted API, charge per call or per seat.

## Repo layout
```
mcp_server/
  server.py          # minimal MCP server wrapping a local model as a tool
  requirements.txt
.mcp.json            # tells Claude Code how to launch your server
docs/MODEL_SOURCING.md  # where to get/fork model foundations on GitHub + HF
```
