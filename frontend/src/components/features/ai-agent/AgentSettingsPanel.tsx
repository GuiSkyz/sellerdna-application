'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, RefreshCw, Calendar, ShieldAlert } from 'lucide-react';

interface AgentSettingsProps {
  config: {
    status?: string;
    weekly_target_ads?: number;
    run_day_of_week?: string;
    run_hour_utc?: number;
    auto_publish_mode?: string;
    min_confidence_score?: number;
  } | null;
  onSaveConfig: (updated: any) => Promise<void>;
  saving: boolean;
}

export function AgentSettingsPanel({ config, onSaveConfig, saving }: AgentSettingsProps) {
  const [status, setStatus] = useState('ACTIVE');
  const [weeklyTarget, setWeeklyTarget] = useState(15);
  const [runDay, setRunDay] = useState('MON');
  const [runHour, setRunHour] = useState(11);
  const [autoPublishMode, setAutoPublishMode] = useState('DRAFT');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      if (config.status) setStatus(config.status);
      if (config.weekly_target_ads) setWeeklyTarget(config.weekly_target_ads);
      if (config.run_day_of_week) setRunDay(config.run_day_of_week);
      if (config.run_hour_utc !== undefined) setRunHour(config.run_hour_utc);
      if (config.auto_publish_mode) setAutoPublishMode(config.auto_publish_mode);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    await onSaveConfig({
      status,
      weekly_target_ads: Number(weeklyTarget),
      run_day_of_week: runDay,
      run_hour_utc: Number(runHour),
      auto_publish_mode: autoPublishMode
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const daysOfWeek = [
    { code: 'MON', label: 'Segunda-feira' },
    { code: 'TUE', label: 'Terça-feira' },
    { code: 'WED', label: 'Quarta-feira' },
    { code: 'THU', label: 'Quinta-feira' },
    { code: 'FRI', label: 'Sexta-feira' },
    { code: 'SAT', label: 'Sábado' },
    { code: 'SUN', label: 'Domingo' }
  ];

  return (
    <div className="bg-card/90 border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Configuração de Automação Semanal</h2>
            <p className="text-xs text-muted-foreground">Defina como e quando o Agente criará seus anúncios no Mercado Livre.</p>
          </div>
        </div>
        
        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" /> Salvo com sucesso
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status do Agente */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Status Operacional do Agente
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('ACTIVE')}
                className={`p-3.5 rounded-2xl border text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                  status === 'ACTIVE'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Ativo (24/7)
              </button>
              <button
                type="button"
                onClick={() => setStatus('PAUSED')}
                className={`p-3.5 rounded-2xl border text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                  status === 'PAUSED'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Pausado
              </button>
            </div>
          </div>

          {/* Meta Semanal de Anúncios */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Meta de Criação Semanal (Anúncios/Semana)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                className="w-full bg-background border border-border/80 rounded-2xl px-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all text-sm"
              />
              <span className="absolute right-4 top-3.5 text-xs font-semibold text-muted-foreground">
                anúncios/rodada
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              O Agente buscará no inventário até {weeklyTarget} produtos sem anúncio e gerará títulos SEO + descrições.
            </p>
          </div>

          {/* Dia da Semana da Rotina */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Dia da Execução da Rotina
            </label>
            <select
              value={runDay}
              onChange={(e) => setRunDay(e.target.value)}
              className="w-full bg-background border border-border/80 rounded-2xl px-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all text-sm"
            >
              {daysOfWeek.map((d) => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Horário da Execução */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Horário da Execução (UTC / Brasília)
            </label>
            <select
              value={runHour}
              onChange={(e) => setRunHour(Number(e.target.value))}
              className="w-full bg-background border border-border/80 rounded-2xl px-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all text-sm"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00 UTC ({((i - 3 + 24) % 24).toString().padStart(2, '0')}:00 Horário Brasília)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modo de Sincronização no Mercado Livre */}
        <div className="pt-4 border-t border-border/50">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-3">
            Modo de Publicação e Revisão no Mercado Livre
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              autoPublishMode === 'DRAFT'
                ? 'bg-purple-500/10 border-purple-500/50 shadow-sm'
                : 'bg-background border-border/60 hover:bg-muted/40'
            }`}>
              <input
                type="radio"
                name="publishMode"
                value="DRAFT"
                checked={autoPublishMode === 'DRAFT'}
                onChange={() => setAutoPublishMode('DRAFT')}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="block text-sm font-extrabold text-foreground">Modo Rascunho / Revisão (Recomendado)</span>
                <span className="block text-xs text-muted-foreground mt-1">
                  A IA cria o anúncio em status de rascunho. Você recebe notificação e relatório para aprovar ou revisar em 1 clique antes da publicação final.
                </span>
              </div>
            </label>

            <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              autoPublishMode === 'PUBLISH'
                ? 'bg-purple-500/10 border-purple-500/50 shadow-sm'
                : 'bg-background border-border/60 hover:bg-muted/40'
            }`}>
              <input
                type="radio"
                name="publishMode"
                value="PUBLISH"
                checked={autoPublishMode === 'PUBLISH'}
                onChange={() => setAutoPublishMode('PUBLISH')}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="block text-sm font-extrabold text-foreground">Publicação Autônoma Direta</span>
                <span className="block text-xs text-muted-foreground mt-1">
                  Os anúncios gerados pela IA são criados e ativados automaticamente na sua loja do Mercado Livre no momento em que a rotina roda.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações do Agente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
