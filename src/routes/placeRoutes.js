const express = require('express');
const { getPlaces, getPlacesByCategory, getAllUsersInterests, voteSafety, checkCanVote } = require('../controllers/placeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/places', authMiddleware, getPlaces);
router.get('/places/category/:category', authMiddleware, getPlacesByCategory);
router.get('/users/interests', authMiddleware, getAllUsersInterests);
router.get('/places/:id/can-vote', authMiddleware, checkCanVote);
router.post('/places/:id/vote', authMiddleware, voteSafety);

module.exports = router;