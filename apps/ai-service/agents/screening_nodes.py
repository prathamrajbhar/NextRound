import logging
from services.embedding_service import embed_text, embed_resume, cosine_similarity
from services.llm_service import generate_text, extract_json_array, extract_json_object
from agents.screening_types import ScreeningState

logger = logging.getLogger("screening_agent")

def parse_resume_node(state: ScreeningState) -> ScreeningState:
    resume_text = state.get("resume_text", "")
    logger.info(f"Parsing resume for application {state.get('application_id')}")

    skills = []
    if resume_text:
        prompt = f"Extract all technical skills and key competencies from this resume as a JSON list of strings:\n\n{resume_text}"
        skills = extract_json_array(generate_text(prompt)) or []

    skills = [str(s).strip() for s in skills if s is not None and str(s).strip()]
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

def compute_gaps_node(state: ScreeningState) -> ScreeningState:
    skills = state.get("parsed_skills", [])
    job_desc = state.get("job_description", "").lower()

    key_jd_terms = ["system architecture", "postgresql", "redis", "bullmq", "webrtc", "docker", "kubernetes", "microservices"]
    missing = [term.title() for term in key_jd_terms if term in job_desc and term not in [s.lower() for s in skills]]

    strengths = skills[:4]
    exp_gaps = []

    strengths_txt = ", ".join(strengths) if strengths else "No skills were extractable from the resume."
    feedback = (
        f"Strengths: {strengths_txt}. "
        f"Gaps identified in: {', '.join(missing) if missing else 'None'}"
    )

    state["gap_analysis"] = {
        "missing_skills": missing[:3],
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
    reasoning = (
        f"Composite score of {composite_score}/100 "
        f"({'exceeds' if decision == 'screening_completed' else 'does not meet'}) "
        f"minimum threshold of {min_score}."
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
