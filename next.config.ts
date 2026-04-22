import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok / tunnel hosts during dev so HMR works over the tunnel.
  // Wildcards cover rotating ngrok subdomains.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
