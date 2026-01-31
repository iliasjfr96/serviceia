from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class RAGQueryRequest(BaseModel):
    tenant_id: str
    query: str
    max_results: int = 5


class RAGQueryResponse(BaseModel):
    answer: str
    sources: list[dict]


@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(request: RAGQueryRequest):
    """Interroge la base de connaissances d'un cabinet via RAG."""
    # TODO: Implement RAG pipeline
    return RAGQueryResponse(
        answer="Service RAG en cours de configuration.",
        sources=[],
    )
