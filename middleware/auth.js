const { supabase } = require('../utilities/supabase');

// Auth middleware
async function verifyAuth(req, res, next) {
    // Skip auth check if Supabase not configured (development mode)
    if (!supabase) {
        req.user = { id: 'dev-user', email: 'dev@example.com' };
        return next();
    }

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No authorization token provided'
            });
        }

        const token = authHeader.substring(7);

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email
        };

        next();
    } catch (error) {
        console.error('Auth verification error:', error);
        res.status(401).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

module.exports = { verifyAuth, supabase };
