//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Nx configuration
  nx: {},

  // ============================================================================
  // IMAGE OPTIMIZATION
  // ============================================================================
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
  },

  // ============================================================================
  // COMPRESSION & PERFORMANCE
  // ============================================================================
  compress: true,
  productionBrowserSourceMaps: false,

  // ============================================================================
  // SECURITY HEADERS
  // ============================================================================
  async headers() {
    const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: isProd ? 'max-age=63072000; includeSubDomains; preload' : 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: isProd
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://googleapis.com https://*.supabase.co"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com http://localhost:*; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http://localhost:*; font-src 'self' data:; connect-src 'self' https://googleapis.com https://*.supabase.co http://localhost:*",
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ============================================================================
  // REDIRECTS & REWRITES
  // ============================================================================
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // ============================================================================
  // WEBPACK OPTIMIZATION
  // ============================================================================
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // React libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react-vendors',
            priority: 30,
            reuseExistingChunk: true,
          },
          // UI libraries
          ui: {
            test: /[\\/]node_modules[\\/](framer-motion|clsx)[\\/]/,
            name: 'ui-vendors',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Shared library code
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    };
    return config;
  },

  // ============================================================================
  // ENVIRONMENT VARIABLES
  // ============================================================================
  env: {
    // This is for webpack bundling, use NEXT_PUBLIC_* for client-side
    NEXT_BUILD_ID: process.env.NEXT_BUILD_ID || new Date().getTime().toString(),
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES
  // ============================================================================
  experimental: {
    esmExternals: true,
  },

  // ============================================================================
  // INTERNATIONALIZATION (Future)
  // ============================================================================
  i18n: undefined, // Not used with App Router
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
