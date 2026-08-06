import logging
from datetime import datetime, timedelta
from typing import Dict, Any, TypedDict, List
from core.config import settings

logger = logging.getLogger("scheduler_agent")

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("LangGraph not installed. Scheduler Agent will use linear node execution.")

# GenAI client
genai_client = None
if settings.gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize GenAI client in scheduler_agent: {e}")


class SchedulerState(TypedDict, total=False):
    application_id: str
    interview_id: str
    candidate_email: str
    job_title: str
    action: str
    available_slots: List[str]
    formatted_email: str
    scheduled_at: str
    status: str


def generate_slots_node(state: SchedulerState) -> SchedulerState:
    """Node 1: Generate 3 prospective interview time slots based on business hours."""
    logger.info(f"Generating interview time slots for application {state.get('application_id')}")

    # Generate 3 slots for tomorrow, day after tomorrow, and 3 days from now at 10:00 AM, 2:00 PM, and 4:00 PM UTC
    now = datetime.utcnow()
    slots = [
        (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0).isoformat() + "Z",
        (now + timedelta(days=1)).replace(hour=14, minute=0, second=0, microsecond=0).isoformat() + "Z",
        (now + timedelta(days=2)).replace(hour=11, minute=0, second=0, microsecond=0).isoformat() + "Z",
    ]

    state["available_slots"] = slots
    return state


def format_invitation_email_node(state: SchedulerState) -> SchedulerState:
    """Node 2: Format professional AI interview invitation email with slot options."""
    job_title = state.get("job_title", "Software Engineer")
    email = state.get("candidate_email", "candidate@example.com")
    slots = state.get("available_slots", [])

    formatted_slots_str = "\n".join([f"- {slot}" for slot in slots])

    if genai_client:
        try:
            prompt = (
                f"Write a friendly and professional interview invitation email for the role of '{job_title}'.\n"
                f"Candidate Email: {email}\n"
                f"Available Slots:\n{formatted_slots_str}\n"
                f"Ask them to choose one slot or request a reschedule."
            )
            res = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            if res and res.text:
                state["formatted_email"] = res.text.strip()
                return state
        except Exception as e:
            logger.error(f"Gemini email formatting failed: {e}")

    state["formatted_email"] = (
        f"Hello,\n\n"
        f"Thank you for progressing in our recruitment pipeline for the {job_title} position. "
        f"Please select your preferred interview time slot from the options below:\n\n"
        f"{formatted_slots_str}\n\n"
        f"Best regards,\nNextRound AI Hiring Platform"
    )
    return state


def build_scheduler_graph():
    """Build LangGraph workflow graph for Scheduler Agent."""
    if not LANGGRAPH_AVAILABLE:
        return None

    builder = StateGraph(SchedulerState)
    builder.add_node("generate_slots", generate_slots_node)
    builder.add_node("format_invitation_email", format_invitation_email_node)

    builder.set_entry_point("generate_slots")
    builder.add_edge("generate_slots", "format_invitation_email")
    builder.add_edge("format_invitation_email", END)

    return builder.compile()


_scheduler_app = build_scheduler_graph()


async def run_scheduler_agent(
    application_id: str,
    interview_id: str = "",
    candidate_email: str = "",
    job_title: str = "",
    action: str = "generate_slots"
) -> Dict[str, Any]:
    """Execute Scheduler Agent pipeline."""
    initial_state: SchedulerState = {
        "application_id": application_id,
        "interview_id": interview_id,
        "candidate_email": candidate_email,
        "job_title": job_title,
        "action": action,
    }

    if _scheduler_app:
        try:
            final_state = await _scheduler_app.ainvoke(initial_state)
            return {
                "available_slots": final_state.get("available_slots", []),
                "formatted_email": final_state.get("formatted_email", ""),
                "status": "completed",
            }
        except Exception as e:
            logger.error(f"LangGraph execution error in Scheduler Agent: {e}")

    s1 = generate_slots_node(initial_state)
    s2 = format_invitation_email_node(s1)

    return {
        "available_slots": s2.get("available_slots", []),
        "formatted_email": s2.get("formatted_email", ""),
        "status": "completed",
    }
