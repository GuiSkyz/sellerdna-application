'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PackageSearch, Sparkles, UploadCloud, Search, Trash2, Edit, Package, ExternalLink, Tag, Shield, FileText, Layers, DollarSign, SlidersHorizontal, CheckCircle2, Download, ShoppingBag, Link2, Unlink, Plus } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ActionSummaryDialog, ActionSummaryItem } from '@/components/features/ActionSummaryDialog';
import { exportProductsToExcel } from '@/utils/exportProductsToExcel';

interface MLListing {
  id: string;
  mlItemId: string;
  title: string;
  price: number;
  availableQuantity: number;
  status: string;
  permalink?: string;
  createdAt?: string;
}

interface Product {
  id: string;
  name: string;
  productType?: string;
  brand: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  sku: string;
  customId?: string;
  ncm?: string;
  mlCategoryId?: string;
  gtin?: string;
  condition?: string;
  listingTypeId?: string;
  warrantyType?: string;
  warrantyTime?: string;
  perfumeType?: string;
  sizeMl?: string;
  gender?: string;
  expirationDate?: string;
  weight?: number;
  shippingMode?: string;
  mlListingsCount?: number;
  mlListings?: MLListing[];
  [key: string]: unknown;
}

interface BulkPublishResult {
  name?: string;
  success?: boolean;
  mlItemId?: string;
  error?: string;
  permalink?: string;
  [key: string]: unknown;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal de Gerenciamento de Anúncios ML do Produto
  const [selectedProductForML, setSelectedProductForML] = useState<Product | null>(null);
  const [allUserListings, setAllUserListings] = useState<MLListing[]>([]);
  const [linkingListingId, setLinkingListingId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paginação
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<'comercial' | 'anuncio' | 'fiscal' | 'specs'>('comercial');

  // Estados de valores - Edição em Massa
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [bulkMlCategoryId, setBulkMlCategoryId] = useState('');
  const [bulkListingTypeId, setBulkListingTypeId] = useState('gold_special');
  const [bulkCondition, setBulkCondition] = useState('new');
  const [bulkBrand, setBulkBrand] = useState('');
  const [bulkGtin, setBulkGtin] = useState('');
  const [bulkNcm, setBulkNcm] = useState('');
  const [bulkPerfumeType, setBulkPerfumeType] = useState('Eau de Parfum');
  const [bulkGender, setBulkGender] = useState('Unissex');
  const [bulkSizeMl, setBulkSizeMl] = useState('100');
  const [bulkWarrantyType, setBulkWarrantyType] = useState('Garantia do vendedor');
  const [bulkWarrantyTime, setBulkWarrantyTime] = useState('30 dias');

  // Estados de ativação (check por atributo estilo Tiny ERP)
  const [updatePriceChecked, setUpdatePriceChecked] = useState(false);
  const [updateQuantityChecked, setUpdateQuantityChecked] = useState(false);
  const [updateMlCategoryIdChecked, setUpdateMlCategoryIdChecked] = useState(false);
  const [updateListingTypeIdChecked, setUpdateListingTypeIdChecked] = useState(false);
  const [updateConditionChecked, setUpdateConditionChecked] = useState(false);
  const [updateBrandChecked, setUpdateBrandChecked] = useState(false);
  const [updateGtinChecked, setUpdateGtinChecked] = useState(false);
  const [updateNcmChecked, setUpdateNcmChecked] = useState(false);
  const [updatePerfumeTypeChecked, setUpdatePerfumeTypeChecked] = useState(false);
  const [updateGenderChecked, setUpdateGenderChecked] = useState(false);
  const [updateSizeMlChecked, setUpdateSizeMlChecked] = useState(false);
  const [updateWarrantyTypeChecked, setUpdateWarrantyTypeChecked] = useState(false);
  const [updateWarrantyTimeChecked, setUpdateWarrantyTimeChecked] = useState(false);

  const [isBulkEditing, setIsBulkEditing] = useState(false);

  const [isBulkPublishOpen, setIsBulkPublishOpen] = useState(false);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [bulkPublishProgress, setBulkPublishProgress] = useState('');
  const [bulkPublishResults, setBulkPublishResults] = useState<BulkPublishResult[] | null>(null);

  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [isClearingPhotos, setIsClearingPhotos] = useState(false);
  const [summaryDialog, setSummaryDialog] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    actionType?: 'search' | 'publish' | 'delete' | 'update' | 'general';
    items: ActionSummaryItem[];
    onConfirmReload?: () => void;
  }>({
    isOpen: false,
    title: '',
    items: [],
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let rawProducts: any[] = [];
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
          const apiRes = await authenticatedFetch(`${apiUrl}/api/products`);
          if (apiRes.ok) {
            rawProducts = await apiRes.json();
          }
        } catch {}

        if (rawProducts.length === 0) {
          const { data, error } = await supabase
            .from('products')
            .select('*, listings(id, ml_item_id, title, price, available_quantity, status, permalink, created_at)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          rawProducts = data || [];
        }

        const formatImageUrl = (url: string | undefined): string | undefined => {
          if (!url || typeof url !== 'string' || url.trim() === '') return undefined;
          const trimmed = url.trim();

          if (trimmed.startsWith('[')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                return formatImageUrl(parsed[0]);
              }
            } catch {}
          }

          const gdriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|thumbnail\?id=)([-_a-zA-Z0-9]{20,})/i);
          if (gdriveMatch && gdriveMatch[1]) {
            return `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1000`;
          }

          return trimmed;
        };

        const getPrimaryImageUrl = (imageUrl: unknown, imageUrls: unknown): string | undefined => {
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            const formatted = formatImageUrl(imageUrl);
            if (formatted) return formatted;
          }
          if (Array.isArray(imageUrls) && imageUrls.length > 0) {
            for (const item of imageUrls) {
              const formatted = formatImageUrl(item);
              if (formatted) return formatted;
            }
          }
          if (imageUrls && typeof imageUrls === 'string' && imageUrls.trim() !== '') {
            try {
              const parsed = JSON.parse(imageUrls);
              if (Array.isArray(parsed) && parsed.length > 0) {
                for (const item of parsed) {
                  const formatted = formatImageUrl(item);
                  if (formatted) return formatted;
                }
              }
            } catch {}
          }
          return undefined;
        };

        const mappedData = rawProducts.map(d => {
          const listingsArr = Array.isArray(d.listings) ? d.listings : (Array.isArray(d.mlListings) ? d.mlListings : []);
          const mlListings: MLListing[] = listingsArr.map((l: any) => ({
            id: l.id,
            mlItemId: l.ml_item_id || l.mlItemId || '',
            title: l.title || '',
            price: Number(l.price || 0),
            availableQuantity: Number(l.available_quantity || l.availableQuantity || 0),
            status: l.status || '',
            permalink: l.permalink || '',
            createdAt: l.created_at || l.createdAt || ''
          }));
          return {
            id: d.id,
            name: d.name || '',
            productType: d.product_type || d.productType || 'Perfume',
            brand: d.brand || '',
            price: Number(d.price || 0),
            quantity: Number(d.quantity || 0),
            imageUrl: getPrimaryImageUrl(d.image_url || d.imageUrl, d.image_urls || d.imageUrls) || '',
            sku: d.sku || '',
            customId: d.custom_id || d.customId || '',
            ncm: d.ncm || '',
            mlCategoryId: d.ml_category_id || d.mlCategoryId || '',
            gtin: d.gtin || '',
            condition: d.condition || 'new',
            listingTypeId: d.listing_type_id || d.listingTypeId || 'gold_special',
            warrantyType: d.warranty_type || d.warrantyType || 'Garantia do vendedor',
            warrantyTime: d.warranty_time || d.warrantyTime || '30 dias',
            perfumeType: d.perfume_type || d.perfumeType || '',
            sizeMl: d.size_ml || d.sizeMl || '',
            gender: d.gender || '',
            expirationDate: d.expiration_date || d.expirationDate || '',
            weight: Number(d.weight || 0),
            shippingMode: d.shipping_mode || d.shippingMode || '',
            mlListingsCount: typeof d.mlListingsCount === 'number' && d.mlListingsCount > 0 ? d.mlListingsCount : mlListings.length,
            mlListings
          };
        });
        
        setProducts(mappedData);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const openMLListingsModal = async (product: Product) => {
    setSelectedProductForML(product);
    setLinkingListingId('');
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/listings`);
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data.listings || []);
        const mappedListings: MLListing[] = arr.map((l: any) => ({
          id: l.id,
          mlItemId: l.ml_item_id || l.mlItemId || '',
          title: l.title || '',
          price: Number(l.price || 0),
          availableQuantity: Number(l.available_quantity || l.availableQuantity || 0),
          status: l.status || '',
          permalink: l.permalink || '',
          createdAt: l.created_at || l.createdAt || ''
        }));
        setAllUserListings(mappedListings);
      }
    } catch (e) {
      console.error('Falha ao buscar anúncios do usuário', e);
    }
  };

  const handleLinkListing = async () => {
    if (!selectedProductForML || !linkingListingId) return;
    setIsLinking(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/listings/${linkingListingId}/link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductForML.id })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao vincular anúncio');
      }
      const linkedListing = allUserListings.find(l => l.id === linkingListingId);
      if (linkedListing) {
        const updatedListings = [...(selectedProductForML.mlListings || []), linkedListing];
        const updatedProduct = {
          ...selectedProductForML,
          mlListings: updatedListings,
          mlListingsCount: updatedListings.length
        };
        setSelectedProductForML(updatedProduct);
        setProducts(prev => prev.map(p => p.id === selectedProductForML.id ? updatedProduct : p));
        setLinkingListingId('');
      }
    } catch (e: any) {
      alert(e.message || 'Erro ao vincular anúncio');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkListing = async (listingId: string) => {
    if (!selectedProductForML) return;
    if (!confirm('Deseja realmente desvincular este anúncio do produto? O anúncio não será excluído do Mercado Livre, apenas desconectado do produto no sistema.')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/listings/${listingId}/link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: null })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao desvincular anúncio');
      }
      const updatedListings = (selectedProductForML.mlListings || []).filter(l => l.id !== listingId);
      const updatedProduct = {
        ...selectedProductForML,
        mlListings: updatedListings,
        mlListingsCount: updatedListings.length
      };
      setSelectedProductForML(updatedProduct);
      setProducts(prev => prev.map(p => p.id === selectedProductForML.id ? updatedProduct : p));
    } catch (e: any) {
      alert(e.message || 'Erro ao desvincular anúncio');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSelectAll = () => {
    const visibleIds = paginatedProducts.map(p => p.id);
    const allVisibleSelected = visibleIds.every(id => selectedIds.includes(id));
    
    if (allVisibleSelected) {
      setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)));
    } else {
      const newSelections = visibleIds.filter(id => !selectedIds.includes(id));
      setSelectedIds([...selectedIds, ...newSelections]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportExcel = () => {
    const productsToExport = selectedIds.length > 0
      ? products.filter(p => selectedIds.includes(p.id))
      : products;

    if (productsToExport.length === 0) {
      alert('Nenhum produto disponível para exportar.');
      return;
    }

    exportProductsToExcel(
      productsToExport,
      selectedIds.length > 0
        ? `produtos_selecionados_${selectedIds.length}.xlsx`
        : 'planilha_produtos_cadastrados.xlsx'
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      setProducts(products.filter(p => p.id !== id));
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } catch (err) {
      console.error(err);
      setSummaryDialog({
        isOpen: true,
        title: 'Erro na Exclusão',
        subtitle: 'Não foi possível excluir o produto.',
        actionType: 'delete',
        items: [{
          id,
          name: products.find(p => p.id === id)?.name || `Produto ID ${id}`,
          status: 'error',
          message: err instanceof Error ? err.message : 'Falha ao excluir o produto.'
        }]
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} produtos?`)) return;
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/products/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (!res.ok) throw new Error('Erro ao excluir em massa');
      
      const removedIds = [...selectedIds];
      setProducts(products.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setSummaryDialog({
        isOpen: true,
        title: 'Resultado: Exclusão em Massa',
        subtitle: 'Exclusão de produtos finalizada com sucesso.',
        actionType: 'delete',
        items: removedIds.map(id => ({
          id,
          name: products.find(p => p.id === id)?.name || `Produto ID ${id}`,
          status: 'success',
          message: 'Produto excluído com sucesso.'
        }))
      });
    } catch (err) {
      console.error(err);
      setSummaryDialog({
        isOpen: true,
        title: 'Erro na Exclusão em Massa',
        subtitle: 'Falha ao excluir os produtos selecionados.',
        actionType: 'delete',
        items: selectedIds.map(id => ({
          id,
          name: products.find(p => p.id === id)?.name || `Produto ID ${id}`,
          status: 'error',
          message: err instanceof Error ? err.message : 'Falha ao excluir os produtos selecionados.'
        }))
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeBulkCount = [
    updatePriceChecked,
    updateQuantityChecked,
    updateMlCategoryIdChecked,
    updateListingTypeIdChecked,
    updateConditionChecked,
    updateBrandChecked,
    updateGtinChecked,
    updateNcmChecked,
    updatePerfumeTypeChecked,
    updateGenderChecked,
    updateSizeMlChecked,
    updateWarrantyTypeChecked,
    updateWarrantyTimeChecked
  ].filter(Boolean).length;

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeBulkCount === 0) {
      alert('Selecione pelo menos um atributo para atualizar em massa.');
      return;
    }
    
    setIsBulkEditing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const payload: Record<string, unknown> = { ids: selectedIds };
      if (updatePriceChecked) payload.price = Number(bulkPrice);
      if (updateQuantityChecked) payload.quantity = Number(bulkQuantity);
      if (updateMlCategoryIdChecked) {
        let cleanCat = bulkMlCategoryId.trim().toUpperCase();
        const mlMatch = cleanCat.match(/(ML[A-Z])-?(\d+)/);
        if (mlMatch) {
          cleanCat = `${mlMatch[1]}${mlMatch[2]}`;
        } else if (/^\d+$/.test(cleanCat)) {
          cleanCat = `MLB${cleanCat}`;
        }
        payload.mlCategoryId = cleanCat;
      }
      if (updateListingTypeIdChecked) payload.listingTypeId = bulkListingTypeId;
      if (updateConditionChecked) payload.condition = bulkCondition;
      if (updateBrandChecked) payload.brand = bulkBrand;
      if (updateGtinChecked) payload.gtin = bulkGtin;
      if (updateNcmChecked) payload.ncm = bulkNcm;
      if (updatePerfumeTypeChecked) payload.perfumeType = bulkPerfumeType;
      if (updateGenderChecked) payload.gender = bulkGender;
      if (updateSizeMlChecked) payload.sizeMl = bulkSizeMl;
      if (updateWarrantyTypeChecked) payload.warrantyType = bulkWarrantyType;
      if (updateWarrantyTimeChecked) payload.warrantyTime = bulkWarrantyTime;

      const res = await authenticatedFetch(`${apiUrl}/api/products/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Erro ao atualizar em massa');
      }
      
      setIsBulkEditOpen(false);
      setSummaryDialog({
        isOpen: true,
        title: 'Resultado: Atualização em Massa',
        subtitle: 'Atributos atualizados com sucesso para os produtos selecionados.',
        actionType: 'update',
        items: selectedIds.map(id => ({
          id,
          name: products.find(p => p.id === id)?.name || `Produto ID ${id}`,
          status: 'success',
          message: 'Atributos atualizados com sucesso.'
        })),
        onConfirmReload: () => window.location.reload(),
      });
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar os produtos selecionados.';
      setSummaryDialog({
        isOpen: true,
        title: 'Erro na Atualização em Massa',
        subtitle: 'Falha ao atualizar atributos.',
        actionType: 'update',
        items: selectedIds.map(id => ({
          id,
          name: products.find(p => p.id === id)?.name || `Produto ID ${id}`,
          status: 'error',
          message: msg,
        })),
      });
    } finally {
      setIsBulkEditing(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedIds.length > 10) {
      setSummaryDialog({
        isOpen: true,
        title: 'Atenção: Limite por Lote',
        subtitle: 'Para evitar instabilidade na IA e nas APIs do Mercado Livre.',
        actionType: 'publish',
        items: [{
          id: 'AVISO',
          name: 'Limite de 10 produtos',
          status: 'warning',
          message: 'A limitação atual de lote de publicação com IA é de no máximo 10 produtos por vez para evitar instabilidades.'
        }]
      });
      return;
    }

    setIsBulkPublishing(true);
    setBulkPublishProgress('IA gerando títulos e descrições e publicando no Mercado Livre...');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/listings/bulk-publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedIds })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na publicação em lote');
      
      const results: ActionSummaryItem[] = (data.results || []).map((r: any, idx: number) => ({
        id: r.mlItemId || selectedIds[idx] || idx + 1,
        name: r.name || `Produto ID ${selectedIds[idx] || idx + 1}`,
        status: r.success ? 'success' : 'error',
        message: r.success ? 'Anúncio publicado com sucesso no Mercado Livre!' : (r.error || 'Falha na publicação'),
        link: r.permalink,
        linkLabel: 'Ver Anúncio',
      }));

      setSummaryDialog({
        isOpen: true,
        title: 'Resultado: Publicação com IA em Lote',
        subtitle: 'Resumo das publicações enviadas ao Mercado Livre.',
        actionType: 'publish',
        items: results,
        onConfirmReload: () => window.location.reload(),
      });
    } catch (err: unknown) {
      console.error(err);
      setSummaryDialog({
        isOpen: true,
        title: 'Erro na Publicação em Lote',
        subtitle: 'Falha ao processar publicações.',
        actionType: 'publish',
        items: selectedIds.map(id => ({
          id,
          name: products.find(p => p.id === id)?.name || `Produto ID ${id}`,
          status: 'error',
          message: err instanceof Error ? err.message : 'Falha na publicação em lote.',
        }))
      });
    } finally {
      setIsBulkPublishing(false);
    }
  };

  const handleBulkFetchDriveImages = async () => {
    if (!confirm(`Sincronizar fotos para ${selectedIds.length} produtos via Google Drive?`)) return;
    setIsFetchingDrive(true);

    const results: ActionSummaryItem[] = [];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

    for (const id of selectedIds) {
      const product = products.find(p => p.id === id);
      const productName = product?.name || `Produto ID ${id}`;

      try {
        const res = await authenticatedFetch(`${apiUrl}/api/gdrive/fetch-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id })
        });
        const data = await res.json();
        if (!res.ok) {
          results.push({
            id,
            name: productName,
            status: 'error',
            message: data.error || `Não encontrado pasta do produto "${productName}" no Google Drive.`
          });
        } else {
          results.push({
            id,
            name: productName,
            status: 'success',
            message: `${data.imageUrls?.length || 0} foto(s) importada(s) com sucesso da pasta no Google Drive.`
          });
        }
      } catch (e: unknown) {
        results.push({
          id,
          name: productName,
          status: 'error',
          message: e instanceof Error ? e.message : `Não encontrado pasta do produto "${productName}" no Google Drive.`
        });
      }
    }

    setIsFetchingDrive(false);
    setSummaryDialog({
      isOpen: true,
      title: 'Resultado: Busca de Fotos no Google Drive',
      subtitle: 'Relatório de verificação de pastas e importação de imagens para cada produto selecionado.',
      actionType: 'search',
      items: results,
      onConfirmReload: () => window.location.reload(),
    });
  };

  const handleBulkClearImages = async () => {
    if (!confirm(`Tem certeza que deseja remover as fotos de ${selectedIds.length} produtos?`)) return;
    setIsClearingPhotos(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/products/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, clearImage: true })
      });
      if (!res.ok) throw new Error('Erro ao limpar fotos');

      setSummaryDialog({
        isOpen: true,
        title: 'Resultado: Limpeza de Fotos',
        subtitle: 'Remoção de imagens dos produtos selecionados.',
        actionType: 'delete',
        items: selectedIds.map(id => ({
          id,
          name: products.find(p => p.id === id)?.name || `Produto ID ${id}`,
          status: 'success',
          message: 'Fotos removidas com sucesso.'
        })),
        onConfirmReload: () => window.location.reload(),
      });
    } catch (e: unknown) {
      setSummaryDialog({
        isOpen: true,
        title: 'Erro na Limpeza de Fotos',
        subtitle: 'Falha ao remover fotos dos produtos.',
        actionType: 'delete',
        items: selectedIds.map(id => ({
          id,
          name: products.find(p => p.id === id)?.name || `Produto ID ${id}`,
          status: 'error',
          message: e instanceof Error ? e.message : 'Erro ao remover fotos'
        }))
      });
    } finally {
      setIsClearingPhotos(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Meus Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os produtos importados da sua planilha.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.length > 0 && (
            <>
              <button 
                onClick={() => setIsBulkEditOpen(true)}
                className="bg-secondary hover:bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors border border-border flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar em Massa
              </button>
              <button 
                onClick={handleBulkPublish}
                disabled={isBulkPublishing}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isBulkPublishing ? 'Publicando...' : `Publicar com IA (${selectedIds.length})`}
              </button>
              <button 
                onClick={handleBulkFetchDriveImages}
                disabled={isFetchingDrive}
                className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-md text-sm font-medium transition-colors border border-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                {isFetchingDrive ? 'Buscando Fotos...' : 'Buscar Fotos (Drive)'}
              </button>
              <button 
                onClick={handleBulkClearImages}
                disabled={isClearingPhotos}
                className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-orange-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isClearingPhotos ? 'Limpando Fotos...' : 'Limpar Fotos'}
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2 rounded-md text-sm font-medium transition-colors border border-destructive/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Excluindo...' : `Excluir (${selectedIds.length})`}
              </button>
            </>
          )}
          <Link 
            href="/products/create"
            className="bg-card hover:bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors border border-border flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Novo Produto
          </Link>
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            {selectedIds.length > 0 ? `Exportar (${selectedIds.length})` : 'Exportar Planilha'}
          </button>
          <Link 
            href="/products/import"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Importar
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou SKU..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {filteredProducts.length} produtos
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                    onChange={toggleSelectAll}
                    className="rounded border-border bg-background text-primary focus:ring-primary cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="px-6 py-4 whitespace-nowrap">CUST ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Produto</th>
                <th className="px-6 py-4 whitespace-nowrap">SKU</th>
                <th className="px-6 py-4 whitespace-nowrap">Preço</th>
                <th className="px-6 py-4 whitespace-nowrap">Estoque</th>
                <th className="px-6 py-4 whitespace-nowrap">NCM</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Anúncios ML</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-muted/30 transition-colors group ${selectedIds.includes(product.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-border bg-background text-primary focus:ring-primary cursor-pointer h-4 w-4"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                    {product.customId || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 min-w-[250px]">
                      <div className="h-10 w-10 flex-shrink-0 bg-muted rounded-md border border-border flex items-center justify-center overflow-hidden relative">
                        {product.imageUrl ? (
                          <>
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-full w-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                            <div className="fallback-icon hidden h-full w-full items-center justify-center">
                              <PackageSearch className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          </>
                        ) : (
                          <PackageSearch className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{product.name}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{product.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium border border-border">
                      {product.sku || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${product.quantity > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                      {product.quantity} un
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {product.ncm || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      type="button"
                      onClick={() => openMLListingsModal(product)}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-sm ${
                        (product.mlListingsCount || 0) > 0
                          ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 cursor-pointer scale-100 hover:scale-105'
                          : 'bg-secondary text-secondary-foreground border border-border hover:bg-muted cursor-pointer'
                      }`}
                      title="Clique para gerenciar os anúncios do Mercado Livre para este produto"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {product.mlListingsCount || 0}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/products/${product.id}/generate-ad`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-semibold transition-colors border border-primary/20"
                        title="Gerar Anúncio com IA"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        IA
                      </Link>
                      <Link 
                        href={`/products/${product.id}/edit`}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        title="Editar Produto"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <PackageSearch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-foreground font-medium">Nenhum produto encontrado.</p>
                    <p className="text-sm text-muted-foreground mt-1">Faça uma importação para começar a gerenciar seu catálogo.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
            <span className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> de <span className="font-medium text-foreground">{filteredProducts.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edição em Massa (Inspirado no Tiny ERP) */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Edição em Massa de Produtos</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    Estilo Tiny ERP
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedIds.length} {selectedIds.length === 1 ? 'produto selecionado' : 'produtos selecionados'}. Marque apenas os atributos que deseja alterar para preparar o anúncio.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground border border-border flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  {activeBulkCount} {activeBulkCount === 1 ? 'campo selecionado' : 'campos selecionados'}
                </span>
              </div>
            </div>

            {/* Navegação por Abas (Estilo ERP) */}
            <div className="flex border-b border-border bg-muted/40 px-6 overflow-x-auto gap-1">
              <button
                type="button"
                onClick={() => setBulkTab('comercial')}
                className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  bulkTab === 'comercial'
                    ? 'border-primary text-primary bg-background/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Comercial & Estoque
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('anuncio')}
                className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  bulkTab === 'anuncio'
                    ? 'border-primary text-primary bg-background/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Tag className="w-4 h-4" />
                Anúncio Mercado Livre
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('fiscal')}
                className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  bulkTab === 'fiscal'
                    ? 'border-primary text-primary bg-background/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-4 h-4" />
                Identificação & Fiscal
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('specs')}
                className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  bulkTab === 'specs'
                    ? 'border-primary text-primary bg-background/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Especificações & Garantia
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <form onSubmit={handleBulkUpdate} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* ABA 1: COMERCIAL & ESTOQUE */}
                {bulkTab === 'comercial' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Preço de Venda */}
                    <div className={`p-4 border rounded-xl transition-all ${updatePriceChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updatePriceChecked}
                            onChange={(e) => setUpdatePriceChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Preço de Venda (R$)</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updatePriceChecked ? 'Será aplicado a todos' : 'Mantém preço original'}</span>
                      </label>
                      {updatePriceChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            placeholder="Ex: 149.90"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>

                    {/* Quantidade em Estoque */}
                    <div className={`p-4 border rounded-xl transition-all ${updateQuantityChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updateQuantityChecked}
                            onChange={(e) => setUpdateQuantityChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Quantidade em Estoque</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updateQuantityChecked ? 'Será aplicado a todos' : 'Mantém estoque original'}</span>
                      </label>
                      {updateQuantityChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <input
                            type="number"
                            min="0"
                            required
                            value={bulkQuantity}
                            onChange={(e) => setBulkQuantity(e.target.value)}
                            placeholder="Ex: 25"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ABA 2: ANÚNCIO MERCADO LIVRE */}
                {bulkTab === 'anuncio' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Categoria ML */}
                    <div className={`p-4 border rounded-xl transition-all ${updateMlCategoryIdChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updateMlCategoryIdChecked}
                            onChange={(e) => setUpdateMlCategoryIdChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Categoria Mercado Livre (ID MLB)</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updateMlCategoryIdChecked ? 'Vinculação automática' : 'Mantém categoria atual'}</span>
                      </label>
                      {updateMlCategoryIdChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <input
                            type="text"
                            required
                            value={bulkMlCategoryId}
                            onChange={(e) => setBulkMlCategoryId(e.target.value)}
                            placeholder="Ex: MLB1271 (Perfumes) ou MLB1234"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Essa categoria será usada em todos os produtos selecionados durante a publicação no Mercado Livre.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Tipo de Anúncio ML */}
                    <div className={`p-4 border rounded-xl transition-all ${updateListingTypeIdChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updateListingTypeIdChecked}
                            onChange={(e) => setUpdateListingTypeIdChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Tipo de Anúncio ML</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updateListingTypeIdChecked ? 'Clássico ou Premium' : 'Mantém tipo padrão'}</span>
                      </label>
                      {updateListingTypeIdChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <select
                            value={bulkListingTypeId}
                            onChange={(e) => setBulkListingTypeId(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="gold_special">Clássico (gold_special — Exposição alta)</option>
                            <option value="gold_pro">Premium (gold_pro — Exposição máxima / Parcelamento sem juros)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Condição */}
                    <div className={`p-4 border rounded-xl transition-all ${updateConditionChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updateConditionChecked}
                            onChange={(e) => setUpdateConditionChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Condição do Produto</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updateConditionChecked ? 'Novo ou Usado' : 'Mantém condição original'}</span>
                      </label>
                      {updateConditionChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <select
                            value={bulkCondition}
                            onChange={(e) => setBulkCondition(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="new">Novo (New)</option>
                            <option value="used">Usado (Used)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ABA 3: FISCAL & IDENTIFICAÇÃO */}
                {bulkTab === 'fiscal' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Marca */}
                    <div className={`p-4 border rounded-xl transition-all ${updateBrandChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updateBrandChecked}
                            onChange={(e) => setUpdateBrandChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Marca do Produto (Brand)</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updateBrandChecked ? 'Será aplicado a todos' : 'Mantém marca original'}</span>
                      </label>
                      {updateBrandChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <input
                            type="text"
                            required
                            value={bulkBrand}
                            onChange={(e) => setBulkBrand(e.target.value)}
                            placeholder="Ex: Lattafa, Dior, Chanel, Carolina Herrera"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>

                    {/* GTIN / EAN */}
                    <div className={`p-4 border rounded-xl transition-all ${updateGtinChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updateGtinChecked}
                            onChange={(e) => setUpdateGtinChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Código de Barras (GTIN / EAN)</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updateGtinChecked ? 'Código universal' : 'Mantém GTIN original'}</span>
                      </label>
                      {updateGtinChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <input
                            type="text"
                            required
                            value={bulkGtin}
                            onChange={(e) => setBulkGtin(e.target.value)}
                            placeholder="Ex: 6291108732049 ou SEM GTIN"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>

                    {/* NCM */}
                    <div className={`p-4 border rounded-xl transition-all ${updateNcmChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updateNcmChecked}
                            onChange={(e) => setUpdateNcmChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Classificação Fiscal (NCM)</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updateNcmChecked ? 'NCM fiscal' : 'Mantém NCM original'}</span>
                      </label>
                      {updateNcmChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <input
                            type="text"
                            required
                            value={bulkNcm}
                            onChange={(e) => setBulkNcm(e.target.value)}
                            placeholder="Ex: 3303.00.10 (Perfumes e águas-de-colônia)"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ABA 4: ESPECIFICAÇÕES & GARANTIA */}
                {bulkTab === 'specs' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tipo de Perfume */}
                      <div className={`p-4 border rounded-xl transition-all ${updatePerfumeTypeChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={updatePerfumeTypeChecked}
                            onChange={(e) => setUpdatePerfumeTypeChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Tipo de Perfume</span>
                        </label>
                        {updatePerfumeTypeChecked && (
                          <select
                            value={bulkPerfumeType}
                            onChange={(e) => setBulkPerfumeType(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="Eau de Parfum">Eau de Parfum (EDP)</option>
                            <option value="Eau de Toilette">Eau de Toilette (EDT)</option>
                            <option value="Parfum">Parfum / Extrait de Parfum</option>
                            <option value="Eau de Cologne">Eau de Cologne (EDC)</option>
                            <option value="Body Splash">Body Splash / Body Mist</option>
                          </select>
                        )}
                      </div>

                      {/* Gênero */}
                      <div className={`p-4 border rounded-xl transition-all ${updateGenderChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={updateGenderChecked}
                            onChange={(e) => setUpdateGenderChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Gênero</span>
                        </label>
                        {updateGenderChecked && (
                          <select
                            value={bulkGender}
                            onChange={(e) => setBulkGender(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="Unissex">Unissex</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Volume (ml) */}
                    <div className={`p-4 border rounded-xl transition-all ${updateSizeMlChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={updateSizeMlChecked}
                            onChange={(e) => setUpdateSizeMlChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Volume da Embalagem (ml)</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{updateSizeMlChecked ? 'Ex: 100ml' : 'Mantém volume original'}</span>
                      </label>
                      {updateSizeMlChecked && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <input
                            type="number"
                            min="1"
                            required
                            value={bulkSizeMl}
                            onChange={(e) => setBulkSizeMl(e.target.value)}
                            placeholder="Ex: 100"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tipo de Garantia */}
                      <div className={`p-4 border rounded-xl transition-all ${updateWarrantyTypeChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={updateWarrantyTypeChecked}
                            onChange={(e) => setUpdateWarrantyTypeChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Tipo de Garantia</span>
                        </label>
                        {updateWarrantyTypeChecked && (
                          <select
                            value={bulkWarrantyType}
                            onChange={(e) => setBulkWarrantyType(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="Garantia do vendedor">Garantia do vendedor</option>
                            <option value="Garantia de fábrica">Garantia de fábrica</option>
                            <option value="Sem garantia">Sem garantia</option>
                          </select>
                        )}
                      </div>

                      {/* Tempo de Garantia */}
                      <div className={`p-4 border rounded-xl transition-all ${updateWarrantyTimeChecked ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/10'}`}>
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={updateWarrantyTimeChecked}
                            onChange={(e) => setUpdateWarrantyTimeChecked(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-foreground">Tempo de Garantia</span>
                        </label>
                        {updateWarrantyTimeChecked && (
                          <input
                            type="text"
                            required
                            value={bulkWarrantyTime}
                            onChange={(e) => setBulkWarrantyTime(e.target.value)}
                            placeholder="Ex: 30 dias / 90 dias"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Ações */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Dica: Atributos inalterados preservam os dados individuais de cada produto.
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsBulkEditOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isBulkEditing || activeBulkCount === 0}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isBulkEditing ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></span>
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {isBulkEditing
                      ? 'Salvando em Massa...'
                      : `Aplicar Alterações (${activeBulkCount} ${activeBulkCount === 1 ? 'campo' : 'campos'})`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Anúncios ML do Produto */}
      {selectedProductForML && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-500" />
                  Anúncios no Mercado Livre
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Produto: <span className="font-medium text-foreground">{selectedProductForML.name}</span> (SKU: {selectedProductForML.sku || 'N/A'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForML(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
                  <span>Anúncios Conectados ({selectedProductForML.mlListings?.length || 0})</span>
                </h4>

                {(!selectedProductForML.mlListings || selectedProductForML.mlListings.length === 0) ? (
                  <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border p-6">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">Nenhum anúncio do Mercado Livre conectado a este produto.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você pode vincular um anúncio existente abaixo ou publicar este produto diretamente no Mercado Livre.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProductForML.mlListings.map(listing => (
                      <div
                        key={listing.id}
                        className="p-4 bg-background border border-border rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-primary/40"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded">
                              {listing.mlItemId}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              listing.status === 'active' || listing.status === 'Ativo'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : listing.status === 'paused' || listing.status === 'Pausado'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}>
                              {listing.status === 'active' ? 'Ativo' : listing.status === 'paused' ? 'Pausado' : listing.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate" title={listing.title}>
                            {listing.title}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Preço: <strong className="text-foreground">R$ {Number(listing.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                            <span>Estoque: <strong className="text-foreground">{listing.availableQuantity} un</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {listing.permalink && (
                            <a
                              href={listing.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors border border-primary/20"
                              title="Ver anúncio no Mercado Livre"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Ver no ML
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUnlinkListing(listing.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                            title="Desconectar este anúncio do produto (não deleta do ML)"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            Desconectar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vincular manualmente outro anúncio */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-primary" />
                  Conectar Anúncio Existente
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Caso o anúncio já exista no seu Mercado Livre mas não esteja vinculado, selecione-o abaixo:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={linkingListingId}
                    onChange={(e) => setLinkingListingId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Selecione um anúncio para vincular --</option>
                    {allUserListings
                      .filter(l => !(selectedProductForML.mlListings || []).some(m => m.id === l.id))
                      .map(l => (
                        <option key={l.id} value={l.id}>
                          [{l.mlItemId}] {l.title} (R$ {Number(l.price || 0).toFixed(2)})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleLinkListing}
                    disabled={!linkingListingId || isLinking}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {isLinking ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></span>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Conectar ao Produto
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProductForML(null)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionSummaryDialog
        isOpen={summaryDialog.isOpen}
        onClose={() => setSummaryDialog(prev => ({ ...prev, isOpen: false }))}
        title={summaryDialog.title}
        subtitle={summaryDialog.subtitle}
        actionType={summaryDialog.actionType}
        items={summaryDialog.items}
        onConfirmReload={summaryDialog.onConfirmReload}
      />
    </div>
  );
}
