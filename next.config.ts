import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Permette l'accesso al dev server da dispositivi sulla rete locale (hotspot, WiFi)
    allowedDevOrigins: [
        "172.20.10.*",   // hotspot personale iPhone
        "192.168.*",     // WiFi di casa/ufficio
        "10.*",          // altro range privato
    ],
    images: {
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
};

export default nextConfig;