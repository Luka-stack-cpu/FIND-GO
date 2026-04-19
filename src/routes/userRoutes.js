const express = require('express');
const { uploadAvatar } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/avatar', authMiddleware, uploadAvatar);

module.exports = router;