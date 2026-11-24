/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;