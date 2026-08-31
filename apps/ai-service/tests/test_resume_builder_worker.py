import pytest
import asyncio
from unittest.mock import patch, MagicMock
from workers.resume_builder_worker import process_resume_builder_job

@pytest.fixture
def mock_job_data():
    return {
        "sessionId": "test-session-123",
        "targetRole": "Software Engineer",
        "targetCompany": "Tech Corp",
        "transcript": [
            {"speaker": "ai", "text": "What is your experience?"},
            {"speaker": "candidate", "text": "I worked at Google for 5 years."}
        ],
        "memory": {
            "candidate_facts": ["Worked at Google for 5 years"]
        }
    }

@pytest.mark.asyncio
@patch('workers.resume_builder_worker.generate_text')
@patch('workers.resume_builder_worker.generate_resume_pdf')
@patch('workers.resume_builder_worker.post_internal')
async def test_process_resume_builder_job_success(mock_post_internal, mock_generate_pdf, mock_generate_text, mock_job_data):
    # Mock the LLM returning a valid JSON string
    mock_generate_text.return_value = '''
    {
        "contact": {
            "name": "John Doe",
            "email": null,
            "phone": null,
            "location": null,
            "linkedin": null,
            "github": null,
            "portfolio": null
        },
        "title": "Software Engineer",
        "summary": "Experienced software engineer.",
        "atsScore": 80,
        "scoreBreakdown": [],
        "work_history": [
            {
                "title": "Software Engineer",
                "role": "Software Engineer",
                "company": "Google",
                "dates": "5 years",
                "period": "5 years",
                "location": null,
                "bullets": ["Worked on search"],
                "highlights": ["Worked on search"]
            }
        ],
        "skills": [],
        "projects": [],
        "education": [],
        "certifications": []
    }
    '''
    
    # Mock PDF generation returning a fake URL
    mock_generate_pdf.return_value = "http://fake-supabase-url.com/resume.pdf"
    
    # Mock the post_internal succeeding
    mock_post_internal.return_value = True

    # Run the worker function
    result = await process_resume_builder_job(mock_job_data)
    
    # Verify success
    assert result is True
    
    # Verify generate_text was called with the memory object in the prompt
    assert mock_generate_text.called
    call_args = mock_generate_text.call_args[0][0]
    assert "Google for 5 years" in call_args
    assert "STRUCTURED FACTS" in call_args
    
    # Verify pdf generator was called with the parsed JSON
    assert mock_generate_pdf.called
    parsed_json = mock_generate_pdf.call_args[0][0]
    assert parsed_json["contact"]["name"] == "John Doe"
    
    # Verify backend was updated with completed status
    mock_post_internal.assert_called_with(
        "PATCH",
        "/internal/resume-builder/test-session-123/result",
        {"generatedResume": parsed_json, "resumePdfUrl": "http://fake-supabase-url.com/resume.pdf", "status": "completed"},
        context="resume result for session test-session-123"
    )

@pytest.mark.asyncio
@patch('workers.resume_builder_worker._mark_failed')
@patch('workers.resume_builder_worker.generate_text')
async def test_process_resume_builder_job_invalid_json(mock_generate_text, mock_mark_failed, mock_job_data):
    # Mock the LLM returning invalid JSON or no JSON
    mock_generate_text.return_value = "Sorry, I can't do that."

    # Run the worker function
    result = await process_resume_builder_job(mock_job_data)
    
    # Verify failure
    assert result is False
    
    # Verify backend was updated with failed status
    assert mock_mark_failed.called
