require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 8080;

// ПОЛНОСТЬЮ ОТКЛЮЧАЕМ CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.static(__dirname));

// Тестовый маршрут
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server works! CORS is disabled' });
});

// Подключаем ваши маршруты
const db = require('./src/models');
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api', require('./src/routes/placeRoutes'));
app.use('/api', require('./src/routes/eventRoutes'));
app.use('/api', require('./src/routes/inviteRoutes'));
app.use('/api', require('./src/routes/userRoutes'));

const server = http.createServer(app);

// Socket.IO
const io = require('socket.io')(server, { 
    cors: { origin: '*', methods: ['*'] } 
});

const start = async () => {
    try {
        await db.sequelize.sync();
        console.log('✅ Database synced');
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🌐 Visit: /api/test to check`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

start();