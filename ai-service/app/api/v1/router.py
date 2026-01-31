from fastapi import APIRouter

from app.api.v1.endpoints import health, rag, call_analysis

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(
    call_analysis.router, prefix="/analysis", tags=["analysis"]
)
