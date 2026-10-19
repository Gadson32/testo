# Where foundations actually come from

GitHub hosts the code. The weights live elsewhere. Know the difference or you'll waste a day looking for a 7GB file in a git repo.

## Sources
- **Hugging Face** (huggingface.co) — the weights themselves (Llama, Qwen, Mistral, Stable Diffusion, Whisper). `git clone` works on HF repos too (they're git-backed), or use `ollama pull <model>` which handles it for you.
- **GitHub** — the inference/training code: `ggml-org/llama.cpp`, `ollama/ollama`, `vllm-project/vllm` for serving; `huggingface/transformers` for fine-tuning; game/agent frameworks you fork and build on top of.

## Forking a foundation for your own use
1. `ollama pull <model>` — fastest path to "model running on my machine," no GitHub needed.
2. Need fine-tuning or custom weights? Fork the model's HF repo, use `peft`/LoRA (cheap — hours on a single GPU, not months on a cluster) to adapt it to your data.
3. Need a different serving stack (batching, multi-GPU)? Fork `vllm-project/vllm` on GitHub instead of Ollama.

## Mixing models (router pattern)
Don't fine-tune one model to do everything. Route:
- cheap/small model → classification, extraction, filtering (fast, near-free)
- strong model → final reasoning, generation, user-facing output

This router is code you write and own — add it to `mcp_server/server.py` as a second tool that picks the model per request.

## Turning this into a service
Package `mcp_server/` as a hosted API (FastAPI + same logic), deploy on a GPU box (RunPod, Lambda Labs, or a cloud VM with a GPU), charge per call/seat. The model is a commodity input; your packaging, latency, and UX are the product.
