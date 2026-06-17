import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// Use a SERVICE_ROLE_KEY se existir, caso contrário faça fallback para a ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL ou chaves do Supabase não estão definidas no .env. As requisições ao banco podem falhar.');
}

// O backend precisa da SERVICE_ROLE_KEY para ignorar o RLS ao salvar contas do Mercado Livre
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);
