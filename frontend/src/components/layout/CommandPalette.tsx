'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, LayoutDashboard, Bot, PackageSearch, UploadCloud, Store, Settings, Sparkles, ArrowRight, RefreshCw, Plus } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-md transition-opacity" 
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Box */}
      <div className="relative z-50 w-full max-w-2xl overflow-hidden rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-[0_16px_70px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_70px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200">
        <Command className="w-full bg-transparent text-foreground outline-none">
          {/* Input Bar */}
          <div className="flex items-center border-b border-border/40 px-4 py-3">
            <Search className="mr-3 h-5 w-5 text-primary flex-shrink-0 animate-pulse" />
            <Command.Input
              autoFocus
              placeholder="Digite um comando ou busque telas, SKUs, ações rápidas... (Esc para fechar)"
              className="flex-1 bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/60 outline-none border-none focus:ring-0"
            />
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-1 rounded-md border border-border/40">
              ESC
            </span>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[380px] overflow-y-auto p-3 space-y-3 scrollbar-hide">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado para essa busca.
            </Command.Empty>

            {/* Quick Actions Group */}
            <Command.Group heading="AÇÕES RÁPIDAS" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 mb-1">
              <div className="space-y-1 mt-1.5">
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/products/import'))}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-150 select-none data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Nova Importação de Produtos em Massa</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 data-[selected=true]:opacity-100 transition-opacity" />
                </Command.Item>

                <Command.Item
                  onSelect={() => runCommand(() => router.push('/listings'))}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-150 select-none data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span>Sincronizar Anúncios do Mercado Livre</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 data-[selected=true]:opacity-100 transition-opacity" />
                </Command.Item>

                <Command.Item
                  onSelect={() => runCommand(() => router.push('/ai-agent'))}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-150 select-none data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span>Acessar Agente AI & Otimizações em 24/7</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 data-[selected=true]:opacity-100 transition-opacity" />
                </Command.Item>
              </div>
            </Command.Group>

            {/* Navigation Group */}
            <Command.Group heading="NAVEGAÇÃO DO SISTEMA" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 pt-2 mb-1 border-t border-border/30">
              <div className="space-y-1 mt-1.5">
                {[
                  { name: 'Dashboard Geral', href: '/dashboard', icon: LayoutDashboard },
                  { name: 'Agente AI (24/7 Automação)', href: '/ai-agent', icon: Bot },
                  { name: 'Meus Produtos Catalogados', href: '/products', icon: PackageSearch },
                  { name: 'Importar Planilhas e Drive', href: '/products/import', icon: UploadCloud },
                  { name: 'Anúncios Sincronizados ML', href: '/listings', icon: Store },
                  { name: 'Configurações de Conta', href: '/settings', icon: Settings },
                ].map((item) => (
                  <Command.Item
                    key={item.href}
                    onSelect={() => runCommand(() => router.push(item.href))}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-foreground hover:bg-muted/60 hover:text-primary transition-all duration-150 select-none data-[selected=true]:bg-muted/60 data-[selected=true]:text-primary group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground/60 group-hover:text-primary transition-colors">Ir &rarr;</span>
                  </Command.Item>
                ))}
              </div>
            </Command.Group>
          </Command.List>

          {/* Footer Bar */}
          <div className="border-t border-border/40 px-4 py-2.5 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-background border border-border/60 rounded text-[10px] font-bold">↑↓</kbd> navegar</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-background border border-border/60 rounded text-[10px] font-bold">Enter</kbd> selecionar</span>
            </div>
            <span className="font-bold text-primary flex items-center gap-1">SellerDNA Command</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
