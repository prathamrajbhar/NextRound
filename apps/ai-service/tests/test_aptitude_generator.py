import pytest
import asyncio
from agents.aptitude_generator_agent import generate_aptitude_questions

@pytest.mark.asyncio
async def test_generate_aptitude_questions_returns_valid_structure():
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
async def test_generate_aptitude_questions_handles_custom_role():
    job_title = "DevOps Engineer"
    questions = await generate_aptitude_questions(job_title=job_title, count=3)
    
    assert len(questions) == 3
    for q in questions:
        assert len(q["options"]) == 4
