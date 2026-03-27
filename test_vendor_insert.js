const { createClient } = require('@supabase/supabase-js');


const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: { user }, error: authError } = await authClient.auth.signInWithPassword({
    email: 'muhammadwasifpro@gmail.com', 
    password: 'tikkit123@'
  });

  if (authError || !user) {
    console.log('Login failed', authError);
    return;
  }
  
  console.log('Logged in as', user.id);

  const { data: eventData, error: eventError } = await authClient
    .from('events')
    .insert({
      title: 'RLS Test Event',
      organizer_id: user.id,
      date_start: new Date().toISOString()
    })
    .select()
    .single();

  if (eventError) {
    console.error('Event Insert Error:', eventError);
    return;
  }
  
  console.log('Event Insert Success:', eventData.id);

  const { data, error } = await authClient
    .from('ticket_types')
    .insert({
      event_id: eventData.id,
      name: 'General Admission',
      quantity: 100,
      price: 10
    })
    .select();
    
  if (error) {
    console.error('Ticket Type Insert Error:', error);
  } else {
    console.log('Ticket Type Insert Success:', data);
  }
}

run();
