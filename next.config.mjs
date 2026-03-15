/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eyelcvclqzxhaaxyvgfu.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig