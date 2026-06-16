import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL ou SUPABASE_ANON_KEY não estão definidos no .env. As requisições ao banco podem falhar.');
}

// O backend usa a anon key por padrão, mas poderia usar a SERVICE_ROLE_KEY se precisar ignorar RLS (Row Level Security).
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);
