'use client';

import React, { useState } from 'react';
import { ExcelUploader } from '@/components/features/ExcelUploader';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

export default function ImportProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleDataParsed = (data: any[]) => {
    setProducts(data);
    setSuccessCount(null);
  };

  const handleImport = async () => {
    if (products.length === 0) return;
    setIsImporting(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await authenticatedFetch(`${apiUrl}/api/products/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });

      if (!response.ok) {
        throw new Error('Falha ao importar produtos no servidor.');
      }

      setSuccessCount(products.length);
      setProducts([]); // clear after success
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar a importação. Verifique se o backend está rodando.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Importar Produtos</h1>
        <p className="text-muted-foreground mt-2">
          Faça upload da sua planilha Excel para criar múltiplos produtos de uma vez só.
        </p>
      </div>

      {successCount !== null && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 mb-8 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Importação Concluída!</h2>
          <p className="text-emerald-600/80 dark:text-emerald-500/80 max-w-md mx-auto">
            Foram importados <strong>{successCount}</strong> produtos com sucesso. Eles já estão disponíveis para a criação de anúncios.
          </p>
          <button 
            onClick={() => setSuccessCount(null)}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            Importar nova planilha
          </button>
        </div>
      )}

      {successCount === null && (
        <>
          <ExcelUploader onDataParsed={handleDataParsed} />

          {products.length > 0 && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                  Pré-visualização 
                  <span className="bg-primary/10 text-primary text-xs py-1 px-2.5 rounded-full font-semibold">
                    {products.length} encontrados
                  </span>
                </h2>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Importando...
                    </>
                  ) : (
                    <>
                      Confirmar Importação <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">Marca</th>
                        <th className="px-6 py-4">Preço</th>
                        <th className="px-6 py-4">Estoque</th>
                        <th className="px-6 py-4">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.slice(0, 10).map((p, idx) => (
                        <tr key={idx} className="bg-card hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">{p.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{p.brand || '-'}</td>
                          <td className="px-6 py-4 text-foreground font-medium">R$ {p.price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-muted-foreground">{p.quantity}</td>
                          <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{p.sku || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {products.length > 10 && (
                  <div className="bg-muted/30 py-4 text-center border-t border-border text-sm text-muted-foreground font-medium">
                    Mostrando 10 de {products.length} produtos. A tabela completa será importada.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
