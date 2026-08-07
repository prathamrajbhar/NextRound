"""
Unit tests for Sentiment & Stress Biomarkers Analysis Service

The service no longer fabricates heuristic reports. It requires a real transcript
and a configured Gemini client; otherwise it raises clean errors.
"""
import pytest
from services.sentiment_service import analyze_interview_sentiment


def test_analyze_interview_sentiment_rejects_empty_transcript():
    """Service must reject empty transcripts instead of fabricating a report."""
    with pytest.raises(ValueError):
        analyze_interview_sentiment(interview_id="interview-empty", transcript=[])


def test_analyze_interview_sentiment_rejects_none_transcript():
    """Service must reject missing transcripts instead of fabricating a report."""
    with pytest.raises(ValueError):
        analyze_interview_sentiment(interview_id="interview-empty", transcript=None)