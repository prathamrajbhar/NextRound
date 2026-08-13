import logging
from typing import Dict, Any, TypedDict, List
from pydantic import BaseModel, Field
from services.embedding_service import embed_text, embed_resume, cosine_similarity
from services.llm_service import generate_text, extract_json_array, extract_json_object

logger = logging.getLogger("screening_agent")

from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END


class GapAnalysis(BaseModel):
    missing_skills: List[str] = Field(default_factory=list)
    experience_gaps: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    feedback: str = ""


# ML_BYPASS: video engagement ML — upgrade to fer+ or DeepFace for expression analysis (with consent)
# ML_BYPASS: ATS ML scorer — replace with trained LambdaMART ranker on resume-outcome data
class ScreeningOutput(BaseModel):
    status: str  # 'screening_completed' | 'rejected'
    resume_score: float
    composite_score: float
    semantic_match_score: float
    gap_analysis: GapAnalysis
    reasoning: str
    rejection_feedback: str = ""


class ScreeningState(TypedDict, total=False):
    application_id: str
    candidate_id: str
    job_id: str
    resume_text: str
    job_description: str
    rubric: dict
    min_score: float
    parsed_skills: list
    resume_score: float
    semantic_match_score: float
    composite_score: float
    video_telemetry: list
    video_expression_summary: dict
    gap_analysis: dict
    decision: str
    rejection_feedback: str
    reasoning: str



def parse_resume_node(state: ScreeningState) -> ScreeningState:
    """Node 1: Extract technical skills, experience, and projects from candidate resume."""
    resume_text = state.get("resume_text", "")
    logger.info(f"Parsing resume for application {state.get('application_id')}")

    skills = []
    if resume_text:
        prompt = f"Extract all technical skills and key competencies from this resume as a JSON list of strings:\n\n{resume_text}"
        skills = extract_json_array(generate_text(prompt)) or []

    if not skills and resume_text:
        # Keyword-based extraction from the actual resume text — never invents
        # skills that are not present in the resume.
        common = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "SQL", "PostgreSQL", "Docker", "AWS", "GraphQL", "REST API", "Git", "System Design"]
        skills = [s for s in common if s.lower() in resume_text.lower()]

    # If the resume yields no skills, the list stays empty — no fabricated
    # default skill set is injected.

    # Coerce every extracted skill to a non-empty string so downstream nodes
    # (gap analysis, feedback generation) can safely lowercase/join them.
    skills = [str(s).strip() for s in skills if s is not None and str(s).strip()]

    state["parsed_skills"] = skills
    return state



def _score_rubric_dimensions_with_llm(resume_text: str, job_description: str) -> dict:
    """Ask Gemini to score the resume against the job on each rubric dimension.

    Returns a dict of dimension -> score (0-100) or None if Gemini is unavailable
    or the response cannot be parsed.
    """
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
    """Node 2: Evaluate candidate against job rubric & compute vector embedding cosine similarity.

    Rubric dimension scores come exclusively from a real LLM evaluation of the
    resume against the job. No heuristic or default-0 scores are used — if the
    LLM cannot produce a complete score set, screening fails rather than
    fabricating a score.
    """
    resume_text = state.get("resume_text", "")
    job_description = state.get("job_description", "")
    rubric = state.get("rubric")
    if not rubric:
        raise RuntimeError("Screening rubric is missing; cannot score the application.")

    # Vector embedding match
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
    """Node 3: Identify skill gaps, experience mismatches, and strengths."""
    skills = state.get("parsed_skills", [])
    job_desc = state.get("job_description", "").lower()

    # Identify potential missing skills mentioned in JD
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
    """Node 4: Gate decision by comparing composite score against job threshold."""
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
    """Node 5: Generate gap-rich constructive rejection feedback if rejected."""
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


def build_screening_graph():
    """Build LangGraph workflow graph for Screening Agent."""
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(ScreeningState)
    builder.add_node("parse_resume", parse_resume_node)
    builder.add_node("score_against_rubric", score_against_rubric_node)
    builder.add_node("compute_gaps", compute_gaps_node)
    builder.add_node("make_decision", make_decision_node)
    builder.add_node("generate_feedback", generate_feedback_node)

    builder.set_entry_point("parse_resume")
    builder.add_edge("parse_resume", "score_against_rubric")
    builder.add_edge("score_against_rubric", "compute_gaps")
    builder.add_edge("compute_gaps", "make_decision")
    builder.add_edge("make_decision", "generate_feedback")
    builder.add_edge("generate_feedback", END)

    return builder.compile()


_screening_app = build_screening_graph()


async def run_screening_agent(
    application_id: str,
    candidate_id: str,
    job_id: str,
    resume_text: str,
    job_description: str,
    rubric: dict,
    min_score: float = 70.0
) -> Dict[str, Any]:
    """
    Execute Screening Agent pipeline on a candidate application.
    Returns dict containing screening decision, composite scores, and gap analysis.
    """
    initial_state: ScreeningState = {
        "application_id": application_id,
        "candidate_id": candidate_id,
        "job_id": job_id,
        "resume_text": resume_text,
        "job_description": job_description,
        "rubric": rubric,
        "min_score": min_score,
    }

    if _screening_app:
        try:
            final_state = await _screening_app.ainvoke(initial_state)
            return {
                "status": final_state.get("decision"),
                "resume_score": final_state.get("resume_score"),
                "composite_score": final_state.get("composite_score"),
                "semantic_match_score": final_state.get("semantic_match_score"),
                "gap_analysis": final_state.get("gap_analysis"),
                "reasoning": final_state.get("reasoning"),
                "rejection_feedback": final_state.get("rejection_feedback"),
            }
        except Exception as e:
            logger.error(f"LangGraph execution error in Screening Agent: {e}")

    # Fallback linear execution if graph invocation fails or LangGraph unavailable
    s1 = parse_resume_node(initial_state)
    s2 = score_against_rubric_node(s1)
    s3 = compute_gaps_node(s2)
    s4 = make_decision_node(s3)
    s5 = generate_feedback_node(s4)

    return {
        "status": s5.get("decision"),
        "resume_score": s5.get("resume_score"),
        "composite_score": s5.get("composite_score"),
        "semantic_match_score": s5.get("semantic_match_score"),
        "gap_analysis": s5.get("gap_analysis"),
        "reasoning": s5.get("reasoning"),
        "rejection_feedback": s5.get("rejection_feedback"),
    }
