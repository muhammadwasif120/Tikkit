import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/open',
    name: 'TIKKIT X',
    short_name: 'TIKKIT X',
    description: 'Your tickets, passes and events. Your QR is always one tap away.',
    // /open sends each person to their own home: guests to Today, organizers to the dashboard, admins to /master.
    start_url: '/open?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#070911',
    theme_color: '#070911',
    lang: 'en-PK',
    categories: ['entertainment', 'lifestyle', 'events'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'My tickets', short_name: 'Tickets', description: 'Open your QR tickets', url: '/guest/tickets', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'For you', short_name: 'For you', description: 'Events, classes and spaces picked for you', url: '/guest/explore', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Event Day', short_name: 'Door', description: 'Scan tickets at the door (organizers)', url: '/dashboard/event-day', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
  }
}
