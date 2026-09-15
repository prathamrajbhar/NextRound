import logging
from services.embedding.embedding_service import embed_text, embed_resume, cosine_similarity
from services.llm.llm_service import generate_text, extract_json_array, extract_json_object
from agents.screening_types import ScreeningState

logger = logging.getLogger("screening_agent")

def parse_resume_node(state: ScreeningState) -> ScreeningState:
    resume_text = state.get("resume_text", "")
    logger.info(f"Parsing resume for application {state.get('application_id')}")

    skills = []
    if resume_text:
        prompt = f"Extract all technical skills and key competencies from this resume as a JSON list of strings:\n\n{resume_text}"
        skills = extract_json_array(generate_text(prompt)) or []

    skills = [s.strip() for s in skills if isinstance(s, str) and s.strip()]
    state["parsed_skills"] = skills
    return state

def _score_rubric_dimensions_with_llm(resume_text: str, job_description: str) -> dict:
    if not resume_text:
        return None
    prompt = (
        f"You are an unbiased ATS reviewer. Score this candidate's resume against the job on four dimensions (0-100).\n"
        f"Job Description: {job_description[:1500]}\n\n"
        f"Resume:\n{resume_text[:3000]}\n\n"
        'Return JSON only: {"technical": float, "communication": float, '
        '"problem_solving": float, "experience": float}'
    )
    return extract_json_object(generate_text(prompt))

def score_against_rubric_node(state: ScreeningState) -> ScreeningState:
    resume_text = state.get("resume_text", "")
    job_description = state.get("job_description", "")
    rubric = state.get("rubric")
    if not rubric:
        raise RuntimeError("Screening rubric is missing; cannot score the application.")

    job_vector = embed_text(job_description)
    resume_vector = embed_resume(resume_text)
    similarity = cosine_similarity(job_vector, resume_vector)
    semantic_score = round(similarity * 100, 2)

    llm_scores = _score_rubric_dimensions_with_llm(resume_text, job_description)
    if not llm_scores:
        raise RuntimeError("Screening LLM returned no rubric scores; cannot evaluate the application.")

    required = ("technical", "communication", "problem_solving", "experience")
    parsed = {dim: llm_scores.get(dim) for dim in required}
    if any(v is None for v in parsed.values()):
        missing = ", ".join(dim for dim, v in parsed.items() if v is None)
        raise RuntimeError(f"Screening LLM returned an incomplete score set; missing: {missing}.")

    tech_score = round(float(parsed["technical"]), 2)
    comm_score = round(float(parsed["communication"]), 2)
    prob_score = round(float(parsed["problem_solving"]), 2)
    exp_score = round(float(parsed["experience"]), 2)

    tech_w = rubric.get("technical", 30) / 100.0
    comm_w = rubric.get("communication", 20) / 100.0
    prob_w = rubric.get("problemSolving", 25) / 100.0
    exp_w = rubric.get("experience", 25) / 100.0

    weighted_resume_score = (tech_score * tech_w) + (comm_score * comm_w) + (prob_score * prob_w) + (exp_score * exp_w)
    composite_score = round((weighted_resume_score * 0.6) + (semantic_score * 0.4), 2)

    state["resume_score"] = round(weighted_resume_score, 2)
    state["semantic_match_score"] = semantic_score
    state["composite_score"] = composite_score

    return state

import re

def compute_gaps_node(state: ScreeningState) -> ScreeningState:
    skills = state.get("parsed_skills", [])
    job_desc = state.get("job_description", "")

    parsed_lower = {s.lower().strip() for s in skills if isinstance(s, str)}
    strengths = skills[:4]
    exp_gaps: list[str] = []

    missing: list[str] = []
    if job_desc:
        potential_terms = re.findall(r"\b[A-Za-z0-9+#.-]+\b", job_desc)
        stop_words = {
            "we", "need", "someone", "with", "and", "or", "experience", "required", "role", 
            "the", "for", "a", "an", "in", "to", "of", "is", "are", "some", "description",
            "job", "candidate", "must", "have", "years", "knowledge", "strong", "understanding"
        }
        seen = set()
        for term in potential_terms:
            t_clean = term.strip()
            t_lower = t_clean.lower()
            if t_lower in stop_words or len(t_clean) < 2 or t_lower in seen:
                continue
            seen.add(t_lower)
            if t_lower not in parsed_lower and not any(t_lower == s or (len(t_lower) > 3 and t_lower in s) for s in parsed_lower):
                missing.append(t_clean)

    missing = missing[:3]
    strengths_txt = ", ".join(strengths) if strengths else "No skills were extractable from the resume."
    feedback = (
        f"Strengths: {strengths_txt}. "
        f"Gaps identified in: {', '.join(missing) if missing else 'None'}"
    )

    state["gap_analysis"] = {
        "missing_skills": missing,
        "experience_gaps": exp_gaps,
        "strengths": strengths,
        "feedback": feedback,
    }
    return state

def make_decision_node(state: ScreeningState) -> ScreeningState:
    composite_score = state.get("composite_score")
    min_score = state.get("min_score")
    if composite_score is None or min_score is None:
        raise RuntimeError("Screening cannot decide without real composite and threshold scores.")

    decision = "screening_completed" if composite_score >= min_score else "rejected"
    verb = "exceeds" if decision == "screening_completed" else "does not meet"
    reasoning = (
        f"Composite score of {composite_score}/100 "
        f"{verb} minimum threshold of {min_score}."
    )

    state["decision"] = decision
    state["reasoning"] = reasoning
    return state

def generate_feedback_node(state: ScreeningState) -> ScreeningState:
    decision = state.get("decision")
    if decision == "rejected":
        gaps = state.get("gap_analysis", {})
        missing = gaps.get("missing_skills", [])
        strengths = gaps.get("strengths", [])

        prompt = (
            f"Write constructive, encouraging 3-paragraph rejection email feedback for a software engineering applicant:\n"
            f"Strengths: {', '.join(strengths)}\n"
            f"Missing Skills: {', '.join(missing)}\n"
            f"Keep the tone supportive and professional."
        )
        feedback_text = generate_text(prompt)
        if not feedback_text:
            raise RuntimeError("Screening LLM returned no rejection feedback for a rejected applicant.")
        state["rejection_feedback"] = feedback_text
    else:
        state["rejection_feedback"] = ""

    return state
