'use client';

import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';

interface ExcelUploaderProps {
  onDataParsed: (data: any[]) => void;
}

export function ExcelUploader({ onDataParsed }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Por favor, faça upload apenas de arquivos Excel (.xlsx, .xls) ou CSV.');
      return;
    }

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte a planilha para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Mapeia para o formato esperado pela API, ignorando linhas vazias sem nome
        const mappedData = jsonData.map((row: any) => ({
          customId: String(row['ID'] || row['Id'] || row['id'] || ''),
          name: row['NOME'] || row['Nome'] || '',
          brand: row['MARCA'] || row['Marca'] || '',
          sizeMl: row['TAMANHO (ML)'] || row['Tamanho (ML)'] || '',
          perfumeType: row['TIPO DE PERFUME'] || row['Tipo de Perfume'] || '',
          price: Number(row['PREÇO DE VENDA (R$)'] || row['PREÇO DE VENDA'] || row['Preço'] || 0),
          quantity: Number(row['QUANTIDADE'] || row['Quantidade'] || 0),
          gender: row['GENÊRO'] || row['GÊNERO'] || row['Gênero'] || '',
          expirationDate: row['VALIDADE'] || row['Validade'] || '',
          weight: Number(row['PESO'] || row['Peso'] || 0),
          ncm: row['NCM'] || '',
          sku: row['SKU'] || '',
          imageUrl: row['FOTO (Link da Pasta Drive)'] || row['FOTO'] || row['Foto'] || ''
        })).filter(item => item.name !== '');

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
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const reset = () => {
    setFileName(null);
    setError(null);
    onDataParsed([]);
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
