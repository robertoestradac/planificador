/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['react-icons'],
  
  // Optimizaciones de compilación
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimización de imágenes
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  
  // Optimización de producción
  productionBrowserSourceMaps: false,
  
  // Optimización de webpack
  webpack: (config, { dev, isServer }) => {
    // Reducir el tamaño del bundle
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };

    // En producción, desactivar el cache persistente en disco de webpack
    // para evitar que `.next/cache/webpack` crezca a varios GB entre builds.
    // El cache sólo acelera rebuilds locales; no se usa en runtime ni se despliega.
    if (!dev) {
      config.cache = false;
    }

    return config;
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
