import { Sidebar } from "@/components/layout/Sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
    <div className="min-h-full bg-[#f8fafc] text-zinc-900 font-sans flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
