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
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Importar Produtos</h1>
        <p className="text-zinc-500 mt-2">
          Faça upload da sua planilha Excel para criar múltiplos produtos de uma vez só.
        </p>
      </div>

      {successCount !== null && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">Importação Concluída!</h2>
          <p className="text-green-700">
            Foram importados <strong>{successCount}</strong> produtos com sucesso. Eles já estão disponíveis para a criação de anúncios.
          </p>
          <button 
            onClick={() => setSuccessCount(null)}
            className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Pré-visualização 
                  <span className="bg-blue-100 text-blue-700 text-sm py-1 px-3 rounded-full">
                    {products.length} encontrados
                  </span>
                </h2>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
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

              <div className="border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 border-b text-zinc-600 uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Nome</th>
                        <th className="px-6 py-4 font-semibold">Marca</th>
                        <th className="px-6 py-4 font-semibold">Preço</th>
                        <th className="px-6 py-4 font-semibold">Estoque</th>
                        <th className="px-6 py-4 font-semibold">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.slice(0, 10).map((p, idx) => (
                        <tr key={idx} className="bg-white hover:bg-zinc-50">
                          <td className="px-6 py-4 font-medium text-zinc-900">{p.name}</td>
                          <td className="px-6 py-4 text-zinc-500">{p.brand || '-'}</td>
                          <td className="px-6 py-4 text-zinc-900 font-medium">R$ {p.price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-zinc-500">{p.quantity}</td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{p.sku || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {products.length > 10 && (
                  <div className="bg-zinc-50 py-3 text-center border-t text-sm text-zinc-500 font-medium">
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
