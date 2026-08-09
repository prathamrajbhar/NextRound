import json
import os

import pytest

from agents import aptitude_generator_agent
from agents.aptitude_generator_agent import (
    generate_aptitude_questions,
    _fallback_questions,
    _load_canonical_questions,
)
from core.config import settings

CANONICAL_PATH = os.path.join(settings.shared_data_dir, "aptitude-questions.json")
# "source" is added by _fallback_questions() at call time; it is not stored in
# the JSON bank itself, so it is not part of the raw canonical key set.
CANONICAL_BANK_KEYS = {"id", "category", "difficulty", "question", "text", "options", "correctIndex", "explanation"}
EXPECTED_KEYS = CANONICAL_BANK_KEYS | {"source"}


def _canonical_bank():
    """Load the canonical bank exactly as the agent does (fresh from disk)."""
    with open(CANONICAL_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _force_fallback(monkeypatch):
    """Make generate_aptitude_questions deterministic by short-circuiting the
    Gemini and Ollama providers so ONLY the canonical fallback is exercised."""
    monkeypatch.setattr(
        aptitude_generator_agent, "generate_text", lambda prompt: None
    )

    async def _no_ollama(*args, **kwargs):
        return []

    monkeypatch.setattr(aptitude_generator_agent, "_generate_with_ollama", _no_ollama)


@pytest.mark.asyncio
async def test_generate_aptitude_questions_returns_valid_structure(monkeypatch):
    _force_fallback(monkeypatch)
    job_title = "Senior React Developer"
    job_desc = "Building high performance Web UI with Next.js and TypeScript"
    questions = await generate_aptitude_questions(job_title=job_title, job_description=job_desc, count=5)

    assert isinstance(questions, list)
    assert len(questions) == 5

    for q in questions:
        assert "id" in q
        assert "category" in q
        assert "difficulty" in q
        assert "question" in q
        assert "options" in q
        assert isinstance(q["options"], list)
        assert len(q["options"]) >= 2
        assert "correctIndex" in q
        assert isinstance(q["correctIndex"], int)

@pytest.mark.asyncio
async def test_generate_aptitude_questions_handles_custom_role(monkeypatch):
    _force_fallback(monkeypatch)
    job_title = "DevOps Engineer"
    questions = await generate_aptitude_questions(job_title=job_title, count=3)

    assert len(questions) == 3
    for q in questions:
        assert len(q["options"]) == 4


# --- Canonical bank fallback (_fallback_questions) -------------------------


def test_fallback_questions_returns_exact_count_from_canonical_bank():
    questions = _fallback_questions("Backend Engineer", 3)
    assert len(questions) == 3
    canonical = _canonical_bank()
    assert [q["id"] for q in questions] == [q["id"] for q in canonical[:3]]


def test_fallback_questions_interpolates_role_placeholder():
    questions = _fallback_questions("Backend Engineer", 1)
    assert len(questions) == 1
    q = questions[0]
    assert "{role}" not in q["question"]
    assert "{role}" not in q["text"]
    assert "Backend Engineer" in q["question"]
    # question and text must stay in sync after interpolation
    assert q["question"] == q["text"]


def test_fallback_questions_output_matches_canonical_shape():
    canonical = _canonical_bank()
    role = "Data Engineer"
    questions = _fallback_questions(role, len(canonical))

    assert len(questions) == len(canonical)
    for returned, original in zip(questions, canonical):
        assert set(returned.keys()) == EXPECTED_KEYS
        for key in ("id", "category", "difficulty", "options", "correctIndex"):
            assert returned[key] == original[key]
        # Only the {role} placeholder changes; the rest of the stem is untouched.
        assert returned["question"].replace(role, "{role}") == original["question"]
        # Fallback questions must carry the "fallback" origin marker.
        assert returned["source"] == "fallback"


def test_fallback_questions_defaults_role_when_blank():
    questions = _fallback_questions("", 2)
    assert len(questions) == 2
    assert "Software Engineer" in questions[0]["question"]


def test_fallback_questions_caps_at_bank_size():
    bank_size = len(_canonical_bank())
    assert len(_fallback_questions("Eng", bank_size + 5)) == bank_size


def test_load_canonical_questions_raises_when_bank_missing(monkeypatch):
    monkeypatch.setattr(
        aptitude_generator_agent,
        "_FALLBACK_PATH",
        "/nonexistent/shared/data/aptitude-questions.json",
    )
    with pytest.raises(RuntimeError, match="not found"):
        _load_canonical_questions()
