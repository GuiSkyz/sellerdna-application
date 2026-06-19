"use client";

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, Search, Bell } from 'lucide-react';
import { ModeToggle } from '../mode-toggle';

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors duration-300 relative selection:bg-primary/30">
      {/* Premium Background Mesh / Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] relative z-10 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Header */}
        <header className="h-20 border-b border-border/50 bg-background/60 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40 transition-all duration-300">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 -ml-2.5 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-300 group"
            >
              <Menu className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            </button>
            <div className="relative hidden md:block group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input 
                type="text" 
                placeholder="Buscar em SellerDNA..." 
                className="pl-10 pr-4 py-2 bg-muted/30 border border-transparent hover:border-border/50 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl text-sm w-72 transition-all outline-none shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ModeToggle />
            <button className="p-2.5 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-300 relative group">
              <Bell className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background shadow-[0_0_8px_var(--primary)]"></span>
            </button>
            <div className="h-8 w-px bg-border/50 mx-1"></div>
            <button className="relative flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md shadow-primary/20 ring-2 ring-background">
                RF
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold leading-tight">Robson F.</span>
                <span className="text-xs text-muted-foreground leading-tight">Admin</span>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
