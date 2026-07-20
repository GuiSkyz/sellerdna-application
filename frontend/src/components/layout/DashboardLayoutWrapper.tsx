"use client";

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, Search, Bell } from 'lucide-react';
import { ModeToggle } from '../mode-toggle';

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300 relative selection:bg-primary/20 selection:text-primary">
      {/* Subtle clean airy background mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,102,255,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(11,17,32,0))]"></div>
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] relative z-10 ${isSidebarOpen ? 'ml-[17.25rem]' : 'ml-[5.75rem]'} pr-3 py-3`}>
        {/* Floating Clean Header */}
        <header className="h-16 rounded-2xl bg-card/85 backdrop-blur-xl border border-border/40 shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] flex items-center justify-between px-6 sticky top-3 z-40 transition-all duration-300 mb-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-200 group"
              title={isSidebarOpen ? 'Recolher Menu' : 'Expandir Menu'}
            >
              <Menu className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
            </button>
            
            <div className="relative hidden md:flex items-center group">
              <Search className="w-4 h-4 absolute left-3.5 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none" />
              <input 
                type="text" 
                placeholder="Buscar em SellerDNA..." 
                className="pl-10 pr-4 py-1.5 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 rounded-full text-sm w-80 transition-all outline-none shadow-sm text-foreground placeholder:text-muted-foreground/70"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ModeToggle />
            <button 
              className="p-2 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-200 relative group"
              title="Notificações"
            >
              <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card shadow-[0_0_8px_var(--primary)]"></span>
            </button>
            <div className="h-6 w-px bg-border/50 mx-1"></div>
            <button className="relative flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-muted/50 transition-colors border border-transparent hover:border-border/40 group">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md shadow-primary/20 ring-2 ring-background transition-transform group-hover:scale-105">
                RF
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-semibold leading-tight text-foreground">Robson F.</span>
                <span className="text-[11px] text-muted-foreground leading-tight">Admin</span>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-3 pb-6 overflow-y-auto w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
