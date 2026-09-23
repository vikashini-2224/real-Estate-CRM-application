/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@realestate-crm/shared'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
