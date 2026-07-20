'use client';

import React, { useState } from 'react';
import { FileText, Eye, CheckCircle, Clock, BarChart3, X, Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ReportItem {
  id: string;
  report_type: string;
  title: string;
  summary_markdown: string;
  metrics: Record<string, any>;
  status: string;
  created_at: string;
}

interface AgentReportsProps {
  reports: ReportItem[];
  loading: boolean;
  onRefresh: () => void;
}

export function AgentReportsList({ reports, loading, onRefresh }: AgentReportsProps) {
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const getReportIcon = (type: string) => {
    if (type === 'WEEKLY_SUMMARY') return <Sparkles className="w-5 h-5 text-purple-500" />;
    if (type === 'OPERATION_AUDIT') return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    return <FileText className="w-5 h-5 text-primary" />;
  };

  const getBadgeType = (type: string) => {
    if (type === 'WEEKLY_SUMMARY') return { text: 'Resumo Semanal', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    if (type === 'OPERATION_AUDIT') return { text: 'Auditoria de Saúde', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    return { text: 'Relatório IA', class: 'bg-primary/10 text-primary border-primary/20' };
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-card/90 border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Central de Relatórios Executivos</h2>
            <p className="text-xs text-muted-foreground">Relatórios detalhados ("Como relatórios") com KPIs e sugestões gerados pela IA após cada rodada.</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          {loading ? 'Atualizando...' : 'Atualizar Lista'}
        </button>
      </div>

      {loading && reports.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3"></div>
          <p className="text-sm text-muted-foreground">Carregando relatórios do Agente...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/60 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-foreground">Nenhum relatório gerado ainda</h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            Quando o Agente Operacional rodar auditorias ou criar anúncios semanalmente, seus relatórios executivos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const badge = getBadgeType(report.report_type);
            const isUnread = report.status === 'UNREAD';

            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isUnread
                    ? 'bg-gradient-to-br from-card via-card to-purple-950/20 border-purple-500/40 shadow-md hover:shadow-lg hover:border-purple-500'
                    : 'bg-card border-border/70 hover:border-border hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.class}`}>
                      {badge.text}
                    </span>
                    {isUnread && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                        Novo
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {report.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                    {report.summary_markdown?.replace(/^[#*-]+\s*/gm, '').substring(0, 140)}...
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(report.created_at)}
                  </span>
                  <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Ler Relatório <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Leitura de Relatório em Markdown Enriquecido */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-500">
                  {getReportIcon(selectedReport.report_type)}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">{selectedReport.title}</h3>
                  <p className="text-xs text-muted-foreground">Gerado em {formatDate(selectedReport.created_at)} • Agente Operacional SELLER DNA</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metrics Badges se disponíveis */}
            {selectedReport.metrics && Object.keys(selectedReport.metrics).length > 0 && (
              <div className="px-6 py-4 bg-purple-500/5 border-b border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedReport.metrics.ads_created !== undefined && (
                  <div className="p-2.5 rounded-xl bg-background/80 border border-border/50 text-center">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Anúncios Criados</span>
                    <span className="text-lg font-black text-foreground">{selectedReport.metrics.ads_created}</span>
                  </div>
                )}
                {selectedReport.metrics.time_saved_hours !== undefined && (
                  <div className="p-2.5 rounded-xl bg-background/80 border border-border/50 text-center">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Economia Tempo</span>
                    <span className="text-lg font-black text-primary">{selectedReport.metrics.time_saved_hours}h</span>
                  </div>
                )}
                {selectedReport.metrics.seo_score_avg !== undefined && (
                  <div className="p-2.5 rounded-xl bg-background/80 border border-border/50 text-center">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Score SEO</span>
                    <span className="text-lg font-black text-emerald-500">{selectedReport.metrics.seo_score_avg}/100</span>
                  </div>
                )}
                {selectedReport.metrics.total_products !== undefined && (
                  <div className="p-2.5 rounded-xl bg-background/80 border border-border/50 text-center">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Itens Catálogo</span>
                    <span className="text-lg font-black text-foreground">{selectedReport.metrics.total_products}</span>
                  </div>
                )}
              </div>
            )}

            {/* Modal Body (Markdown/Texto Renderizado) */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm sm:text-base text-foreground/90 leading-relaxed font-sans">
              {selectedReport.summary_markdown?.split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return <h1 key={idx} className="text-xl sm:text-2xl font-black text-foreground pt-2 pb-1 border-b border-border/40">{line.replace('# ', '')}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={idx} className="text-base sm:text-lg font-extrabold text-primary pt-3">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={idx} className="text-sm font-bold text-foreground pt-2">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('- ')) {
                  return (
                    <li key={idx} className="ml-4 list-disc text-sm text-foreground/80 pl-1">
                      {line.replace('- ', '')}
                    </li>
                  );
                }
                if (line.trim() === '---') {
                  return <hr key={idx} className="my-4 border-border/60" />;
                }
                return line.trim() ? <p key={idx} className="text-sm text-foreground/80">{line}</p> : <div key={idx} className="h-2" />;
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/60 bg-muted/10 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm shadow-md transition-all"
              >
                Concluir Leitura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
