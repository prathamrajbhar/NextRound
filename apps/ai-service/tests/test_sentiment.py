"""
Unit tests for Sentiment & Stress Biomarkers Analysis Service
"""
import pytest
from services.sentiment_service import analyze_interview_sentiment


def test_analyze_interview_sentiment_structure():
    """Verify analyze_interview_sentiment returns required telemetric and sentiment fields."""
    transcript = [
        {"turnNumber": 1, "speaker": "interviewer", "text": "Welcome to the voice assessment round."},
        {"turnNumber": 2, "speaker": "candidate", "text": "Thank you, I am excited to discuss my backend architecture experience."},
        {"turnNumber": 3, "speaker": "interviewer", "text": "How do you optimize slow database queries?"},
        {"turnNumber": 4, "speaker": "candidate", "text": "I analyze EXPLAIN ANALYZE execution plans, add B-tree or GIN indexes, and implement Redis caching."},
    ]

    res = analyze_interview_sentiment(interview_id="interview-999", transcript=transcript)

    assert res["interviewId"] == "interview-999"
    assert "overallTone" in res
    assert "overallStressLevel" in res
    assert "speechPaceWpm" in res
    assert res["speechPaceWpm"] > 0
    assert "pitchVarianceHz" in res
    assert len(res["emotionalJourney"]) == 4
    assert len(res["stressPeakMoments"]) >= 1


def test_analyze_interview_sentiment_empty_transcript_fallback():
    """Verify service handles empty transcript gracefully with heuristic fallback."""
    res = analyze_interview_sentiment(interview_id="interview-empty", transcript=[])

    assert res["interviewId"] == "interview-empty"
    assert res["overallTone"] == "confident"
    assert len(res["emotionalJourney"]) > 0
