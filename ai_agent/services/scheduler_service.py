import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from typing import Optional
from supabase import create_client, Client

from config.settings import settings
from services.agent_operator import agent_operator_service
from services.report_generator import report_generator_service

logger = logging.getLogger("SchedulerService")

class SchedulerService:
    """
    Agendador de Tarefas em background para o Agente Operacional Python.
    Executa checagens periódicas de saúde do catálogo e dispara a rodada semanal
    de criação de anúncios nos horários configurados.
    """
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.supabase: Optional[Client] = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            except Exception as e:
                logger.error(f"[Scheduler] Erro de conexão com Supabase: {str(e)}")

    def start(self):
        # 1. Checkup diário de saúde operacional de todos os usuários com agente ativo (às 08:00 UTC)
        self.scheduler.add_job(
            self.run_daily_health_checkups,
            trigger=CronTrigger(hour=8, minute=0),
            id="daily_health_checkups",
            name="Checkup diário de saúde operacional",
            replace_existing=True
        )

        # 2. Verificador horário para rotinas semanais agendadas de usuários
        self.scheduler.add_job(
            self.check_and_run_weekly_routines,
            trigger=CronTrigger(minute=0), # roda toda hora cheia para verificar quem agendou essa hora/dia
            id="hourly_weekly_routine_checker",
            name="Checagem de rotinas semanais programadas",
            replace_existing=True
        )

        self.scheduler.start()
        logger.info("[Scheduler] APScheduler do Agente de IA iniciado com sucesso!")

    def shutdown(self):
        self.scheduler.shutdown()
        logger.info("[Scheduler] APScheduler desligado.")

    async def run_daily_health_checkups(self):
        logger.info("[Scheduler] Executando checkup diário de saúde para usuários ativos...")
        if not self.supabase:
            return
        try:
            res = self.supabase.table("ai_agent_config").select("user_id").eq("status", "ACTIVE").execute()
            for row in (res.data or []):
                user_id = row.get("user_id")
                if user_id:
                    await agent_operator_service.analyze_operation_health(user_id)
        except Exception as e:
            logger.error(f"[Scheduler] Erro no checkup diário: {str(e)}")

    async def check_and_run_weekly_routines(self):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        current_day_abbr = now.strftime("%a").upper()[:3] # MON, TUE, WED, THU, FRI, SAT, SUN
        current_hour = now.hour

        logger.info(f"[Scheduler] Checando rotinas semanais para dia={current_day_abbr}, hora={current_hour} UTC")
        if not self.supabase:
            return
        try:
            res = (self.supabase.table("ai_agent_config")
                   .select("user_id, weekly_target_ads")
                   .eq("status", "ACTIVE")
                   .eq("run_day_of_week", current_day_abbr)
                   .eq("run_hour_utc", current_hour)
                   .execute())
            for row in (res.data or []):
                user_id = row.get("user_id")
                if user_id:
                    logger.info(f"[Scheduler] Disparando rotina semanal agendada para {user_id}")
                    await agent_operator_service.execute_weekly_routine(user_id)
        except Exception as e:
            logger.error(f"[Scheduler] Erro ao checar rotinas semanais: {str(e)}")

scheduler_service = SchedulerService()
