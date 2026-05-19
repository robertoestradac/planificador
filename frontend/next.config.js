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
  // remotePatterns es deliberadamente restrictivo. Para añadir hosts CDN
  // (S3, Cloudinary, etc.) hay que listarlos explícitamente vía env y
  // serializarlos en NEXT_PUBLIC_IMAGE_HOSTS="cdn.foo.com,bucket.bar.com".
  images: (() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    let apiHostname = 'localhost';
    let apiProtocol = 'http';
    let apiPort = '';
    try {
      const u = new URL(apiUrl);
      apiHostname = u.hostname;
      apiProtocol = u.protocol.replace(':', '');
      apiPort = u.port || '';
    } catch {
      /* fallback to defaults */
    }

    const extraHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || '')
      .split(',').map(h => h.trim()).filter(Boolean);

    return {
      formats: ['image/webp'],
      minimumCacheTTL: 60,
      remotePatterns: [
        // API que sirve /uploads/**
        {
          protocol: apiProtocol,
          hostname: apiHostname,
          port: apiPort,
          pathname: '/uploads/**',
        },
        // Hosts adicionales (CDN propio) declarados explícitamente
        ...extraHosts.map(host => ({ protocol: 'https', hostname: host })),
      ],
    };
  })(),
  
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
