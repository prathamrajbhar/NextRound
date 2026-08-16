import sys

sys.path.insert(0, "/home/pratham/Disk1/NextRound/apps/ai-service")

from workers.interview_worker import _build_context_text


def test_build_context_text_composes_facts():
    context = {
        "candidate": {
            "fullName": "Alex Morgan",
            "headline": "Senior Full-Stack Engineer",
            "location": "Bengaluru, India",
            "yearsOfExperience": 6,
            "targetRoles": ["Senior Engineer"],
            "bio": "Builder of scalable systems.",
        },
        "resume": {"rawText": "Experienced in React, Node and Go."},
        "social": {
            "github": {"username": "alexmorgan", "totalStars": 420},
            "linkedin": {"headline": "Senior Full-Stack Engineer"},
        },
        "skills": ["TypeScript", "Go", "React"],
        "experience": [{"title": "Senior Engineer", "company": "Acme"}],
        "projects": [{"name": "nextround"}],
        "education": [{"degree": "B.Tech"}],
        "job": {
            "title": "Staff Engineer",
            "description": "Lead platform initiatives.",
            "rubric": {"technical": 0.4},
        },
        "interviewFocus": [
            {"sourceType": "github", "section": "projects", "content": "Pushed 400 commits to nextround."}
        ],
    }
    text = _build_context_text(context)
    assert "Candidate: Alex Morgan" in text
    assert "Headline: Senior Full-Stack Engineer" in text
    assert "JOB: Staff Engineer" in text
    assert "Skills: TypeScript, Go, React" in text
    assert "MOST RELEVANT PROFILE SECTIONS" in text


def test_build_context_text_caps_length():
    context = {
        "candidate": {"fullName": "A"},
        "resume": {"rawText": ""},
        "social": {"github": None, "linkedin": None},
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "job": {"title": "Role", "description": "", "rubric": None},
        "interviewFocus": [],
    }
    text = _build_context_text(context, max_length=100)
    assert len(text) <= 100


def test_build_context_text_handles_empty_context():
    text = _build_context_text({})
    assert "Candidate: N/A" in text