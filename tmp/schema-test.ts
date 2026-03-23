import { Database } from '../src/lib/supabase/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

const client = new SupabaseClient<Database>('https://example.com', 'key');
const q = client.from('guest_profiles').select('*');
