require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const userRoutes = require('./src/routes/userRoutes');


console.log('1. Начало загрузки модулей...');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('2. Подключение к базе данных...');
const db = require('./src/models');
console.log('3. База данных подключена');

console.log('4. Подключение маршрутов...');
const authRoutes = require('./src/routes/authRoutes');
const placeRoutes = require('./src/routes/placeRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const inviteRoutes = require('./src/routes/inviteRoutes');
console.log('5. Маршруты подключены');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api', placeRoutes);
app.use('/api', eventRoutes);
app.use('/api', inviteRoutes);
app.use('/api', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Сервер работает!' });
});

console.log('6. Настройка Socket.IO...');
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('🔌 Новый пользователь подключился');
  socket.on('joinEvent', (data) => {
    socket.join(`event_${data.eventId}`);
    console.log(`📢 Пользователь ${data.userName} присоединился к комнате event_${data.eventId}`);
  });
  socket.on('sendMessage', async (data) => {
    try {
      const message = await db.Message.create({
        eventId: data.eventId,
        userId: data.userId,
        userName: data.userName,
        text: data.text
      });
      io.to(`event_${data.eventId}`).emit('newMessage', {
        id: message.id,
        userId: message.userId,
        userName: message.userName,
        text: message.text,
        time: message.createdAt
      });
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
    }
  });
  socket.on('disconnect', () => {
    console.log('🔌 Пользователь отключился');
  });
});

const start = async () => {
  try {
    console.log('7. Синхронизация с базой данных...');
    await db.sequelize.sync();
    console.log('8. Синхронизация завершена');
    
    server.listen(PORT, () => {
      console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
      console.log(`📍 Регистрация: http://localhost:${PORT}/register.html`);
      console.log(`🔑 Вход: http://localhost:${PORT}/login.html`);
      console.log(`💬 Чат доступен после создания похода`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске:', error);
    console.error('Детали ошибки:', error.message);
    if (error.original) console.error('Оригинальная ошибка:', error.original.message);
  }
};

console.log('9. Запуск сервера...');
start();