'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConnectMLButton } from '@/components/features/ConnectMLButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Store } from 'lucide-react';

function OnboardingContent() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      alert(`Falha na autenticação do Mercado Livre. O Backend encontrou um erro ao salvar sua conta:\n\n${decodeURIComponent(errorParam)}`);
    }
    async function checkAccount() {
      try {
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    checkAccount();
  }, [searchParams]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50">Carregando...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Quase lá!
          </h1>
          <p className="mt-3 text-lg text-zinc-500">
            Para utilizar a plataforma Seller DNA, você precisa vincular sua conta do Mercado Livre.
          </p>
        </div>

        <Card className="border-zinc-200/60 shadow-lg">
          <CardHeader className="bg-yellow-50/50 border-b border-yellow-100 rounded-t-xl pb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <CardTitle className="text-lg text-yellow-900">Integração Obrigatória</CardTitle>
                <CardDescription className="text-yellow-700 mt-1">
                  Nós precisamos de acesso seguro para ler e publicar anúncios em seu nome.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 flex flex-col items-center">
            <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-6 flex flex-col items-center text-center">
              <img src="https://logodownload.org/wp-content/uploads/2016/08/mercado-livre-logo-1.png" alt="Mercado Livre" className="h-10 mb-6 object-contain" />
              <p className="text-sm text-zinc-500 mb-6">
                Ao clicar no botão abaixo, você será redirecionado para o Mercado Livre de forma segura.
              </p>
              <ConnectMLButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50">Carregando...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
