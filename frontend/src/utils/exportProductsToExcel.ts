import * as XLSX from 'xlsx';

export interface ExportableProduct {
  id?: string;
  customId?: string;
  name?: string;
  sku?: string;
  mlCategoryId?: string;
  price?: number;
  quantity?: number;
  brand?: string;
  gtin?: string;
  ncm?: string;
  productType?: string;
  perfumeType?: string;
  sizeMl?: string;
  gender?: string;
  condition?: string;
  listingTypeId?: string;
  warrantyType?: string;
  warrantyTime?: string;
  expirationDate?: string;
  weight?: number;
  imageUrl?: string;
  [key: string]: unknown;
}

export function exportProductsToExcel(products: ExportableProduct[], filename = 'produtos_cadastrados.xlsx') {
  const rows = products.map((p) => ({
    'ID do Sistema': p.id || '',
    'ID Personalizado': p.customId || '',
    'Nome': p.name || '',
    'SKU': p.sku || '',
    'Categoria ML': p.mlCategoryId || '',
    'Preço (R$)': Number(p.price || 0),
    'Estoque': Number(p.quantity || 0),
    'Marca': p.brand || '',
    'GTIN/EAN': p.gtin || '',
    'NCM': p.ncm || '',
    'Tipo de Produto': p.productType || 'Perfume',
    'Tipo de Perfume': p.perfumeType || '',
    'Tamanho (ML)': p.sizeMl || '',
    'Gênero': p.gender || '',
    'Condição': p.condition || 'new',
    'Tipo de Anúncio ML': p.listingTypeId || 'gold_special',
    'Tipo de Garantia': p.warrantyType || 'Garantia do vendedor',
    'Tempo de Garantia': p.warrantyTime || '30 dias',
    'Validade': p.expirationDate || '',
    'Peso (g)': p.weight !== undefined && p.weight !== null ? p.weight : '',
    'Foto URL': p.imageUrl || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 38 }, // ID do Sistema
    { wch: 18 }, // ID Personalizado
    { wch: 45 }, // Nome
    { wch: 18 }, // SKU
    { wch: 18 }, // Categoria ML
    { wch: 14 }, // Preço (R$)
    { wch: 12 }, // Estoque
    { wch: 20 }, // Marca
    { wch: 18 }, // GTIN/EAN
    { wch: 14 }, // NCM
    { wch: 18 }, // Tipo de Produto
    { wch: 20 }, // Tipo de Perfume
    { wch: 14 }, // Tamanho (ML)
    { wch: 14 }, // Condição
    { wch: 20 }, // Tipo de Anúncio ML
    { wch: 20 }, // Tipo de Garantia
    { wch: 18 }, // Tempo de Garantia
    { wch: 14 }, // Validade
    { wch: 12 }, // Peso (g)
    { wch: 45 }, // Foto URL
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
  XLSX.writeFile(workbook, filename);
}
