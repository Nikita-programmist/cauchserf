/** @type {import('next').NextConfig} */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:8000';

module.exports = {
  async rewrites() {
    const target = API_PROXY_TARGET.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`
      }
    ];
  }
};
