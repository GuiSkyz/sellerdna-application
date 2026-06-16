'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ConnectMLButton } from '@/components/features/ConnectMLButton';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const isConnected = searchParams.get('ml_connected');
    const hasError = searchParams.get('error');

    if (isConnected === 'true') {
      setSuccessMsg('Sua conta do Mercado Livre foi conectada com sucesso!');
    } else if (isConnected === 'false' || hasError) {
      setErrorMsg('Não foi possível conectar a conta. Tente novamente.');
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações</h1>
        <p className="text-sm text-gray-400 mt-2">
          Gerencie as integrações e as configurações da sua conta Seller DNA.
        </p>
      </header>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 px-4 py-3 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700">
          <h2 className="text-lg font-medium text-white">Integrações</h2>
          <p className="text-sm text-gray-400 mt-1">Conecte suas contas para sincronizar produtos automaticamente.</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/80">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="font-bold text-blue-900 text-lg">ML</span>
              </div>
              <div>
                <h3 className="text-white font-medium">Mercado Livre</h3>
                <p className="text-sm text-gray-400">Importação e sincronização de anúncios</p>
              </div>
            </div>
            <div>
              <ConnectMLButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="text-white">Carregando configurações...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
