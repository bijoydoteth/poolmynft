/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      }
      // {
      //   protocol: 'https',
      //   hostname: 'res.cloudinary.com',
      //   // You can add these as well
      //   // port: '',
      //   // pathname: 'arifscloud/image/upload/**',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'i.seadn.io',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'lh3.googleusercontent.com',
      // }
    ],
  },
  // unoptimized: true,
}

module.exports = nextConfig
