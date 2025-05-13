const config = {
  balldontlie: {
    apiKey: process.env.BALLDONTLIE_API_KEY,
    baseUrl: 'https://api.balldontlie.io/v2'
  },
  isServer: typeof window === 'undefined'
};

// Validate required environment variables
if (config.isServer && !config.balldontlie.apiKey) {
  console.error('Required environment variable BALLDONTLIE_API_KEY is not set');
}

export default config; 