'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PackageSearch, UploadCloud, Settings, Box, Store } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Meus Produtos', href: '/products', icon: PackageSearch },
    { name: 'Importar Excel', href: '/products/import', icon: UploadCloud },
    { name: 'Anúncios do ML', href: '/listings', icon: Store },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200/60 flex flex-col h-screen fixed top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200/60">
        <div className="flex items-center gap-2 text-blue-600">
          <Box className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight text-zinc-900">SELLER<span className="text-blue-600">DNA</span></span>
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-100' 
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-zinc-200/60">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            R
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-900 leading-tight">Renan F.</span>
            <span className="text-xs text-zinc-500">Vendedor Premium</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
