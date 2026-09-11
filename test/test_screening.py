import asyncio
import json
import os
import subprocess
import sys

# Ensure apps/ai-service is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "ai-service")))

from services.embedding.embedding_service import embed_text, embed_resume, cosine_similarity
from agents.screening_agent import run_screening_agent
from agents.screening_nodes import parse_resume_node, compute_gaps_node

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract full raw text directly from an actual PDF document using pdftotext."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    process = subprocess.run(
        ["pdftotext", pdf_path, "-"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=True
    )
    raw_text = process.stdout.strip()
    if not raw_text:
        raise RuntimeError(f"Extracted zero text from PDF: {pdf_path}")
    return raw_text

def run_pipeline():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    pdf_path = os.path.join(base_dir, "chelsea_dole_resume.pdf")
    jd_path = os.path.join(base_dir, "job_description_greenhouse_signifyd.txt")

    print("=" * 70)
    print("STEP 1: Extracting Text From Real-World Candidate PDF Resume")
    print(f"File: {pdf_path}")
    print("=" * 70)
    resume_text = extract_text_from_pdf(pdf_path)
    print(f"Extracted {len(resume_text)} characters / {len(resume_text.split())} words from actual PDF.")
    print("Preview:\n" + "\n".join(resume_text.splitlines()[:12]))

    print("\n" + "=" * 70)
    print("STEP 2: Loading Real Job Description From Top Job Board (Greenhouse / Signifyd)")
    print(f"File: {jd_path}")
    print("=" * 70)
    with open(jd_path, "r") as f:
        job_description = f.read().strip()
    print(f"Loaded {len(job_description.split())} words from job description.")

    print("\n" + "=" * 70)
    print("STEP 3: Testing Vector Embeddings & Semantic Cosine Matching")
    print("=" * 70)
    jd_vector = embed_text(job_description)
    resume_vector = embed_resume(resume_text)
    similarity = cosine_similarity(jd_vector, resume_vector)
    semantic_match_pct = round(similarity * 100, 2)
    print(f"JD Vector dimensions:     {len(jd_vector)}")
    print(f"Resume Vector dimensions: {len(resume_vector)}")
    print(f"Semantic Cosine Match:    {similarity:.4f} ({semantic_match_pct}%)")
    assert 0.0 <= similarity <= 1.0, "Cosine similarity must be bounded in [0, 1]"
    assert semantic_match_pct > 65.0, f"Expected strong match (>65%), got {semantic_match_pct}%"

    print("\n" + "=" * 70)
    print("STEP 4: Testing Skill & Competency Extraction (parse_resume_node)")
    print("=" * 70)
    screening_state = {
        "application_id": "app-signifyd-001",
        "candidate_id": "cand-chelsea-001",
        "job_id": "job-greenhouse-001",
        "resume_text": resume_text,
        "job_description": job_description,
    }
    parsed_state = parse_resume_node(screening_state)
    skills = parsed_state.get("parsed_skills", [])
    print(f"Extracted {len(skills)} competencies & skills:")
    for s in skills:
        print(f"  • {s}")
    assert len(skills) > 0, "Failed to extract skills from resume"

    print("\n" + "=" * 70)
    print("STEP 5: Testing Gap Analysis (compute_gaps_node)")
    print("=" * 70)
    gap_state = compute_gaps_node(parsed_state)
    gap_analysis = gap_state.get("gap_analysis", {})
    print(json.dumps(gap_analysis, indent=2))

    print("\n" + "=" * 70)
    print("STEP 6: Full End-to-End AI Screening Agent (run_screening_agent)")
    print("=" * 70)
    rubric = {
        "technical": 40,
        "communication": 15,
        "problemSolving": 25,
        "experience": 20,
    }

    result = asyncio.run(
        run_screening_agent(
            application_id="app-signifyd-001",
            candidate_id="cand-chelsea-001",
            job_id="job-greenhouse-001",
            resume_text=resume_text,
            job_description=job_description,
            rubric=rubric,
            min_score=70.0,
        )
    )

    print("\nFinal Screening Decision & Score Breakdown:")
    print(json.dumps(result, indent=2))
    assert result.get("status") in ["screening_completed", "rejected"], "Invalid screening status"
    assert result.get("composite_score") is not None, "Missing composite score"
    print("\n>>> End-to-end PDF AI Resume Screening pipeline succeeded flawlessly!")

if __name__ == "__main__":
    run_pipeline()
