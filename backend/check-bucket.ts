import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.storage.from('product-images').list();
  if (error) console.error(error);
  console.log('Arquivos na raiz do bucket:', data);
  
  // Vamos ver se tem alguma pasta (como o userId)
  if (data) {
    for (const item of data) {
      if (!item.id) { // é pasta
        const { data: sub } = await supabase.storage.from('product-images').list(item.name);
        console.log(`Subpasta ${item.name}:`, sub);
      }
    }
  }
}
run();
