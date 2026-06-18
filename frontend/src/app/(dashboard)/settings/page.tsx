'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
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

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const gdriveRes = await authenticatedFetch(`${apiUrl}/api/gdrive/status`);
        if (gdriveRes.ok) {
          const gdriveData = await gdriveRes.json();
          if (gdriveData.connected) {
            setGoogleAccounts([gdriveData]);
          } else {
            setGoogleAccounts([]);
          }
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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações e Integrações</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Gerencie suas conexões com marketplaces e armazenamento em nuvem.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-3 rounded-md flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Integração Mercado Livre */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-muted/30">
            <h2 className="text-base font-semibold text-foreground">Integrações do Mercado Livre</h2>
            <p className="text-sm text-muted-foreground mt-1">Conecte suas contas para sincronizar produtos automaticamente.</p>
          </div>
          <div className="p-6 space-y-4">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                    <span className="font-bold text-blue-900 text-lg">ML</span>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">{acc.nickname}</h3>
                    <p className="text-xs text-muted-foreground">ID: {acc.ml_user_id}</p>
                  </div>
                </div>
                <div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md text-xs font-semibold">
                    Conectado
                  </span>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-border rounded-xl bg-muted/10 border-dashed">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted border border-border rounded-full flex items-center justify-center">
                  <span className="font-bold text-muted-foreground text-xs">ML</span>
                </div>
                <div>
                  <h3 className="text-foreground font-medium text-sm">Adicionar Nova Conta</h3>
                  <p className="text-xs text-muted-foreground">Conecte mais uma conta do Mercado Livre</p>
                </div>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <ConnectMLButton />
              </div>
            </div>
          </div>
        </div>

        {/* Integração Google Drive */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <UploadCloud className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Google Drive</h3>
                <p className="text-sm text-muted-foreground max-w-lg mt-1 leading-relaxed">
                  Conecte sua conta do Google Drive para permitir que o SellerDNA importe em lote todas as fotos dos seus produtos de forma automatizada.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              {googleAccounts.length > 0 ? (
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Conectado
                  </span>
                  <button
                    onClick={handleConnectGoogle}
                    disabled={loading}
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    {loading ? 'Aguarde...' : 'Reconectar'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                >
                  {loading ? 'Redirecionando...' : 'Conectar Conta'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
