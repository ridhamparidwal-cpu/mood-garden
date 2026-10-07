# Mood Garden AI backend (Python)

Powers two features of the app:

1. **Journal mood detection**: as you write, the text is analysed and, when the
   result is confident, the wallpaper switches to that mood.
2. **Fern, the garden friend**: the chat bubble at the bottom-right.

Pure Python 3.9+ standard library: nothing to `pip install`.

## Run it

```bash
cd ai-backend
python server.py            # http://127.0.0.1:8000
```

Then run the app as usual (`pnpm dev`). If the backend is not running, the app
still works: the journal shows "pick a mood above" and Fern gives simple replies.

### Optional: smarter AI with Claude

```bash
# macOS / Linux
export ANTHROPIC_API_KEY=your_key_here
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "your_key_here"

python server.py
```

Without a key it uses the built-in offline engine (`mood_engine.py`, `friend.py`).
If a Claude call ever fails, it falls back to offline automatically.
The key stays in the backend; it is never sent to the browser.
Model defaults to `claude-haiku-4-5-20251001`; change it with `CLAUDE_MODEL`.

## Files

| File | What it does |
|---|---|
| `server.py` | HTTP endpoints `/chat`, `/detect-mood`, `/health` |
| `mood_engine.py` | Offline mood detector (words, phrases, negation, "but" handling) |
| `friend.py` | Offline replies for Fern |
| `llm.py` | Claude client (chat + mood classification) |
| `safety.py` | Spots self-harm language; gets a fixed, caring reply, never sent to the model |
| `test_backend.py` | 30 tests: `python -m unittest -v` |

## Mood mapping

The app has four scenes, so related feelings are folded in:
happy = joy, pride, gratitude · calm = peaceful, relieved · tired = exhausted,
sad, lonely, anxious, stressed · angry = frustrated, annoyed, resentful.
Mixed or weak text changes nothing (confidence below 0.6).

## Settings

- `NEXT_PUBLIC_AI_URL` (frontend): backend URL, default `http://localhost:8000`
- `MOOD_GARDEN_ORIGINS` (backend): allowed browser origins, default `http://localhost:3000,http://127.0.0.1:3000`
- Tuning knobs for the detector are at the top of `mood_engine.py`

Journal and chat text are never logged or stored by the backend.
