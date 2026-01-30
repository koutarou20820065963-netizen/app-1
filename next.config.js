const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development', // Disable in dev to avoid aggressive caching issues
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: {
        appIsrStatus: false,
        buildActivity: false,
    },
    reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
