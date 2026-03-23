const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function revert() {
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === 'muhammadwasif1@hotmail.com');
  
  if (user) {
    const { error } = await supabase.from('profiles').update({ role: 'guest' }).eq('id', user.id);
    if (error) console.error('Failed to revert role:', error);
    else console.log('Successfully reverted role to guest via Service Key.');
  }
}

revert();
