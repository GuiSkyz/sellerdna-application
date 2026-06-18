'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { authenticatedFetch } from '@/utils/authenticatedFetch';
import { ConnectMLButton } from '@/components/features/ConnectMLButton';

function SettingsContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);

  useEffect(() => {
    const isConnected = searchParams.get('ml_connected');
    const isGdriveConnected = searchParams.get('gdrive');
    const hasError = searchParams.get('error');

    if (isConnected === 'true') {
      setSuccessMsg('Sua conta do Mercado Livre foi conectada com sucesso!');
    } else if (isGdriveConnected === 'success') {
      setSuccessMsg('Sua conta do Google Drive foi conectada com sucesso!');
    } else if (isConnected === 'false' || hasError) {
      setErrorMsg('Não foi possível conectar a conta. Tente novamente.');
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: mlData, error: mlError } = await supabase
          .from('mercadolivre_accounts')
          .select('*')
          .eq('user_id', user.id);

        if (mlError) throw mlError;
        setAccounts(mlData || []);

        const { data: googleData, error: googleError } = await supabase
          .from('google_integrations')
          .select('*')
          .eq('user_id', user.id);

        if (!googleError && googleData) {
          setGoogleAccounts(googleData);
        }
      } catch (err) {
        console.error('Erro ao buscar contas:', err);
      }
    }
    fetchAccounts();
  }, []);

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Configurações e Integrações</h1>
        <p className="text-zinc-500 mt-2">
          Gerencie suas conexões com marketplaces e armazenamento em nuvem.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
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

      <div className="space-y-6">
        {/* Integração Mercado Livre */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
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
            {googleAccounts.length > 0 ? (
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Conectado
                </span>
                <button
                  onClick={handleConnectGoogle}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {loading ? 'Redirecionando...' : 'Reconectar'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 h-fit"
              >
                {loading ? 'Redirecionando...' : 'Conectar Conta'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
