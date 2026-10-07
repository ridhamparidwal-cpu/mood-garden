"""Offline mood detection for Mood Garden journal entries.

This is the fallback "brain" used when no ANTHROPIC_API_KEY is configured (or
when the Claude call fails). It needs no packages and no network.

How it works
------------
1. Multi-word phrases ("burnt out", "fed up", "can't sleep") are matched first.
2. Remaining words are looked up in a small emotion lexicon, each word having a
   weight (strong words count more than mild ones).
3. Words are adjusted by context:
     * intensifiers   "really exhausted"  -> stronger
     * downtoners     "a bit annoyed"     -> weaker
     * negation       "not happy"         -> leans toward "tired"
                      "not angry"         -> leans toward "calm"
4. Contrast: in "I was happy but now I'm exhausted", the part after "but"
   counts more, because it's how the person feels *now*.
5. Scores become a confidence value. If the signal is weak or the moods are
   evenly mixed, we return mood=None so the wallpaper does NOT change.

The app only has four scenes, so related feelings are folded in:
    happy = joy, excitement, pride, gratitude, affection
    calm  = peaceful, relaxed, content, relieved
    tired = exhausted, drained, sad, lonely, low, anxious, stressed, overwhelmed
    angry = anger, frustration, irritation, resentment
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

MOODS = ("happy", "calm", "tired", "angry")

# --------------------------------------------------------------------------- #
# Lexicon: word -> weight. Keys are base forms; inflections are found by
# _candidates() below ("excited" -> "excite", "worries" -> "worrie"/"worry"...).
# --------------------------------------------------------------------------- #
WORDS: dict[str, dict[str, float]] = {
    "happy": {
        "happy": 1.0, "happier": 1.0, "happiest": 1.0, "glad": 0.8, "joy": 1.0, "joyful": 1.0,
        "cheerful": 1.0, "delighted": 1.0, "thrilled": 1.2, "excited": 1.0, "excite": 1.0,
        "elated": 1.2, "ecstatic": 1.2, "overjoyed": 1.2, "great": 0.8, "awesome": 0.9,
        "amazing": 0.9, "wonderful": 0.9, "fantastic": 0.9, "love": 0.8, "loved": 0.8,
        "proud": 0.9, "grateful": 0.9, "thankful": 0.8, "blessed": 0.8, "fun": 0.7,
        "smile": 0.7, "smiling": 0.7, "laugh": 0.7, "laughing": 0.7, "celebrate": 0.8,
        "celebrating": 0.8, "yay": 0.9, "hooray": 0.9, "good": 0.5, "nice": 0.5,
        "enjoy": 0.8, "enjoyed": 0.8, "enjoying": 0.8, "lucky": 0.7, "hopeful": 0.7,
        "optimistic": 0.8, "motivated": 0.7, "energized": 0.8, "energised": 0.8,
    },
    "calm": {
        "calm": 1.0, "peaceful": 1.0, "peace": 0.9, "relaxed": 1.0, "relax": 0.9,
        "serene": 1.0, "tranquil": 1.0, "content": 0.8, "contented": 0.8, "relieved": 0.9,
        "relief": 0.9, "soothing": 0.8, "gentle": 0.6, "cozy": 0.7, "cosy": 0.7,
        "quiet": 0.6, "steady": 0.7, "grounded": 0.9, "balanced": 0.8,
        "comfortable": 0.7, "safe": 0.6, "settled": 0.7, "mellow": 0.8, "centered": 0.8,
        "centred": 0.8, "unhurried": 0.8, "breathe": 0.6, "breathing": 0.5, "meditate": 0.8,
        "meditating": 0.8, "meditation": 0.8, "slow": 0.4, "easy": 0.4,
    },
    "tired": {
        "tired": 1.0, "exhausted": 1.2, "exhaust": 1.0, "sleepy": 0.9, "drained": 1.0,
        "drain": 0.9, "worn": 0.7, "fatigue": 1.0, "fatigued": 1.0, "burnout": 1.1,
        "weary": 1.0, "lethargic": 1.0, "drowsy": 0.9, "yawn": 0.6, "yawning": 0.6,
        "insomnia": 0.9, "overwhelmed": 1.0, "overwhelm": 0.9, "stressed": 1.0, "stress": 0.8,
        "anxious": 1.0, "anxiety": 1.0, "worried": 0.9, "worry": 0.8, "nervous": 0.8,
        "panicking": 1.0, "panic": 0.9, "sad": 1.0, "unhappy": 1.0, "lonely": 1.0,
        "alone": 0.5, "empty": 0.9, "numb": 0.9, "hopeless": 1.1, "depressed": 1.1,
        "miserable": 1.1, "gloomy": 0.9, "heavy": 0.6, "cry": 0.9, "crying": 0.9,
        "cried": 0.9, "tears": 0.7, "hurt": 0.7, "hurting": 0.7, "sick": 0.6, "ill": 0.6,
        "unwell": 0.7, "lost": 0.5, "stuck": 0.6, "burdened": 0.9, "discouraged": 0.9,
        "disappointed": 0.8, "grief": 0.9, "grieving": 0.9, "homesick": 0.9,
    },
    "angry": {
        "angry": 1.0, "mad": 0.9, "furious": 1.2, "annoyed": 0.8, "annoy": 0.8,
        "annoying": 0.8, "irritated": 0.9, "irritate": 0.9, "irritating": 0.9,
        "frustrated": 1.0, "frustrate": 1.0, "frustrating": 1.0, "frustration": 1.0,
        "rage": 1.2, "raging": 1.2, "livid": 1.2, "irate": 1.2, "fuming": 1.2,
        "hate": 1.0, "hated": 1.0, "hatred": 1.0, "resent": 0.9, "resentful": 0.9,
        "resentment": 0.9, "outraged": 1.2, "bitter": 0.8, "hostile": 0.9, "unfair": 0.8,
        "betrayed": 1.0, "betray": 1.0, "disrespected": 1.0, "disrespect": 0.9,
        "insulted": 0.9, "infuriating": 1.2, "infuriated": 1.2, "enraged": 1.2,
        "yelled": 0.8, "yelling": 0.8, "shouted": 0.8, "shouting": 0.8, "argued": 0.7,
        "argument": 0.7, "arguing": 0.7, "fight": 0.6, "fought": 0.7, "snapped": 0.8,
        "boiling": 0.8, "seething": 1.2, "temper": 0.6, "grr": 0.8, "ugh": 0.5,
    },
}

PHRASES: dict[str, dict[str, float]] = {
    "happy": {
        "over the moon": 1.3, "best day": 1.1, "feel great": 1.0, "feeling great": 1.0,
        "feel good": 0.8, "feeling good": 0.8, "good day": 0.8, "made my day": 1.0,
        "on top of the world": 1.3, "can't wait": 0.8, "cant wait": 0.8,
        "so happy": 1.2, "went well": 0.8, "went great": 1.0,
    },
    "calm": {
        "at peace": 1.2, "at ease": 1.1, "deep breath": 0.8, "deep breaths": 0.8,
        "feel safe": 0.8, "no rush": 0.8, "let go": 0.7, "letting go": 0.7,
        "peace of mind": 1.1, "feeling better": 0.6, "slowed down": 0.8, "took a walk": 0.6,
    },
    "tired": {
        "can't sleep": 1.0, "cant sleep": 1.0, "couldn't sleep": 1.0, "couldnt sleep": 1.0,
        "no energy": 1.2, "burnt out": 1.2, "burned out": 1.2, "worn out": 1.1,
        "run down": 1.0, "feel down": 1.0, "feeling down": 1.0, "feel low": 1.0,
        "feeling low": 1.0, "can't cope": 1.1, "cant cope": 1.1, "falling apart": 1.1,
        "feel alone": 1.0, "feeling alone": 1.0, "so alone": 1.0, "no motivation": 1.0,
        "too much": 0.7, "give up": 0.9, "don't care anymore": 1.0, "dont care anymore": 1.0,
        "long day": 0.7, "rough day": 0.9, "bad day": 0.9,
    },
    "angry": {
        "fed up": 1.1, "sick of": 1.0, "had enough": 1.0, "can't stand": 1.0,
        "cant stand": 1.0, "so unfair": 1.0, "makes me mad": 1.1, "blew up": 1.0,
        "lost my temper": 1.2, "pissed off": 1.2, "ticked off": 1.0, "want to scream": 1.1,
        "drives me crazy": 1.0, "driving me crazy": 1.0, "over it": 0.7,
        "sick and tired": 1.1, "tired of": 0.7, "calm down": 0.6,
    },
}

EMOJI: dict[str, tuple[str, float]] = {
    "😊": ("happy", 0.9), "😄": ("happy", 1.0), "😁": ("happy", 1.0), "😀": ("happy", 0.9),
    "🥰": ("happy", 1.0), "😍": ("happy", 1.0), "🎉": ("happy", 1.0), "🥳": ("happy", 1.1),
    "😌": ("calm", 1.0), "🧘": ("calm", 1.0), "🌿": ("calm", 0.7), "☮": ("calm", 0.8),
    "😴": ("tired", 1.0), "🥱": ("tired", 1.0), "😩": ("tired", 0.9), "😢": ("tired", 1.0),
    "😭": ("tired", 1.1), "😞": ("tired", 1.0), "😔": ("tired", 1.0), "😰": ("tired", 0.9),
    "😡": ("angry", 1.2), "😠": ("angry", 1.1), "🤬": ("angry", 1.3), "😤": ("angry", 1.0),
}

NEGATORS = {
    "not", "no", "never", "dont", "don't", "doesnt", "doesn't", "didnt", "didn't",
    "isnt", "isn't", "wasnt", "wasn't", "cant", "can't", "cannot", "wont", "won't",
    "hardly", "barely", "aint", "ain't", "neither", "nor", "without",
}
INTENSIFIERS = {
    "very": 1.4, "really": 1.4, "so": 1.4, "extremely": 1.6, "super": 1.5, "totally": 1.4,
    "completely": 1.5, "utterly": 1.6, "incredibly": 1.6, "absolutely": 1.6,
    "truly": 1.3, "deeply": 1.4, "too": 1.3, "especially": 1.3,
}
DOWNTONERS = {
    "slightly": 0.6, "bit": 0.6, "little": 0.6, "kinda": 0.6, "somewhat": 0.6,
    "mildly": 0.6, "abit": 0.6, "sorta": 0.6,
}

# Tuning knobs -------------------------------------------------------------- #
MIN_TOTAL_SCORE = 0.75     # below this there simply isn't enough emotional signal
NEGATION_WINDOW = 3        # how many words back a negator can reach
MODIFIER_WINDOW = 2        # how many words back an intensifier can reach
LATE_CLAUSE_BOOST = 2.0    # weight of the part after "but" / "however"
LATE_SENTENCE_BOOST = 0.3  # later sentences count up to 30% more than the first
NEGATED_POSITIVE_TO_TIRED = 0.9
NEGATED_NEGATIVE_TO_CALM = 0.4

_CONTRAST = re.compile(r"\b(?:but|however|although|though|yet|except)\b")
_SENTENCE = re.compile(r"[.!?;\n]+")
_TOKEN = re.compile(r"[a-z']+|[\U0001F300-\U0001FAFF\u2600-\u27BF]")


@dataclass
class MoodResult:
    mood: Optional[str]
    confidence: float
    scores: dict = field(default_factory=dict)


def _normalise(text: str) -> str:
    text = text.lower().replace("\u2019", "'").replace("\u2018", "'")
    return re.sub(r"\bsort of\b", "sorta", re.sub(r"\bkind of\b", "kinda", text))


def _candidates(token: str) -> list[str]:
    """Possible base forms of a token: 'worries' -> ['worries', 'worrie', 'worry'...]"""
    out = [token]
    if token.endswith("ies") and len(token) > 4:
        out.append(token[:-3] + "y")
    if token.endswith("s") and len(token) > 3:
        out.append(token[:-1])
    if token.endswith("ed") and len(token) > 4:
        out += [token[:-2], token[:-1]]
    if token.endswith("ing") and len(token) > 5:
        out += [token[:-3], token[:-3] + "e"]
    if token.endswith("ly") and len(token) > 4:
        out.append(token[:-2])
    return out


def _lookup(token: str) -> Optional[tuple[str, float]]:
    for cand in _candidates(token):
        for mood in MOODS:
            weight = WORDS[mood].get(cand)
            if weight is not None:
                return mood, weight
    return None


def _score_clause(clause: str, weight: float, scores: dict) -> None:
    # 1) phrases first, then blank them out so their words aren't counted twice
    for mood, phrases in PHRASES.items():
        for phrase, w in phrases.items():
            pattern = r"\b" + re.escape(phrase) + r"\b"
            hits = re.findall(pattern, clause)
            if hits:
                scores[mood] += w * len(hits) * weight
                clause = re.sub(pattern, " ", clause)

    # 2) word-by-word with modifiers
    tokens = _TOKEN.findall(clause)
    for i, tok in enumerate(tokens):
        if tok in EMOJI:
            mood, w = EMOJI[tok]
            scores[mood] += w * weight
            continue

        hit = _lookup(tok)
        if not hit:
            continue
        mood, w = hit

        mult = 1.0
        for prev in tokens[max(0, i - MODIFIER_WINDOW):i]:
            if prev in INTENSIFIERS:
                mult *= INTENSIFIERS[prev]
            elif prev in DOWNTONERS:
                mult *= DOWNTONERS[prev]

        negated = any(p in NEGATORS for p in tokens[max(0, i - NEGATION_WINDOW):i])
        points = w * mult * weight
        if negated:
            if mood in ("happy", "calm"):
                scores["tired"] += points * NEGATED_POSITIVE_TO_TIRED
            else:
                scores["calm"] += points * NEGATED_NEGATIVE_TO_CALM
        else:
            scores[mood] += points


def detect_mood(text: str) -> MoodResult:
    """Return the dominant mood of `text`, or mood=None if unclear."""
    scores = {m: 0.0 for m in MOODS}
    text = _normalise(text or "")

    sentences = [s.strip() for s in _SENTENCE.split(text) if s.strip()]
    for s_idx, sentence in enumerate(sentences):
        # Later sentences usually say how the writer ended up feeling.
        recency = 1.0 + (LATE_SENTENCE_BOOST * s_idx / (len(sentences) - 1) if len(sentences) > 1 else 0.0)
        clauses = [c.strip() for c in _CONTRAST.split(sentence) if c.strip()]
        for c_idx, clause in enumerate(clauses):
            is_late = len(clauses) > 1 and c_idx == len(clauses) - 1
            _score_clause(clause, recency * (LATE_CLAUSE_BOOST if is_late else 1.0), scores)

    total = sum(scores.values())
    rounded = {m: round(v, 3) for m, v in scores.items()}
    if total < MIN_TOTAL_SCORE:
        return MoodResult(None, 0.0, rounded)

    top = max(scores, key=scores.get)
    share = scores[top] / total                 # how dominant is the winner?
    strength = min(1.0, total / 2.0)            # how much signal is there overall?
    confidence = round(share * (0.55 + 0.45 * strength), 3)
    return MoodResult(top, confidence, rounded)
