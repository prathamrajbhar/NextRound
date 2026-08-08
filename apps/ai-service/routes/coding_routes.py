import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from agents.coding_agent import run_coding_agent
from services.code_executor_service import execute_code_sandbox

logger = logging.getLogger("coding_routes")

coding_router = APIRouter(prefix="/api/v1/ai/coding", tags=["coding-sandbox"])


class CodeExecutionRequest(BaseModel):
    applicationId: Optional[str] = "app-sandbox-eval"
    problemId: Optional[str] = "virtualized-list"
    code: str = Field(..., description="Candidate source code to execute")
    language: Optional[str] = "python"
    submissionId: Optional[str] = ""
    testCases: Optional[List[Dict[str, Any]]] = None


class CodeExecutionResponse(BaseModel):
    success: bool
    score: float
    pass_rate: float
    passed_cases: int
    total_cases: int
    execution_time_ms: float
    memory_kb: int
    complexity_analysis: Dict[str, Any]
    passed: bool
    feedback: str
    security_passed: bool = True
    test_results: Optional[List[Dict[str, Any]]] = None


@coding_router.post("/execute", response_model=CodeExecutionResponse)
async def execute_coding_submission(request: CodeExecutionRequest):
    """
    Execute candidate code submission in secure AST-inspected OS resource-capped sandbox.
    """
    if not request.code or not request.code.strip():
        raise HTTPException(status_code=400, detail="Code string cannot be empty")

    logger.info(f"Coding Sandbox: Executing submission for problem {request.problemId}")

    # If custom test cases are passed, run direct sandbox evaluation
    if request.testCases:
        sandbox_res = execute_code_sandbox(
            code=request.code,
            language=request.language or "python",
            test_cases=request.testCases
        )
        return CodeExecutionResponse(
            success=sandbox_res.get("success", False),
            score=round(sandbox_res.get("pass_rate", 0.0) * 100.0, 1),
            pass_rate=sandbox_res.get("pass_rate", 0.0),
            passed_cases=sandbox_res.get("passed_cases", 0),
            total_cases=sandbox_res.get("total_cases", 0),
            execution_time_ms=sandbox_res.get("execution_time_ms", 0.0),
            memory_kb=sandbox_res.get("memory_kb", 42000),
            complexity_analysis={"time_complexity": "O(N)"},
            passed=sandbox_res.get("pass_rate", 0.0) >= 0.8,
            feedback=sandbox_res.get("error") or f"Passed {sandbox_res.get('passed_cases')}/{sandbox_res.get('total_cases')} test cases.",
            security_passed=sandbox_res.get("security_passed", True),
            test_results=sandbox_res.get("test_results", [])
        )

    # Otherwise run full Coding Agent graph
    output = await run_coding_agent(
        application_id=request.applicationId or "app-sandbox-eval",
        problem_id=request.problemId or "virtualized-list",
        code=request.code,
        language=request.language or "python",
        submission_id=request.submissionId or ""
    )

    return CodeExecutionResponse(
        success=True,
        score=output.get("score", 0.0),
        pass_rate=output.get("pass_rate", 0.0),
        passed_cases=output.get("passed_cases", 0),
        total_cases=output.get("total_cases", 0),
        execution_time_ms=output.get("execution_time_ms", 0.0),
        memory_kb=output.get("memory_kb", 42000),
        complexity_analysis=output.get("complexity_analysis", {"time_complexity": "O(N)"}),
        passed=output.get("passed", False),
        feedback=output.get("feedback", ""),
        security_passed=True,
        test_results=[]
    )
