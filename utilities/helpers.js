function getFrontendUrl() {
    // If explicitly set, use it
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
    }

    // In production (Railway), derive from APP_URL or use production domain
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
        // Railway auto-provides RAILWAY_PUBLIC_DOMAIN
        if (process.env.RAILWAY_PUBLIC_DOMAIN) {
            return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
        }
        // Fallback to known production URL
        return 'https://capable-motivation-production-7a75.up.railway.app';
    }

    // Local development
    return 'http://localhost:5173';
}

module.exports = { getFrontendUrl };
