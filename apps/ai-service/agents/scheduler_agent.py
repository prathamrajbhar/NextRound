import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, TypedDict
from services.llm_service import generate_text

logger = logging.getLogger("scheduler_agent")

from core.langgraph import LANGGRAPH_AVAILABLE, StateGraph, END


class SchedulerState(TypedDict, total=False):
    application_id: str
    interview_id: str
    candidate_email: str
    job_title: str
    action: str
    org_id: str
    availability_hours: Dict[str, Any]
    available_slots: List[str]
    formatted_email: str
    scheduled_at: str
    status: str
    slot_source: str


# Representative times within the availability bands the company-onboarding
# "Scheduling & Automation" step exposes (Morning 9a-12p, Afternoon 12p-5p,
# Evening 5p-9p). Slots are emitted as real future UTC datetimes inside the
# org's configured windows.
BAND_TIMES = {
    "morning": (10, 0),
    "afternoon": (14, 0),
    "evening": (18, 0),
}

def _day_category(dt: datetime) -> str:
    """Monday-Friday -> 'weekday', Saturday/Sunday -> 'weekend'."""
    return "weekday" if dt.weekday() < 5 else "weekend"


def _enabled_bands(availability: Any, category: str) -> List[str]:
    """Return enabled band keys (morning/afternoon/evening) for a day category."""
    if not isinstance(availability, dict):
        return []
    day_cfg = availability.get(category)
    if not isinstance(day_cfg, dict):
        return []
    return [band for band, enabled in day_cfg.items() if enabled is True and band in BAND_TIMES]


def compute_available_slots(now: datetime, availability: Any, count: int = 3) -> List[str]:
    """Generate up to ``count`` real future UTC slots within the org's configured
    availability windows (Organization.settings.availabilityHours). Returns an
    empty list when the config yields no valid future slot.
    """
    slots: List[str] = []
    day_offset = 1
    while len(slots) < count and day_offset <= 14:
        candidate_day = now + timedelta(days=day_offset)
        for band in _enabled_bands(availability, _day_category(candidate_day)):
            if len(slots) >= count:
                break
            hour, minute = BAND_TIMES[band]
            slot_dt = candidate_day.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if slot_dt > now:
                slots.append(slot_dt.isoformat() + "Z")
        day_offset += 1
    return slots


def generate_slots_node(state: SchedulerState) -> SchedulerState:
    """Node 1: Generate 3 prospective interview time slots.

    Slots are driven by the org's real availability config when present. When it
    is absent (or yields no valid future time) the node reports no slots and an
    honest status instead of fabricating a hardcoded schedule.
    """
    logger.info(f"Generating interview time slots for application {state.get('application_id')}")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    availability = state.get("availability_hours")

    if isinstance(availability, dict) and availability:
        slots = compute_available_slots(now, availability)
        state["slot_source"] = "org_availability"
        if not slots:
            logger.warning(
                "Org availability is configured but produced no valid future slots; "
                "reporting no slots rather than fabricating times."
            )
    else:
        slots = []
        state["slot_source"] = "no_availability_config"
        logger.warning(
            "No org availability config present; reporting no slots "
            "rather than inventing interview times."
        )

    state["available_slots"] = slots
    return state


def format_invitation_email_node(state: SchedulerState) -> SchedulerState:
    """Node 2: Format professional AI interview invitation email with slot options.

    Honesty guard: without a real candidate email there is no recipient, and
    without real slots there is nothing to offer. In both cases no invitation is
    drafted (no placeholder address or fabricated content is produced).
    """
    job_title = state.get("job_title") or ""
    email = state.get("candidate_email") or ""
    slots = state.get("available_slots") or []

    if not email:
        state["formatted_email"] = ""
        state["status"] = "email_unavailable"
        logger.warning("No candidate email available; scheduling invite skipped.")
        return state

    if not slots:
        state["formatted_email"] = ""
        state["status"] = "no_slots"
        logger.warning("No available slots to offer; scheduling invite skipped.")
        return state

    role = job_title or "the open position"
    formatted_slots_str = "\n".join([f"- {slot}" for slot in slots])

    prompt = (
        f"Write a friendly and professional interview invitation email for the role of '{role}'.\n"
        f"Candidate Email: {email}\n"
        f"Available Slots:\n{formatted_slots_str}\n"
        f"Ask them to choose one slot or request a reschedule."
    )
    generated_email = generate_text(prompt)
    if not generated_email:
        raise RuntimeError("Scheduler LLM returned no invitation email; not sending a canned substitute.")
    state["formatted_email"] = generated_email
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
    action: str = "generate_slots",
    org_id: str = "",
    availability_hours: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Execute Scheduler Agent pipeline."""
    initial_state: SchedulerState = {
        "application_id": application_id,
        "interview_id": interview_id,
        "candidate_email": candidate_email,
        "job_title": job_title,
        "action": action,
        "org_id": org_id,
        "availability_hours": availability_hours,
    }

    if _scheduler_app:
        try:
            final_state = await _scheduler_app.ainvoke(initial_state)
            return {
                "available_slots": final_state.get("available_slots", []),
                "formatted_email": final_state.get("formatted_email", ""),
                "status": final_state.get("status"),
                "slot_source": final_state.get("slot_source"),
            }
        except Exception as e:
            logger.error(f"LangGraph execution error in Scheduler Agent: {e}")

    s1 = generate_slots_node(initial_state)
    s2 = format_invitation_email_node(s1)

    return {
        "available_slots": s2.get("available_slots", []),
        "formatted_email": s2.get("formatted_email", ""),
        "status": s2.get("status"),
        "slot_source": s1.get("slot_source"),
    }
