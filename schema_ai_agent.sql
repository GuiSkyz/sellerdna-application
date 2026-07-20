-- Schema do Agente de IA Operacional (SELLER DNA Agent)
-- Tabelas para armazenar configurações, relatórios e logs de auditoria/ações de automação em Python

-- 1. AI_AGENT_CONFIG (Configuração individual de automação por usuário)
CREATE TABLE IF NOT EXISTS public.ai_agent_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED
  weekly_target_ads INTEGER NOT NULL DEFAULT 15, -- Quantidade de anúncios alvo por semana
  run_day_of_week TEXT NOT NULL DEFAULT 'MON', -- MON, TUE, WED, THU, FRI, SAT, SUN
  run_hour_utc INTEGER NOT NULL DEFAULT 11, -- Horário padrão de execução da rotina semanal (UTC)
  auto_publish_mode TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT (cria rascunho para revisão) ou PUBLISH (publica direto no ML)
  target_categories JSONB DEFAULT '[]'::jsonb, -- Categorias ou tipos preferenciais de produtos para criar
  min_confidence_score DECIMAL(5, 2) DEFAULT 80.00, -- Score mínimo de confiança da IA para criar anúncio
  notify_email BOOLEAN DEFAULT TRUE,
  notify_dashboard BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- 2. AI_AGENT_REPORTS (Relatórios executivos e operacionais gerados pela IA)
CREATE TABLE IF NOT EXISTS public.ai_agent_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- WEEKLY_SUMMARY, OPERATION_AUDIT, BATCH_CREATION, ALERT_REPORT
  title TEXT NOT NULL,
  summary_markdown TEXT NOT NULL, -- Conteúdo rico em Markdown para leitura na Central de Relatórios
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb, -- ex: {"products_analyzed": 45, "ads_created": 15, "seo_score_avg": 94, "time_saved_hours": 4.5}
  status TEXT NOT NULL DEFAULT 'UNREAD', -- UNREAD, READ, ARCHIVED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. AI_AGENT_ACTIONS (Feed em tempo real de ações e avisos - "Sempre avisando deixando informado")
CREATE TABLE IF NOT EXISTS public.ai_agent_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- CATALOG_CHECK, SEO_GENERATION, AD_CREATED, AD_DUPLICATED, STOCK_ALERT, REPORT_GENERATED
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, WARNING, ERROR, IN_PROGRESS
  metadata JSONB DEFAULT '{}'::jsonb, -- ID do produto, ID do anúncio ou dados técnicos da IA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance em buscas frequentes no dashboard do agente
CREATE INDEX IF NOT EXISTS idx_ai_agent_config_user ON public.ai_agent_config(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_reports_user ON public.ai_agent_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_user ON public.ai_agent_actions(user_id, created_at DESC);

-- Função / Trigger para atualizar updated_at na config
CREATE OR REPLACE FUNCTION public.update_ai_agent_config_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ai_agent_config_timestamp ON public.ai_agent_config;
CREATE TRIGGER trg_update_ai_agent_config_timestamp
  BEFORE UPDATE ON public.ai_agent_config
  FOR EACH ROW EXECUTE PROCEDURE public.update_ai_agent_config_timestamp();
