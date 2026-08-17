import os
import sys
import shutil
import json
import logging
from unittest.mock import patch

# Setup python path to include parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.resume_builder_agent import run_resume_builder_agent, SYSTEM_PROMPT
from services.llm_service import generate_text, extract_json_object
from services.pdf_generator import generate_resume_pdf

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("simulation")

def simulate_candidate_response(question: str, history: list) -> str:
    history_str = "\n".join([f"{h['role'].upper()}: {h['content']}" for h in history])
    prompt = (
        "You are an expert Software Engineer interviewing for a high-paying Senior Developer role. "
        "The interviewer is asking you questions to build your professional resumé. "
        "Answer the question naturally, professionally, and concisely (MUST be under 20 words). "
        "Be extremely quantitative: mention metrics, scale, percentages, and dollars where applicable. "
        "Do not include any conversational meta-text or commentary.\n\n"
        f"Conversation History:\n{history_str}\n\n"
        f"Interviewer Question: {question}\n"
        "Candidate Response (under 20 words):"
    )
    res = generate_text(prompt)
    if not res:
        res = "I am a Senior Software Engineer specializing in scalable Python and React architectures."
    return res.strip()

async def main():
    print("🚀 Starting Candidate-Interviewer Agent Simulation...")

    state = {
        "session_id": "simulated-session-123",
        "target_role": "Senior Full Stack Engineer",
        "target_company": "Innovative Tech Corp",
        "current_stage": "intro",
        "turn_number": 0,
        "latest_candidate_response": "",
        "conversation_history": [],
        "memory": {},
        "is_complete": False
    }

    # Turn loop
    max_turns = 8
    print("\n--- Starting Resume Builder Voice Interview Call Simulation ---\n")
    
    for turn in range(max_turns):
        # 1. Run Resume AI agent to get question
        state = run_resume_builder_agent(state)
        ai_question = state.get("latest_ai_response", "")
        print(f"🎙️ Interviewer (Turn {state['turn_number']}): {ai_question}")
        
        # Check if conversation is complete
        if state.get("is_complete") or state.get("current_stage") == "closing":
            break
            
        # 2. Run Candidate AI Agent to generate answer
        history = [{"role": h["speaker"], "content": h["text"]} for h in state.get("conversation_history", [])]
        candidate_ans = simulate_candidate_response(ai_question, history)
        print(f"👤 Candidate: {candidate_ans}")
        
        # 3. Feed candidate response back into the state
        state["latest_candidate_response"] = candidate_ans
        
        # Update conversation history format
        hist = state.get("conversation_history", [])
        hist.append({"speaker": "ai", "text": ai_question})
        hist.append({"speaker": "candidate", "text": candidate_ans})
        state["conversation_history"] = hist
        
    print("\n--- Interview Simulation Finished Successfully ---\n")

    # 4. Generate the ATS Resume JSON from the simulated transcript
    transcript_text = "\n".join([
        f"{h['speaker'].upper()}: {h['text']}" for h in state["conversation_history"]
    ])
    
    print("🧠 Extracting ATS Resume JSON from conversation transcript...")
    extraction_prompt = (
        "Based on the following voice interview transcript, generate an ATS-optimized resumé JSON.\n\n"
        f"Transcript:\n{transcript_text}\n\n"
        "Return exactly in this JSON format (no surrounding markdown codeblocks except raw json text):\n"
        "{\n"
        "  \"contact\": {\n"
        "    \"name\": \"Jane Doe\",\n"
        "    \"email\": \"jane.doe@example.com\",\n"
        "    \"phone\": \"+1-555-0199\",\n"
        "    \"location\": \"New York, NY\",\n"
        "    \"linkedin\": \"linkedin.com/in/janedoe\",\n"
        "    \"github\": \"github.com/janedoe\",\n"
        "    \"portfolio\": \"janedoe.dev\"\n"
        "  },\n"
        "  \"title\": \"Senior Full Stack Engineer\",\n"
        "  \"summary\": \"Driven Senior Software Engineer specializing in Python, React, and high-performance backend systems.\",\n"
        "  \"atsScore\": 94,\n"
        "  \"work_history\": [\n"
        "    {\n"
        "      \"title\": \"Senior Software Engineer\",\n"
        "      \"company\": \"Innovative Tech Corp\",\n"
        "      \"dates\": \"2021 - Present\",\n"
        "      \"location\": \"New York, NY\",\n"
        "      \"bullets\": [\n"
        "        \"Architected microservices boosting system throughput by 45%.\",\n"
        "        \"Managed frontend redesign, reducing initial page load time by 1.2 seconds.\"\n"
        "      ]\n"
        "    }\n"
        "  ],\n"
        "  \"skills\": [\"Python\", \"React\", \"TypeScript\", \"PostgreSQL\", \"Redis\", \"Docker\"],\n"
        "  \"projects\": [\n"
        "    {\n"
        "      \"name\": \"Analytics Pipeline\",\n"
        "      \"description\": \"Real-time data ingestion processing 1M+ messages daily.\"\n"
        "    }\n"
        "  ],\n"
        "  \"education\": [\n"
        "    {\n"
        "      \"degree\": \"Bachelor of Science in Computer Science\",\n"
        "      \"institution\": \"State University\",\n"
        "      \"year\": \"2019\"\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    
    extracted_json_str = generate_text(extraction_prompt)
    resume_data = extract_json_object(extracted_json_str)
    
    if not resume_data:
        print("❌ Failed to parse/extract resume JSON from LLM response.")
        sys.exit(1)
        
    print("✅ ATS Resume JSON extracted successfully.")

    # 5. Compile PDF with ReportLab and save directly to project root
    root_pdf_path = "/home/pratham/Disk1/NextRound/generated_resume.pdf"
    
    # Custom mock function to copy the generated PDF to project root before deletion
    def mock_upload_to_supabase(file_path, key, content_type="application/pdf"):
        print(f"💾 Intercepted PDF file at: {file_path}")
        shutil.copy(file_path, root_pdf_path)
        print(f"🎉 PDF Resume successfully saved to root folder at: {root_pdf_path}")
        return "https://mock-supabase-storage-url/generated_resume.pdf"

    print("📄 Compiling ReportLab PDF and copying to project root...")
    with patch("services.pdf_generator.upload_to_supabase", side_effect=mock_upload_to_supabase):
        generate_resume_pdf(resume_data)

    # 6. Verify PDF exists and is valid
    if os.path.exists(root_pdf_path) and os.path.getsize(root_pdf_path) > 0:
        print(f"\n🏆 Verification Succeeded! PDF size: {os.path.getsize(root_pdf_path)} bytes.")
        print(f"File Location: {root_pdf_path}")
        print("\n🎉 ALL PIPELINE CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n❌ Verification Failed: PDF file was not created or is empty.")
        sys.exit(1)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
