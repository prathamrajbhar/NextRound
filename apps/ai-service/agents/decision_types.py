from typing import TypedDict, Optional

class DecisionState(TypedDict, total=False):
    application_id: str
    evaluation_id: Optional[str]
    composite_score: Optional[float]
    confidence: Optional[float]
    decision: str
    auto_offer: bool
    offer_letter_content: str
    rejection_email_content: str
    hold_notice_content: str
    reasoning: str
    job_title: Optional[str]
    salary: Optional[str]
    equity: Optional[str]
