const express = require('express');
const { uploadAvatar, updateProfile, adminUpdateUserAge } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/avatar — загрузка аватара
router.post('/avatar', authMiddleware, uploadAvatar);

// PUT /api/user/profile — обновление bio (факты о себе)
router.put('/user/profile', authMiddleware, updateProfile);

// PUT /api/admin/users/:id/birthday — изменение даты рождения только администратором
router.put('/admin/users/:id/birthday', authMiddleware, adminUpdateUserAge);

module.exports = router;