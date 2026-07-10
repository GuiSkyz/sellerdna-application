'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, Save, ExternalLink, Star, Heart, Check, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

export default function GenerateAdPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [productData, setProductData] = useState<Record<string, unknown> | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    stock: 0,
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const res = await authenticatedFetch(`${apiUrl}/api/products/${unwrappedParams.id}`);
        if (!res.ok) throw new Error('Falha ao carregar produto');
        const data = await res.json();
        
        setProductData(data);
        setFormData(prev => ({ ...prev, price: data.price, stock: data.quantity }));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [unwrappedParams.id]);

  const generateWithAI = async () => {
    setGenerating(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/products/${unwrappedParams.id}/generate-ad-copy`, {
        method: 'POST'
      });
      
      if (!res.ok) throw new Error('Falha ao gerar copy com a IA');
      
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        title: data.generatedAd.optimizedTitle,
        description: data.generatedAd.optimizedDescription
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar copy');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!productData) return;
    setPublishing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      
      const payload = {
        productId: productData.id,
        title: formData.title,
        description: formData.description,
        price: formData.price,
        quantity: formData.stock
      };

      const res = await authenticatedFetch(`${apiUrl}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao publicar no Mercado Livre');
      }
      
      setSuccessMessage('Anúncio publicado com sucesso no Mercado Livre!');
      setTimeout(() => router.push('/products'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar no Mercado Livre');
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const titleLength = formData.title.length;

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 bg-card border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Gerador de Anúncio IA <Sparkles className="w-5 h-5 text-purple-500" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gere títulos SEO e descrições matadoras para o ML.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm font-medium">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-3 rounded-md text-sm font-medium flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LADO ESQUERDO: EDITOR E GERADOR */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5 text-primary">
              <Sparkles className="w-32 h-32" />
            </div>
            
            <h2 className="text-lg font-semibold text-foreground mb-2">Consultor IA</h2>
            <p className="text-sm text-muted-foreground mb-6">Deixe nossa IA gerar uma copy otimizada e estruturada para converter mais.</p>
            
            <button 
              onClick={generateWithAI}
              disabled={generating}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-3 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Gerando Copy...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Gerar Anúncio com IA</>
              )}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Editor do Anúncio</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Título do Anúncio (SEO)</label>
                  <span className={`text-xs font-semibold ${titleLength > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {titleLength}/60
                  </span>
                </div>
                <input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  maxLength={60}
                  className="w-full px-4 py-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium text-foreground"
                  placeholder="Ex: Perfume Masculino Original Lacrado 100ml"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Preço Original</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <input 
                      type="number"
                      disabled
                      value={formData.price}
                      className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-md text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Estoque Disp.</label>
                  <input 
                    type="number"
                    disabled
                    value={formData.stock}
                    className="w-full px-4 py-2 bg-muted/50 border border-border rounded-md text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descrição Matadora</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={15}
                  className="w-full px-4 py-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono leading-relaxed resize-y text-foreground"
                  placeholder="A descrição aparecerá aqui..."
                />
              </div>

              <button 
                onClick={handlePublish}
                disabled={publishing || !formData.title || !formData.description}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-md font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Publicar no Mercado Livre
              </button>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: PREVIEW MERCADO LIVRE */}
        <div>
          <div className="sticky top-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-yellow-500" />
              Preview no Mercado Livre
            </h2>
            
            {/* ML Preview is inherently light-themed to mimic the actual website */}
            <div className="w-[360px] max-w-full mx-auto bg-white rounded-[2rem] border-8 border-zinc-900 overflow-hidden shadow-2xl relative h-[700px] flex flex-col">
              {/* Header do app ML fake */}
              <div className="bg-[#FFE600] p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <ArrowLeft className="w-5 h-5 text-zinc-900" />
                <div className="flex gap-4">
                  <Heart className="w-5 h-5 text-zinc-900" />
                  <ShoppingBag className="w-5 h-5 text-zinc-900" />
                </div>
              </div>

              {/* Corpo do Anúncio */}
              <div className="flex-1 overflow-y-auto bg-white pb-20">
                <div className="aspect-square bg-zinc-100 flex items-center justify-center">
                  {productData?.imageUrl ? (
                    <img src={String(productData.imageUrl)} alt="Produto" className="object-contain w-full h-full" />
                  ) : (
                    <span className="text-zinc-400">Sem Foto</span>
                  )}
                </div>
                
                <div className="p-4 border-b border-zinc-100">
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2">
                    <span>Novo</span>
                    <span>|</span>
                    <span>{formData.stock} vendidos</span>
                  </div>
                  
                  <h1 className="text-[17px] leading-tight text-zinc-800 mb-2 break-words">
                    {formData.title || "Seu título aparecerá aqui..."}
                  </h1>
                  
                  <div className="flex items-center gap-1 mb-4">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-[#3483FA] fill-[#3483FA]" />)}
                    </div>
                    <span className="text-xs text-zinc-500">(15)</span>
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl text-zinc-800 tracking-tight font-light flex items-start">
                      <span className="text-lg mt-1 mr-1">R$</span>
                      {Math.floor(formData.price || 0)}
                      <span className="text-lg mt-1 ml-0.5">
                        {((formData.price || 0) % 1).toFixed(2).substring(2)}
                      </span>
                    </div>
                    <div className="text-[#00A650] text-sm mt-1">
                      em <span className="font-medium">10x R$ {((formData.price || 0)/10).toFixed(2)} sem juros</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-[#3483FA] text-white py-3 rounded-md font-semibold text-sm">
                      Comprar agora
                    </button>
                    <button className="flex-1 bg-[#4189E6]/10 text-[#3483FA] py-3 rounded-md font-semibold text-sm">
                      Adicionar ao carrinho
                    </button>
                  </div>
                </div>

                <div className="p-4 border-b border-zinc-100">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-[#00A650]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                    <div>
                      <div className="text-[#00A650] text-[15px]">Chegará grátis amanhã</div>
                      <div className="text-zinc-500 text-xs">Benefício Mercado Pontos</div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h2 className="text-[17px] text-zinc-800 mb-4">Descrição</h2>
                  <div className="text-zinc-600 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                    {formData.description || "A descrição rica gerada pela IA aparecerá aqui em texto corrido, do jeito que o Mercado Livre aceita..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
