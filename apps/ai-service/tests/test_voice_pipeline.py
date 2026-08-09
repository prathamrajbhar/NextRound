import pytest
import base64
from fastapi.testclient import TestClient
from services.stt_service import transcribe_audio_bytes
from services.tts_service import generate_tts_audio_base64, stream_sentence_tts


@pytest.mark.asyncio
async def test_generate_tts_audio_base64():
    """Verify Edge TTS generates valid data:audio/mp3;base64 Data URL."""
    text = "Welcome to the NextRound AI interview platform."
    audio_url = await generate_tts_audio_base64(text)

    assert isinstance(audio_url, str)
    assert audio_url.startswith("data:audio/mp3;base64,")
    # Decode base64 payload to ensure non-empty MP3 audio bytes
    b64_payload = audio_url.replace("data:audio/mp3;base64,", "")
    audio_bytes = base64.b64decode(b64_payload)
    assert len(audio_bytes) > 1000


@pytest.mark.asyncio
async def test_stream_sentence_tts():
    """Verify sentence-based TTS streaming yields chunked audio objects."""
    text = "First sentence of the interview response. Second sentence detailing technical architecture."
    chunks = []
    async for chunk in stream_sentence_tts(text):
        chunks.append(chunk)

    assert len(chunks) >= 2
    assert chunks[0]["index"] == 0
    assert chunks[0]["sentence"].startswith("First sentence")
    assert chunks[0]["audio"].startswith("data:audio/mp3;base64,")
    assert chunks[-1]["is_final"] is True


def test_transcribe_audio_bytes():
    """Verify STT returns a string transcript with a bounded confidence.

    When Whisper STT is unavailable (no Groq API key configured), the service
    must return an empty transcript rather than fabricating a candidate
    response, so downstream evaluation never scores invented speech.
    """
    sample_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    transcript, confidence = transcribe_audio_bytes(sample_bytes)

    assert isinstance(transcript, str)
    if transcript:
        assert 0.0 <= confidence <= 1.0
    else:
        assert confidence == 0.0


def test_transcribe_endpoint():
    """Test POST /api/v1/ai/interview/transcribe endpoint with base64 payload and file upload."""
    from main import app
    client = TestClient(app)

    dummy_audio_b64 = base64.b64encode(b"dummy audio data for testing").decode("utf-8")
    res_json = client.post("/api/v1/ai/interview/transcribe", json={"audio_base64": dummy_audio_b64})
    assert res_json.status_code == 200
    data_json = res_json.json()
    assert "transcript" in data_json
    assert "confidence" in data_json

    # Test file upload
    res_file = client.post(
        "/api/v1/ai/interview/transcribe",
        files={"file": ("audio.webm", b"dummy audio file bytes", "audio/webm")},
    )
    assert res_file.status_code == 200
    data_file = res_file.json()
    assert "transcript" in data_file



def test_tts_endpoint():
    """Test POST /api/v1/ai/interview/tts endpoint returns MP3 audio URL."""
    from main import app
    client = TestClient(app)

    res = client.post("/api/v1/ai/interview/tts", json={"text": "Can you explain your experience with microservices?"})

    assert res.status_code == 200
    data = res.json()
    assert data["audio_format"] == "mp3"
    assert data["audio_url"].startswith("data:audio/mp3;base64,")


def test_respond_endpoint_with_audio():
    """Test POST /api/v1/ai/interview/respond returns text response and synthesized audioUrl."""
    from main import app
    client = TestClient(app)

    payload = {
        "interviewId": "test-interview-123",
        "transcript": "I have 5 years of experience building Python and TypeScript web applications.",
        "stage": "intro",
        "turnNumber": 0,
        "jobTitle": "Senior Software Engineer",
    }
    res = client.post("/api/v1/ai/interview/respond", json=payload)

    assert res.status_code == 200
    data = res.json()
    assert "text" in data
    assert len(data["text"]) > 0
    assert data["audioUrl"] is not None
    assert data["audioUrl"].startswith("data:audio/mp3;base64,")


def test_voice_stream_endpoint():
    """Test POST /api/v1/ai/interview/voice-stream yields SSE chunks."""
    from main import app
    client = TestClient(app)

    payload = {
        "interviewId": "test-interview-123",
        "transcript": "My primary backend language is Python.",
        "stage": "intro",
        "turnNumber": 0,
    }
    res = client.post("/api/v1/ai/interview/voice-stream", json=payload)

    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]
    lines = res.text.strip().split("\n\n")
    assert len(lines) >= 1
    assert lines[0].startswith("data: ")
