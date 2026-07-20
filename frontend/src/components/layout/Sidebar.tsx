'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackageSearch, UploadCloud, Settings, Box, Store, Bot, Sparkles } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Agente AI', href: '/ai-agent', icon: Bot, isAi: true },
    { name: 'Meus Produtos', href: '/products', icon: PackageSearch },
    { name: 'Importar', href: '/products/import', icon: UploadCloud },
    { name: 'Anúncios ML', href: '/listings', icon: Store },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-3 left-3 bottom-3 bg-card/90 backdrop-blur-2xl border border-border/40 rounded-2xl flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] z-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand / Logo */}
      <div className="h-20 flex items-center justify-center px-4 mb-2">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden w-full px-2 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-md shadow-primary/25 flex-shrink-0 text-primary-foreground transition-transform duration-300 group-hover:scale-105">
            <Box className="w-5 h-5" />
          </div>
          <span className={`font-black text-lg tracking-tight text-foreground transition-all duration-300 whitespace-nowrap ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 hidden'}`}>
            SELLER<span className="text-primary font-extrabold">DNA</span>
          </span>
        </Link>
      </div>
      
      {/* Nav List */}
      <div className="px-3 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className={`text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2.5 px-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
          Menu Principal
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isOpen ? item.name : undefined}
                className={`relative flex items-center gap-3.5 rounded-xl transition-all duration-200 group overflow-hidden ${
                  isOpen ? 'px-3.5 py-3' : 'justify-center p-3 mx-auto w-11 h-11'
                } ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-primary scale-105' : 'group-hover:scale-110'} ${item.isAi && !isActive ? 'text-blue-500 dark:text-blue-400' : ''}`} />
                
                <span className={`text-sm whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 hidden'}`}>
                  {item.name}
                </span>

                {item.isAi && isOpen && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    24/7
                  </span>
                )}

                {!item.isAi && isActive && isOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Footer Card */}
      {isOpen && (
        <div className="p-3.5 mb-3 mx-3">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-3.5 backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:border-primary/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-foreground tracking-tight">Plano Premium</span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">PRO</span>
            </div>
            <div className="w-full bg-background/60 rounded-full h-1.5 mb-2 overflow-hidden border border-border/20">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: '70%' }}></div>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground flex justify-between">
              <span>Importações</span>
              <span className="text-foreground font-semibold">7k / 10k</span>
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
