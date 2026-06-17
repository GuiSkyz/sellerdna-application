const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Using URL:', supabaseUrl);
  console.log('Using Key starting with:', supabaseKey ? supabaseKey.substring(0, 10) : 'none');
  
  const { data, error } = await supabase.from('mercadolivre_accounts').select('*');
  if (error) {
    console.error('Error fetching accounts:', error);
  } else {
    console.log(`Found ${data.length} accounts in DB.`);
    console.log(data);
  }
}

check();
