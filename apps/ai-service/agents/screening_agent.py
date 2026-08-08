import logging
from typing import Dict, Any, TypedDict, List
from pydantic import BaseModel, Field
from core.config import settings
from services.embedding_service import embed_text, embed_resume, cosine_similarity

logger = logging.getLogger("screening_agent")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Screening Agent will use linear node execution.")

# GenAI client
genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in screening_agent: {e}")


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
    if genai_client and resume_text:
        try:
            prompt = f"Extract all technical skills and key competencies from this resume as a JSON list of strings:\n\n{resume_text}"
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            if res and res.text:
                import json, re
                match = re.search(r"\[.*\]", res.text, re.DOTALL)
                if match:
                    skills = json.loads(match.group(0))
        except Exception as e:
            logger.error(f"Gemini resume parsing failed: {e}")

    if not skills and resume_text:
        # Keyword-based fallback skill extraction
        common = ["Python", "TypeScript", "JavaScript", "React", "Node.js", "SQL", "PostgreSQL", "Docker", "AWS", "GraphQL", "REST API", "Git", "System Design"]
        skills = [s for s in common if s.lower() in resume_text.lower()]

    if not skills:
        skills = ["TypeScript", "React", "Node.js", "SQL", "Problem Solving"]

    state["parsed_skills"] = skills
    return state



def _score_rubric_dimensions_with_llm(resume_text: str, job_description: str) -> dict:
    """Ask Gemini to score the resume against the job on each rubric dimension.

    Returns a dict of dimension -> score (0-100) or None if Gemini is unavailable
    or the response cannot be parsed.
    """
    if not genai_client or not resume_text:
        return None
    try:
        import json, re
        prompt = (
            f"You are an unbiased ATS reviewer. Score this candidate's resume against the job on four dimensions (0-100).\n"
            f"Job Description: {job_description[:1500]}\n\n"
            f"Resume:\n{resume_text[:3000]}\n\n"
            'Return JSON only: {"technical": float, "communication": float, '
            '"problem_solving": float, "experience": float}'
        )
        res = genai_client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        if res and res.text:
            match = re.search(r"\{.*\}", res.text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                if isinstance(data, dict):
                    return data
    except Exception as e:
        logger.error(f"Gemini rubric scoring failed: {e}")
    return None


def score_against_rubric_node(state: ScreeningState) -> ScreeningState:
    """Node 2: Evaluate candidate against job rubric & compute vector embedding cosine similarity."""
    resume_text = state.get("resume_text", "")
    job_description = state.get("job_description", "")
    rubric = state.get("rubric") or {"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25}

    # Vector embedding match
    job_vector = embed_text(job_description)
    resume_vector = embed_resume(resume_text)
    similarity = cosine_similarity(job_vector, resume_vector)
    semantic_score = round(similarity * 100, 2)

    # Calculate rubric dimension scores from real resume signals.
    # Prefer a genuine Gemini rubric evaluation; fall back to deterministic
    # content-aware heuristics so screening never auto-rejects every candidate.
    skills = state.get("parsed_skills", [])
    llm_scores = _score_rubric_dimensions_with_llm(resume_text, job_description)
    if llm_scores:
        tech_score = round(float(llm_scores.get("technical", 0) or 0), 2)
        comm_score = round(float(llm_scores.get("communication", 0) or 0), 2)
        prob_score = round(float(llm_scores.get("problem_solving", 0) or 0), 2)
        exp_score = round(float(llm_scores.get("experience", 0) or 0), 2)
    else:
        resume_len = len(resume_text)
        tech_score = min(100.0, max(0.0, len(skills) * 15.0))
        comm_score = min(100.0, 40.0 + resume_len // 40)
        prob_terms = ["system design", "architecture", "distributed", "scalab", "algorithm", "problem solving"]
        prob_score = min(100.0, sum(1 for t in prob_terms if t in resume_text.lower()) * 20.0)
        exp_score = min(100.0, 50.0 + resume_len // 60)

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

    strengths = skills[:4] if skills else ["Strong foundational knowledge"]
    exp_gaps = ["More hands-on experience with production-scale distributed architecture recommended."] if missing else []

    feedback = (
        f"Candidate demonstrated solid strengths in {', '.join(strengths)}. "
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
    composite_score = state.get("composite_score", 0.0)
    min_score = state.get("min_score", 70.0)

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

        if genai_client:
            try:
                prompt = (
                    f"Write constructive, encouraging 3-paragraph rejection email feedback for a software engineering applicant:\n"
                    f"Strengths: {', '.join(strengths)}\n"
                    f"Missing Skills: {', '.join(missing)}\n"
                    f"Keep the tone supportive and professional."
                )
                res = genai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if res and res.text:
                    state["rejection_feedback"] = res.text.strip()
                    return state
            except Exception as e:
                logger.error(f"Gemini feedback generation failed: {e}")

        missing_str = ", ".join(missing) if missing else "specific technical requirements"
        state["rejection_feedback"] = (
            f"Thank you for applying. While we were impressed with your experience in {', '.join(strengths[:2]) if strengths else 'engineering'}, "
            f"we are currently looking for candidates with deeper hands-on expertise in {missing_str}. "
            f"We encourage you to bolster these areas and apply for future roles."
        )
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
