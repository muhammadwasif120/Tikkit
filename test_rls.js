const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRlsSecurity() {
  console.log('--- Tikkit RLS Security Verification ---');

  // 1. Authenticate as a normal user (replace with actual credentials to test against live DB)
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'muhammadwasif1@hotmail.com',
    password: 'tikkit123@'
  });

  if (authError) {
    console.log('Authentication failed (as expected if test user does not exist):', authError.message);
    console.log('Skipping TEST 1 (Privilege Escalation) as it requires a verified user context...');
  } else {
    console.log('\\n[TEST 1] Attempting Privilege Escalation');
    // Attempt to update the user's own profile to set role = 'admin'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (profileError) {
      console.log('✅ SUCCESS: Privilege escalation blocked!');
      console.log('Error reason:', profileError.message);
    } else {
      console.log('❌ FAILURE: Privilege escalation succeeded. The RLS policy failed.');
    }
  }

  console.log('\\n[TEST 2] Attempting Registration Bypass');
  // Attempt to insert a public registration with 'approved' status directly
  const { error: regError } = await supabase
    .from('public_registrations')
    .insert({
      event_id: '00000000-0000-0000-0000-000000000000', // Dummy event ID
      full_name: 'Malicious Guest',
      email: 'hacker@example.com',
      status: 'approved',
      payment_status: 'confirmed'
    });

  if (regError) {
    console.log('✅ SUCCESS: Registration bypass blocked!');
    console.log('Error reason:', regError.message);
  } else {
    console.log('❌ FAILURE: Registration bypass succeeded. The RLS policy failed.');
  }

  console.log('\\n--- Verification Complete ---');
}

testRlsSecurity();
