"""
Unit tests for Sentiment & Stress Biomarkers Analysis Service
"""
from services.sentiment_service import analyze_interview_sentiment


def test_analyze_interview_sentiment_reports_unavailable():
    """Verify the service reports an explicit unavailable state, never fabricated metrics."""
    transcript = [
        {"speaker": "interviewer", "text": "Can you explain your system design approach?"},
        {"speaker": "candidate", "text": "I start by identifying core bottlenecks and data flows."}
    ]
    res = analyze_interview_sentiment(interview_id="interview-123", transcript=transcript)
    assert res["interviewId"] == "interview-123"
    assert res["status"] == "unavailable"
    # No fabricated sentiment/stress metrics may be emitted.
    assert "overallTone" not in res
    assert "overallStressLevel" not in res
    assert "emotionalJourney" not in res


def test_analyze_interview_sentiment_empty_transcript_reports_unavailable():
    """Verify an empty transcript also reports the unavailable state."""
    res = analyze_interview_sentiment(interview_id="interview-empty", transcript=[])
    assert res["interviewId"] == "interview-empty"
    assert res["status"] == "unavailable"
