import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TIKKIT X',
    short_name: 'TIKKITX',
    description: 'Discover and attend exclusive events. Your digital pass lives here.',
    start_url: '/guest/explore',
    display: 'standalone',
    background_color: '#000000', // Neon-noir theme
    theme_color: '#ffaa00',      // Neon-noir theme
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    orientation: 'portrait',
    scope: '/',
  }
}
