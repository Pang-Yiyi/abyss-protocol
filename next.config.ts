import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: isGitHubPages ? 'export' : undefined,
  basePath: isGitHubPages ? '/abyss-protocol' : '',
  assetPrefix: isGitHubPages ? '/abyss-protocol/' : undefined,
  images: isGitHubPages ? { unoptimized: true } : undefined,
};

export default nextConfig;
