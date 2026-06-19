'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackageSearch, UploadCloud, Settings, Box, Store } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Meus Produtos', href: '/products', icon: PackageSearch },
    { name: 'Importar', href: '/products/import', icon: UploadCloud },
    { name: 'Anúncios ML', href: '/listings', icon: Store },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="h-20 flex items-center justify-center px-4 mb-2">
        <div className="flex items-center gap-3 overflow-hidden w-full px-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 flex-shrink-0 text-primary-foreground">
            <Box className="w-5 h-5" />
          </div>
          <span className={`font-black text-xl tracking-tight text-foreground transition-all duration-300 whitespace-nowrap ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 hidden'}`}>
            SELLER<span className="text-primary">DNA</span>
          </span>
        </div>
      </div>
      
      <div className="px-3 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className={`text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3 px-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
          Menu Principal
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isOpen ? item.name : undefined}
                className={`relative flex items-center gap-3 rounded-xl transition-all duration-300 group overflow-hidden ${
                  isOpen ? 'px-3 py-3' : 'justify-center p-3 mx-auto w-12 h-12'
                } ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 dark:bg-primary/15 transition-all duration-300"></div>
                )}
                {/* Hover subtle background */}
                {!isActive && (
                  <div className="absolute inset-0 bg-muted/0 group-hover:bg-muted/50 transition-colors duration-300"></div>
                )}
                
                <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-sm font-medium whitespace-nowrap relative z-10 transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 hidden'}`}>
                  {item.name}
                </span>
                {isActive && isOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] relative z-10 animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {isOpen && (
        <div className="p-4 mb-4">
          <div className="bg-gradient-to-br from-muted/50 to-muted/10 border border-border/50 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
            <p className="text-sm font-bold text-foreground mb-1">Plano Premium</p>
            <div className="w-full bg-background/50 rounded-full h-2 mb-2 overflow-hidden border border-border/20">
              <div className="bg-gradient-to-r from-primary/80 to-primary h-full rounded-full relative" style={{ width: '70%' }}>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">7.000 / 10.000 importações</p>
          </div>
        </div>
      )}
    </aside>
  );
}
