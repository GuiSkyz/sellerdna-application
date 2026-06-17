'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/gdrive/auth`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to Google Drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Configurações e Integrações</h1>
        <p className="text-zinc-500 mt-2">
          Gerencie suas conexões com marketplaces e armazenamento em nuvem.
        </p>
      </div>

      <div className="space-y-6">
        {/* Integração Google Drive */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Google Drive</h3>
                <p className="text-sm text-zinc-500 max-w-lg mt-1">
                  Conecte sua conta do Google Drive para permitir que o SellerDNA importe em lote todas as fotos dos seus produtos de forma automatizada.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnectGoogle}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? 'Redirecionando...' : 'Conectar Conta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
