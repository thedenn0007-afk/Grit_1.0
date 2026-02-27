/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // appDir is enabled by default in Next 14

  // Expose environment variables to server-side code
  env: {
    // Gemini API key - only available on server
    // Access via: process.env.GEMINI_API_KEY
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};

module.exports = nextConfig;
