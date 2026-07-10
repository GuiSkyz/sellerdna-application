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
              const options = attr.values || attr.values_list || [];
              const currentValue = String(attributesData[attr.id] || '');
              
              return (
                <div key={attr.id} className="space-y-2 p-3.5 rounded-lg border border-border/60 bg-background/50">
                  <label className="text-sm font-medium text-foreground flex items-center justify-between">
                    <span>
                      {attr.name} {isRequired && <span className="text-red-500">*</span>}
                    </span>
                    {isRequired && (
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                        Obrigatório ML
                      </span>
                    )}
                  </label>
                  
                  {options.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {options.slice(0, 8).map(v => {
                          const isSelected = currentValue.toLowerCase() === v.name.toLowerCase();
                          return (
                            <button
                              key={v.id || v.name}
                              type="button"
                              onClick={() => onAttributeChange(attr.id, isSelected ? '' : v.name)}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              {v.name}
                            </button>
                          );
                        })}
                      </div>
                      {options.length > 8 && (
                        <select
                          value={currentValue}
                          onChange={(e) => onAttributeChange(attr.id, e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Outra opção ({options.length} disponíveis)...</option>
                          {options.map(v => (
                            <option key={v.id || v.name} value={v.name}>{v.name}</option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => onAttributeChange(attr.id, e.target.value)}
                        placeholder={`Ou digite sua opção personalizada...`}
                        className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  ) : attr.value_type === 'boolean' ? (
                    <div className="flex gap-2">
                      {['Sim', 'Não'].map(opt => {
                        const isSelected = currentValue === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => onAttributeChange(attr.id, isSelected ? '' : opt)}
                            className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-card text-muted-foreground border-border hover:bg-muted'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (attr.value_type === 'number_unit' || attr.id === 'UNIT_VOLUME' || attr.name.toLowerCase().includes('volume')) ? (
                    (() => {
                      const units = attr.name.toLowerCase().includes('peso') ? ['g', 'kg', 'mg'] :
                                    attr.name.toLowerCase().includes('comprimento') || attr.name.toLowerCase().includes('altura') ? ['cm', 'mm', 'm'] :
                                    ['mL', 'L', 'fl oz'];
                      const match = currentValue.match(/^([\d,.]+)\s*([a-zA-Z]+)?$/);
                      const numVal = match ? match[1] : currentValue.replace(/[a-zA-Z\s]/g, '');
                      const unitVal = match && match[2] ? match[2] : 'mL';

                      return (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={numVal}
                            onChange={(e) => {
                              const v = e.target.value;
                              onAttributeChange(attr.id, v ? `${v} ${unitVal}` : '');
                            }}
                            placeholder="Ex: 100"
                            className="w-1/2 px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          <div className="flex gap-1 flex-1">
                            {units.map(u => {
                              const isSel = unitVal.toLowerCase() === u.toLowerCase();
                              return (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => onAttributeChange(attr.id, numVal ? `${numVal} ${u}` : `0 ${u}`)}
                                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all flex-1 ${
                                    isSel
                                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                                  }`}
                                >
                                  {u}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => onAttributeChange(attr.id, e.target.value)}
                      placeholder={`Ex: ${attr.name}`}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
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
