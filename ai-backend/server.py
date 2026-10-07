"""Mood Garden AI backend.

    python server.py                 # http://127.0.0.1:8000
    python server.py --port 9000

Endpoints (JSON in, JSON out)
    GET  /health
    POST /detect-mood   {"text": "..."}
                        -> {"mood": "tired"|null, "confidence": 0.82, "source": "claude"|"local"|"none",
                            "support": false, "note": null}
    POST /chat          {"messages": [{"role": "user"|"assistant", "content": "..."}], "scene": "calm"}
                        -> {"reply": "...", "source": "claude"|"local"|"safety"}

Runs with the standard library only. Set ANTHROPIC_API_KEY to use Claude;
otherwise it answers with the built-in offline engine.

Privacy: journal and chat text are never logged or stored by this server.
"""

from __future__ import annotations

import argparse
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Optional

import friend
import llm
import mood_engine
import safety

MAX_BODY_BYTES = 64 * 1024
MAX_TEXT_CHARS = 4000
MAX_CHAT_MESSAGES = 40
MAX_CHAT_MESSAGE_CHARS = 2000


class BadRequest(Exception):
    pass


def _allowed_origins() -> set[str]:
    raw = os.environ.get("MOOD_GARDEN_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return {o.strip() for o in raw.split(",") if o.strip()}


# --------------------------------------------------------------------------- #
# Request logic (pure functions, easy to test)
# --------------------------------------------------------------------------- #
def handle_detect(payload: dict) -> dict:
    text = payload.get("text")
    if not isinstance(text, str):
        raise BadRequest("'text' must be a string")
    text = text.strip()[-MAX_TEXT_CHARS:]          # keep the most recent part
    if not text:
        return {"mood": None, "confidence": 0.0, "source": "none", "support": False, "note": None}

    support = safety.is_crisis(text)
    note = safety.JOURNAL_SUPPORT_NOTE if support else None

    if llm.available():
        try:
            result = llm.detect_mood(text)
            return {**result, "source": "claude", "support": support, "note": note}
        except llm.LLMError:
            pass  # fall through to the offline engine

    local = mood_engine.detect_mood(text)
    return {"mood": local.mood, "confidence": local.confidence, "source": "local",
            "support": support, "note": note}


def handle_chat(payload: dict) -> dict:
    raw = payload.get("messages")
    if not isinstance(raw, list) or not raw:
        raise BadRequest("'messages' must be a non-empty list")

    history = []
    for item in raw[-MAX_CHAT_MESSAGES:]:
        if not isinstance(item, dict):
            raise BadRequest("each message must be an object")
        role, content = item.get("role"), item.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str):
            raise BadRequest("each message needs a role (user/assistant) and string content")
        history.append({"role": role, "content": content[:MAX_CHAT_MESSAGE_CHARS]})

    if history[-1]["role"] != "user" or not history[-1]["content"].strip():
        raise BadRequest("the last message must be a non-empty user message")

    scene: Optional[str] = payload.get("scene") if isinstance(payload.get("scene"), str) else None

    # Self-harm language always gets the fixed, carefully worded reply.
    if safety.is_crisis(history[-1]["content"]):
        return {"reply": safety.CRISIS_REPLY, "source": "safety"}

    if llm.available():
        try:
            return {"reply": llm.chat(history, scene), "source": "claude"}
        except llm.LLMError:
            pass  # fall through to the offline friend

    return {"reply": friend.offline_reply(history, scene), "source": "local"}


# --------------------------------------------------------------------------- #
# HTTP plumbing
# --------------------------------------------------------------------------- #
class Handler(BaseHTTPRequestHandler):
    server_version = "MoodGardenAI/1.0"

    def _cors(self) -> None:
        origin = self.headers.get("Origin")
        if origin and origin in _allowed_origins():
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send(self, status: int, body: Optional[dict] = None) -> None:
        data = json.dumps(body).encode("utf-8") if body is not None else b""
        self.send_response(status)
        self._cors()
        if body is not None:
            self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:  # CORS preflight
        self._send(204)

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send(200, {"status": "ok", "llm": llm.available(),
                             "model": llm.model() if llm.available() else None})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        routes = {"/detect-mood": handle_detect, "/chat": handle_chat}
        route = routes.get(self.path)
        if route is None:
            return self._send(404, {"error": "not found"})

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY_BYTES:
                raise BadRequest("body missing or too large")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(payload, dict):
                raise BadRequest("body must be a JSON object")
            self._send(200, route(payload))
        except BadRequest as err:
            self._send(400, {"error": str(err)})
        except (ValueError, UnicodeDecodeError):
            self._send(400, {"error": "invalid JSON"})
        except Exception:  # never leak internals or user text
            self._send(500, {"error": "internal error"})

    def log_message(self, fmt: str, *args) -> None:
        # Request line + status only (no bodies), so journal text never hits the console.
        super().log_message(fmt, *args)


def make_server(host: str = "127.0.0.1", port: int = 8000) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), Handler)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mood Garden AI backend")
    parser.add_argument("--host", default="127.0.0.1", help="keep 127.0.0.1 unless you know why not")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    mode = f"Claude ({llm.model()})" if llm.available() else "offline engine (set ANTHROPIC_API_KEY to use Claude)"
    print(f"Mood Garden AI backend on http://{args.host}:{args.port}  |  mode: {mode}")
    try:
        make_server(args.host, args.port).serve_forever()
    except KeyboardInterrupt:
        print("\nBye!")


if __name__ == "__main__":
    main()
