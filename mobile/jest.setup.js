// Dummy values so modules that read env vars at import time (e.g.
// src/lib/supabase.ts) don't throw during tests. Never real credentials.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'
