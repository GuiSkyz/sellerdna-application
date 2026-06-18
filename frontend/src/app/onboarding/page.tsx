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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Quase lá!
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Para utilizar a plataforma Seller DNA, você precisa vincular sua conta do Mercado Livre.
          </p>
        </div>

        <Card className="border-border shadow-lg bg-card overflow-hidden">
          <CardHeader className="bg-yellow-500/10 border-b border-yellow-500/20 pb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div>
                <CardTitle className="text-lg text-yellow-800 dark:text-yellow-400">Integração Obrigatória</CardTitle>
                <CardDescription className="text-yellow-700/80 dark:text-yellow-500/80 mt-1">
                  Nós precisamos de acesso seguro para ler e publicar anúncios em seu nome.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 flex flex-col items-center">
            <div className="w-full bg-muted/50 border border-border rounded-xl p-6 flex flex-col items-center text-center">
              {/* Using a monochrome or theme-friendly icon/image for Mercado Livre would be better, but we stick to the provided logo or a placeholder */}
              <div className="bg-white p-3 rounded-lg mb-6 shadow-sm border border-border/50">
                <img src="https://logodownload.org/wp-content/uploads/2016/08/mercado-livre-logo-1.png" alt="Mercado Livre" className="h-8 object-contain" />
              </div>
              <p className="text-sm text-muted-foreground mb-6">
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
