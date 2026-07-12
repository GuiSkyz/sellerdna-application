'use client';

import React, { useState } from 'react';
import { ExcelUploader } from '@/components/features/ExcelUploader';
import { CheckCircle2, ArrowRight, Loader2, RefreshCw, Layers, Download } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

interface ImportedProduct {
  id?: string;
  customId?: string;
  name: string;
  brand?: string;
  sizeMl?: string;
  perfumeType?: string;
  price: number;
  quantity: number;
  gender?: string;
  expirationDate?: string;
  weight?: number;
  ncm?: string;
  sku?: string;
  imageUrl?: string;
  mlCategoryId?: string;
  [key: string]: unknown;
}

interface ImportResult {
  message: string;
  updatedCount?: number;
  createdCount?: number;
}

export default function ImportProductsPage() {
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [mode, setMode] = useState<'upsert' | 'update' | 'create'>('upsert');

  const handleDataParsed = (data: Record<string, unknown>[]) => {
    setProducts(data as ImportedProduct[]);
    setResult(null);
  };

  const handleImport = async () => {
    if (products.length === 0) return;
    setIsImporting(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await authenticatedFetch(`${apiUrl}/api/products/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, mode })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Falha ao importar produtos no servidor.');
      }

      const resData = await response.json();
      setResult({
        message: resData.message || 'Importação concluída com sucesso!',
        updatedCount: resData.updatedCount || 0,
        createdCount: resData.createdCount || 0
      });
      setProducts([]); // clear after success
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erro ao realizar a importação.';
      alert(`${msg} Verifique os dados da planilha ou conexão com o backend.`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Importar / Atualizar Produtos via Planilha</h1>
          <p className="text-muted-foreground mt-2">
            Faça upload da sua planilha Excel para atualizar produtos cadastrados ou adicionar novos itens em massa.
          </p>
        </div>
        <button
          onClick={async () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
            const res = await authenticatedFetch(`${apiUrl}/api/products`);
            if (res.ok) {
              const data = await res.json();
              const { exportProductsToExcel } = await import('@/utils/exportProductsToExcel');
              exportProductsToExcel(data, 'planilha_produtos_cadastrados.xlsx');
            } else {
              alert('Erro ao buscar produtos para exportação.');
            }
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          Baixar Planilha Atual
        </button>
      </div>

      {result !== null && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 mb-8 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Processamento Concluído!</h2>
          <p className="text-emerald-600/90 dark:text-emerald-500/90 max-w-md mx-auto mb-4">
            {result.message}
          </p>
          {(result.updatedCount !== undefined || result.createdCount !== undefined) && (
            <div className="flex gap-4 my-2 text-sm">
              <div className="bg-emerald-500/20 px-4 py-2 rounded-lg font-medium text-emerald-800 dark:text-emerald-300">
                ✏️ Atualizados: <strong>{result.updatedCount || 0}</strong>
              </div>
              <div className="bg-emerald-500/20 px-4 py-2 rounded-lg font-medium text-emerald-800 dark:text-emerald-300">
                ✨ Novos Cadastros: <strong>{result.createdCount || 0}</strong>
              </div>
            </div>
          )}
          <button 
            onClick={() => setResult(null)}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            Importar nova planilha
          </button>
        </div>
      )}

      {result === null && (
        <>
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Modo de Importação da Planilha
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label 
                onClick={() => setMode('upsert')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                  mode === 'upsert'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={mode === 'upsert'} 
                    onChange={() => setMode('upsert')}
                    className="text-primary"
                  />
                  <span className="text-sm font-semibold text-foreground">Atualizar e Criar (Upsert)</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Atualiza os produtos existentes (por ID ou SKU) e cadastra os novos.
                </p>
              </label>

              <label 
                onClick={() => setMode('update')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                  mode === 'update'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={mode === 'update'} 
                    onChange={() => setMode('update')}
                    className="text-primary"
                  />
                  <span className="text-sm font-semibold text-foreground">Apenas Atualizar Cadastros</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Edita apenas produtos já cadastrados na planilha exportada.
                </p>
              </label>

              <label 
                onClick={() => setMode('create')}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                  mode === 'create'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-background hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={mode === 'create'} 
                    onChange={() => setMode('create')}
                    className="text-primary"
                  />
                  <span className="text-sm font-semibold text-foreground">Apenas Criar Novos</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Cadastra todas as linhas como novos produtos no sistema.
                </p>
              </label>
            </div>
          </div>

          <ExcelUploader onDataParsed={handleDataParsed} />

          {products.length > 0 && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                  Pré-visualização da Planilha
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Processando...
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
                        <th className="px-6 py-4">Status / ID</th>
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">Categoria ML</th>
                        <th className="px-6 py-4">Preço</th>
                        <th className="px-6 py-4">Estoque</th>
                        <th className="px-6 py-4">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.slice(0, 10).map((p, idx) => {
                        const isUpdate = Boolean(p.id || p.sku);
                        return (
                          <tr key={idx} className="bg-card hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                isUpdate 
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {isUpdate ? 'Atualização' : 'Novo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-foreground">{p.name}</td>
                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                              {p.mlCategoryId || '-'}
                            </td>
                            <td className="px-6 py-4 text-foreground font-medium">
                              R$ {Number(p.price || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{p.quantity}</td>
                            <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{p.sku || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {products.length > 10 && (
                  <div className="bg-muted/30 py-4 text-center border-t border-border text-sm text-muted-foreground font-medium">
                    Mostrando 10 de {products.length} produtos. A tabela completa será processada.
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

