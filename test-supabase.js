import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const { data: products, error } = await supabase.from('products').select('*').limit(1);
  console.log('Error:', error);
  console.log('Data:', products);
}

test();
