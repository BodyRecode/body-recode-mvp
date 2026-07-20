import type { NextConfig } from "next";

/**
 * Brand architecture:
 *   bodyrecode.au              -> THIS app. IP/parent homepage + the entire
 *                                 application backend (api, portal, dashboard,
 *                                 book, blueprint, membership, etc.)
 *   performance.bodyrecode.au  -> Separate marketing site (repo: performance-bodyrecode).
 *                                 Owns /, /online, /brisbane, /founder, /how-it-works,
 *                                 /links, /scorecard, /check-in. The marketing scorecard
 *                                 form posts to bodyrecode.au/api/* and CTAs link to
 *                                 bodyrecode.au/book.
 *
 * The redirects below send users from legacy MARKETING-ONLY paths on bodyrecode.au
 * to their canonical home on performance.bodyrecode.au. Application paths
 * (/book, /portal, /blueprint, /membership, /api/*) MUST NOT redirect; they live
 * here permanently.
 */
const nextConfig: NextConfig = {
  // Externalise the headless-Chromium binary so Vercel's serverless bundler
  // does not try to include /var/task/node_modules/@sparticuz/chromium/bin
  // in the function bundle (which fails at runtime with "input directory
  // does not exist"). @sparticuz/chromium ships its own binary tarball that
  // must be loaded from node_modules at cold-start, not from the bundle.
  // Fix for the 2026-07-20 PDF regression on Foundational Reading download.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],

  async redirects() {
    return [
      // Scorecard: marketing entry lives on the perf domain.
      {
        source: '/scorecard',
        destination: 'https://performance.bodyrecode.au/scorecard',
        permanent: false,
      },

      // Legacy /performance-coaching/* paths -> their new short-URL homes on perf.
      {
        source: '/performance-coaching',
        destination: 'https://performance.bodyrecode.au/',
        permanent: true,
      },
      {
        source: '/performance-coaching/online',
        destination: 'https://performance.bodyrecode.au/online',
        permanent: true,
      },
      {
        source: '/performance-coaching/brisbane',
        destination: 'https://performance.bodyrecode.au/brisbane',
        permanent: true,
      },
      // Long-tail SEO subpaths (strength / fat-loss / personal-training) all collapse
      // to the matching mode page on perf, since those distinctions don't exist there.
      {
        source: '/performance-coaching/:slug(strength|fat-loss|personal-training)/online',
        destination: 'https://performance.bodyrecode.au/online',
        permanent: true,
      },
      {
        source: '/performance-coaching/:slug(strength|fat-loss|personal-training)/brisbane',
        destination: 'https://performance.bodyrecode.au/brisbane',
        permanent: true,
      },

      // Pre-existing keyword aliases. Same destination logic as above.
      { source: '/online-performance-coaching',  destination: 'https://performance.bodyrecode.au/online',    permanent: true },
      { source: '/performance-coach-brisbane',   destination: 'https://performance.bodyrecode.au/brisbane',  permanent: true },
      { source: '/online-strength-coaching',     destination: 'https://performance.bodyrecode.au/online',    permanent: true },
      { source: '/strength-coach-brisbane',      destination: 'https://performance.bodyrecode.au/brisbane', permanent: true },
      { source: '/online-fat-loss-coaching',     destination: 'https://performance.bodyrecode.au/online',    permanent: true },
      { source: '/fat-loss-coach-brisbane',      destination: 'https://performance.bodyrecode.au/brisbane', permanent: true },
      { source: '/online-personal-trainer',      destination: 'https://performance.bodyrecode.au/online',    permanent: true },
      { source: '/personal-trainer-brisbane',    destination: 'https://performance.bodyrecode.au/brisbane', permanent: true },
    ]
  },
};

export default nextConfig;
