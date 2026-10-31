/** @type {import('next').NextConfig} */
const nextConfig = {
  // Guides and the Composio catalog are read from disk at request time.
  outputFileTracingIncludes: {
    "/**": ["./data/**/*"],
  },
};

export default nextConfig;
