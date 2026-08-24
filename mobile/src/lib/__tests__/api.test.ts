// Mock the Supabase client before importing api.ts, since supabase.ts throws
// at import time if EXPO_PUBLIC_SUPABASE_URL/ANON_KEY aren't set (as they
// won't be in a test environment).
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}))

import { getEvents } from '@/lib/api'

const originalFetch = global.fetch

function mockFetch(response: { ok: boolean; status?: number; json: () => Promise<any>; headers?: Record<string, string> }) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    headers: {
      get: (key: string) => (response.headers ?? { 'content-type': 'application/json' })[key.toLowerCase()] ?? null,
    },
    json: response.json,
  }) as any
}

afterEach(() => {
  global.fetch = originalFetch
  jest.clearAllMocks()
})

describe('api request helper (via getEvents)', () => {
  it('resolves with parsed JSON on a 2xx response', async () => {
    mockFetch({
      ok: true,
      json: async () => ({ events: [{ id: '1', title: 'Test Event' }], page: 0, limit: 20 }),
    })

    const res = await getEvents(0)
    expect(res.events).toHaveLength(1)
    expect(res.events[0].id).toBe('1')
  })

  it('throws the server-provided error message on a non-2xx response', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request from server' }),
    })

    await expect(getEvents(0)).rejects.toThrow('Bad request from server')
  })

  it('falls back to statusText when the error body has no message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: { get: () => 'application/json' },
      json: async () => { throw new Error('not json') },
    }) as any

    await expect(getEvents(0)).rejects.toThrow('Internal Server Error')
  })

  it('rejects when a 2xx response is not JSON', async () => {
    mockFetch({
      ok: true,
      json: async () => { throw new Error('should not be called') },
      headers: { 'content-type': 'text/html' },
    })

    await expect(getEvents(0)).rejects.toThrow(/non-JSON response/)
  })
})
