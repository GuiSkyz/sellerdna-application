const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Testing insert with real user...');
  
  // 1. Get a real user ID
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError || !users || users.length === 0) {
    console.error('Could not get users', usersError);
    return;
  }
  
  const realUserId = users[0].id;
  console.log('Got real user ID:', realUserId);
  
  // 2. Try inserting
  const { data, error } = await supabase.from('mercadolivre_accounts').insert({
    user_id: realUserId,
    ml_user_id: '99999999',
    nickname: 'Test Real User',
    status: 'ACTIVE'
  }).select('id').single();
  
  if (error) {
    console.error('\n❌ SUPABASE INSERT ERROR:\n', JSON.stringify(error, null, 2));
  } else {
    console.log('\n✅ INSERT SUCCESS!', data);
    await supabase.from('mercadolivre_accounts').delete().eq('id', data.id);
  }
}

check();
