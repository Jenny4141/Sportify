/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3005',
        pathname: '/api/admin/shop/product/image/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3005',
        pathname: '/center-imgs/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3005',
        pathname: '/course-imgs/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3005',
        pathname: '/team-imgs/**',
      },
      // {
      //   protocol: 'http',
      //   hostname: 'localhost',
      //   port: '3005',
      //   pathname: '/api/admin/shop/product/image/**',
      // },
    ],
  },
}

export default nextConfig
