'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ConnectMLButton } from '@/components/features/ConnectMLButton';
import { authenticatedFetch } from '@/utils/authenticatedFetch';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const res = await authenticatedFetch(`${apiUrl}/api/ml/accounts`);
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        }
      } catch (err) {
        console.error('Erro ao buscar contas:', err);
      }
    }
    fetchAccounts();
  }, []);

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
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Configurações</h1>
        <p className="text-sm text-zinc-500 mt-1">
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

      <div className="bg-white border border-zinc-200/60 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
          <h2 className="text-lg font-medium text-zinc-900">Integrações do Mercado Livre</h2>
          <p className="text-sm text-zinc-500 mt-1">Conecte suas contas para sincronizar produtos automaticamente.</p>
        </div>
        <div className="p-6 space-y-4">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                  <span className="font-bold text-blue-900 text-lg">ML</span>
                </div>
                <div>
                  <h3 className="text-zinc-900 font-semibold">{acc.nickname}</h3>
                  <p className="text-xs text-zinc-500">ID: {acc.ml_user_id}</p>
                </div>
              </div>
              <div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium">
                  Conectado
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 border-dashed">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center">
                <span className="font-bold text-zinc-500 text-sm">ML</span>
              </div>
              <div>
                <h3 className="text-zinc-900 font-medium">Adicionar Nova Conta</h3>
                <p className="text-sm text-zinc-500">Conecte mais uma conta do Mercado Livre</p>
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
    <Suspense fallback={<div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>}>
      <SettingsContent />
    </Suspense>
  );
}
