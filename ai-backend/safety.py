"""Safety net for a mood journal + chat companion.

People sometimes write the heaviest things in a private journal or to a "friend"
chatbot. If someone mentions hurting themselves or ending their life, the app
must not answer with a cheerful canned line or hand the decision to a language
model. This module spots that language so server.py can respond with a fixed,
carefully worded message instead.

It errs on the side of caution: a few false alarms (an idiom like "I could kill
myself for forgetting") only cost a gentle, caring message.
"""

from __future__ import annotations

import re

_PATTERNS = [
    r"\bkill(?:ing)? myself\b",
    r"\bend(?:ing)? my (?:own )?life\b",
    r"\bend it all\b",
    r"\bsuicid",
    r"\bwant(?:ed|ing)? to die\b",
    r"\bwish i (?:was|were) dead\b",
    r"\bdon'?t want to (?:live|be here|exist|wake up)\b",
    r"\bno reason to (?:live|go on)\b",
    r"\bbetter off (?:dead|without me)\b",
    r"\b(?:hurt|hurting|harm|harming|cut|cutting) myself\b",
    r"\bself[- ]?harm",
    r"\btake my own life\b",
]
_CRISIS = re.compile("|".join(_PATTERNS))


def is_crisis(text: str) -> bool:
    """True if the text contains language about self-harm or suicide."""
    cleaned = (text or "").lower().replace("\u2019", "'")
    return bool(_CRISIS.search(cleaned))


# Deliberately generic: no phone numbers, because the right number depends on
# where the person lives and a wrong one is worse than none.
CRISIS_REPLY = (
    "I'm really glad you told me, and I'm so sorry things feel this heavy right now. "
    "You deserve real support, and I'm only a small garden friend, so please reach out to "
    "someone who can be with you: a person you trust, or a crisis helpline or emergency "
    "number where you live. If you might act on these thoughts, please contact emergency "
    "services now. I'll be right here too."
)

# Short note the journal screen can show next to the mood chip.
JOURNAL_SUPPORT_NOTE = (
    "That sounds really heavy. If you're thinking about hurting yourself, please reach out "
    "to someone you trust or a local helpline right now."
)
