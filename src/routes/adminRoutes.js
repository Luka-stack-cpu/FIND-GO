const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Секретный токен — только для разового использования
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'findgo-setup-2026';

router.post('/set-role', async (req, res) => {
    const { token, email, role } = req.body;

    if (!token || token !== ADMIN_SECRET) {
        return res.status(403).json({ message: 'Forbidden: invalid secret token' });
    }

    const allowedRoles = ['user', 'moderator', 'admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Use: ${allowedRoles.join(', ')}` });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: `User not found: ${email}` });
        }

        user.role = role;
        await user.save();

        res.json({
            message: `✅ Role of "${email}" set to "${role}" successfully`,
            userId: user.id,
            name: user.name,
            role: user.role
        });
    } catch (e) {
        console.error('❌ set-role error:', e.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
