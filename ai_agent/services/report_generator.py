import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from supabase import create_client, Client

from config.settings import settings
from services.gemini_ai import gemini_ai_service

logger = logging.getLogger("ReportGenerator")

class ReportGeneratorService:
    """
    Serviço responsável por gerar, formatar e salvar relatórios executivos 
    e operacionais no banco de dados Supabase (tabela ai_agent_reports).
    """
    def __init__(self):
        self.supabase: Optional[Client] = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            except Exception as e:
                logger.error(f"[ReportGenerator] Erro ao conectar ao Supabase: {str(e)}")

    def _get_user_db(self, user_id: str):
        return self.supabase

    async def generate_audit_report(self, user_id: str, stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gera um relatório completo de auditoria da operação e salva no banco.
        """
        logger.info(f"[ReportGenerator] Gerando relatório de auditoria para o usuário {user_id}")
        
        # Enriquece stats com timestamp
        stats["timestamp"] = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
        
        # Gera markdown executivo com Gemini
        summary_markdown = await gemini_ai_service.synthesize_audit_report(stats)
        
        report_data = {
            "user_id": user_id,
            "report_type": "OPERATION_AUDIT",
            "title": f"Auditoria Operacional Completa - {datetime.now(timezone.utc).strftime('%d/%m/%Y')}",
            "summary_markdown": summary_markdown,
            "metrics": stats,
            "status": "UNREAD",
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        if self.supabase:
            try:
                res = self.supabase.table("ai_agent_reports").insert(report_data).execute()
                if res.data and len(res.data) > 0:
                    report_data["id"] = res.data[0].get("id")
                    
                # Insere também no feed de ações do agente
                self.supabase.table("ai_agent_actions").insert({
                    "user_id": user_id,
                    "action_type": "REPORT_GENERATED",
                    "title": "Novo Relatório de Auditoria Gerado",
                    "description": f"Auditoria completa do catálogo e SEO concluída com sucesso.",
                    "status": "SUCCESS",
                    "metadata": {"report_id": report_data.get("id"), "type": "OPERATION_AUDIT"}
                }).execute()
            except Exception as e:
                logger.error(f"[ReportGenerator] Erro ao salvar relatório no Supabase: {str(e)}")
        
        return report_data

    async def generate_weekly_summary_report(self, user_id: str, batch_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Gera o relatório de resumo semanal de criação de anúncios ("Sempre avisando deixando informado").
        """
        logger.info(f"[ReportGenerator] Gerando resumo semanal para o usuário {user_id}")
        
        created_count = batch_results.get("created_count", 0)
        failed_count = batch_results.get("failed_count", 0)
        created_products = batch_results.get("created_products", [])
        failed_products = batch_results.get("failed_products", [])
        time_saved = round(created_count * 0.25, 1) # 15 min (0.25h) por anúncio economizado
        
        title = f"Relatório Semanal de Criação de Anúncios ({created_count} criados)"
        
        products_md = ""
        if len(created_products) > 0:
            for p in created_products:
                products_md += f"- ✅ **{p.get('product_name')}** → *Título SEO:* `{p.get('title')}`\n"
        else:
            products_md += "- *Nenhum anúncio foi criado nesta rodada (ou não há produtos com fotos disponíveis).*\n"

        if len(failed_products) > 0:
            products_md += "\n---\n\n## ⚠️ Erros ou Avisos (Anúncios Não Criados)\n"
            for fp in failed_products:
                products_md += f"- ❌ **{fp.get('product_name')}** → *Motivo:* `{fp.get('error')}`\n"

        markdown = f"""# 🚀 Relatório Semanal de Automação de Anúncios

**Data da Execução:** {datetime.now(timezone.utc).strftime("%d/%m/%Y às %H:%M UTC")}
**Status:** Concluído

---

## 🏆 Resumo dos Resultados
- **Anúncios Gerados e Processados pela IA:** `{created_count}` itens
- **Erros / Falhas:** `{failed_count}` itens
- **Economia Estimada de Tempo de Trabalho:** `{time_saved} horas` humanas
- **Taxa de Sucesso:** `{(100 if created_count > 0 and failed_count == 0 else round(created_count / max(1, created_count + failed_count) * 100))}%`

---

## 📦 Detalhamento dos Anúncios Gerados
{products_md}
---

## 🛠️ Detalhes da Operação
O **Agente Operacional SELLER DNA** analisou os produtos pendentes no seu catálogo com foto e aplicou nossas heurísticas avançadas de SEO do Mercado Livre para máxima conversão e busca orgânica.
"""

        metrics = {
            "ads_created": created_count,
            "ads_failed": failed_count,
            "time_saved_hours": time_saved,
            "created_products": created_products,
            "failed_products": failed_products,
            "execution_date": datetime.now(timezone.utc).isoformat()
        }

        report_data = {
            "user_id": user_id,
            "report_type": "WEEKLY_SUMMARY",
            "title": title,
            "summary_markdown": markdown,
            "metrics": metrics,
            "status": "UNREAD",
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        if self.supabase:
            try:
                res = self.supabase.table("ai_agent_reports").insert(report_data).execute()
                if res.data and len(res.data) > 0:
                    report_data["id"] = res.data[0].get("id")

                self.supabase.table("ai_agent_actions").insert({
                    "user_id": user_id,
                    "action_type": "REPORT_GENERATED",
                    "title": f"Relatório Semanal Gerado ({created_count} anúncios)",
                    "description": f"Automação semanal finalizou criando {created_count} novos anúncios com economia de {time_saved}h.",
                    "status": "SUCCESS" if failed_count == 0 else "WARNING",
                    "metadata": {
                        "report_id": report_data.get("id"), 
                        "type": "WEEKLY_SUMMARY",
                        "created_products": created_products,
                        "failed_products": failed_products
                    }
                }).execute()
            except Exception as e:
                logger.error(f"[ReportGenerator] Erro ao salvar relatório semanal: {str(e)}")

        return report_data

report_generator_service = ReportGeneratorService()
