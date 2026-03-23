const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: 'muhammadwasif1@hotmail.com',
    password: 'tikkit123@'
  });

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  console.log('Current role is:', data.role);
}

check();
