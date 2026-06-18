import Link from 'next/link';
import { Box, Sparkles, TrendingUp, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="px-6 h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Box className="w-8 h-8" />
          <span className="font-black text-2xl tracking-tighter text-foreground">
            SELLER<span className="text-primary">DNA</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <ModeToggle />
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Entrar
          </Link>
          <Link href="/signup" className="inline-flex items-center justify-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-6 shadow-sm">
            Criar Conta Grátis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-4 pt-32 pb-24 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold mb-8 border border-primary/20 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          A Inteligência por trás dos líderes do Mercado Livre
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tighter max-w-4xl leading-[1.1] relative z-10">
          Gestão de anúncios <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/60">
            orientada a dados.
          </span>
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed relative z-10">
          O SellerDNA é o ERP inteligente para vendedores do Mercado Livre. Otimize descrições com IA, sincronize múltiplos canais e escale suas vendas com previsibilidade.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <Link href="/signup" className="inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-8 py-4 text-base shadow-lg shadow-primary/20 w-full sm:w-auto">
            Começar Gratuitamente
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link href="#features" className="inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md px-8 py-4 text-base w-full sm:w-auto">
            Conhecer Plataforma
          </Link>
        </div>

        {/* Features Preview */}
        <div id="features" className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full text-left relative z-10">
          {[
            {
              title: "Motor de IA Avançado",
              description: "Descrições persuasivas e títulos magnéticos gerados instantaneamente com base nos melhores anúncios do nicho.",
              icon: Sparkles
            },
            {
              title: "Sincronização Bidirecional",
              description: "Controle total do seu inventário. Publique novos anúncios, ajuste preços e pause vendas em tempo real via API oficial.",
              icon: RefreshCw
            },
            {
              title: "Dashboard Analítico",
              description: "Métricas acionáveis em tempo real. Acompanhe visitas, conversões e o índice de qualidade dos seus anúncios em uma única tela.",
              icon: TrendingUp
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border bg-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
          <div className="flex items-center gap-2 mb-4 md:mb-0 font-bold text-foreground">
            <Box className="w-5 h-5 text-primary" />
            SELLERDNA
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs">Seguro e integrado oficialmente com o Mercado Livre.</span>
          </div>
          <p className="mt-4 md:mt-0 text-xs">
            &copy; {new Date().getFullYear()} SellerDNA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
