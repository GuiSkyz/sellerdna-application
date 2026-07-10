import React, { useState } from 'react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { Loader2, Search, AlertCircle } from 'lucide-react';

interface MLAttribute {
  id: string;
  name: string;
  value_type?: string;
  tags?: {
    required?: boolean;
    catalog_required?: boolean;
  };
  values?: { id: string; name: string }[];
  values_list?: Array<{ id: string; name: string }>;
}

interface MLDynamicAttributesProps {
  title: string;
  categoryId: string;
  categoryName: string;
  attributesData: Record<string, unknown>;
  onCategorySelected: (categoryId: string, categoryName: string) => void;
  onAttributeChange: (key: string, value: string) => void;
}

export function MLDynamicAttributes({
  title,
  categoryId,
  categoryName,
  attributesData,
  onCategorySelected,
  onAttributeChange
}: MLDynamicAttributesProps) {
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [error, setError] = useState('');
  const [attributesList, setAttributesList] = useState<MLAttribute[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const fetchCategory = async () => {
    if (!title) {
      setError('Preencha o título (Nome do Produto) antes de buscar a categoria.');
      return;
    }
    
    setLoadingCategory(true);
    setError('');
    
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/ml/categories/predict?title=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error('Não foi possível prever a categoria');
      
      const data = await res.json();
      if (data && data.id) {
        onCategorySelected(data.id, data.name || data.id);
        await loadAttributes(data.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao prever categoria');
    } finally {
      setLoadingCategory(false);
    }
  };

  const loadAttributes = React.useCallback(async (id: string) => {
    setLoadingAttributes(true);
    try {
      const res = await authenticatedFetch(`${apiUrl}/api/ml/categories/${id}/attributes`);
      if (!res.ok) throw new Error('Erro ao carregar atributos da categoria');
      
      const data: MLAttribute[] = await res.json();
      const filtered = data.filter((attr: MLAttribute) => {
        const isRequired = attr.tags?.required || attr.tags?.catalog_required;
        const isAlreadyHandled = ['GTIN', 'WARRANTY_TYPE', 'WARRANTY_TIME', 'ITEM_CONDITION'].includes(attr.id);
        
        return isRequired && !isAlreadyHandled;
      });
      
      filtered.sort((a: MLAttribute, b: MLAttribute) => a.name.localeCompare(b.name));

      setAttributesList(filtered);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar atributos');
    } finally {
      setLoadingAttributes(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    if (categoryId && attributesList.length === 0) {
      loadAttributes(categoryId);
    }
  }, [categoryId, attributesList.length, loadAttributes]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground">Categoria no Mercado Livre</label>
          <div className="flex gap-2">
            <input 
              readOnly
              value={categoryName || categoryId || 'Nenhuma categoria selecionada'}
              className="flex-1 px-4 py-2 bg-muted border border-border rounded-md text-sm text-muted-foreground"
            />
            <button
              type="button"
              onClick={fetchCategory}
              disabled={loadingCategory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loadingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Prever Categoria
            </button>
          </div>
          <p className="text-xs text-muted-foreground">A categoria determina quais campos extras são obrigatórios no ML.</p>
        </div>
      </div>

      {loadingAttributes ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando atributos da categoria...
        </div>
      ) : attributesList.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground mb-4 border-b border-border pb-2">Atributos da Categoria ({categoryName || categoryId})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attributesList.map(attr => {
              const isRequired = attr.tags?.required || attr.tags?.catalog_required;
              
              return (
                <div key={attr.id} className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    {attr.name} {isRequired && <span className="text-red-500">*</span>}
                  </label>
                  
                  {attr.values_list && attr.values_list.length > 0 ? (
                    <select
                      value={String(attributesData[attr.id] || '')}
                      onChange={(e) => onAttributeChange(attr.id, e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-foreground"
                    >
                      <option value="">Selecione...</option>
                      {attr.values_list.map(v => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  ) : attr.value_type === 'boolean' ? (
                    <select
                      value={String(attributesData[attr.id] || '')}
                      onChange={(e) => onAttributeChange(attr.id, e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-foreground"
                    >
                      <option value="">Selecione...</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  ) : (
                    <input
                      type={attr.value_type === 'number_unit' ? 'text' : 'text'}
                      value={String(attributesData[attr.id] || '')}
                      onChange={(e) => onAttributeChange(attr.id, e.target.value)}
                      placeholder={`Ex: ${attr.name}`}
                      className="w-full px-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-foreground"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : categoryId && !loadingAttributes && (
         <div className="text-sm text-muted-foreground py-4">
           Nenhum atributo adicional encontrado para esta categoria.
         </div>
      )}
    </div>
  );
}
