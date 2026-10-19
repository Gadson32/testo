"""Minimal MCP server that wraps a local open-weight model (via Ollama) as a tool.

This is the whole pattern in one file: a foundation model you didn't train,
called from code you wrote, exposed as a tool any MCP client (Claude Code
included) can invoke. Swap OLLAMA_MODEL to mix models, or add more tools
below to route different tasks to different models.
"""
import os
import httpx
from mcp.server.fastmcp import FastMCP

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")

mcp = FastMCP("testo-local-model")


@mcp.tool()
def ask_local_model(prompt: str) -> str:
    """Send a prompt to the locally running open-weight model and return its reply."""
    resp = httpx.post(
        f"{OLLAMA_URL}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["response"]


if __name__ == "__main__":
    mcp.run()
