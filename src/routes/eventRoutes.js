const express = require('express');
const {
    createEvent,
    getActiveEvents,
    joinEvent,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventMessages,
    getEventParticipants
} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Порядок важен: специфичные маршруты перед :id
router.get('/events/:id/participants', authMiddleware, getEventParticipants);
router.get('/events/:id/messages',    authMiddleware, getEventMessages);

router.post('/events',                authMiddleware, createEvent);

// Поддерживает ?page=1&limit=20&category=квест&search=...
router.get('/events',                 authMiddleware, getActiveEvents);

router.get('/events/:id',             authMiddleware, getEventById);
router.post('/events/:id/join',       authMiddleware, joinEvent);
router.put('/events/:id',             authMiddleware, updateEvent);
router.delete('/events/:id',          authMiddleware, deleteEvent);

module.exports = router;