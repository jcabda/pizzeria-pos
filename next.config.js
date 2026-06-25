/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['tu-proyecto.supabase.co'],
        formats: ['image/avif', 'image/webp'],
    },
    compress: true,
    swcMinify: true,
    poweredByHeader: false,
    reactStrictMode: true,
    experimental: {
        optimizeCss: true,
    },
}

module.exports = nextConfig