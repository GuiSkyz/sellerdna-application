import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from routers.agent_router import router as agent_router
from services.scheduler_service import scheduler_service

# Configurações globais de log
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("AIAgentMain")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== SELLER DNA AI Agent Service (Python) Iniciando ===")
    scheduler_service.start()
    yield
    logger.info("=== SELLER DNA AI Agent Service Encerrando ===")
    scheduler_service.shutdown()

app = FastAPI(
    title="SELLER DNA AI Agent Operations Engine",
    description="Serviço Python de Inteligência Artificial Autônoma para controle operacional, criação de anúncios semanal e relatórios executivos.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS para aceitar requisições do Next.js e Node.js
origins = [
    settings.FRONTEND_URL,
    settings.BACKEND_NODE_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3333"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router, prefix="/api/agent", tags=["DNA Agent Operator"])

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "ai_agent_python",
        "timestamp": settings.PORT,
        "scheduler": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
