const express = require('express');
const { register, login, getProfile, updateInterests, getInterests } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/interests', authMiddleware, updateInterests);
router.get('/interests/all', authMiddleware, getInterests);
router.get('/users/:id', authMiddleware, async (req, res) => {
    const { User } = require('../models');
    const u = await User.findByPk(req.params.id, { attributes: ['id','name','interests'] });
    if (!u) return res.status(404).json({ message: 'Не найден' });
    res.json(u);
});
router.get('/users', authMiddleware, async (req, res) => {
    const { User } = require('../models');
    const users = await User.findAll({ 
        attributes: ['id', 'name', 'interests'],
        where: { id: { [require('sequelize').Op.ne]: req.user.id } }
    });
    res.json(users);
});

module.exports = router;