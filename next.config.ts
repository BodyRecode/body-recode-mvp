import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // NOTE: The /scorecard host redirect is handled by middleware.ts so it only
    // fires on the bodyrecode.au IP host, not on localhost or the consumer subdomain.
    // The entries below are SEO aliases that map within the consumer arm; middleware
    // promotes them to performance.bodyrecode.au if they land on bodyrecode.au.
    return [
      { source: '/online-performance-coaching', destination: '/performance-coaching/online', permanent: true },
      { source: '/performance-coach-brisbane', destination: '/performance-coaching/brisbane', permanent: true },
      { source: '/online-strength-coaching', destination: '/performance-coaching/strength/online', permanent: true },
      { source: '/strength-coach-brisbane', destination: '/performance-coaching/strength/brisbane', permanent: true },
      { source: '/online-fat-loss-coaching', destination: '/performance-coaching/fat-loss/online', permanent: true },
      { source: '/fat-loss-coach-brisbane', destination: '/performance-coaching/fat-loss/brisbane', permanent: true },
      { source: '/online-personal-trainer', destination: '/performance-coaching/personal-training/online', permanent: true },
      { source: '/personal-trainer-brisbane', destination: '/performance-coaching/personal-training/brisbane', permanent: true },
    ]
  },
};

export default nextConfig;
