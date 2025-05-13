/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BALLDONTLIE_API_KEY: process.env.BALLDONTLIE_API_KEY,
  },
  // Add proper error handling for missing environment variables
  webpack: (config, { isServer }) => {
    // Only check on server startup
    if (isServer && !process.env.BALLDONTLIE_API_KEY) {
      console.error('\x1b[31m%s\x1b[0m', `
        Error: BALLDONTLIE_API_KEY environment variable is not set
        Please create a .env.local file with your API key:
        BALLDONTLIE_API_KEY=your_api_key_here
      `);
      process.exit(1);
    }
    return config;
  },
};

module.exports = nextConfig; 