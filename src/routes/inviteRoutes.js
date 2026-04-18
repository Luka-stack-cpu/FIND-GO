const express = require('express');
const { sendInvite, getInvites, acceptInvite, rejectInvite } = require('../controllers/inviteController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/invite', authMiddleware, sendInvite);
router.get('/invites', authMiddleware, getInvites);
router.post('/invite/:id/accept', authMiddleware, acceptInvite);
router.post('/invite/:id/reject', authMiddleware, rejectInvite);

module.exports = router;