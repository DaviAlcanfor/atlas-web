import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home folder would otherwise be taken as the workspace root.
  turbopack: { root: process.cwd() },
  experimental: {
    // Prerendering ~200 country pages fires one API call each. At the default parallelism (workers x 8) the API stopped
    // answering (even /v1/health) for minutes, twice. 2 workers x 2 pages keeps it to 4 calls in flight (spec 020).
    cpus: 2,
    staticGenerationMaxConcurrency: 2,
  },
};

export default nextConfig;
