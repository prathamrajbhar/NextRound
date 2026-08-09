import pytest

from agents import aptitude_generator_agent
from agents.aptitude_generator_agent import (
    generate_aptitude_questions,
    generate_aptitude_chunk,
)

MOCK_LLM_RESPONSE = """
[
  {
    "id": "gen_q1",
    "category": "Quantitative Reasoning",
    "difficulty": "medium",
    "question": "If a team doubles size, what is the impact?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0
  }
]
"""

@pytest.mark.asyncio
async def test_generate_aptitude_questions_returns_valid_structure(monkeypatch):
    monkeypatch.setattr(
        aptitude_generator_agent, "generate_text", lambda prompt: MOCK_LLM_RESPONSE
    )
    questions = await generate_aptitude_questions(job_title="Software Developer", count=1)

    assert isinstance(questions, list)
    assert len(questions) == 1
    q = questions[0]
    assert q["id"] == "gen_q1"
    assert q["options"] == ["A", "B", "C", "D"]
    assert q["correctIndex"] == 0
    assert q["source"] == "ai-generated"


@pytest.mark.asyncio
async def test_generate_aptitude_chunk_returns_valid_structure(monkeypatch):
    monkeypatch.setattr(
        aptitude_generator_agent, "generate_text", lambda prompt: MOCK_LLM_RESPONSE
    )
    questions = await generate_aptitude_chunk(
        job_title="Software Developer",
        chunk_index=0,
        chunk_size=1
    )

    assert isinstance(questions, list)
    assert len(questions) == 1
    q = questions[0]
    assert q["id"] == "chunk_0_q1"
    assert q["source"] == "ai-chunk"


