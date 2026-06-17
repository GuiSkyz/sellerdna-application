const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Testing insert with Service Role Key...');
  
  // Try inserting a fake account to see if schema matches
  const { data, error } = await supabase.from('mercadolivre_accounts').insert({
    user_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
    ml_user_id: '12345678',
    nickname: 'Test User',
    status: 'ACTIVE'
  }).select('id').single();
  
  if (error) {
    console.error('\n❌ SUPABASE INSERT ERROR:\n', JSON.stringify(error, null, 2));
  } else {
    console.log('\n✅ INSERT SUCCESS!', data);
    
    // Clean up
    await supabase.from('mercadolivre_accounts').delete().eq('id', data.id);
  }
}

check();
