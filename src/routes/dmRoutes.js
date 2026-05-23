const express = require('express');
const router = express.Router();
const dmController = require('../controllers/dmController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dms/conversations', authMiddleware, dmController.getConversations);
router.get('/dms/chat/:userId', authMiddleware, dmController.getChatHistory);

module.exports = router;
