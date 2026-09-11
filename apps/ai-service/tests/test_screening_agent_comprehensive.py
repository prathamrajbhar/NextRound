import pytest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.screening_nodes import (
    parse_resume_node,
    score_against_rubric_node,
    compute_gaps_node,
    make_decision_node,
    generate_feedback_node,
)
from agents.screening_types import ScreeningState, GapAnalysis, ScreeningOutput
from services.embedding.embedding_service import embed_text, embed_resume, cosine_similarity


# ---------------------------------------------------------------------------
# Embedding service — unit tests (the most testable part without model files)
# ---------------------------------------------------------------------------

class TestEmbeddingService:
    """Tests for the embedding service functions — cosine similarity math."""

    def test_cosine_similarity_identical_vectors(self):
        """Identical vectors should give cosine similarity of 1.0."""
        vec = [1.0, 2.0, 3.0]
        assert cosine_similarity(vec, vec) == pytest.approx(1.0)

    def test_cosine_similarity_opposite_vectors(self):
        """Opposite vectors are normalized to 0.0 in [0.0, 1.0] similarity space."""
        vec_a = [1.0, 0.0]
        vec_b = [-1.0, 0.0]
        assert cosine_similarity(vec_a, vec_b) == pytest.approx(0.0)

    def test_cosine_similarity_orthogonal_vectors(self):
        """Orthogonal vectors should give cosine similarity of 0.0."""
        vec_a = [1.0, 0.0]
        vec_b = [0.0, 1.0]
        assert cosine_similarity(vec_a, vec_b) == pytest.approx(0.0)

    def test_cosine_similarity_zero_vector_handling(self):
        """Zero vector should not crash; result should be 0."""
        result = cosine_similarity([0.0, 0.0], [1.0, 2.0])
        assert result == pytest.approx(0.0)

    def test_cosine_similarity_768_dim_vectors(self):
        """Should handle the expected 768-dim embedding size."""
        import random
        random.seed(42)
        vec_a = [random.gauss(0, 1) for _ in range(768)]
        vec_b = [random.gauss(0, 1) for _ in range(768)]
        result = cosine_similarity(vec_a, vec_b)
        assert -1.0 <= result <= 1.0

    def test_embed_text_returns_768_dim(self):
        """embed_text should return a vector of the expected dimension."""
        # This requires the actual model to be loaded, so we test shape only
        # when the model is available. Without it, we skip.
        try:
            vec = embed_text("Test text for embedding dimension check")
            assert len(vec) == 768
            assert all(isinstance(x, float) for x in vec)
        except (RuntimeError, ImportError):
            pytest.skip("Embedding model not available in test environment")

    def test_embed_resume_returns_768_dim(self):
        """embed_resume should return a 768-dim vector."""
        try:
            vec = embed_resume("Resume text for dimension check")
            assert len(vec) == 768
            assert all(isinstance(x, float) for x in vec)
        except (RuntimeError, ImportError):
            pytest.skip("Embedding model not available in test environment")


# ---------------------------------------------------------------------------
# parse_resume_node — skill extraction from resume text
# ---------------------------------------------------------------------------

class TestParseResumeNode:
    """Tests for parse_resume_node — the first node in the screening graph."""

    @patch("agents.screening_nodes.generate_text")
    @patch("agents.screening_nodes.extract_json_array")
    def test_extracts_skills_from_resume(self, mock_extract, mock_generate):
        """When LLM returns a valid JSON array of skills, they are stored."""
        mock_generate.return_value = '["Python", "FastAPI", "PostgreSQL"]'
        mock_extract.return_value = ["Python", "FastAPI", "PostgreSQL"]

        state: ScreeningState = {
            "application_id": "app-001",
            "resume_text": "Experienced Python developer with FastAPI and PostgreSQL.",
        }

        result = parse_resume_node(state)
        assert "parsed_skills" in result
        assert result["parsed_skills"] == ["Python", "FastAPI", "PostgreSQL"]

    @patch("agents.screening_nodes.generate_text")
    @patch("agents.screening_nodes.extract_json_array")
    def test_returns_empty_skills_when_llm_fails(self, mock_extract, mock_generate):
        """When LLM returns nothing, parsed_skills should be empty list."""
        mock_generate.return_value = None
        mock_extract.return_value = None

        state: ScreeningState = {
            "application_id": "app-002",
            "resume_text": "Some resume text here",
        }

        result = parse_resume_node(state)
        assert result["parsed_skills"] == []

    @patch("agents.screening_nodes.generate_text")
    @patch("agents.screening_nodes.extract_json_array")
    def test_filters_non_string_skills(self, mock_extract, mock_generate):
        """Non-string items in the array should be filtered out."""
        mock_generate.return_value = '["Python", 123, null, "Go"]'
        mock_extract.return_value = ["Python", 123, None, "Go"]

        state: ScreeningState = {
            "application_id": "app-003",
            "resume_text": "Resume with mixed content",
        }

        result = parse_resume_node(state)
        assert result["parsed_skills"] == ["Python", "Go"]

    @patch("agents.screening_nodes.generate_text")
    @patch("agents.screening_nodes.extract_json_array")
    def test_returns_empty_when_resume_text_is_empty(self, mock_extract, mock_generate):
        """Empty resume text should not trigger LLM call."""
        state: ScreeningState = {
            "application_id": "app-004",
            "resume_text": "",
        }

        result = parse_resume_node(state)
        assert result["parsed_skills"] == []

    @patch("agents.screening_nodes.generate_text")
    @patch("agents.screening_nodes.extract_json_array")
    def test_preserves_application_id_in_state(self, mock_extract, mock_generate):
        mock_generate.return_value = '["Python"]'
        mock_extract.return_value = ["Python"]
        state: ScreeningState = {
            "application_id": "app-preserve-001",
            "resume_text": "Some text",
        }
        result = parse_resume_node(state)
        assert result["application_id"] == "app-preserve-001"

    def test_strips_whitespace_from_skill_strings(self):
        @patch("agents.screening_nodes.generate_text")
        @patch("agents.screening_nodes.extract_json_array")
        def _test(mock_extract, mock_generate):
            mock_generate.return_value = '[" Python ", "  FastAPI  ", "PostgreSQL"]'
            mock_extract.return_value = [" Python ", "  FastAPI  ", "PostgreSQL"]
            state: ScreeningState = {
                "application_id": "app-strip-001",
                "resume_text": "Resume text",
            }
            result = parse_resume_node(state)
            assert result["parsed_skills"] == ["Python", "FastAPI", "PostgreSQL"]

        _test()


# ---------------------------------------------------------------------------
# score_against_rubric_node — weighted scoring
# ---------------------------------------------------------------------------

class TestScoreAgainstRubricNode:
    """Tests for score_against_rubric_node — the core scoring logic."""

    @patch("agents.screening_nodes.embed_text")
    @patch("agents.screening_nodes.embed_resume")
    @patch("agents.screening_nodes.cosine_similarity")
    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    def test_computes_weighted_resume_score(
        self, mock_llm_score, mock_cosine, mock_embed_resume, mock_embed_text
    ):
        """The weighted average of LLM scores should be stored as resume_score."""
        mock_embed_text.return_value = [0.1] * 768
        mock_embed_resume.return_value = [0.2] * 768
        mock_cosine.return_value = 0.85
        mock_llm_score.return_value = {
            "technical": 85.0,
            "communication": 70.0,
            "problem_solving": 80.0,
            "experience": 75.0,
        }

        state: ScreeningState = {
            "application_id": "app-score-001",
            "resume_text": "Resume text",
            "job_description": "Job description",
            "rubric": {
                "technical": 40,
                "communication": 20,
                "problemSolving": 25,
                "experience": 15,
            },
        }

        result = score_against_rubric_node(state)

        # resume_score should be the weighted average of LLM dimension scores
        # tech_w = 0.40, comm_w = 0.20, prob_w = 0.25, exp_w = 0.15
        expected = (85.0 * 0.40) + (70.0 * 0.20) + (80.0 * 0.25) + (75.0 * 0.15)
        expected = round(expected, 2)
        assert result["resume_score"] == expected

    @patch("agents.screening_nodes.embed_text")
    @patch("agents.screening_nodes.embed_resume")
    @patch("agents.screening_nodes.cosine_similarity")
    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    def test_computes_semantic_match_score(
        self, mock_llm_score, mock_cosine, mock_embed_resume, mock_embed_text
    ):
        """semantic_match_score should be cosine_similarity * 100."""
        mock_embed_text.return_value = [0.1] * 768
        mock_embed_resume.return_value = [0.3] * 768
        mock_cosine.return_value = 0.72
        mock_llm_score.return_value = {
            "technical": 80, "communication": 70,
            "problem_solving": 75, "experience": 70,
        }

        state: ScreeningState = {
            "application_id": "app-semantic-001",
            "resume_text": "Resume",
            "job_description": "Job",
            "rubric": {"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25},
        }

        result = score_against_rubric_node(state)
        assert result["semantic_match_score"] == 72.0

    @patch("agents.screening_nodes.embed_text")
    @patch("agents.screening_nodes.embed_resume")
    @patch("agents.screening_nodes.cosine_similarity")
    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    def test_computes_composite_score(
        self, mock_llm_score, mock_cosine, mock_embed_resume, mock_embed_text
    ):
        """composite_score = (weighted_resume_score * 0.6) + (semantic_score * 0.4)."""
        mock_embed_text.return_value = [0.1] * 768
        mock_embed_resume.return_value = [0.2] * 768
        mock_cosine.return_value = 0.80
        mock_llm_score.return_value = {
            "technical": 85, "communication": 70,
            "problem_solving": 80, "experience": 75,
        }

        state: ScreeningState = {
            "application_id": "app-composite-001",
            "resume_text": "Resume",
            "job_description": "Job",
            "rubric": {"technical": 40, "communication": 20, "problemSolving": 25, "experience": 15},
        }

        result = score_against_rubric_node(state)

        weighted = (85 * 0.40) + (70 * 0.20) + (80 * 0.25) + (75 * 0.15)
        expected_composite = round((weighted * 0.6) + (80.0 * 0.4), 2)
        assert result["composite_score"] == expected_composite

    def test_throws_when_rubric_missing(self):
        state: ScreeningState = {
            "application_id": "app-norubric",
            "resume_text": "Text",
            "job_description": "Job",
            # No rubric key
        }

        with pytest.raises(RuntimeError, match="Screening rubric is missing"):
            score_against_rubric_node(state)

    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    def test_throws_when_llm_returns_no_scores(self, mock_llm_score):
        mock_llm_score.return_value = None

        state: ScreeningState = {
            "application_id": "app-noscore",
            "resume_text": "Resume",
            "job_description": "Job",
            "rubric": {"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25},
        }

        with pytest.raises(RuntimeError, match="Screening LLM returned no rubric scores"):
            score_against_rubric_node(state)

    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    def test_throws_when_llm_returns_incomplete_scores(self, mock_llm_score):
        mock_llm_score.return_value = {
            "technical": 80,
            # Missing communication, problem_solving, experience
        }

        state: ScreeningState = {
            "application_id": "app-incomplete",
            "resume_text": "Resume",
            "job_description": "Job",
            "rubric": {"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25},
        }

        with pytest.raises(RuntimeError, match="incomplete score set"):
            score_against_rubric_node(state)

    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    @patch("agents.screening_nodes.embed_text")
    def test_embeds_job_description(self, mock_embed, mock_llm_score):
        mock_embed.return_value = [0.0] * 768
        mock_llm_score.return_value = {"technical": 80, "communication": 70, "problem_solving": 75, "experience": 70}

        state: ScreeningState = {
            "application_id": "app-embed-job",
            "resume_text": "Resume",
            "job_description": "Specific job description text",
            "rubric": {"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25},
        }

        score_against_rubric_node(state)
        mock_embed.assert_called_once_with("Specific job description text")

    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    @patch("agents.screening_nodes.embed_resume")
    def test_embeds_resume_text(self, mock_embed, mock_llm_score):
        mock_embed.return_value = [0.0] * 768
        mock_llm_score.return_value = {"technical": 80, "communication": 70, "problem_solving": 75, "experience": 70}

        state: ScreeningState = {
            "application_id": "app-embed-resume",
            "resume_text": "Resume content for embedding",
            "job_description": "Job",
            "rubric": {"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25},
        }

        score_against_rubric_node(state)
        mock_embed.assert_called_once_with("Resume content for embedding")

    @patch("agents.screening_nodes.cosine_similarity")
    def test_uses_cosine_for_semantic_score(self, mock_cosine):
        mock_cosine.return_value = 0.75

        state: ScreeningState = {
            "application_id": "app-cosine",
            "resume_text": "Resume",
            "job_description": "Job",
            "rubric": {"technical": 30, "communication": 20, "problemSolving": 25, "experience": 25},
        }

        @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
        def _test(mock_llm):
            mock_llm.return_value = {"technical": 80, "communication": 70, "problem_solving": 75, "experience": 70}
            result = score_against_rubric_node(state)
            assert result["semantic_match_score"] == 75.0

        _test()


# ---------------------------------------------------------------------------
# compute_gaps_node — gap analysis from skills vs JD
# ---------------------------------------------------------------------------

class TestComputeGapsNode:
    """Tests for compute_gaps_node — gap analysis logic."""

    def test_identifies_missing_skills_from_jd(self):
        state: ScreeningState = {
            "application_id": "app-gaps-001",
            "parsed_skills": ["Python", "FastAPI", "AWS"],
            "job_description": "We need someone with Python, PostgreSQL, Redis, and Docker experience.",
        }

        result = compute_gaps_node(state)

        assert "gap_analysis" in result
        assert "PostgreSQL" in result["gap_analysis"]["missing_skills"]
        assert "Redis" in result["gap_analysis"]["missing_skills"]
        assert "Docker" in result["gap_analysis"]["missing_skills"]
        # Python is present — should not be in missing
        assert "Python" not in result["gap_analysis"]["missing_skills"]

    def test_empty_missing_skills_when_all_present(self):
        state: ScreeningState = {
            "application_id": "app-gaps-002",
            "parsed_skills": ["Python", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
            "job_description": "We need Python, PostgreSQL, Redis, Docker, Kubernetes.",
        }

        result = compute_gaps_node(state)
        assert result["gap_analysis"]["missing_skills"] == []

    def test_captures_strengths_from_parsed_skills(self):
        state: ScreeningState = {
            "application_id": "app-gaps-003",
            "parsed_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "Kubernetes"],
            "job_description": "Some description",
        }

        result = compute_gaps_node(state)
        assert len(result["gap_analysis"]["strengths"]) == 4
        assert "Python" in result["gap_analysis"]["strengths"]

    def test_feedback_includes_strengths_and_gaps(self):
        state: ScreeningState = {
            "application_id": "app-gaps-004",
            "parsed_skills": ["Python"],
            "job_description": "Python, PostgreSQL, Docker required",
        }

        result = compute_gaps_node(state)
        assert "Strengths:" in result["gap_analysis"]["feedback"]
        assert "Gaps identified in:" in result["gap_analysis"]["feedback"]

    def test_no_skills_extractable_message(self):
        state: ScreeningState = {
            "application_id": "app-gaps-005",
            "parsed_skills": [],
            "job_description": "Some job description",
        }

        result = compute_gaps_node(state)
        assert "No skills were extractable from the resume" in result["gap_analysis"]["feedback"]

    def test_missing_skills_limited_to_3(self):
        """Even if many skills are missing, only top 3 are reported."""
        state: ScreeningState = {
            "application_id": "app-gaps-006",
            "parsed_skills": [],
            "job_description": "system architecture, postgresql, redis, bullmq, webrtc, docker, kubernetes, microservices",
        }

        result = compute_gaps_node(state)
        # 8 terms in JD, 0 in skills — all 8 are missing, but only 3 reported
        assert len(result["gap_analysis"]["missing_skills"]) <= 3

    def test_preserves_other_state_fields(self):
        state: ScreeningState = {
            "application_id": "app-gaps-007",
            "parsed_skills": ["Python"],
            "job_description": "Job",
            "resume_score": 80,
            "composite_score": 75,
        }

        result = compute_gaps_node(state)
        assert result["resume_score"] == 80
        assert result["composite_score"] == 75


# ---------------------------------------------------------------------------
# make_decision_node — pass/fail threshold
# ---------------------------------------------------------------------------

class TestMakeDecisionNode:
    """Tests for make_decision_node — threshold-based decision."""

    def test_passes_when_score_above_threshold(self):
        state: ScreeningState = {
            "application_id": "app-decision-001",
            "composite_score": 82.5,
            "min_score": 70.0,
        }

        result = make_decision_node(state)
        assert result["decision"] == "screening_completed"
        assert result["reasoning"].startswith("Composite score of 82.5/100 exceeds")

    def test_rejects_when_score_below_threshold(self):
        state: ScreeningState = {
            "application_id": "app-decision-002",
            "composite_score": 65.0,
            "min_score": 70.0,
        }

        result = make_decision_node(state)
        assert result["decision"] == "rejected"
        assert result["reasoning"].startswith("Composite score of 65.0/100 does not meet")

    def test_passes_at_exact_threshold(self):
        state: ScreeningState = {
            "application_id": "app-decision-003",
            "composite_score": 70.0,
            "min_score": 70.0,
        }

        result = make_decision_node(state)
        assert result["decision"] == "screening_completed"

    def test_throws_when_scores_missing(self):
        state: ScreeningState = {
            "application_id": "app-decision-004",
            # No composite_score
            "min_score": 70.0,
        }

        with pytest.raises(RuntimeError, match="cannot decide without real composite"):
            make_decision_node(state)

        state2: ScreeningState = {
            "application_id": "app-decision-005",
            "composite_score": 80.0,
            # No min_score
        }

        with pytest.raises(RuntimeError, match="cannot decide without real composite"):
            make_decision_node(state2)

    def test_reasoning_includes_threshold(self):
        state: ScreeningState = {
            "application_id": "app-decision-006",
            "composite_score": 90.0,
            "min_score": 75.0,
        }

        result = make_decision_node(state)
        assert "minimum threshold of 75" in result["reasoning"]

    def test_preserves_existing_state(self):
        state: ScreeningState = {
            "application_id": "app-decision-007",
            "composite_score": 85.0,
            "min_score": 70.0,
            "resume_score": 82.0,
            "parsed_skills": ["Python"],
        }

        result = make_decision_node(state)
        assert result["resume_score"] == 82.0
        assert result["parsed_skills"] == ["Python"]


# ---------------------------------------------------------------------------
# generate_feedback_node — rejection feedback
# ---------------------------------------------------------------------------

class TestGenerateFeedbackNode:
    """Tests for generate_feedback_node — rejection feedback generation."""

    @patch("agents.screening_nodes.generate_text")
    def test_generates_rejection_feedback_for_rejected_candidate(self, mock_generate):
        mock_generate.return_value = "Dear Candidate, while your skills are impressive..."

        state: ScreeningState = {
            "application_id": "app-feedback-001",
            "decision": "rejected",
            "gap_analysis": {
                "missing_skills": ["Kubernetes", "Docker"],
                "strengths": ["Python", "FastAPI"],
            },
        }

        result = generate_feedback_node(state)
        assert "rejection_feedback" in result
        assert result["rejection_feedback"] == "Dear Candidate, while your skills are impressive..."

    @patch("agents.screening_nodes.generate_text")
    def test_sets_empty_feedback_for_passed_candidate(self, mock_generate):
        """When decision is not rejected, feedback should be empty string."""
        # This branch should not call generate_text
        state: ScreeningState = {
            "application_id": "app-feedback-002",
            "decision": "screening_completed",
            "gap_analysis": {
                "missing_skills": [],
                "strengths": ["Python"],
            },
        }

        result = generate_feedback_node(state)
        assert result["rejection_feedback"] == ""

    @patch("agents.screening_nodes.generate_text")
    def test_throws_when_llm_returns_no_feedback(self, mock_generate):
        mock_generate.return_value = None

        state: ScreeningState = {
            "application_id": "app-feedback-003",
            "decision": "rejected",
            "gap_analysis": {
                "missing_skills": ["Docker"],
                "strengths": ["Python"],
            },
        }

        with pytest.raises(RuntimeError, match="no rejection feedback"):
            generate_feedback_node(state)

    def test_handles_empty_gap_analysis(self):
        state: ScreeningState = {
            "application_id": "app-feedback-004",
            "decision": "rejected",
            "gap_analysis": {},
        }

        @patch("agents.screening_nodes.generate_text")
        def _test(mock_generate):
            mock_generate.return_value = "Generic feedback."
            result = generate_feedback_node(state)
            assert result["rejection_feedback"] == "Generic feedback."
            # Should have been called with empty strengths and missing skills
            call_args = mock_generate.call_args[0][0]
            assert "Strengths: " in call_args

        _test()

    def test_feedback_prompt_includes_missing_skills(self):
        state: ScreeningState = {
            "application_id": "app-feedback-005",
            "decision": "rejected",
            "gap_analysis": {
                "missing_skills": ["Kubernetes", "Redis"],
                "strengths": ["Python", "FastAPI"],
            },
        }

        @patch("agents.screening_nodes.generate_text")
        def _test(mock_generate):
            mock_generate.return_value = "Feedback text"
            result = generate_feedback_node(state)
            call_args = mock_generate.call_args[0][0]
            assert "Kubernetes" in call_args
            assert "Redis" in call_args
            assert "Python" in call_args
            assert "FastAPI" in call_args

        _test()


# ---------------------------------------------------------------------------
# Node chain — sequential execution
# ---------------------------------------------------------------------------

class TestScreeningNodeChain:
    """Tests for sequential execution of all screening nodes (without LangGraph)."""

    @patch("agents.screening_nodes.generate_text")
    @patch("agents.screening_nodes.extract_json_array")
    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    @patch("agents.screening_nodes.embed_text")
    @patch("agents.screening_nodes.embed_resume")
    @patch("agents.screening_nodes.cosine_similarity")
    def test_full_chain_produces_complete_output(
        self, mock_cosine, mock_embed_resume, mock_embed_text, mock_llm, mock_extract, mock_generate
    ):
        """Running all nodes sequentially should produce a complete ScreeningOutput."""
        mock_embed_text.return_value = [0.1] * 768
        mock_embed_resume.return_value = [0.2] * 768
        mock_cosine.return_value = 0.80
        mock_llm.return_value = {
            "technical": 85, "communication": 70,
            "problem_solving": 80, "experience": 75,
        }
        mock_extract.return_value = ["Python", "FastAPI"]
        mock_generate.return_value = "Dear Candidate, thank you for applying..."

        state: ScreeningState = {
            "application_id": "app-chain-001",
            "candidate_id": "cand-chain-001",
            "job_id": "job-chain-001",
            "resume_text": "Senior Python engineer with FastAPI expertise.",
            "job_description": "Python backend role requiring FastAPI and PostgreSQL.",
            "rubric": {"technical": 40, "communication": 20, "problemSolving": 25, "experience": 15},
            "min_score": 90.0,
        }

        # Run the chain manually (as the non-LangGraph path does)
        s1 = parse_resume_node(state)
        s2 = score_against_rubric_node(s1)
        s3 = compute_gaps_node(s2)
        s4 = make_decision_node(s3)
        s5 = generate_feedback_node(s4)

        # Should have all expected fields
        assert s5["decision"] == "rejected"  # 80.25*0.6 + 80*0.4 = 80.15 < 90
        assert s5["resume_score"] > 0
        assert s5["composite_score"] > 0
        assert s5["semantic_match_score"] == 80.0
        assert "gap_analysis" in s5
        assert "parsed_skills" in s5
        assert "rejection_feedback" in s5
        assert s5["rejection_feedback"] == "Dear Candidate, thank you for applying..."


class TestScreeningGraphShape:
    """Verify the LangGraph screening graph has the expected structure when available."""

    def test_graph_builder_exists(self):
        """build_screening_graph should return a compiled graph or None."""
        from agents.screening_agent import build_screening_graph
        graph = build_screening_graph()
        # When LangGraph is available, it returns a compiled graph
        # When not, it returns None. Either way, it should not crash.
        assert graph is None or hasattr(graph, 'invoke')

    @patch("agents.screening_nodes.generate_text")
    @patch("agents.screening_nodes.extract_json_array")
    @patch("agents.screening_nodes._score_rubric_dimensions_with_llm")
    @patch("agents.screening_nodes.embed_text")
    @patch("agents.screening_nodes.embed_resume")
    @patch("agents.screening_nodes.cosine_similarity")
    def test_run_screening_agent_returns_expected_keys(
        self, mock_cosine, mock_embed_resume, mock_embed_text, mock_llm, mock_extract, mock_generate
    ):
        """run_screening_agent should return a dict with all expected keys."""
        mock_embed_text.return_value = [0.1] * 768
        mock_embed_resume.return_value = [0.2] * 768
        mock_cosine.return_value = 0.80
        mock_llm.return_value = {
            "technical": 85, "communication": 70,
            "problem_solving": 80, "experience": 75,
        }
        mock_extract.return_value = ["Python", "FastAPI"]
        mock_generate.return_value = "Candidate feedback text"

        from agents.screening_agent import run_screening_agent
        import asyncio

        async def _test():
            result = await run_screening_agent(
                application_id="app-agent-test",
                candidate_id="cand-agent-test",
                job_id="job-agent-test",
                resume_text="Python developer with FastAPI and PostgreSQL experience.",
                job_description="We need a Python backend engineer with FastAPI.",
                rubric={"technical": 40, "communication": 20, "problemSolving": 25, "experience": 15},
                min_score=70.0,
            )

            assert "status" in result
            assert "resume_score" in result
            assert "composite_score" in result
            assert "semantic_match_score" in result
            assert "gap_analysis" in result
            assert "reasoning" in result
            assert "rejection_feedback" in result

        asyncio.run(_test())
