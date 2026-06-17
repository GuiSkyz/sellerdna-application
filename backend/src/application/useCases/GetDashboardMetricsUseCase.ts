import { supabase } from '../../infrastructure/database/supabase';

export class GetDashboardMetricsUseCase {
  async execute(userId: string) {
    // Buscar contas conectadas
    const { data: accounts } = await supabase.from('mercadolivre_accounts').select('id').eq('user_id', userId);
    const accountIds = (accounts || []).map(a => a.id);

    // Contar produtos na base local
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    let activeListings = 0;
    let pausedListings = 0;
    let endedListings = 0;
    let totalVisits = 0;
    let totalSales = 0;

    if (accountIds.length > 0) {
      const { data: listings } = await supabase.from('listings').select('status, visits, sold_quantity').in('account_id', accountIds);
      
      if (listings) {
        for (const l of listings) {
          totalVisits += (l.visits || 0);
          totalSales += (l.sold_quantity || 0);
          if (l.status === 'active') activeListings++;
          else if (l.status === 'paused') pausedListings++;
          else if (l.status === 'closed') endedListings++;
        }
      }
    }

    const totalListings = activeListings + pausedListings + endedListings;

    return {
      totalProducts: totalProducts || 0,
      totalListings,
      activeListings,
      pausedListings,
      endedListings,
      totalVisits,
      totalSales,
      recentActivities: [
        { id: 1, action: 'Visão Geral', date: new Date().toISOString(), description: `Você tem ${totalProducts || 0} produtos e ${totalListings} anúncios.` }
      ]
    };
  }
}
