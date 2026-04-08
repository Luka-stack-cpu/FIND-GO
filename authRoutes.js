const express = require('express');
const { register, login, getProfile, updateInterests, getInterests } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/interests', authMiddleware, updateInterests);
router.get('/interests/all', authMiddleware, getInterests);

module.exports = router;