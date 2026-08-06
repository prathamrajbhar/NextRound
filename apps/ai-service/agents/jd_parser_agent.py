import logging
from typing import Dict, Any, TypedDict
from pydantic import BaseModel, Field
from core.config import settings

logger = logging.getLogger("jd_parser_agent")

# Try importing LangGraph
try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Agent will use direct node workflow execution.")

# Try initializing Google GenAI Client
genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize Google GenAI Client in jd_parser_agent: {e}")


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

    skills = ["TypeScript", "React", "Node.js", "System Architecture", "Problem Solving"]
    if genai_client and raw:
        try:
            prompt = f"Extract core technical skills and requirements from this job description prompt as a JSON list of strings:\n\n{raw}"
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if res and res.text:
                import json, re
                match = re.search(r"\[.*\]", res.text, re.DOTALL)
                if match:
                    skills = json.loads(match.group(0))
        except Exception as e:
            logger.error(f"Gemini requirement parsing failed: {e}")

    state["extracted_skills"] = skills
    return state


def generate_description_node(state: JDParserState) -> JDParserState:
    """Node 2: Generate structured, ATS-optimized markdown job description."""
    raw = state.get("raw_description", "")
    skills = state.get("extracted_skills", [])

    if genai_client and raw:
        try:
            prompt = (
                f"Create a professional, highly engaging ATS-friendly job description in markdown format based on:\n"
                f"Input: {raw}\nKey Skills: {', '.join(skills)}\n\n"
                f"Include sections: Role Overview, Key Responsibilities, Requirements & Qualifications, What We Offer."
            )
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            if res and res.text:
                state["generated_description"] = res.text.strip()
                return state
        except Exception as e:
            logger.error(f"Gemini description generation failed: {e}")

    # Fallback template description
    formatted_skills = "\n".join([f"- {s}" for s in skills])
    fallback_desc = f"""## Position Overview
{raw or 'We are seeking a talented engineer to join our team and build scalable software solutions.'}

## Key Responsibilities
- Architect, build, and maintain high-performance software applications.
- Collaborate with cross-functional teams to deliver robust features.
- Participate in code reviews, technical designs, and system optimizations.

## Technical Requirements
{formatted_skills}

## What We Offer
- Competitive compensation and equity options.
- Flexible remote-first work setup.
- Continuous growth, mentorship, and professional development.
"""
    state["generated_description"] = fallback_desc
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
    Returns dict containing generated description, rubric, and thresholds.
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
    }
