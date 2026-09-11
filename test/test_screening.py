import asyncio
import json
import os
import sys

# Add apps/ai-service to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "ai-service")))

from services.embedding.embedding_service import embed_text, embed_resume, cosine_similarity
from agents.screening_agent import run_screening_agent
from agents.screening_nodes import parse_resume_node, compute_gaps_node

def run_test():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    jd_path = os.path.join(base_dir, "job_description.md")
    resume_path = os.path.join(base_dir, "resume_candidate.md")

    with open(jd_path, "r") as f:
        job_description = f.read()

    with open(resume_path, "r") as f:
        resume_text = f.read()

    print("=" * 60)
    print("STEP 1: Testing Vector Embeddings & Semantic Similarity")
    print("=" * 60)
    jd_vec = embed_text(job_description)
    resume_vec = embed_resume(resume_text)
    similarity = cosine_similarity(jd_vec, resume_vec)
    semantic_match_pct = round(similarity * 100, 2)
    print(f"JD Vector dimensions: {len(jd_vec)}")
    print(f"Resume Vector dimensions: {len(resume_vec)}")
    print(f"Semantic Cosine Similarity: {similarity:.4f} ({semantic_match_pct}%)")
    assert 0.0 <= similarity <= 1.0, "Cosine similarity must be bounded [0, 1]"
    assert semantic_match_pct > 60.0, f"Expected strong match (>60%), got {semantic_match_pct}%"

    print("\n" + "=" * 60)
    print("STEP 2: Testing Skill Extraction (parse_resume_node)")
    print("=" * 60)
    screening_state = {
        "application_id": "test-app-001",
        "candidate_id": "cand-joshua-001",
        "job_id": "job-lead-001",
        "resume_text": resume_text,
        "job_description": job_description,
    }
    parsed_state = parse_resume_node(screening_state)
    skills = parsed_state.get("parsed_skills", [])
    print(f"Extracted {len(skills)} skills:")
    for skill in skills:
        print(f" - {skill}")
    assert len(skills) > 0, "Failed to extract skills from candidate resume"

    print("\n" + "=" * 60)
    print("STEP 3: Testing Gap Analysis (compute_gaps_node)")
    print("=" * 60)
    gap_state = compute_gaps_node(parsed_state)
    gap_analysis = gap_state.get("gap_analysis", {})
    print("Gap Analysis Output:")
    print(json.dumps(gap_analysis, indent=2))

    print("\n" + "=" * 60)
    print("STEP 4: Full End-to-End AI Resume Screening (run_screening_agent)")
    print("=" * 60)
    rubric = {
        "technical": 35,
        "communication": 20,
        "problemSolving": 25,
        "experience": 20,
    }

    result = asyncio.run(
        run_screening_agent(
            application_id="test-app-001",
            candidate_id="cand-joshua-001",
            job_id="job-lead-001",
            resume_text=resume_text,
            job_description=job_description,
            rubric=rubric,
            min_score=70.0,
        )
    )

    print("\nScreening Agent Decision & Summary:")
    print(json.dumps(result, indent=2))
    assert result.get("status") in ["screening_completed", "rejected"], "Invalid screening status"
    assert result.get("composite_score") is not None, "Missing composite score"
    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! AI Resume Screening is functioning properly.")

if __name__ == "__main__":
    run_test()
