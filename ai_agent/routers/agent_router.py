from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from supabase import create_client

from config.settings import settings
from services.agent_operator import agent_operator_service
from services.report_generator import report_generator_service

router = APIRouter()

class ConfigUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, description="ACTIVE ou PAUSED")
    weekly_target_ads: Optional[int] = Field(None, ge=1, le=100)
    run_day_of_week: Optional[str] = Field(None, description="MON, TUE, WED, THU, FRI, SAT, SUN")
    run_hour_utc: Optional[int] = Field(None, ge=0, le=23)
    auto_publish_mode: Optional[str] = Field(None, description="DRAFT ou PUBLISH")
    target_categories: Optional[List[str]] = None
    min_confidence_score: Optional[float] = Field(None, ge=0.0, le=100.0)

class RunImmediateRequest(BaseModel):
    user_id: str
    target_count: Optional[int] = Field(15, ge=1, le=100)

@router.get("/overview")
async def get_agent_overview(user_id: str = Query(..., description="UUID do usuário")):
    """
    Retorna a visão geral da operação do Agente para o usuário:
    KPIs de catálogo, configuração semanal, score SEO e contadores.
    """
    config = await agent_operator_service.get_or_create_config(user_id)
    health = await agent_operator_service.analyze_operation_health(user_id)
    return {
        "config": config,
        "health": health,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/config")
async def update_agent_config(
    user_id: str = Query(..., description="UUID do usuário"),
    payload: ConfigUpdateRequest = Body(...)
):
    """
    Atualiza as configurações do Agente de IA (ex: ativar/pausar, meta semanal de anúncios, modo rascunho).
    """
    updates = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    updated_config = await agent_operator_service.update_config(user_id, updates)
    return {"success": True, "config": updated_config}

@router.post("/run-now")
async def trigger_immediate_execution(payload: RunImmediateRequest):
    """
    Força a execução imediata da rodada semanal/em massa de criação de anúncios.
    """
    result = await agent_operator_service.execute_weekly_routine(
        user_id=payload.user_id,
        force_count=payload.target_count
    )
    return {"success": True, "result": result}

@router.post("/generate-audit")
async def generate_immediate_audit_report(user_id: str = Query(...)):
    """
    Gera um relatório de auditoria e diagnóstico em tempo real.
    """
    health = await agent_operator_service.analyze_operation_health(user_id)
    report = await report_generator_service.generate_audit_report(user_id, health)
    return {"success": True, "report": report}

@router.get("/reports")
async def list_agent_reports(
    user_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Retorna a lista de relatórios executivos gerados pelo Agente ("como relatórios").
    """
    if not agent_operator_service.supabase:
        return {"reports": []}
    try:
        res = (agent_operator_service.supabase.table("ai_agent_reports")
               .select("*")
               .eq("user_id", user_id)
               .order("created_at", desc=True)
               .limit(limit)
               .execute())
        return {"reports": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/{report_id}")
async def get_report_detail(report_id: str):
    """
    Retorna os detalhes e conteúdo Markdown de um relatório específico.
    """
    if not agent_operator_service.supabase:
        raise HTTPException(status_code=500, detail="Supabase não configurado no serviço Python")
    try:
        res = agent_operator_service.supabase.table("ai_agent_reports").select("*").eq("id", report_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Relatório não encontrado")
        
        # Marca como lido automaticamente ao abrir
        agent_operator_service.supabase.table("ai_agent_reports").update({"status": "READ"}).eq("id", report_id).execute()
        
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/actions")
async def list_live_actions(
    user_id: str = Query(...),
    limit: int = Query(30, ge=1, le=100)
):
    """
    Retorna o Feed em Tempo Real do Agente ("Sempre avisando deixando informado").
    """
    if not agent_operator_service.supabase:
        return {"actions": []}
    try:
        res = (agent_operator_service.supabase.table("ai_agent_actions")
               .select("*")
               .eq("user_id", user_id)
               .order("created_at", desc=True)
               .limit(limit)
               .execute())
        return {"actions": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
