require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ ИСПРАВЛЕНО: Получаем разрешённые домены из переменной окружения
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://find-go-production.up.railway.app',
        'https://*.railway.app'
    ];

// ✅ ИСПРАВЛЕНО: CORS для Express
app.use(cors({
  origin: function(origin, callback) {
    // Разрешаем запросы без origin (как от curl или мобильных приложений)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => {
      // Поддержка wildcard *.railway.app
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      console.log('❌ CORS блокирует:', origin);
      callback(new Error('CORS: домен не разрешён'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Папка uploads создана');
}

const db = require('./src/models');

const authRoutes   = require('./src/routes/authRoutes');
const placeRoutes  = require('./src/routes/placeRoutes');
const eventRoutes  = require('./src/routes/eventRoutes');
const inviteRoutes = require('./src/routes/inviteRoutes');
const userRoutes   = require('./src/routes/userRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api', placeRoutes);
app.use('/api', eventRoutes);
app.use('/api', inviteRoutes);
app.use('/api', userRoutes);
app.use('/api', notificationRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
    console.error('❌ Необработанная ошибка:', err.message);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

const server = http.createServer(app);

// ✅ ИСПРАВЛЕНО: CORS для Socket.IO
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    allowEIO3: true // Для совместимости
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

async function seedIfEmpty() {
    try {
        const count = await db.Place.count();
        if (count === 0) {
            await db.Place.bulkCreate([
                { name: 'Квест «Тайна старого дома»', description: 'Интерактивный квест в центре Бишкека', category: 'квест' },
                { name: 'Квест «Побег из тюрьмы»', description: 'Адреналиновый квест', category: 'квест' },
                { name: 'Паб «Beer House»', description: 'Крафтовое пиво и спорт', category: 'паб' },
                { name: 'Бар «No Name»', description: 'Авторские коктейли', category: 'паб' },
                { name: 'Ирландский паб «Molly»', description: 'Виски и эль', category: 'паб' },
                { name: 'Кинотеатр «Ала-Тоо»', description: 'Новинки кино', category: 'кино' },
                { name: 'Кинотеатр «Кыргызстан»', description: 'Уютный кинотеатр', category: 'кино' },
                { name: 'Арт-кафе «Старый Баку»', description: 'Живая музыка', category: 'кафе' },
                { name: 'Кофейня «Coffee House»', description: 'Кофе и десерты', category: 'кафе' },
                { name: 'Клуб «Metro»', description: 'Главный ночной клуб', category: 'клуб' },
                { name: 'Клуб «Restobar 12»', description: 'Ресторан и танцы', category: 'клуб' }
            ]);
            console.log('✅ База данных заполнена начальными местами');
        } else {
            console.log(`✅ В базе уже ${count} мест, сид пропущен`);
        }
    } catch (err) {
        console.error('❌ Ошибка при заполнении мест:', err.message);
    }
}

const start = async () => {
    try {
        await db.sequelize.query(`
            CREATE TABLE IF NOT EXISTS EventParticipants (
                EventId INTEGER NOT NULL REFERENCES Events(id),
                UserId INTEGER NOT NULL REFERENCES Users(id),
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL,
                PRIMARY KEY (EventId, UserId)
            );
        `);
        console.log('✅ Таблица EventParticipants создана/проверена');

        await db.sequelize.sync({ alter: false });
        console.log('✅ База данных синхронизирована');

        await seedIfEmpty();

        server.listen(PORT, () => {
            console.log(`✅ Сервер запущен на порту ${PORT}`);
            console.log(`📍 Регистрация: http://localhost:${PORT}/register.html`);
            console.log(`🔑 Вход: http://localhost:${PORT}/login.html`);
            console.log(`💬 Чат доступен после создания похода`);
            console.log(`🌐 Railway URL: ${process.env.RAILWAY_URL || 'не задан'}`);
        });
    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
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