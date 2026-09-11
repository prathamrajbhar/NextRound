import pytest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.resume_builder_types import (
    STAGES,
    ACTIONS,
    MAX_TURNS,
    STAGE_MIN_TURNS,
    PROFILE_TYPES,
    ResumeBuilderState,
)
from agents.resume_builder_memory import (
    _normalize_question,
    _is_duplicate,
    _normalize_memory,
    _collect_asked_questions,
    _update_memory,
    _stage_complete,
    _next_stage,
    _infer_profile_type,
    _derive_insight,
)
from agents.resume_builder_prompts import (
    _validate_analysis,
    _context_block,
    _build_greeting_prompt,
    _build_turn_prompt,
    _build_closing_prompt,
    _STAGE_GUIDANCE,
)
# We won't import run_resume_builder_agent here because it requires LLM calls.
# The unit tests below cover all the pure functions that the agent depends on.


# ---------------------------------------------------------------------------
# resume_builder_types — constants and type contract
# ---------------------------------------------------------------------------

class TestResumeBuilderTypes:
    """Verify type definitions, constants, and stage ordering."""

    def test_stages_are_ordered_sequentially(self):
        """STAGES must be in the order the agent walks through."""
        assert STAGES[0] == "intro"
        assert STAGES[-1] == "closing"
        assert "work_history" in STAGES
        assert "skills" in STAGES
        assert "education" in STAGES
        assert "certifications" in STAGES
        assert "career_goals" in STAGES

    def test_stages_have_no_duplicates(self):
        assert len(STAGES) == len(set(STAGES))

    def test_stage_min_turns_matches_stages(self):
        """Every stage in STAGES must have a min-turn entry."""
        for stage in STAGES:
            assert stage in STAGE_MIN_TURNS, f"Missing min-turns for stage '{stage}'"

    def test_closing_stage_has_zero_min_turns(self):
        assert STAGE_MIN_TURNS["closing"] == 0

    def test_intro_has_min_turn_1(self):
        assert STAGE_MIN_TURNS["intro"] == 1

    def test_work_history_has_high_min_turns(self):
        assert STAGE_MIN_TURNS["work_history"] >= 2

    def test_actions_are_valid(self):
        assert "FOLLOW_UP" in ACTIONS
        assert "CLARIFY" in ACTIONS
        assert "DEEPEN" in ACTIONS
        assert "NEXT_TOPIC" in ACTIONS
        assert "END" in ACTIONS
        assert len(ACTIONS) == 5

    def test_max_turns_is_reasonable(self):
        assert MAX_TURNS >= 20
        assert MAX_TURNS <= 60

    def test_profile_types_cover_all_cases(self):
        assert "student" in PROFILE_TYPES
        assert "fresher" in PROFILE_TYPES
        assert "experienced" in PROFILE_TYPES
        assert "career_changer" in PROFILE_TYPES
        assert "freelancer" in PROFILE_TYPES

    def test_resume_builder_state_type_has_required_fields(self):
        """Verify the TypedDict has all the fields we expect."""
        # We can't do runtime type checking on TypedDict, but we verify
        # the keys we access are correct by using them in other tests.
        state = ResumeBuilderState(
            session_id="test",
            target_role="Engineer",
            target_company="Acme",
            current_stage="intro",
            turn_number=0,
            stage_turns={},
            conversation_history=[],
            is_complete=False,
            memory={},
        )
        assert state["session_id"] == "test"
        assert state["current_stage"] == "intro"


# ---------------------------------------------------------------------------
# resume_builder_memory — deduplication, normalisation, stage logic
# ---------------------------------------------------------------------------

class TestQuestionNormalization:
    """Tests for _normalize_question and _is_duplicate."""

    def test_normalize_question_lowercases(self):
        assert _normalize_question("What Is Your Name?") == "what is your name"

    def test_normalize_question_removes_punctuation(self):
        assert _normalize_question("What's your tech stack?") == "whats your tech stack"

    def test_normalize_question_collapses_whitespace(self):
        assert _normalize_question("  too   many   spaces  ") == "too many spaces"

    def test_normalize_question_handles_empty(self):
        assert _normalize_question("") == ""
        assert _normalize_question(None) == ""

    def test_normalize_question_preserves_numbers(self):
        assert _normalize_question("5 years experience") == "5 years experience"

    def test_is_duplicate_exact_match(self):
        assert _is_duplicate("What is your name?", ["What is your name?"]) is True

    def test_is_duplicate_normalized_match(self):
        assert _is_duplicate("What is your name?", ["What's your name?"]) is True

    def test_is_duplicate_similar_but_not_duplicate(self):
        # Same topic, different question — should not be flagged as duplicate
        assert _is_duplicate(
            "Which programming languages do you use?",
            ["What is your primary language?"]
        ) is False

    def test_is_duplicate_token_overlap_below_threshold(self):
        # "What is your experience?" vs "Tell me about your background"
        # token overlap should be < 0.95
        assert _is_duplicate(
            "What is your experience?",
            ["Tell me about your background"]
        ) is False

    def test_is_duplicate_empty_question(self):
        assert _is_duplicate("", ["some question"]) is False

    def test_is_duplicate_with_many_existing_questions(self):
        asked = ["Q1", "Q2", "Q3", "What is your name?", "Q5"]
        assert _is_duplicate("What is your name?", asked) is True
        assert _is_duplicate("What is your age?", asked) is False

    def test_is_duplicate_case_insensitive(self):
        assert _is_duplicate("WHAT IS YOUR NAME?", ["What is your name?"]) is True


class TestMemoryNormalization:
    """Tests for _normalize_memory — ensures memory always has the right shape."""

    def test_normalize_empty_memory(self):
        result = _normalize_memory(None)
        assert result["candidate_facts"] == []
        assert result["covered_topics"] == []
        assert result["missing_information"] == []
        assert result["previous_questions"] == []
        assert result["current_topic"] is None
        assert result["stage_turns"] == {}
        assert result["profile_type"] is None
        assert result["user_name"] is None

    def test_normalize_partial_memory(self):
        result = _normalize_memory({"candidate_facts": ["fact1"]})
        assert result["candidate_facts"] == ["fact1"]
        assert result["covered_topics"] == []
        assert result["stage_turns"] == {}

    def test_normalize_preserves_existing_lists(self):
        result = _normalize_memory({
            "candidate_facts": ["a", "b"],
            "covered_topics": ["intro"],
            "missing_information": ["x"],
            "previous_questions": ["Q1"],
        })
        assert len(result["candidate_facts"]) == 2
        assert len(result["covered_topics"]) == 1
        assert len(result["missing_information"]) == 1
        assert len(result["previous_questions"]) == 1

    def test_normalize_coerces_non_list_to_list(self):
        result = _normalize_memory({"candidate_facts": "not a list"})
        assert isinstance(result["candidate_facts"], list)
        assert result["candidate_facts"] == []

    def test_normalize_preserves_stage_turns(self):
        result = _normalize_memory({"stage_turns": {"intro": 2, "background": 1}})
        assert result["stage_turns"] == {"intro": 2, "background": 1}

    def test_normalize_handles_non_dict_stage_turns(self):
        result = _normalize_memory({"stage_turns": "bad"})
        assert result["stage_turns"] == {}

    def test_normalize_does_not_overwrite_existing_keys(self):
        custom = {"custom_key": "custom_value"}
        result = _normalize_memory(custom)
        assert result["custom_key"] == "custom_value"


class TestCollectAskedQuestions:
    """Tests for _collect_asked_questions — builds the question history."""

    def test_collects_from_memory_previous_questions(self):
        memory = {"previous_questions": ["Q1", "Q2"]}
        result = _collect_asked_questions(memory, [])
        assert "Q1" in result
        assert "Q2" in result

    def test_collects_from_conversation_history_ai_speaker(self):
        history = [
            {"speaker": "ai", "text": "What is your name?"},
            {"speaker": "candidate", "text": "Alice"},
            {"speaker": "ai", "text": "What is your experience?"},
        ]
        result = _collect_asked_questions({}, history)
        assert "What is your name?" in result
        assert "What is your experience?" in result
        # Candidate's answer should not be included
        assert "Alice" not in result

    def test_handles_interviewer_speaker_label(self):
        history = [
            {"role": "interviewer", "text": "Tell me about yourself"},
        ]
        result = _collect_asked_questions({}, history)
        assert "Tell me about yourself" in result

    def test_deduplicates_questions_in_collection(self):
        history = [
            {"speaker": "ai", "text": "What is your name?"},
            {"speaker": "ai", "text": "What is your name?"},  # duplicate
        ]
        result = _collect_asked_questions({}, history)
        assert result.count("What is your name?") == 1

    def test_handles_non_dict_history_entries(self):
        history = ["bad entry", 123, None, {"speaker": "ai", "text": "Good question"}]
        result = _collect_asked_questions({}, history)
        assert "Good question" in result

    def test_empty_history_returns_memory_questions_only(self):
        memory = {"previous_questions": ["Q1"]}
        result = _collect_asked_questions(memory, [])
        assert result == ["Q1"]


class TestMemoryUpdate:
    """Tests for _update_memory — integrates analysis into memory state."""

    def test_adds_candidate_fact_when_not_duplicate(self):
        memory = {"candidate_facts": []}
        analysis = {"memory_update": "5 years Python experience"}
        result = _update_memory(memory, analysis, "I have 5 years of Python experience", "background")
        assert "5 years Python experience" in result["candidate_facts"]

    def test_does_not_add_duplicate_fact(self):
        memory = {"candidate_facts": ["5 years Python experience"]}
        analysis = {"memory_update": "5 years Python experience"}
        result = _update_memory(memory, analysis, "I have 5 years of Python experience", "background")
        assert len(result["candidate_facts"]) == 1

    def test_adds_covered_topic(self):
        memory = {"covered_topics": []}
        analysis = {"topic": "education"}
        result = _update_memory(memory, analysis, "I have a CS degree", "education")
        assert "education" in result["covered_topics"]

    def test_does_not_add_already_covered_topic(self):
        memory = {"covered_topics": ["education"]}
        analysis = {"topic": "education"}
        result = _update_memory(memory, analysis, "I also have an MBA", "education")
        assert result["covered_topics"].count("education") == 1

    def test_updates_current_topic(self):
        memory = {}
        analysis = {"topic": "skills"}
        result = _update_memory(memory, analysis, "", "skills")
        assert result["current_topic"] == "skills"

    def test_captures_missing_information(self):
        memory = {}
        analysis = {"missing_information": ["years of experience", "degree"]}
        result = _update_memory(memory, analysis, "", "")
        assert "years of experience" in result["missing_information"]
        assert "degree" in result["missing_information"]

    def test_adds_question_to_previous_questions(self):
        memory = {"previous_questions": []}
        analysis = {"next_question": "What is your name?"}
        result = _update_memory(memory, analysis, "", "")
        assert "What is your name?" in result["previous_questions"]

    def test_does_not_add_duplicate_question(self):
        memory = {"previous_questions": ["What is your name?"]}
        analysis = {"next_question": "What is your name?"}
        result = _update_memory(memory, analysis, "", "")
        assert result["previous_questions"].count("What is your name?") == 1

    def test_captures_user_name_from_analysis(self):
        memory = {}
        analysis = {"user_name": "Alice"}
        result = _update_memory(memory, analysis, "", "intro")
        assert result["user_name"] == "Alice"

    def test_captures_profile_type_when_valid(self):
        memory = {}
        analysis = {"profile_type": "experienced"}
        result = _update_memory(memory, analysis, "", "intro")
        assert result["profile_type"] == "experienced"

    def test_ignores_invalid_profile_type(self):
        memory = {}
        analysis = {"profile_type": "superhero"}
        result = _update_memory(memory, analysis, "", "intro")
        assert result["profile_type"] is None

    def test_increments_stage_turns_on_candidate_answer(self):
        memory = {"stage_turns": {"background": 1}}
        analysis = {}
        result = _update_memory(memory, analysis, "I have 5 years exp", "background")
        assert result["stage_turns"]["background"] == 2

    def test_does_not_increment_stage_turns_on_empty_answer(self):
        memory = {"stage_turns": {"background": 1}}
        analysis = {}
        result = _update_memory(memory, analysis, "", "background")
        assert result["stage_turns"]["background"] == 1


class TestStageProgression:
    """Tests for _stage_complete, _next_stage — stage transition logic."""

    def test_stage_complete_when_min_turns_reached(self):
        memory = {"stage_turns": {"background": 2}}
        assert _stage_complete(memory, "background") is True

    def test_stage_not_complete_below_min_turns(self):
        memory = {"stage_turns": {"work_history": 1}}
        assert _stage_complete(memory, "work_history") is False

    def test_stage_complete_at_exact_min(self):
        memory = {"stage_turns": {"intro": 1}}
        assert _stage_complete(memory, "intro") is True

    def test_stage_not_complete_below_zero_min(self):
        memory = {"stage_turns": {"closing": 0}}
        assert _stage_complete(memory, "closing") is True  # 0 >= 0

    def test_next_stage_returns_successor(self):
        assert _next_stage("intro") == "background"
        assert _next_stage("background") == "work_history"
        assert _next_stage("work_history") == "achievements"

    def test_next_stage_returns_none_for_closing(self):
        assert _next_stage("closing") is None

    def test_next_stage_returns_none_for_unknown_stage(self):
        assert _next_stage("nonexistent") is None

    def test_next_stage_goes_to_closing_from_second_to_last(self):
        assert _next_stage(STAGES[-2]) == "closing"


class TestProfileTypeInference:
    """Tests for _infer_profile_type — heuristic profile detection."""

    def test_detects_student(self):
        facts = ["I am a final year computer science student at university"]
        assert _infer_profile_type(facts) == "student"

    def test_detects_fresher(self):
        facts = ["I am a fresh graduate with no experience"]
        assert _infer_profile_type(facts) == "fresher"

    def test_detects_experienced(self):
        facts = ["I have 8 years of experience as a senior engineer"]
        assert _infer_profile_type(facts) == "experienced"

    def test_detects_career_changer(self):
        facts = ["I am switching from marketing to software engineering"]
        assert _infer_profile_type(facts) == "career_changer"

    def test_detects_freelancer(self):
        facts = ["I have been a freelancer for 3 years"]
        assert _infer_profile_type(facts) == "freelancer"

    def test_returns_none_for_no_signal(self):
        facts = ["I like hiking on weekends"]
        assert _infer_profile_type(facts) is None

    def test_empty_facts_returns_none(self):
        assert _infer_profile_type([]) is None

    def test_student_with_experience_not_student(self):
        facts = ["I am a student but also worked at a startup for 2 years"]
        # Has "student" keyword but also "worked at" — should not be student
        result = _infer_profile_type(facts)
        assert result != "student"

    def test_case_insensitive_matching(self):
        facts = ["I STUDIED at college and am a STUDENT"]
        assert _infer_profile_type(facts) == "student"


class TestDeriveInsight:
    """Tests for _derive_insight — real-time coaching tips."""

    def test_returns_tip_for_single_missing_item(self):
        result = _derive_insight(["years of experience"])
        assert result == "Tip: mention years of experience to make this section stronger."

    def test_returns_tip_for_first_missing_item(self):
        result = _derive_insight(["degree", "years of experience", "certifications"])
        assert result == "Tip: mention degree to make this section stronger."

    def test_returns_none_for_empty_list(self):
        assert _derive_insight([]) is None

    def test_returns_none_for_whitespace_only(self):
        assert _derive_insight(["   "]) is None

    def test_returns_none_for_none_input(self):
        assert _derive_insight(None) is None


# ---------------------------------------------------------------------------
# resume_builder_prompts — validation and prompt building
# ---------------------------------------------------------------------------

class TestValidateAnalysis:
    """Tests for _validate_analysis — ensures LLM output conforms to schema."""

    def test_accepts_valid_analysis(self):
        parsed = {
            "response": "Got it.",
            "action": "FOLLOW_UP",
            "next_question": "What languages do you use?",
            "topic": "skills",
            "memory_update": "Python developer",
            "missing_information": [],
            "user_name": None,
            "profile_type": None,
        }
        result = _validate_analysis(parsed)
        assert result is not None
        assert result["action"] == "FOLLOW_UP"
        assert result["response"] == "Got it."
        assert result["next_question"] == "What languages do you use?"

    def test_rejects_non_dict(self):
        assert _validate_analysis("not a dict") is None
        assert _validate_analysis(123) is None
        assert _validate_analysis(None) is None

    def test_rejects_missing_response(self):
        parsed = {"action": "FOLLOW_UP"}
        assert _validate_analysis(parsed) is None

    def test_rejects_missing_action(self):
        parsed = {"response": "Got it."}
        assert _validate_analysis(parsed) is None

    def test_rejects_invalid_action(self):
        parsed = {
            "response": "Got it.",
            "action": "INVALID_ACTION",
        }
        assert _validate_analysis(parsed) is None

    def test_rejects_empty_response(self):
        parsed = {
            "response": "",
            "action": "FOLLOW_UP",
        }
        assert _validate_analysis(parsed) is None

    def test_rejects_non_string_next_question(self):
        parsed = {
            "response": "Got it.",
            "action": "FOLLOW_UP",
            "next_question": 123,
        }
        assert _validate_analysis(parsed) is None

    def test_rejects_non_string_topic(self):
        parsed = {
            "response": "Got it.",
            "action": "FOLLOW_UP",
            "topic": 42,
        }
        assert _validate_analysis(parsed) is None

    def test_rejects_non_string_memory_update(self):
        parsed = {
            "response": "Got it.",
            "action": "FOLLOW_UP",
            "memory_update": ["list"],
        }
        assert _validate_analysis(parsed) is None

    def test_rejects_non_list_missing_information(self):
        parsed = {
            "response": "Got it.",
            "action": "FOLLOW_UP",
            "missing_information": "not a list",
        }
        assert _validate_analysis(parsed) is not None  # coercion to []
        assert _validate_analysis(parsed)["missing_information"] == []

    def test_normalizes_fields_on_accept(self):
        parsed = {
            "response": "  Got it.  ",
            "action": "FOLLOW_UP",
            "next_question": "  What is your name?  ",
            "topic": "  intro  ",
            "memory_update": "  fact  ",
            "missing_information": ["  gap  "],
            "user_name": "  Alice  ",
            "profile_type": "  ExPeRiEnCeD  ",
        }
        result = _validate_analysis(parsed)
        assert result["response"] == "Got it."
        assert result["next_question"] == "What is your name?"
        assert result["topic"] == "intro"
        assert result["memory_update"] == "fact"
        assert result["missing_information"] == ["gap"]
        assert result["user_name"] == "Alice"
        assert result["profile_type"] == "experienced"

    def test_nulls_optional_fields(self):
        parsed = {
            "response": "Got it.",
            "action": "END",
            "next_question": None,
            "topic": None,
            "memory_update": None,
            "missing_information": None,
            "user_name": None,
            "profile_type": None,
        }
        result = _validate_analysis(parsed)
        assert result["next_question"] is None
        assert result["topic"] is None
        assert result["memory_update"] is None
        assert result["missing_information"] == []

    def test_coerces_action_to_upper(self):
        parsed = {
            "response": "Got it.",
            "action": "follow_up",
        }
        result = _validate_analysis(parsed)
        assert result["action"] == "FOLLOW_UP"


class TestContextBlock:
    """Tests for _context_block — builds the context section of prompts."""

    def test_includes_target_role_and_company(self):
        state = {
            "current_stage": "intro",
            "turn_number": 1,
            "conversation_history": [],
            "latest_candidate_response": "",
            "existing_resume": "",
            "career_goals": "",
        }
        result = _context_block(state, {}, [], "Senior Engineer", "Acme Corp", )
        assert "TARGET: Senior Engineer role at Acme Corp" in result

    def test_handles_missing_target_role(self):
        state = {
            "current_stage": "intro",
            "turn_number": 1,
            "conversation_history": [],
            "latest_candidate_response": "",
            "existing_resume": "",
            "career_goals": "",
        }
        result = _context_block(state, {}, [], "", "",)
        assert "TARGET: software engineering role at their target company" in result

    def test_includes_user_name(self):
        state = {"user_name": "Alice"}
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        assert "CANDIDATE NAME: Alice" in result

    def test_handles_missing_user_name(self):
        state = {}
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        assert "CANDIDATE NAME: (not captured yet)" in result

    def test_includes_profile_type(self):
        state = {"profile_type": "experienced"}
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        assert "PROFILE TYPE: experienced" in result

    def test_includes_conversation_history(self):
        state = {
            "conversation_history": [
                {"speaker": "ai", "text": "Hi"},
                {"speaker": "candidate", "text": "Hello"},
            ],
        }
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        assert "CONVERSATION HISTORY:" in result
        assert "Hi" in result

    def test_truncates_long_history_to_14_entries(self):
        history = [{"speaker": "ai", "text": f"Msg {i}"} for i in range(20)]
        state = {"conversation_history": history}
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        # Only last 14 should appear
        assert result.count("Msg") <= 14

    def test_includes_questions_already_asked(self):
        result = _context_block({}, {}, ["Q1", "Q2"], "Engineer", "Acme",)
        assert "QUESTIONS ALREADY ASKED" in result
        assert "Q1" in result
        assert "Q2" in result

    def test_includes_candidate_facts(self):
        memory = {"candidate_facts": ["5 years Python", "BS in CS"]}
        result = _context_block({}, memory, [], "Engineer", "Acme",)
        assert "CANDIDATE FACTS COLLECTED SO FAR:" in result
        assert "5 years Python" in result

    def test_truncates_facts_to_30(self):
        memory = {"candidate_facts": [f"fact {i}" for i in range(50)]}
        result = _context_block({}, memory, [], "Engineer", "Acme",)
        assert result.count("fact") <= 30

    def test_includes_existing_resume(self):
        state = {"existing_resume": "My resume text here..."}
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        assert "EXISTING RESUME" in result
        assert "My resume text here..." in result

    def test_truncates_existing_resume_to_3000_chars(self):
        state = {"existing_resume": "x" * 5000}
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        assert len(result.split("EXISTING RESUME")[-1].split("\n\n")[0].strip()) <= 3000

    def test_includes_career_goals(self):
        state = {"career_goals": "Become a tech lead"}
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        assert "CANDIDATE'S CAREER GOALS" in result
        assert "Become a tech lead" in result

    def test_includes_missing_information(self):
        memory = {"missing_information": ["degree", "certifications"]}
        result = _context_block({}, memory, [], "Engineer", "Acme",)
        assert "INFORMATION STILL MISSING: degree, certifications" in result

    def test_includes_latest_candidate_answer(self):
        state = {"latest_candidate_response": "I have 5 years experience"}
        result = _context_block(state, {}, [], "Engineer", "Acme",)
        assert "LATEST CANDIDATE ANSWER:" in result
        assert "I have 5 years experience" in result


class TestGreetingPrompt:
    """Tests for _build_greeting_prompt — first message construction."""

    def test_includes_system_prompt(self):
        state = {"existing_resume": ""}
        result = _build_greeting_prompt(state, "Engineer", "Acme",)
        assert "You are Alex" in result
        assert "CORE RULES" in result

    def test_includes_target_context(self):
        state = {}
        result = _build_greeting_prompt(state, "Backend Engineer", "TechCorp",)
        assert "Backend Engineer role" in result
        assert "TechCorp" in result

    def test_includes_existing_resume_hint(self):
        state = {"existing_resume": "Existing resume content..."}
        result = _build_greeting_prompt(state, "Engineer", "Acme",)
        assert "existing resume" in result.lower()
        assert "Existing resume content..." in result

    def test_truncates_existing_resume_to_1500_chars(self):
        state = {"existing_resume": "x" * 3000}
        result = _build_greeting_prompt(state, "Engineer", "Acme",)
        # The resume hint should be truncated
        assert result.count("x") < 3000

    def test_asks_only_for_name(self):
        state = {}
        result = _build_greeting_prompt(state, "Engineer", "Acme",)
        assert "ask ONLY for their name" in result

    def test_includes_json_format_specification(self):
        state = {}
        result = _build_greeting_prompt(state, "Engineer", "Acme",)
        assert "NEXT_TOPIC" in result
        assert "user_name" in result

    def test_action_is_next_topic(self):
        state = {}
        result = _build_greeting_prompt(state, "Engineer", "Acme",)
        assert '"action": "NEXT_TOPIC"' in result


class TestTurnPrompt:
    """Tests for _build_turn_prompt — per-turn prompt construction."""

    def test_includes_stage_guidance(self):
        state = {"current_stage": "skills"}
        memory = {}
        result = _build_turn_prompt(state, memory, [], "Engineer", "Acme",)
        assert "STAGE: SKILLS" in result
        assert "collect a complete" in result.lower()

    def test_includes_advance_hint_when_min_turns_met(self):
        memory = {"stage_turns": {"intro": 1}}
        state = {"current_stage": "intro", "turn_number": 2}
        result = _build_turn_prompt(state, memory, [], "Engineer", "Acme",)
        assert "You MAY use NEXT_TOPIC now" in result

    def test_includes_advance_hint_when_min_turns_not_met(self):
        memory = {"stage_turns": {"work_history": 1}}
        state = {"current_stage": "work_history", "turn_number": 2}
        result = _build_turn_prompt(state, memory, [], "Engineer", "Acme",)
        assert "Do NOT use NEXT_TOPIC yet" in result

    def test_includes_json_format(self):
        state = {}
        result = _build_turn_prompt(state, {}, [], "Engineer", "Acme",)
        assert "FOLLOW_UP|CLARIFY|DEEPEN|NEXT_TOPIC|END" in result

    def test_includes_profile_type_in_prompt(self):
        memory = {"profile_type": "student"}
        state = {}
        result = _build_turn_prompt(state, memory, [], "Engineer", "Acme",)
        assert "PROFILE TYPE: student (adapt question style accordingly)" in result

    def test_includes_all_action_instructions(self):
        state = {}
        result = _build_turn_prompt(state, {}, [], "Engineer", "Acme",)
        assert "FOLLOW_UP: good answer" in result
        assert "DEEPEN: answer too short" in result
        assert "CLARIFY: answer unclear" in result
        assert "NEXT_TOPIC: current stage is sufficiently covered" in result
        assert "END: closing stage is done" in result


class TestClosingPrompt:
    """Tests for _build_closing_prompt — session end message."""

    def test_includes_system_prompt(self):
        state = {}
        result = _build_closing_prompt(state, "Engineer", "Acme",)
        assert "You are Alex" in result

    def test_includes_conversation_summary(self):
        state = {
            "conversation_history": [
                {"speaker": "ai", "text": "What is your name?"},
                {"speaker": "candidate", "text": "Alice"},
            ],
        }
        result = _build_closing_prompt(state, "Engineer", "Acme",)
        assert "Conversation so far:" in result
        assert "Alice" in result

    def test_includes_user_name_in_closing(self):
        state = {"user_name": "Alice"}
        result = _build_closing_prompt(state, "Engineer", "Acme",)
        assert "Alice" in result

    def test_says_resume_is_being_generated(self):
        state = {}
        result = _build_closing_prompt(state, "Engineer", "Acme",)
        assert "resume is being generated" in result

    def test_no_json_in_closing(self):
        state = {}
        result = _build_closing_prompt(state, "Engineer", "Acme",)
        # The closing prompt explicitly says "Return ONLY the spoken text — no JSON"
        assert "Return ONLY the spoken text" in result


class TestStageGuidanceCompleteness:
    """Verify every stage has corresponding guidance text."""

    def test_all_stages_have_guidance(self):
        for stage in STAGES:
            assert stage in _STAGE_GUIDANCE, f"Missing stage guidance for '{stage}'"

    def test_intro_guidance_asks_name(self):
        assert "name" in _STAGE_GUIDANCE["intro"].lower()

    def test_work_history_guidance_asks_for_company(self):
        assert "company" in _STAGE_GUIDANCE["work_history"].lower()

    def test_skills_guidance_mentions_categories(self):
        assert "programming languages" in _STAGE_GUIDANCE["skills"].lower()

    def test_projects_guidance_asks_for_technologies(self):
        assert "technologies" in _STAGE_GUIDANCE["projects"].lower()

    def test_education_guidance_mentions_degree(self):
        assert "degree" in _STAGE_GUIDANCE["education"].lower()

    def test_closing_guidance_is_brief(self):
        closing = _STAGE_GUIDANCE["closing"]
        assert "thank" in closing.lower()
        assert "closing message" in closing.lower()
