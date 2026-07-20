import os
import json
import logging
from typing import Dict, Any, Optional, List
from google import genai

from config.settings import settings

logger = logging.getLogger("GeminiAI")

class GeminiAIService:
    """
    Serviço de Inteligência Artificial em Python para o Agente Operacional SELLER DNA.
    Gera títulos SEO (<55 caracteres), descrições persuasivas de alta conversão e
    sintetiza relatórios executivos em Markdown.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GEMINI_API_KEY não configurada no serviço Python. Modo de fallback ou mock será ativado quando necessário.")

        self.models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ]

    async def _generate_text(self, prompt: str, temperature: float = 0.7) -> str:
        if not self.client:
            return ""
        
        last_err = None
        for model_name in self.models:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={"temperature": temperature}
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                last_err = e
                logger.warning(f"[Gemini Python] Falha com modelo {model_name}: {str(e)}")
                continue
        
        logger.error(f"[Gemini Python] Falha em todos os modelos: {last_err}")
        return ""

    async def generate_seo_title(self, product: Dict[str, Any]) -> str:
        name = product.get("name", "Produto")
        brand = product.get("brand", "")
        size_ml = product.get("size_ml", "")
        perfume_type = product.get("perfume_type", "")

        prompt = f"""
        Você é o Consultor Sênior e Agente Operacional Autônomo do Mercado Livre.
        Sua missão é criar um TÍTULO IMPECÁVEL de SEO de alta conversão para o anúncio.

        REGRAS CRÍTICAS E INEGOCIÁVEIS:
        1. O TÍTULO DEVE TER NO MÁXIMO 55 CARACTERES. Seja extremamente conciso.
        2. Estrutura recomendada: [Tipo/Nome do Produto] + [Marca] + [Volume/Especificação] + [Palavra de Confiança como Original ou Lacrado].
        3. NUNCA use aspas, nem pontos finais, nem termos proibidos pelo ML ("Frete Grátis", "Envio Já").
        4. NUNCA invente especificações que não estejam nos dados reais.

        Dados do Produto:
        Nome: {name}
        Marca: {brand}
        Volume: {size_ml}
        Tipo: {perfume_type}

        Retorne APENAS o título sugerido. Exemplo: Perfume Club De Nuit 105ml Original Lacrado
        """
        title = await self._generate_text(prompt, temperature=0.6)
        if not title:
            # Fallback inteligente se a API falhar
            clean_brand = f" {brand}" if brand and brand.lower() not in name.lower() else ""
            clean_size = f" {size_ml}" if size_ml and size_ml.lower() not in name.lower() else ""
            title = f"{name}{clean_brand}{clean_size} Original".strip()

        # Garante corte seguro no espaço em caso de ultrapassar 58 caracteres
        if len(title) > 58:
            truncated = title[:58]
            last_space = truncated.rfind(' ')
            title = truncated[:last_space] if last_space > 0 else truncated

        return title

    async def generate_persuasive_description(self, product: Dict[str, Any]) -> str:
        prompt = f"""
        Você é o Consultor Sênior de Vendas e Agente de IA do Mercado Livre.
        Crie uma DESCRIÇÃO PROFISSIONAL, PERSUASIVA E ALTAMENTE CONVERSORA para este produto.

        Dados Reais do Produto (Não invente notas olfativas ou volumetrias falsas se não constarem nos dados ou no seu conhecimento factual da marca):
        {json.dumps(product, ensure_ascii=False, indent=2)}

        ESTRUTURA OBRIGATÓRIA DA DESCRIÇÃO (Em texto plano para Mercado Livre, usando hifens para listas e letras MAIÚSCULAS para títulos de seção):
        TÍTULO EM CAIXA ALTA DO PRODUTO
        
        INTRODUÇÃO PERSUASIVA:
        Breve parágrafo destacando a exclusividade, originalidade e presença marcante do produto.

        PRINCIPAIS CARACTERÍSTICAS:
        - Característica ou benefício real 1
        - Característica ou benefício real 2
        - Característica ou benefício real 3

        COMO E ONDE USAR:
        Dicas práticas e ocasiões ideais para aproveitamento máximo.

        GARANTIA E SEGURANÇA:
        Produto 100% original, embalado com máxima segurança e pronto para envio imediato. Compre com total tranquilidade!

        Retorne APENAS o texto da descrição pronta.
        """
        desc = await self._generate_text(prompt, temperature=0.7)
        if not desc:
            desc = f"PRODUTO ORIGINAL E LACRADO: {product.get('name', 'Produto')}\n\nGaranta já o seu {product.get('name', '')} da marca {product.get('brand', 'Original')}. Produto de alta qualidade, 100% autêntico e com envio seguro para todo o Brasil.\n\n- Produto Novo e Lacrado\n- Pronta Entrega\n- Garantia de Qualidade\n\nAproveite e faça seu pedido agora!"
        return desc

    async def synthesize_audit_report(self, stats: Dict[str, Any]) -> str:
        prompt = f"""
        Você é o Agente Operacional de IA SELLER DNA, responsável pela gestão executiva da loja no Mercado Livre.
        Sintetize um RELATÓRIO EXECUTIVO DE AUDITORIA OPERACIONAL com base nos seguintes indicadores colhidos agora do banco de dados:

        {json.dumps(stats, ensure_ascii=False, indent=2)}

        Crie um relatório em formato Markdown elegante, com cabeçalhos claros, listas, destaques e recomendações práticas.
        Aborde:
        1. **Visão Geral do Catálogo**: Total de produtos vs quantos já estão anunciados.
        2. **Gargalos e Oportunidades**: O que o vendedor está deixando na mesa (produtos parados sem anúncio).
        3. **Ações Executadas / Recomendadas pela IA**: Próximos passos automáticos programados para a semana.
        """
        report_md = await self._generate_text(prompt, temperature=0.6)
        if not report_md:
            total = stats.get("total_products", 0)
            listed = stats.get("listed_products", 0)
            unlisted = stats.get("unlisted_products", 0)
            report_md = f"""# 📊 Relatório Executivo de Auditoria Operacional

**Data da Auditoria:** {(stats.get('timestamp') or 'Hoje')}
**Status Geral:** Monitoramento 24/7 Ativo

---

## 📈 Resumo do Inventário
- **Total de Produtos Cadastrados:** {total} itens
- **Produtos com Anúncio no Mercado Livre:** {listed} itens
- **Produtos Não Anunciados (Oportunidade de Venda):** {unlisted} itens

---

## 🚨 Oportunidades Identificadas
Foi identificado que **{unlisted} produtos** estão disponíveis no seu inventário/Drive mas ainda não foram publicados no Mercado Livre.
Ao acionar a rotina automática do **Agente AI**, nossos algoritmos criarão os títulos otimizados para SEO e as descrições de conversão para colocar esses produtos imediatamente à venda!

---

## 💡 Próximos Passos
O Agente está programado para executar a rotina semanal e publicar novos lotes de anúncios conforme a sua configuração na aba do Agente AI.
"""
        return report_md

gemini_ai_service = GeminiAIService()
