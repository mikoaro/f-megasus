/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Optional: If you are skipping TS checks, you often want to skip ESLint too
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;