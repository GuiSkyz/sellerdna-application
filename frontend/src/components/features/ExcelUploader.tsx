'use client';

import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud } from 'lucide-react';

interface ExcelUploaderProps {
  onDataParsed: (data: Record<string, unknown>[]) => void;
}

export function ExcelUploader({ onDataParsed }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Por favor, faça upload apenas de arquivos Excel (.xlsx, .xls) ou CSV.');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
        
        const mappedData = jsonData.map((row: Record<string, unknown>) => {
          const sysId = String(row['ID do Sistema'] || row['ID Sistema'] || row['ID DO SISTEMA'] || row['ID_SISTEMA'] || row['id'] || '');
          const custId = String(row['ID Personalizado'] || row['ID PERSONALIZADO'] || row['CUST ID'] || row['customId'] || row['ID'] || row['Id'] || '');
          const isSysIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(custId);
          const finalId = sysId || (isSysIdUuid ? custId : '');
          const finalCustomId = !isSysIdUuid ? custId : '';

          return {
            id: finalId,
            customId: finalCustomId,
            name: String(row['Nome'] || row['NOME'] || row['Produto'] || row['name'] || (finalId || String(row['SKU'] || '') ? 'Produto (Atualização)' : '')),
            sku: String(row['SKU'] || row['sku'] || ''),
            mlCategoryId: String(row['Categoria ML'] || row['CATEGORIA ML'] || row['CATEGORIA'] || row['Categoria'] || row['mlCategoryId'] || ''),
            price: Number(row['Preço (R$)'] || row['PREÇO (R$)'] || row['Preço'] || row['PREÇO DE VENDA (R$)'] || row['PREÇO DE VENDA'] || row['price'] || 0),
            quantity: Number(row['Estoque'] || row['ESTOQUE'] || row['Quantidade'] || row['QUANTIDADE'] || row['quantity'] || 0),
            brand: String(row['Marca'] || row['MARCA'] || row['brand'] || ''),
            gtin: String(row['GTIN/EAN'] || row['GTIN'] || row['EAN'] || row['gtin'] || ''),
            ncm: String(row['NCM'] || row['ncm'] || ''),
            productType: String(row['Tipo de Produto'] || row['TIPO DE PRODUTO'] || row['productType'] || 'Perfume'),
            perfumeType: String(row['Tipo de Perfume'] || row['TIPO DE PERFUME'] || row['perfumeType'] || ''),
            sizeMl: String(row['Tamanho (ML)'] || row['TAMANHO (ML)'] || row['sizeMl'] || ''),
            gender: String(row['Gênero'] || row['GÊNERO'] || row['GENÊRO'] || row['gender'] || ''),
            condition: String(row['Condição'] || row['CONDIÇÃO'] || row['condition'] || 'new'),
            listingTypeId: String(row['Tipo de Anúncio ML'] || row['TIPO DE ANÚNCIO ML'] || row['listingTypeId'] || 'gold_special'),
            warrantyType: String(row['Tipo de Garantia'] || row['TIPO DE GARANTIA'] || row['warrantyType'] || 'Garantia do vendedor'),
            warrantyTime: String(row['Tempo de Garantia'] || row['TEMPO DE GARANTIA'] || row['warrantyTime'] || '30 dias'),
            expirationDate: String(row['Validade'] || row['VALIDADE'] || row['expirationDate'] || ''),
            weight: Number(row['Peso (g)'] || row['PESO (G)'] || row['Peso'] || row['PESO'] || row['weight'] || 0),
            imageUrl: String(row['Foto URL'] || row['FOTO URL'] || row['Foto'] || row['FOTO (Link da Pasta Drive)'] || row['FOTO'] || row['imageUrl'] || '')
          };
        }).filter(item => Boolean(item.name || item.id || item.sku));

        if (mappedData.length === 0) {
          setError('Nenhum dado válido encontrado. Verifique as colunas da planilha.');
        } else {
          onDataParsed(mappedData);
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao processar o arquivo. Verifique se ele não está corrompido.');
      }
    };
    reader.readAsBinaryString(file);
  }, [onDataParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer relative overflow-hidden group ${
          isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-zinc-300 hover:border-blue-400 hover:bg-zinc-50/50 bg-white'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <UploadCloud className={`mx-auto h-12 w-12 mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-zinc-400 group-hover:text-blue-500'}`} />
        <p className="text-zinc-700 font-medium mb-1 relative">Arraste sua planilha do Excel aqui</p>
        <p className="text-sm text-zinc-500 relative">ou clique para selecionar o arquivo (.xlsx, .csv)</p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileInput}
        />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mt-6 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0"></div>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
