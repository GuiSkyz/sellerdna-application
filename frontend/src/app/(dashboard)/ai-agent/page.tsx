'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, BarChart3, Activity, Settings } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { AgentOverviewCards } from '@/components/features/ai-agent/AgentOverviewCards';
import { AgentSettingsPanel } from '@/components/features/ai-agent/AgentSettingsPanel';
import { AgentReportsList } from '@/components/features/ai-agent/AgentReportsList';
import { AgentActivityFeed } from '@/components/features/ai-agent/AgentActivityFeed';

export default function AIAgentPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'reports' | 'actions'>('overview');
  const [loading, setLoading] = useState(true);
  const [runningNow, setRunningNow] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const [health, setHealth] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const baseUrl = getApiUrl();
    try {
      // 1. Overview e Saúde operados integralmente no Backend
      const resOverview = await authenticatedFetch(`${baseUrl}/api/agent/overview`);
      if (resOverview.ok) {
        const dataOverview = await resOverview.json();
        setHealth(dataOverview.health || null);
        setConfig(dataOverview.config || null);
      }

      // 2. Relatórios processados no Backend
      const resReports = await authenticatedFetch(`${baseUrl}/api/agent/reports`);
      if (resReports.ok) {
        const dataReports = await resReports.json();
        setReports(dataReports.reports || []);
      }

      // 3. Ações no Backend
      const resActions = await authenticatedFetch(`${baseUrl}/api/agent/actions`);
      if (resActions.ok) {
        const dataActions = await resActions.json();
        setActions(dataActions.actions || []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do Agente no Backend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSaveConfig = async (updated: any) => {
    setSavingConfig(true);
    const baseUrl = getApiUrl();
    try {
      const res = await authenticatedFetch(`${baseUrl}/api/agent/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
      }
    } catch (err) {
      console.error('Erro ao salvar config no Backend:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRunNow = async () => {
    setRunningNow(true);
    const baseUrl = getApiUrl();
    try {
      const res = await authenticatedFetch(`${baseUrl}/api/agent/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_count: config?.weekly_target_ads || 15 })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Erro ao executar rotina imediata no Backend:', err);
    } finally {
      setRunningNow(false);
    }
  };

  const handleGenerateAudit = async () => {
    setRunningNow(true);
    const baseUrl = getApiUrl();
    try {
      await authenticatedFetch(`${baseUrl}/api/agent/generate-audit`, { method: 'POST' });
      await fetchAllData();
    } catch (err) {
      console.error('Erro ao gerar auditoria no Backend:', err);
    } finally {
      setRunningNow(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Cards & Banner Principal */}
      <AgentOverviewCards
        health={health}
        config={config}
        onRunNow={handleRunNow}
        onGenerateAudit={handleGenerateAudit}
        running={runningNow}
      />

      {/* Tabs de Navegação Interna na Aba do Agente */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Bot className="w-4 h-4" />
          Visão Geral & Controle
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all whitespace-nowrap relative ${
            activeTab === 'reports'
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Relatórios Executivos
          {reports.filter(r => r.status === 'UNREAD').length > 0 && (
            <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[11px] font-extrabold flex items-center justify-center animate-bounce-subtle">
              {reports.filter(r => r.status === 'UNREAD').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Settings className="w-4 h-4" />
          Automação Semanal
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all whitespace-nowrap ${
            activeTab === 'actions'
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          Feed ao Vivo & Avisos
        </button>
      </div>

      {/* Conteúdo Dinâmico por Tab */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <AgentReportsList reports={reports.slice(0, 3)} loading={loading} onRefresh={fetchAllData} />
            </div>
            <div className="space-y-8">
              <AgentActivityFeed actions={actions.slice(0, 5)} loading={loading} onRefresh={fetchAllData} />
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <AgentReportsList reports={reports} loading={loading} onRefresh={fetchAllData} />
        )}

        {activeTab === 'settings' && (
          <AgentSettingsPanel config={config} onSaveConfig={handleSaveConfig} saving={savingConfig} />
        )}

        {activeTab === 'actions' && (
          <AgentActivityFeed actions={actions} loading={loading} onRefresh={fetchAllData} />
        )}
      </div>
    </div>
  );
}
