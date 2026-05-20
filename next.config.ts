import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
            {
                protocol: "https",
                hostname: "*.cdninstagram.com",
            },
            {
                protocol: "https",
                hostname: "*.instagram.com",
            },
        ],
    },
};

export default nextConfig;