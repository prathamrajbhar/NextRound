import os
import pytest
from services.pdf_generator import generate_resume_pdf

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
