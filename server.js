require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

// ============================================================
// ИСПРАВЛЕНИЕ #1: userRoutes подключался ДО инициализации db
// Теперь все require идут в правильном порядке
// ============================================================

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// ИСПРАВЛЕНИЕ #2: CORS — в продакшене нельзя origin: '*'
// Берём разрешённый origin из .env
// ============================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Разрешаем запросы без origin (Postman, мобильные) и разрешённые домены
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS: домен не разрешён'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '1mb' })); // защита от огромных тел запроса
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// ИСПРАВЛЕНИЕ #3: Папка uploads — создаём безопасно
// ============================================================
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Папка uploads создана');
}

// ============================================================
// База данных и маршруты — после настройки app
// ============================================================
const db = require('./src/models');

const authRoutes   = require('./src/routes/authRoutes');
const placeRoutes  = require('./src/routes/placeRoutes');
const eventRoutes  = require('./src/routes/eventRoutes');
const inviteRoutes = require('./src/routes/inviteRoutes');
const userRoutes   = require('./src/routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api', placeRoutes);
app.use('/api', eventRoutes);
app.use('/api', inviteRoutes);
app.use('/api', userRoutes);

// ============================================================
// Health-check для Render (важно — без авторизации)
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// Глобальный обработчик ошибок Express
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Необработанная ошибка:', err.message);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

// ============================================================
// Socket.IO
// ============================================================
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        // ИСПРАВЛЕНИЕ #4: в продакшене указывать конкретный origin
        origin: process.env.ALLOWED_ORIGINS || '*',
        methods: ['GET', 'POST']
    }
});

// ИСПРАВЛЕНИЕ #5: Отслеживаем комнаты для предотвращения утечек памяти
const roomUsers = new Map(); // eventId → Set of socketIds

io.on('connection', (socket) => {

    socket.on('joinEvent', (data) => {
        if (!data?.eventId) return;
        const room = `event_${data.eventId}`;
        socket.join(room);

        // Отслеживаем пользователя в комнате
        if (!roomUsers.has(data.eventId)) roomUsers.set(data.eventId, new Set());
        roomUsers.get(data.eventId).add(socket.id);

        // Сохраняем для disconnect
        socket.eventId = data.eventId;
        socket.userName = data.userName;
    });

    socket.on('sendMessage', async (data) => {
        // ИСПРАВЛЕНИЕ #6: валидация данных сообщения
        if (!data?.eventId || !data?.userId || !data?.text) return;
        if (typeof data.text !== 'string' || data.text.trim().length === 0) return;
        if (data.text.length > 2000) return; // защита от огромных сообщений

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

    // Индикатор набора текста
    socket.on('typing', (data) => {
        if (!data?.eventId) return;
        socket.to(`event_${data.eventId}`).emit('userTyping', {
            userId: data.userId,
            userName: data.userName
        });
    });

    socket.on('disconnect', () => {
        // Очищаем из отслеживания комнат
        if (socket.eventId && roomUsers.has(socket.eventId)) {
            roomUsers.get(socket.eventId).delete(socket.id);
            if (roomUsers.get(socket.eventId).size === 0) {
                roomUsers.delete(socket.eventId);
            }
        }
    });
});

// ============================================================
// Автозаполнение базы данных если она пустая (для Render)
// ============================================================
async function seedIfEmpty() {
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
    }
}

// ============================================================
// Запуск сервера с graceful shutdown
// ============================================================
const start = async () => {
    try {
        // ИСПРАВЛЕНИЕ #7: alter:true вместо force:true — не удаляет данные
        await db.sequelize.sync({ alter: true });
        console.log('✅ База данных синхронизирована');

        await seedIfEmpty();

        server.listen(PORT, () => {
            console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Ошибка при запуске:', error.message);
        process.exit(1);
    }
};

// ИСПРАВЛЕНИЕ #8: Graceful shutdown — корректное завершение при SIGTERM (Render)
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
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Необработанный Promise rejection:', reason);
});

start();