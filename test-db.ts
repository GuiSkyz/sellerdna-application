import { authenticatedFetch } from './frontend/src/utils/authenticatedFetch';

// Mock since we are in node
// Actually, let's just make a direct fetch to the local backend if it's running, or query supabase.
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const { data: products, error: err1 } = await supabase.from('products').select('*').limit(1);
  if (err1) {
    console.error('List error:', err1);
    return;
  }
  console.log('Product:', products[0]);
  
  if (products[0]) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', products[0].id)
      .eq('user_id', products[0].user_id)
      .single();
      
    console.log('Get by ID error:', error);
    console.log('Get by ID data:', data);
  }
}

test();
