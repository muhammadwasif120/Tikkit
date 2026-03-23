const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOrganizerRls() {
  console.log('--- Tikkit Organizer Security Verification ---');

  // Authenticate as the Organizer
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'muhammadwasifpro@gmail.com',
    password: 'tikkit123@'
  });

  if (authError || !user) {
    console.log('Authentication failed:', authError?.message);
    return;
  }
  
  console.log(`Successfully logged in as Organizer: ${user.id}\\n`);

  console.log('[TEST 1] Attempting Privilege Escalation to Admin');
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id);

  if (profileError) {
    console.log('✅ SUCCESS: Privilege escalation blocked!');
    console.log('Error reason:', profileError.message);
  } else {
    console.log('❌ FAILURE: Privilege escalation succeeded. Organizer became admin!');
  }

  console.log('\\n[TEST 2] Attempting to insert an event belonging to another Organizer');
  const fakeUserId = '00000000-0000-0000-0000-000000000000';
  const { error: insertEventError } = await supabase
    .from('events')
    .insert({
      title: 'Hacked Event',
      slug: 'hacked-event-123',
      organizer_id: fakeUserId,
      status: 'draft'
    });

  if (insertEventError) {
    console.log('✅ SUCCESS: Cross-tenant event insertion blocked!');
    console.log('Error reason:', insertEventError.message);
  } else {
    console.log('❌ FAILURE: Was able to insert an event belonging to someone else!');
  }

  console.log('\\n[TEST 3] Attempting to update events owned by other Organizers');
  const { data: updateData, error: updateEventError } = await supabase
    .from('events')
    .update({ title: 'Hacked by Malicious Organizer' })
    .neq('organizer_id', user.id)
    .select();

  if (updateEventError) {
    console.log('✅ SUCCESS: Cross-tenant event update threw an explicit error!');
    console.log('Error reason:', updateEventError.message);
  } else if (!updateData || updateData.length === 0) {
    console.log('✅ SUCCESS: Cross-tenant event update returned 0 affected rows (RLS isolated query).');
  } else {
    console.log(`❌ FAILURE: Successfully hijacked ${updateData.length} events belonging to other organizers!`);
  }

  console.log('\\n--- Verification Complete ---');
}

testOrganizerRls();
