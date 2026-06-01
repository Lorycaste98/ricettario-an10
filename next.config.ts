import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Permette l'accesso al dev server da dispositivi sulla rete locale (hotspot, WiFi)
    allowedDevOrigins: [
        "172.20.10.*",   // hotspot personale iPhone
        "192.168.*",     // WiFi di casa/ufficio
        "10.*",          // altro range privato
    ],
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