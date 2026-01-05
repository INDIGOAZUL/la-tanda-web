const ROLES = require('../constants/roles');
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) return res.status(401).json({ error: 'Unauthorized' });
        if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
        next();
    };
};
module.exports = checkRole;
