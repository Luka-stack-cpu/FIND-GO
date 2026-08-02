const express = require('express');
const router = express.Router();
const { getNewReports, getUserDetailsForMod, closeReport, hideProfile, banUser } = require('../controllers/moderatorController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/moderator/reports', authMiddleware, getNewReports);
router.get('/moderator/users/:id/details', authMiddleware, getUserDetailsForMod);
router.post('/moderator/reports/:id/close', authMiddleware, closeReport);
router.post('/moderator/users/:id/hide', authMiddleware, hideProfile);
router.post('/moderator/users/:id/ban', authMiddleware, banUser);

module.exports = router;
