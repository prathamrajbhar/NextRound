"""
Unit tests for Sentiment & Stress Biomarkers Analysis Service
"""
import pytest
from services.sentiment_service import analyze_interview_sentiment


def test_analyze_interview_sentiment_valid_transcript():
    """Verify sentiment service returns structured tone, stress level, and emotional journey."""
    transcript = [
        {"speaker": "interviewer", "text": "Can you explain your system design approach?"},
        {"speaker": "candidate", "text": "I start by identifying core bottlenecks and data flows."}
    ]
    res = analyze_interview_sentiment(interview_id="interview-123", transcript=transcript)
    assert res["interviewId"] == "interview-123"
    assert res["overallTone"] in ["confident", "enthusiastic", "focused", "thoughtful"]
    assert res["overallStressLevel"] in ["low", "medium"]
    assert len(res["emotionalJourney"]) == 2


def test_analyze_interview_sentiment_empty_transcript_returns_default():
    """Service returns default dialogue journey if transcript is empty."""
    res = analyze_interview_sentiment(interview_id="interview-empty", transcript=[])
    assert res["interviewId"] == "interview-empty"
    assert "overallTone" in res
    assert len(res["emotionalJourney"]) > 0