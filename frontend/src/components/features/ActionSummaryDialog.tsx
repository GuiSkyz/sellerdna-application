'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  FolderSearch,
  Sparkles,
  UploadCloud,
  X,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Layers,
  Check,
} from 'lucide-react';

export interface ActionSummaryItem {
  id: string | number;
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  detail?: string;
  link?: string;
  linkLabel?: string;
}

export interface ActionSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actionType?: 'search' | 'publish' | 'delete' | 'update' | 'general';
  items: ActionSummaryItem[];
  onConfirmReload?: () => void;
}

export const ActionSummaryDialog: React.FC<ActionSummaryDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = 'Resumo detalhado de cada item processado na ação.',
  actionType = 'general',
  items,
  onConfirmReload,
}) => {
  if (!isOpen) return null;

  const successCount = items.filter((item) => item.status === 'success').length;
  const errorCount = items.filter((item) => item.status === 'error').length;
  const warningCount = items.filter((item) => item.status === 'warning').length;

  const renderHeaderIcon = () => {
    switch (actionType) {
      case 'search':
        return <FolderSearch className="w-6 h-6 text-primary" />;
      case 'publish':
        return <Sparkles className="w-6 h-6 text-purple-500" />;
      case 'delete':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'update':
        return <RefreshCw className="w-6 h-6 text-blue-500" />;
      default:
        return <Layers className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200 relative">
        {/* Top decorative gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-purple-500 to-emerald-500" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/70 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              {renderHeaderIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 bg-muted/30 border-b border-border/60 grid grid-cols-3 gap-4">
          <div className="bg-card border border-border/80 rounded-xl p-3 flex flex-col">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Processado
            </span>
            <span className="text-2xl font-bold text-foreground mt-1">
              {items.length}
            </span>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex flex-col">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Encontrados / Sucesso
            </span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {successCount}
            </span>
          </div>

          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex flex-col">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Não Encontrados / Falhas
            </span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {errorCount + warningCount}
            </span>
          </div>
        </div>

        {/* List of actions */}
        <div className="p-6 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nenhum item processado.
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, index) => {
                const isSuccess = item.status === 'success';
                const isWarning = item.status === 'warning';
                const isError = item.status === 'error';

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                      isSuccess
                        ? 'bg-emerald-500/[0.03] border-emerald-500/20 hover:bg-emerald-500/[0.06]'
                        : isWarning
                        ? 'bg-amber-500/[0.03] border-amber-500/20 hover:bg-amber-500/[0.06]'
                        : 'bg-rose-500/[0.03] border-rose-500/20 hover:bg-rose-500/[0.06]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0">
                        {isSuccess && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {isWarning && (
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                        {isError && (
                          <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground line-clamp-1">
                            {item.name}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                            ID: {item.id}
                          </span>
                        </div>

                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            isSuccess
                              ? 'text-muted-foreground'
                              : isWarning
                              ? 'text-amber-600 dark:text-amber-400 font-medium'
                              : 'text-rose-600 dark:text-rose-400 font-medium'
                          }`}
                        >
                          {item.message}
                        </p>

                        {item.detail && (
                          <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono">
                            {item.detail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                        >
                          {item.linkLabel || 'Ver'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isSuccess
                            ? 'Concluído'
                            : isWarning
                            ? 'Atenção'
                            : 'Não Encontrado'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-muted/30 border-t border-border flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            As ações foram finalizadas. Verifique o status de cada produto na lista acima.
          </span>

          <div className="flex items-center gap-3">
            {onConfirmReload ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Fechar sem Recarregar
                </button>
                <button
                  type="button"
                  onClick={onConfirmReload}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Concluir e Atualizar Tela
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
