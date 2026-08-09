import os
import pytest
from services.pdf_generator import generate_resume_pdf, generate_analytics_pdf

def test_generate_resume_pdf_creates_file(tmp_path):
    try:
        import reportlab  # noqa: F401
    except ImportError:
        pytest.skip("ReportLab not installed; real PDF generation unavailable.")
    resume_data = {
        "summary": "Senior Software Architect with 8+ years experience in distributed systems.",
        "contact": {
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "phone": "+1 (555) 987-6543",
            "location": "New York, NY"
        },
        "work_history": [
            {
                "title": "Staff Engineer",
                "company": "Tech Corp",
                "dates": "2021 - Present",
                "bullets": [
                    "Architected high-throughput microservices using FastAPI and Kafka.",
                    "Led team of 6 engineers."
                ]
            }
        ],
        "skills": ["Python", "TypeScript", "Docker", "Kubernetes", "PostgreSQL"],
        "education": [
            {
                "degree": "B.S. Computer Science",
                "institution": "MIT"
            }
        ],
        "projects": [
            {
                "name": "Distributed Cache",
                "description": "In-memory cache with Raft consensus algorithm implementation."
            }
        ]
    }

    out_dir = str(tmp_path)
    result = generate_resume_pdf(resume_data, output_dir=out_dir)

    assert result.startswith("/uploads/resumes/")
    assert len(os.listdir(out_dir)) == 1


def test_generate_analytics_pdf_creates_file(tmp_path):
    try:
        import reportlab  # noqa: F401
    except ImportError:
        pytest.skip("ReportLab not installed; real PDF generation unavailable.")
    metrics = {
        "applied": 100,
        "screened": 60,
        "interviewed": 30,
        "offered": 12,
        "accepted": 9,
        "time_to_hire_days": 21,
    }
    conversions = {
        "appliedToScreened": 60,
        "screenedToInterviewed": 50,
        "interviewedToOffered": 40,
        "offerAcceptanceRate": 75,
    }
    narrative = "100 candidates applied, 60 passed screening, and 9 accepted."

    out_dir = str(tmp_path)
    result = generate_analytics_pdf(
        metrics=metrics,
        conversions=conversions,
        narrative=narrative,
        org_id="org-123",
        output_dir=out_dir,
    )

    assert result.startswith("/uploads/analytics/")
    assert len(os.listdir(out_dir)) == 1


def test_generate_analytics_pdf_handles_empty_narrative(tmp_path):
    """Empty narrative still produces a real PDF (honest placeholder line)."""
    try:
        import reportlab  # noqa: F401
    except ImportError:
        pytest.skip("ReportLab not installed; real PDF generation unavailable.")

    out_dir = str(tmp_path)
    result = generate_analytics_pdf(
        metrics={"applied": 0, "screened": 0, "interviewed": 0, "offered": 0, "accepted": 0},
        conversions={},
        narrative="",
        output_dir=out_dir,
    )

    assert result.startswith("/uploads/analytics/")
    assert len(os.listdir(out_dir)) == 1
