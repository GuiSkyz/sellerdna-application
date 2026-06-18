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
      className={`fixed top-0 left-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 z-50 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="h-16 flex items-center justify-center px-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 text-primary overflow-hidden w-full px-2">
          <Box className="w-7 h-7 flex-shrink-0" />
          <span className={`font-black text-xl tracking-tight text-foreground transition-opacity duration-300 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
            SELLER<span className="text-primary">DNA</span>
          </span>
        </div>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isOpen ? item.name : undefined}
                className={`flex items-center gap-3 rounded-md transition-all duration-200 group ${
                  isOpen ? 'px-3 py-2.5' : 'justify-center p-3'
                } ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span className={`text-sm whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {item.name}
                </span>
                {isActive && isOpen && (
                  <div className="ml-auto w-1 h-5 bg-primary rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {isOpen && (
        <div className="p-4 border-t border-border bg-card/50">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Plano Premium</p>
            <div className="w-full bg-border rounded-full h-1.5 mb-2">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '70%' }}></div>
            </div>
            <p className="text-[10px] text-muted-foreground">7.000 / 10.000 importações</p>
          </div>
        </div>
      )}
    </aside>
  );
}
