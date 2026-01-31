from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CallSummaryRequest(BaseModel):
    tenant_id: str
    call_id: str
    transcript: str
    practice_area: str | None = None


class CallSummaryResponse(BaseModel):
    summary: str
    key_facts: list[str]
    practice_area: str | None
    urgency_level: str
    lead_score: int
    is_emergency: bool
    emergency_type: str | None
    extracted_data: dict


class LeadScoreRequest(BaseModel):
    tenant_id: str
    transcript: str
    practice_area: str | None = None


class LeadScoreResponse(BaseModel):
    score: int
    factors: list[str]


class EmergencyDetectRequest(BaseModel):
    text: str


class EmergencyDetectResponse(BaseModel):
    is_emergency: bool
    emergency_type: str | None
    confidence: float


@router.post("/call-summary", response_model=CallSummaryResponse)
async def generate_call_summary(request: CallSummaryRequest):
    """Genere un resume structure d'un appel a partir de sa transcription."""
    # TODO: Implement with Claude API
    return CallSummaryResponse(
        summary="Resume en cours de configuration.",
        key_facts=[],
        practice_area=request.practice_area,
        urgency_level="NORMAL",
        lead_score=50,
        is_emergency=False,
        emergency_type=None,
        extracted_data={},
    )


@router.post("/lead-score", response_model=LeadScoreResponse)
async def calculate_lead_score(request: LeadScoreRequest):
    """Calcule un score de lead a partir d'une transcription."""
    # TODO: Implement with Claude API
    return LeadScoreResponse(score=50, factors=[])


@router.post("/emergency-detect", response_model=EmergencyDetectResponse)
async def detect_emergency(request: EmergencyDetectRequest):
    """Detecte une situation d'urgence dans un texte."""
    # TODO: Implement emergency detection
    return EmergencyDetectResponse(
        is_emergency=False,
        emergency_type=None,
        confidence=0.0,
    )
