console.log("DATABASE_URL =", process.env.DATABASE_URL);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// ========== CORS ПОЛНОСТЬЮ ОТКЛЮЧЁН ==========
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['*']
}));

// Дополнительная страховка для всех заголовков
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
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/img', express.static(path.join(__dirname, 'img')));

// ========== ОСНОВНЫЕ МАРШРУТЫ ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/app.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/chats.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chats.html'));
});

app.get('/create-event.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'create-event.html'));
});

app.get('/faq.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});

app.get('/icebreakers.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'icebreakers.html'));
});

// Health check для Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Тестовый маршрут для проверки CORS
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'CORS полностью отключён! Сервер работает на Render',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Создаём папку для загрузок
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Папка uploads создана');
}

// Подключаем модели и маршруты
const db = require('./src/models');

const authRoutes   = require('./src/routes/authRoutes');
const placeRoutes  = require('./src/routes/placeRoutes');
const eventRoutes  = require('./src/routes/eventRoutes');
const inviteRoutes = require('./src/routes/inviteRoutes');
const userRoutes   = require('./src/routes/userRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const dmRoutes = require('./src/routes/dmRoutes');


app.use('/api/auth', authRoutes);
app.use('/api', placeRoutes);
app.use('/api', eventRoutes);
app.use('/api', inviteRoutes);
app.use('/api', userRoutes);
app.use('/api', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', dmRoutes);

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
    console.error('❌ Необработанная ошибка:', err.message);
    res.status(500).json({ message: 'Внутренняя ошибка сервера', error: err.message });
});

const server = http.createServer(app);

console.log("DATABASE_URL =", process.env.DATABASE_URL);

// ========== CORS ДЛЯ SOCKET.IO ПОЛНОСТЬЮ ОТКЛЮЧЁН ==========
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['*'],
        credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
});

const roomUsers = new Map();

io.on('connection', (socket) => {
    console.log('🔌 Новое Socket.IO подключение');
    
    socket.on('joinEvent', (data) => {
        if (!data?.eventId) return;
        const room = `event_${data.eventId}`;
        socket.join(room);

        if (!roomUsers.has(data.eventId)) roomUsers.set(data.eventId, new Set());
        roomUsers.get(data.eventId).add(socket.id);

        socket.eventId = data.eventId;
        socket.userName = data.userName;
        console.log(`📡 Пользователь ${data.userName} присоединился к событию ${data.eventId}`);
    });

    socket.on('sendMessage', async (data) => {
        if (!data?.eventId || !data?.userId || !data?.text) return;
        if (typeof data.text !== 'string' || data.text.trim().length === 0) return;
        if (data.text.length > 2000) return;

        try {
            const message = await db.Message.create({
                eventId: data.eventId,
                userId: data.userId,
                userName: data.userName || 'Аноним',
                text: data.text.trim()
            });
            io.to(`event_${data.eventId}`).emit('newMessage', {
                id: message.id,
                userId: message.userId,
                userName: message.userName,
                text: message.text,
                time: message.createdAt
            });
        } catch (error) {
            console.error('❌ Ошибка сохранения сообщения:', error.message);
        }
    });

    socket.on('typing', (data) => {
        if (!data?.eventId) return;
        socket.to(`event_${data.eventId}`).emit('userTyping', {
            userId: data.userId,
            userName: data.userName
        });
    });

    socket.on('sendPrivateMessage', async (data) => {
        if (!data?.fromUserId || !data?.toUserId || !data?.text) return;
        try {
            const message = await db.PrivateMessage.create({
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                text: data.text.trim(),
                read: false
            });
            
            const msgToClient = {
                id: message.id,
                fromUserId: message.fromUserId,
                toUserId: message.toUserId,
                text: message.text,
                createdAt: message.createdAt,
                sender: {
                    name: data.fromUserName,
                    avatar: data.fromUserAvatar
                }
            };

            io.emit(`private_${data.fromUserId}`, msgToClient);
            io.emit(`private_${data.toUserId}`, msgToClient);
            
            console.log(`📩 Личное сообщение от ${data.fromUserId} к ${data.toUserId}`);
        } catch (error) {
            console.error('❌ Ошибка отправки ЛС:', error.message);
        }
    });

    socket.on('disconnect', () => {
        if (socket.eventId && roomUsers.has(socket.eventId)) {
            roomUsers.get(socket.eventId).delete(socket.id);
            if (roomUsers.get(socket.eventId).size === 0) {
                roomUsers.delete(socket.eventId);
            }
        }
        console.log('🔌 Socket.IO отключение');
    });
});

const start = async () => {
    try {
        // Синхронизируем схему БД — создаём таблицы если их нет
        // Используем { alter: true } только для PostgreSQL (prod), для SQLite — простой sync
        const isProduction = !!process.env.DATABASE_URL;
        try {
            if (isProduction) {
                await db.sequelize.sync({ alter: true });
            } else {
                await db.sequelize.sync();
            }
            console.log('🗄️ База данных синхронизирована');
        } catch (syncErr) {
            console.warn('⚠️ sync с alter не удался, пробуем базовый sync:', syncErr.message);
            await db.sequelize.sync();
            console.log('🗄️ База данных синхронизирована (базовый режим)');
        }

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
            console.log(`📍 Регистрация: http://localhost:${PORT}/register.html`);
            console.log(`🔑 Вход: http://localhost:${PORT}/login.html`);
            console.log(`💬 Чат доступен после создания похода`);
        });
    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', async () => {
    console.log('🛑 Получен SIGTERM, завершаем сервер...');
    server.close(async () => {
        await db.sequelize.close();
        console.log('✅ Сервер остановлен');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('💥 Необработанное исключение:', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Необработанный Promise rejection:', reason);
});

start();
