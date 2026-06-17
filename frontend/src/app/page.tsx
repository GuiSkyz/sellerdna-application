import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Box, Sparkles, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="px-6 h-20 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600">
          <Box className="w-8 h-8" />
          <span className="font-extrabold text-2xl tracking-tight text-zinc-900">
            SELLER<span className="text-blue-600">DNA</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            Entrar
          </Link>
          <Link href="/signup" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">Criar Conta Grátis</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-8 border border-blue-200/50">
          <Sparkles className="w-4 h-4" />
          A Revolução da IA no Mercado Livre
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 tracking-tight max-w-4xl leading-tight">
          Escale suas vendas com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Inteligência Artificial</span>
        </h1>
        
        <p className="mt-6 text-xl text-zinc-500 max-w-2xl leading-relaxed">
          Importe seus produtos, deixe nossa IA otimizar títulos e descrições, e gerencie todos os seus anúncios do Mercado Livre em uma única plataforma.
        </p>
        
        <div className="mt-10 flex items-center gap-4">
          <Link href="/signup" className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-lg shadow-xl shadow-blue-600/20">
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>

        {/* Features Preview */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full text-left">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200/50">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Otimização com IA</h3>
            <p className="mt-3 text-zinc-500 leading-relaxed">
              Descrições persuasivas e títulos magnéticos gerados instantaneamente pela nossa Inteligência Artificial treinada com os melhores anúncios.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200/50">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
              <RefreshCw className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Sincronização Direta</h3>
            <p className="mt-3 text-zinc-500 leading-relaxed">
              Publique novos anúncios, pause e acompanhe o estoque diretamente da plataforma. Conexão oficial com a API do Mercado Livre.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200/50">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Métricas Reais</h3>
            <p className="mt-3 text-zinc-500 leading-relaxed">
              Acompanhe suas vendas, visitas e o índice de qualidade dos anúncios em um painel único e gerencie múltiplas contas simultaneamente.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-zinc-500 text-sm border-t border-zinc-200 bg-white">
        &copy; {new Date().getFullYear()} Seller DNA. Todos os direitos reservados.
      </footer>
    </div>
  );
}
