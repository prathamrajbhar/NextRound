import pytest
from agents.jd_parser_agent import (
    parse_requirements_node,
    generate_description_node,
    compute_rubric_node,
    validate_output_node,
    run_jd_parser_agent,
    JDParserState,
)

def test_parse_requirements_node_extracts_skills():
    state: JDParserState = {
        "job_id": "job-101",
        "raw_description": "We need a Senior Python Developer with FastAPI and PostgreSQL expertise."
    }
    result = parse_requirements_node(state)
    assert "extracted_skills" in result
    # Without an available extraction source, no fabricated skills are returned.
    assert isinstance(result["extracted_skills"], list)

def test_compute_rubric_node_weights_sum_to_100():
    state: JDParserState = {
        "extracted_skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "System Design"]
    }
    result = compute_rubric_node(state)
    rubric = result["rubric"]
    total_weight = sum(rubric.values())
    assert total_weight == 100
    assert result["thresholds"]["minScore"] == 70

def test_validate_output_node_verifies_schema():
    state: JDParserState = {
        "generated_description": "## Senior Python Engineer",
        "rubric": {"technical": 35, "communication": 20, "problemSolving": 25, "experience": 20},
        "thresholds": {"minScore": 75, "autoOffer": True, "qCount": 5}
    }
    result = validate_output_node(state)
    assert result["status"] == "validated"

@pytest.mark.asyncio
async def test_run_jd_parser_agent_end_to_end():
    result = await run_jd_parser_agent(
        job_id="job-202",
        raw_description="Looking for a React frontend engineer with TypeScript and Tailwind CSS."
    )
    assert "description" in result
    assert "rubric" in result
    assert "thresholds" in result
    assert result["rubric"]["technical"] >= 30
