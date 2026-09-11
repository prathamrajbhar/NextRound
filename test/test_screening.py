import asyncio
import json
import os
import subprocess
import sys
from typing import Dict, Any

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

TEST_CASES = [
    {
        "id": "CASE-1-CLOUD-DB",
        "domain": "Cloud Platform & Database Infrastructure",
        "company": "Signifyd (Greenhouse)",
        "role": "Staff Software Engineer, Cloud Platform & Database Infrastructure",
        "pdf_file": "chelsea_dole_resume.pdf",
        "jd_file": "job_description_greenhouse_signifyd.txt",
        "expected_decision": "screening_completed",
        "rubric": {
            "technical": 40,
            "communication": 15,
            "problemSolving": 25,
            "experience": 20,
        },
        "min_score": 70.0,
    },
    {
        "id": "CASE-2-BACKEND-APIS",
        "domain": "High-Throughput Distributed APIs & Logistics Platform",
        "company": "DoorDash (Careers/Lever)",
        "role": "Senior / Staff Software Engineer, Backend & Platform APIs",
        "pdf_file": "resume_elazar.pdf",
        "jd_file": "job_description_doordash_backend.txt",
        "expected_decision": "screening_completed",
        "rubric": {
            "technical": 35,
            "communication": 20,
            "problemSolving": 25,
            "experience": 20,
        },
        "min_score": 70.0,
    },
    {
        "id": "CASE-3-AI-RESEARCH",
        "domain": "Deep Learning Systems & Foundation Models",
        "company": "Meta AI (Careers/LinkedIn)",
        "role": "Research Engineer / Deep Learning Systems",
        "pdf_file": "resume_ml_arjtala.pdf",
        "jd_file": "job_description_meta_ai.txt",
        "expected_decision": "screening_completed",
        "rubric": {
            "technical": 45,
            "communication": 15,
            "problemSolving": 25,
            "experience": 15,
        },
        "min_score": 65.0,
    },
    {
        "id": "CASE-4-CROSS-DOMAIN-MISMATCH",
        "domain": "Intentional Cross-Domain Rejection Test",
        "company": "DoorDash (Backend Platform)",
        "role": "Staff Backend Engineer (Postgres/Redis APIs)",
        "pdf_file": "resume_ml_arjtala.pdf",  # ML/Scientific researcher applied to core eCommerce backend
        "jd_file": "job_description_doordash_backend.txt",
        "expected_decision": "rejected",
        "rubric": {
            "technical": 40,
            "communication": 15,
            "problemSolving": 25,
            "experience": 20,
        },
        "min_score": 75.0,
    }
]

async def run_single_test(test_case: Dict[str, Any], results_accumulator: list):
    base_dir = os.path.abspath(os.path.dirname(__file__))
    pdf_path = os.path.join(base_dir, test_case["pdf_file"])
    jd_path = os.path.join(base_dir, test_case["jd_file"])

    print("\n" + "=" * 80)
    print(f"RUNNING: {test_case['id']} | {test_case['domain']}")
    print(f"Candidate PDF: {test_case['pdf_file']}")
    print(f"Target Role:   {test_case['role']} ({test_case['company']})")
    print("=" * 80)

    # 1. Parse PDF
    resume_text = extract_text_from_pdf(pdf_path)
    words_count = len(resume_text.split())
    print(f"[1/5] Extracted raw text: {len(resume_text)} chars / {words_count} words")

    # 2. Load JD
    with open(jd_path, "r") as f:
        job_description = f.read().strip()
    print(f"[2/5] Loaded Job Description: {len(job_description.split())} words")

    # 3. Vector Match
    jd_vec = embed_text(job_description)
    resume_vec = embed_resume(resume_text)
    cosine_sim = cosine_similarity(jd_vec, resume_vec)
    sim_pct = round(cosine_sim * 100, 2)
    print(f"[3/5] Vector Cosine Match: {cosine_sim:.4f} ({sim_pct}%) [768-dim]")

    # 4. Skill Extraction & Gap Analysis
    state = {
        "application_id": f"app-{test_case['id']}",
        "candidate_id": f"cand-{test_case['id']}",
        "job_id": f"job-{test_case['id']}",
        "resume_text": resume_text,
        "job_description": job_description,
    }
    parsed = parse_resume_node(state)
    skills = parsed.get("parsed_skills", [])
    print(f"[4/5] Skills extracted: {len(skills)} competencies found.")
    gaps = compute_gaps_node(parsed).get("gap_analysis", {})

    # 5. Full Screening Decision
    decision_res = await run_screening_agent(
        application_id=f"app-{test_case['id']}",
        candidate_id=f"cand-{test_case['id']}",
        job_id=f"job-{test_case['id']}",
        resume_text=resume_text,
        job_description=job_description,
        rubric=test_case["rubric"],
        min_score=test_case["min_score"]
    )

    actual_decision = decision_res.get("status")
    composite_score = decision_res.get("composite_score")
    print(f"[5/5] Screening Decision: {actual_decision} | Composite Score: {composite_score}/100 (Threshold: {test_case['min_score']})")

    results_accumulator.append({
        "test_id": test_case["id"],
        "domain": test_case["domain"],
        "company": test_case["company"],
        "role": test_case["role"],
        "pdf_file": test_case["pdf_file"],
        "words_count": words_count,
        "vector_match_pct": sim_pct,
        "skills_extracted_count": len(skills),
        "top_skills": skills[:6],
        "composite_score": composite_score,
        "threshold": test_case["min_score"],
        "actual_decision": actual_decision,
        "expected_decision": test_case["expected_decision"],
        "reasoning": decision_res.get("reasoning"),
        "rejection_feedback": decision_res.get("rejection_feedback", ""),
    })

def main():
    results = []
    for tc in TEST_CASES:
        asyncio.run(run_single_test(tc, results))

    output_path = os.path.join(os.path.dirname(__file__), "screening_test_results.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    print("\n" + "#" * 80)
    print("ALL DOMAIN SCREENING PIPELINES EXECUTED!")
    print(f"Results saved to: {output_path}")
    print("#" * 80)

if __name__ == "__main__":
    main()
