/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@realestate-crm/shared'],

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
