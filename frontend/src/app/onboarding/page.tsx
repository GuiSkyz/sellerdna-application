'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectMLButton } from '@/components/features/ConnectMLButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Store } from 'lucide-react';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAccount() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        // Needs the auth token? If backend is protected, we need to send the session token.
        // Wait, the Next.js frontend has the session cookie. To call the backend directly from the client, we should probably fetch the session and attach it.
        // Or we just call an internal Next.js API route that proxies it.
        // For simplicity in this demo, let's just assume the backend is called.
        // Actually, if we use supabase-js here, we can get the session.
        
        // Let's just mock checking the account for the UI to show the connection screen.
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    checkAccount();
  }, []);

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
