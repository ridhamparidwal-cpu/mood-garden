"""Fern, the garden friend - offline replies.

Used when no ANTHROPIC_API_KEY is set, or when the Claude call fails, so the
chat always answers. It's intentionally simple: it spots the mood in the last
message (using mood_engine) and answers with a warm, short reply plus a gentle
follow-up question. Replies rotate so Fern doesn't repeat herself.
"""

from __future__ import annotations

import re
from typing import Optional

from mood_engine import MOODS, detect_mood

PERSONA_NAME = "Fern"

_BY_MOOD = {
    "happy": [
        "That's wonderful to hear! What was the best part?",
        "I love that for you. Maybe jot it in your journal so you can revisit it on slower days.",
        "Your garden is practically glowing. What do you think sparked it?",
    ],
    "calm": [
        "That sounds peaceful. What's helping you feel settled today?",
        "Lovely. A calm moment is worth savoring, so take one slow breath and enjoy it.",
        "I'm glad you've found some quiet. Is there something from it you'd like to carry forward?",
    ],
    "tired": [
        "That sounds like a lot to carry. You don't have to fix everything today. "
        "Is there one small thing that could make the next hour a little easier?",
        "I'm sorry you're feeling worn down. Rest counts as progress too. "
        "Would some water, a stretch or a few slow breaths help right now?",
        "Thanks for telling me. It's okay to move slowly today. What's weighing on you the most?",
    ],
    "angry": [
        "That sounds really frustrating, and it makes sense that you feel it. Want to tell me what set it off?",
        "I hear you. Breathing out slowly, longer than you breathe in, can take the edge off. What happened?",
        "Anger often points at something that matters to you. What do you wish had gone differently?",
    ],
    None: [
        "I'm listening. Tell me more about how your day has been.",
        "Thanks for sharing that with me. How is it sitting with you?",
        "I'm here. What's on your mind right now?",
    ],
}

_GREETING = re.compile(r"^\s*(hi|hello|hey|hiya|yo|good (morning|afternoon|evening))\b")
_THANKS = re.compile(r"\b(thanks|thank you|thx|ty)\b")
_WHO = re.compile(r"\b(who|what) are you\b|\byour name\b")
_GARDEN = re.compile(r"\b(garden|plants?|points?|flowers?)\b")


def _last_user_text(history: list[dict]) -> str:
    for msg in reversed(history):
        if msg.get("role") == "user":
            return msg.get("content", "")
    return ""


def offline_reply(history: list[dict], scene: Optional[str] = None) -> str:
    """Pick a reply for the latest user message in `history`."""
    text = _last_user_text(history)
    lowered = text.lower().strip()
    turn = sum(1 for m in history if m.get("role") == "user")  # rotates the variants

    if _WHO.search(lowered):
        return (f"I'm {PERSONA_NAME}, a little garden friend. I'm an AI rather than a person, "
                "but I'm happy to listen. How are you feeling?")
    if _GREETING.match(lowered) and len(lowered.split()) <= 5:
        return f"Hi, I'm {PERSONA_NAME}. How are you feeling today?"
    if _THANKS.search(lowered) and len(lowered.split()) <= 6:
        return "Anytime. I'm glad you're here."

    mood = detect_mood(text).mood
    if mood is None and scene in MOODS:
        mood = scene  # fall back to the garden's current mood
    if mood is None and _GARDEN.search(lowered):
        return ("Your garden grows with your attention. Check-ins and journaling earn points "
                "you can spend on new plants.")

    options = _BY_MOOD[mood]
    return options[turn % len(options)]
