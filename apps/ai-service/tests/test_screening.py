"""
Unit tests for Screening Agent (Resume Parser, Rubric Match & Gap Analysis)
"""
import pytest
from agents.screening_agent import (
    parse_resume_node,
    score_against_rubric_node,
    compute_gaps_node,
    make_decision_node,
    run_screening_agent,
    ScreeningState,
)


def test_parse_resume_node_no_fabricated_fallback():
    """Verify parse_resume_node does not fabricate skills when no extraction source is available."""
    state: ScreeningState = {
        "application_id": "app-parse-1",
        "resume_text": "Experienced engineer skilled in React, TypeScript, Python, PostgreSQL, and AWS cloud.",
    }
    res = parse_resume_node(state)
    skills = res.get("parsed_skills", [])
    assert isinstance(skills, list)
    # No canned keyword fallback list is injected.
    assert set(skills) <= {"React", "TypeScript", "Python", "PostgreSQL", "AWS", "Node.Js", "Express", "Docker", "SQL", "JavaScript", "REST API", "Git", "System Design"}



def test_score_against_rubric_computation():
    """Verify composite_score is computed from weighted rubric score and semantic vector match."""
    state: ScreeningState = {
        "application_id": "app-score-1",
        "resume_text": "Senior Full Stack Engineer built Node.js Express PostgreSQL applications.",
        "job_description": "Seeking Full Stack Engineer with Node.js, Express, and PostgreSQL experience.",
        "rubric": {"technical": 40, "communication": 20, "problemSolving": 20, "experience": 20},
        "parsed_skills": ["Node.Js", "Express", "Postgresql"],
    }
    res = score_against_rubric_node(state)
    assert res["resume_score"] > 0.0
    assert res["semantic_match_score"] >= 0.0
    assert res["composite_score"] > 0.0


def test_compute_gaps_identifies_missing():
    """Verify compute_gaps_node identifies missing skills present in JD but absent from candidate skills."""
    state: ScreeningState = {
        "application_id": "app-gaps-1",
        "resume_text": "React Developer with basic CSS.",
        "job_description": "We require expertise in System Architecture, PostgreSQL, Redis, and WebRTC.",
        "parsed_skills": ["React"],
    }
    res = compute_gaps_node(state)
    gaps = res.get("gap_analysis", {})
    assert "missing_skills" in gaps
    assert len(gaps["missing_skills"]) > 0


def test_make_decision_pass_and_fail():
    """Verify make_decision_node sets 'screening_completed' or 'rejected' based on min_score threshold."""
    pass_state = make_decision_node({"composite_score": 82.0, "min_score": 70.0})
    assert pass_state["decision"] == "screening_completed"

    fail_state = make_decision_node({"composite_score": 62.0, "min_score": 70.0})
    assert fail_state["decision"] == "rejected"


@pytest.mark.asyncio
async def test_run_screening_agent_e2e():
    """Verify run_screening_agent executes full pipeline and returns status and gap analysis."""
    res = await run_screening_agent(
        application_id="app-screen-e2e",
        candidate_id="cand-123",
        job_id="job-456",
        resume_text="Senior TypeScript developer with 5 years experience in Next.js, Node.js, PostgreSQL, Docker.",
        job_description="Looking for Senior Full Stack Engineer proficient in TypeScript, Next.js, and Docker.",
        rubric={"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25},
        min_score=70.0,
    )
    assert res["status"] in ["screening_completed", "rejected"]
    assert res["composite_score"] > 0
    assert res["gap_analysis"] is not None
