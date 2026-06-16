'use client';

import { useState } from 'react';

export function ConnectMLButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/ml/auth-url`);
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao obter a URL de autenticação do Mercado Livre');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
          Conectando...
        </>
      ) : (
        'Conectar Conta'
      )}
    </button>
  );
}
