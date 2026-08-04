const express = require('express');
const {
    register,
    login,
    getProfile,
    updateInterests,
    getInterests,
    getUserById,
    telegramAuth,
    googleLogin,
    googleCallback,
    completeProfile
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Публичные маршруты
router.post('/register', register);
router.post('/login',    login);
router.get('/google',    googleLogin);
router.get('/google/callback', googleCallback);
router.get('/telegram',  telegramAuth);

// Приватные маршруты (требуют токен)
router.get('/profile',           authMiddleware, getProfile);
router.put('/complete-profile',  authMiddleware, completeProfile);
router.put('/interests',         authMiddleware, updateInterests);
router.get('/interests/all',     authMiddleware, getInterests);

// НОВЫЙ: профиль другого пользователя (без email)
router.get('/users/:id',         authMiddleware, getUserById);

module.exports = router;