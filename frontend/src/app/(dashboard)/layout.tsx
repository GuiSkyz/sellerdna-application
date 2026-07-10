import { DashboardLayoutWrapper } from "@/components/layout/DashboardLayoutWrapper";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify ML account
  const { data: accounts } = await supabase
    .from('mercadolivre_accounts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (!accounts || accounts.length === 0) {
    redirect('/onboarding');
  }

  return (
    <DashboardLayoutWrapper>
      {children}
    </DashboardLayoutWrapper>
  );
}
