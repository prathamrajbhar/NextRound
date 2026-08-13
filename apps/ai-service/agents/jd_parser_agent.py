import logging
from typing import Dict, Any, TypedDict
from pydantic import BaseModel, Field
from services.llm_service import generate_text, extract_json_array

logger = logging.getLogger("jd_parser_agent")

# Try importing LangGraph
from core.langgraph_shim import LANGGRAPH_AVAILABLE, StateGraph, END


class RubricWeights(BaseModel):
    technical: int = Field(default=30, ge=0, le=100)
    communication: int = Field(default=20, ge=0, le=100)
    problemSolving: int = Field(default=25, ge=0, le=100)
    experience: int = Field(default=25, ge=0, le=100)


class JobThresholds(BaseModel):
    minScore: int = Field(default=70, ge=0, le=100)
    autoOffer: bool = Field(default=False)
    qCount: int = Field(default=5)


class JDParserOutput(BaseModel):
    description: str
    rubric: RubricWeights
    thresholds: JobThresholds


class JDParserState(TypedDict, total=False):
    job_id: str
    raw_description: str
    extracted_skills: list
    generated_description: str
    rubric: dict
    thresholds: dict
    status: str


def parse_requirements_node(state: JDParserState) -> JDParserState:
    """Node 1: Extract technical & soft skills from raw job description prompt."""
    raw = state.get("raw_description", "")
    logger.info(f"Parsing requirements for job {state.get('job_id')}")

    skills = []
    if raw:
        prompt = f"Extract core technical skills and requirements from this job description prompt as a JSON list of strings:\n\n{raw}"
        skills = extract_json_array(generate_text(prompt)) or []

    state["extracted_skills"] = skills
    return state


def generate_description_node(state: JDParserState) -> JDParserState:
    """Node 2: Generate structured, ATS-optimized markdown job description."""
    raw = state.get("raw_description", "")
    skills = state.get("extracted_skills", [])

    if raw:
        prompt = (
            f"Create a professional, highly engaging ATS-friendly job description in markdown format based on:\n"
            f"Input: {raw}\nKey Skills: {', '.join(skills)}\n\n"
            f"Include sections: Role Overview, Key Responsibilities, Requirements & Qualifications, What We Offer."
        )
        generated_description = generate_text(prompt)
        if generated_description:
            state["generated_description"] = generated_description
            return state

    state["generated_description"] = ""
    return state


def compute_rubric_node(state: JDParserState) -> JDParserState:
    """Node 3: Compute balanced rubric weights (sum = 100%) and thresholds."""
    skills = state.get("extracted_skills", [])

    # Dynamic rubric adjustment based on extracted skill balance
    tech_weight = 35 if len(skills) > 4 else 30
    comm_weight = 20
    prob_weight = 25
    exp_weight = 100 - (tech_weight + comm_weight + prob_weight)

    state["rubric"] = {
        "technical": tech_weight,
        "communication": comm_weight,
        "problemSolving": prob_weight,
        "experience": exp_weight,
    }

    state["thresholds"] = {
        "minScore": 70,
        "autoOffer": False,
        "qCount": 5,
    }

    return state


def validate_output_node(state: JDParserState) -> JDParserState:
    """Node 4: Validate agent state against Pydantic schema."""
    output = JDParserOutput(
        description=state.get("generated_description", ""),
        rubric=RubricWeights(**state.get("rubric", {})),
        thresholds=JobThresholds(**state.get("thresholds", {})),
    )
    state["status"] = "validated"
    return state


def build_jd_parser_graph():
    """Build LangGraph workflow graph for JD Parser Agent."""
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(JDParserState)
    builder.add_node("parse_requirements", parse_requirements_node)
    builder.add_node("generate_description", generate_description_node)
    builder.add_node("compute_rubric", compute_rubric_node)
    builder.add_node("validate_output", validate_output_node)

    builder.set_entry_point("parse_requirements")
    builder.add_edge("parse_requirements", "generate_description")
    builder.add_edge("generate_description", "compute_rubric")
    builder.add_edge("compute_rubric", "validate_output")
    builder.add_edge("validate_output", END)

    return builder.compile()


# Compiled agent graph instance
_jd_parser_app = build_jd_parser_graph()


async def run_jd_parser_agent(job_id: str, raw_description: str) -> Dict[str, Any]:
    """
    Execute JD Parser Agent pipeline on a job description prompt.
    Returns dict containing generated description, rubric, thresholds, and extracted skills.
    """
    initial_state: JDParserState = {
        "job_id": job_id,
        "raw_description": raw_description,
    }

    if _jd_parser_app:
        try:
            final_state = await _jd_parser_app.ainvoke(initial_state)
            return {
                "description": final_state.get("generated_description"),
                "rubric": final_state.get("rubric"),
                "thresholds": final_state.get("thresholds"),
                "skills": final_state.get("extracted_skills", []),
            }
        except Exception as e:
            logger.error(f"LangGraph execution error in JD Parser Agent: {e}")

    # Fallback linear execution if graph invocation fails or LangGraph unavailable
    s1 = parse_requirements_node(initial_state)
    s2 = generate_description_node(s1)
    s3 = compute_rubric_node(s2)
    s4 = validate_output_node(s3)

    return {
        "description": s4.get("generated_description"),
        "rubric": s4.get("rubric"),
        "thresholds": s4.get("thresholds"),
        "skills": s4.get("extracted_skills", []),
    }
