const { Event, Place, User, Message } = require('../models');
const db = require('../models'); // для прямых SQL-запросов

// ========== СОЗДАТЬ ПОХОД ==========
exports.createEvent = async (req, res) => {
  try {
    const { placeId, datetime, maxParticipants, description } = req.body;
    const creatorId = req.user.id;
    
    const event = await Event.create({
      creatorId,
      placeId,
      datetime,
      maxParticipants: maxParticipants || 5,
      description
    });

    // ✅ Добавляем создателя в участники
    const now = new Date();
    const dialect = db.sequelize.getDialect();
    if (dialect === 'sqlite') {
      await db.sequelize.query(
        'INSERT OR IGNORE INTO EventParticipants (EventId, UserId, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        { replacements: [event.id, creatorId, now, now] }
      );
    } else {
      await db.sequelize.query(
        'INSERT INTO "EventParticipants" ("EventId", "UserId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
        { replacements: [event.id, creatorId, now, now] }
      );
    }
    
    res.status(201).json(event);
  } catch (error) {
    console.error('❌ createEvent Error:', error.message);
    res.status(500).json({ message: 'Ошибка при создании события: ' + error.message });
  }
};

// ========== АКТИВНЫЕ ПОХОДЫ (С КОЛИЧЕСТВОМ УЧАСТНИКОВ) ==========
exports.getActiveEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { status: 'active' },
      include: [
        { model: Place, as: 'place' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['datetime', 'ASC']]
    });
    
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      const dialect = db.sequelize.getDialect();
      const participantsRows = await db.sequelize.query(
        dialect === 'sqlite' 
          ? 'SELECT UserId FROM EventParticipants WHERE EventId = ?' 
          : 'SELECT "UserId" FROM "EventParticipants" WHERE "EventId" = ?',
        { replacements: [event.id], type: db.sequelize.QueryTypes.SELECT }
      );
      // Поддержка разного регистра в разных БД
      const participantsIds = participantsRows.map(p => Number(p.UserId || p.userid || p.UserID));
      return {
        ...event.toJSON(),
        participantsCount: participantsIds.length,
        participants: participantsIds
      };
    }));
    
    res.json(eventsWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки событий' });
  }
};

// ========== ПРИСОЕДИНИТЬСЯ К ПОХОДУ (ЧИСТЫЙ SQL) ==========
exports.joinEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }
    
    // Проверка, не присоединился ли уже
    const existing = await db.sequelize.query(
      'SELECT 1 FROM EventParticipants WHERE EventId = ? AND UserId = ? LIMIT 1',
      { replacements: [eventId, userId], type: db.sequelize.QueryTypes.SELECT }
    );
    if (existing.length) {
      return res.status(400).json({ message: 'Вы уже присоединились к этому походу' });
    }
    
    // Количество участников
    const [countResult] = await db.sequelize.query(
      'SELECT COUNT(*) as count FROM EventParticipants WHERE EventId = ?',
      { replacements: [eventId], type: db.sequelize.QueryTypes.SELECT }
    );
    if (countResult.count >= event.maxParticipants) {
      return res.status(400).json({ message: 'Максимум участников достигнут' });
    }
    
    // Добавляем участника (с учетом диалекта БД)
    const now = new Date();
    const dialect = db.sequelize.getDialect();
    
    if (dialect === 'sqlite') {
      await db.sequelize.query(
        `INSERT OR IGNORE INTO EventParticipants (EventId, UserId, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
        { replacements: [eventId, userId, now, now] }
      );
    } else {
      await db.sequelize.query(
        `INSERT INTO "EventParticipants" ("EventId", "UserId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`,
        { replacements: [eventId, userId, now, now] }
      );
    }
    
    res.json({ 
      ...event.toJSON(),
      participantsCount: countResult.count + 1
    });
  } catch (error) {
    console.error('❌ joinEvent Error:', error.message);
    res.status(500).json({ message: 'Ошибка при присоединении: ' + error.message });
  }
};

// ========== МОИ ПОХОДЫ (СОЗДАННЫЕ) ==========
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { creatorId: req.user.id },
      include: [{ model: Place, as: 'place' }],
      order: [['datetime', 'ASC']]
    });
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      const dialect = db.sequelize.getDialect();
      const participantsRows = await db.sequelize.query(
        dialect === 'sqlite' 
          ? 'SELECT UserId FROM EventParticipants WHERE EventId = ?' 
          : 'SELECT "UserId" FROM "EventParticipants" WHERE "EventId" = ?',
        { replacements: [event.id], type: db.sequelize.QueryTypes.SELECT }
      );
      const participantsIds = participantsRows.map(p => Number(p.UserId || p.userid || p.UserID));
      return {
        ...event.toJSON(),
        participantsCount: participantsIds.length,
        participants: participantsIds
      };
    }));
    
    res.json(eventsWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки походов пользователя' });
  }
};

// ========== ПОЛУЧИТЬ ПОХОД ПО ID (С УЧАСТНИКАМИ) ==========
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Place, as: 'place' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] }
      ]
    });
    if (!event) {
      return res.status(404).json({ message: 'Поход не найден' });
    }
    
    const dialect = db.sequelize.getDialect();
    const participants = await db.sequelize.query(
      dialect === 'sqlite' 
        ? 'SELECT UserId FROM EventParticipants WHERE EventId = ?' 
        : 'SELECT "UserId" FROM "EventParticipants" WHERE "EventId" = ?',
      { replacements: [event.id], type: db.sequelize.QueryTypes.SELECT }
    );
    res.json({
      ...event.toJSON(),
      participantsCount: participants.length,
      participants: participants.map(p => Number(p.UserId || p.userid || p.UserID))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки похода' });
  }
};

// ========== ПОЛУЧИТЬ УЧАСТНИКОВ ПОХОДА ==========
exports.getEventParticipants = async (req, res) => {
  try {
    const dialect = db.sequelize.getDialect();
    const participants = await db.sequelize.query(
      dialect === 'sqlite'
        ? `SELECT Users.id, Users.name, Users.avatar FROM EventParticipants
           JOIN Users ON EventParticipants.UserId = Users.id
           WHERE EventParticipants.EventId = ?`
        : `SELECT "Users"."id", "Users"."name", "Users"."avatar" FROM "EventParticipants"
           JOIN "Users" ON "EventParticipants"."UserId" = "Users"."id"
           WHERE "EventParticipants"."EventId" = ?`,
      { replacements: [req.params.id], type: db.sequelize.QueryTypes.SELECT }
    );
    res.json(participants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки участников' });
  }
};

// ========== ИСТОРИЯ ЧАТА (С АВАТАРКАМИ) ==========
exports.getEventMessages = async (req, res) => {
  try {
    const messages = await db.sequelize.query(
      `SELECT Messages.*, Users.avatar as userAvatar, Users.name as userName 
       FROM Messages 
       JOIN Users ON Messages.userId = Users.id 
       WHERE Messages.eventId = ? 
       ORDER BY Messages.createdAt ASC`,
      { replacements: [req.params.id], type: db.sequelize.QueryTypes.SELECT }
    );
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки сообщений' });
  }
};

// ========== РЕДАКТИРОВАТЬ ПОХОД ==========
exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { datetime, maxParticipants, description } = req.body;
    
    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Поход не найден' });
    if (event.creatorId !== userId) return res.status(403).json({ message: 'Только создатель может редактировать' });
    
    await event.update({ datetime, maxParticipants, description });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка редактирования' });
  }
};

// ========== УДАЛИТЬ ПОХОД ==========
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Поход не найден' });
    if (event.creatorId !== userId) return res.status(403).json({ message: 'Только создатель может удалить' });
    
    // Вручную удаляем все связанные записи, чтобы избежать ошибок Foreign Key Constraint
    const dialect = db.sequelize.getDialect();
    await db.sequelize.query(
      dialect === 'sqlite' ? 'DELETE FROM EventParticipants WHERE EventId = ?' : 'DELETE FROM "EventParticipants" WHERE "EventId" = ?',
      { replacements: [eventId] }
    );
    
    // Пытаемся удалить связанные данные, если модели загружены
    try {
        if (db.Review) await db.Review.destroy({ where: { eventId } });
        if (db.Message) await db.Message.destroy({ where: { eventId } });
        if (db.Invite) await db.Invite.destroy({ where: { eventId } });
    } catch(err) {
        console.warn('Не удалось удалить некоторые связанные данные похода:', err);
    }

    await event.destroy();
    res.json({ message: 'Поход удален' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка удаления похода' });
  }
};

// ========== ЗАВЕРШИТЬ ПОХОД ==========
exports.completeEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Поход не найден' });
    if (event.creatorId !== userId) return res.status(403).json({ message: 'Только создатель может завершить поход' });
    if (event.status === 'completed') return res.status(400).json({ message: 'Поход уже завершен' });

    // Проверяем, наступило ли время похода
    if (new Date(event.datetime) > new Date()) {
      return res.status(400).json({ message: 'Нельзя завершить поход, время которого еще не наступило' });
    }

    event.status = 'completed';
    await event.save();

    res.json({ message: 'Поход успешно завершен', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при завершении похода' });
  }
};