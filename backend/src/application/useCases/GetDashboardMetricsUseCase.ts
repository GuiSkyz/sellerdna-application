export class GetDashboardMetricsUseCase {
  async execute(userId: string) {
    // Em um cenário real, estas métricas viriam de queries (COUNT, SUM) no banco de dados.
    // Retornaremos dados mockados simulando o painel de um vendedor do ML
    return {
      totalListings: 145,
      activeListings: 120,
      pausedListings: 20,
      endedListings: 5,
      totalDuplicatedAI: 34,
      recentActivities: [
        { id: 1, action: 'Importação de Planilha', date: new Date().toISOString(), description: '50 produtos importados.' },
        { id: 2, action: 'Geração de IA', date: new Date(Date.now() - 3600000).toISOString(), description: 'Títulos e Descrições de 3 anúncios otimizados.' },
        { id: 3, action: 'Sincronização', date: new Date(Date.now() - 7200000).toISOString(), description: 'Conta Mercado Livre sincronizada.' }
      ]
    };
  }
}
