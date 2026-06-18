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
  const [driveFolderId, setDriveFolderId] = useState('');
  const [savingDrive, setSavingDrive] = useState(false);

  useEffect(() => {
    const isConnected = searchParams.get('ml_connected');
    const isGdriveConnected = searchParams.get('gdrive');
    const hasError = searchParams.get('error');

    if (isConnected === 'true') {
      setSuccessMsg('Sua conta do Mercado Livre foi conectada com sucesso!');
    } else if (isGdriveConnected === 'success') {
      setSuccessMsg('Configurações do Google Drive salvas com sucesso!');
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

        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('drive_folder_id')
          .eq('id', user.id)
          .single();
          
        if (userRecord?.drive_folder_id) {
          setDriveFolderId(userRecord.drive_folder_id);
        }
      } catch (err) {
        console.error('Erro ao buscar contas:', err);
      }
    }
    fetchAccounts();
  }, []);

  const handleSaveDriveFolder = async () => {
    try {
      setSavingDrive(true);
      setErrorMsg('');
      setSuccessMsg('');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const res = await authenticatedFetch(`${apiUrl}/api/gdrive/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: driveFolderId })
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      setSuccessMsg('Pasta do Google Drive configurada com sucesso!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao salvar a pasta do Google Drive.');
    } finally {
      setSavingDrive(false);
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
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <UploadCloud className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-3 flex-1 max-w-2xl">
                <h3 className="text-base font-semibold text-foreground">Google Drive (Integração de Fotos Automática)</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para que o SellerDNA consiga importar automaticamente as fotos dos seus perfumes do Google Drive, siga os passos abaixo:
                </p>
                <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                  <li>Crie uma pasta no seu Google Drive (ex: "BD Cosméticos").</li>
                  <li>Compartilhe essa pasta com o nosso robô: <span className="font-semibold text-primary select-all">drivephotos@mystic-producer-485015-j6.iam.gserviceaccount.com</span> (Acesso de Leitor).</li>
                  <li>Cole o link ou ID dessa pasta no campo abaixo.</li>
                </ol>
                
                <div className="flex gap-3 pt-2">
                  <input
                    type="text"
                    value={driveFolderId}
                    onChange={(e) => setDriveFolderId(e.target.value)}
                    placeholder="Cole o ID ou link da pasta aqui..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    onClick={handleSaveDriveFolder}
                    disabled={savingDrive}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                  >
                    {savingDrive ? 'Salvando...' : 'Salvar Pasta'}
                  </button>
                </div>
              </div>
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
