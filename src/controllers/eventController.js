const { Event, Place, User, Message } = require('../models');
const db = require('../models'); // для доступа к sequelize

// Создать событие
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
    
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при создании события' });
  }
};

// Получить активные события
exports.getActiveEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { status: 'active' },
      include: [
        { model: Place, as: 'place' },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ],
      order: [['datetime', 'ASC']]
    });
    
    const eventsWithCount = await Promise.all(events.map(async (event) => {
      const [result] = await db.sequelize.query(
        'SELECT COUNT(*) as count FROM EventParticipants WHERE EventId = ?',
        { replacements: [event.id], type: db.sequelize.QueryTypes.SELECT }
      );
      const participantsCount = result ? result.count : 0;
      const participantsRows = await db.sequelize.query(
        'SELECT UserId FROM EventParticipants WHERE EventId = ?',
        { replacements: [event.id], type: db.sequelize.QueryTypes.SELECT }
      );
      const participantIds = participantsRows.map(row => row.UserId);
      
      return {
        ...event.toJSON(),
        participantsCount,
        participants: participantIds
      };
    }));
    
    res.json(eventsWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки событий' });
  }
};

// Присоединиться к событию
exports.joinEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }
    
    // Проверяем, не присоединился ли уже
    const [existing] = await db.sequelize.query(
      'SELECT 1 FROM EventParticipants WHERE EventId = ? AND UserId = ?',
      { replacements: [eventId, userId], type: db.sequelize.QueryTypes.SELECT }
    );
    if (existing) {
      return res.status(400).json({ message: 'Вы уже присоединились к этому походу' });
    }
    
    // Считаем текущих участников
    const [countResult] = await db.sequelize.query(
      'SELECT COUNT(*) as count FROM EventParticipants WHERE EventId = ?',
      { replacements: [eventId], type: db.sequelize.QueryTypes.SELECT }
    );
    if (countResult.count >= event.maxParticipants) {
      return res.status(400).json({ message: 'Максимум участников достигнут' });
    }
    
    // Добавляем
    const now = new Date();
    await db.sequelize.query(
      `INSERT INTO EventParticipants (EventId, UserId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?)`,
      { replacements: [eventId, userId, now, now], type: db.sequelize.QueryTypes.INSERT }
    );
    
    // Получаем обновлённый список участников
    const participantsRows = await db.sequelize.query(
      'SELECT UserId FROM EventParticipants WHERE EventId = ?',
      { replacements: [eventId], type: db.sequelize.QueryTypes.SELECT }
    );
    const participantsCount = participantsRows.length;
    const participantIds = participantsRows.map(row => row.UserId);
    
    res.json({
      ...event.toJSON(),
      participantsCount,
      participants: participantIds
    });
  } catch (error) {
    console.error('Ошибка joinEvent:', error);
    res.status(500).json({ message: 'Ошибка при присоединении' });
  }
};

// Редактировать событие
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

// Удалить событие
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Поход не найден' });
    if (event.creatorId !== userId) return res.status(403).json({ message: 'Только создатель может удалить' });
    
    await event.destroy();
    res.json({ message: 'Поход удалён' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка удаления' });
  }
};

// Получить событие по ID (с участниками)
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: Place, as: 'place' },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });
    if (!event) {
      return res.status(404).json({ message: 'Поход не найден' });
    }
    
    const participantsRows = await db.sequelize.query(
      'SELECT UserId FROM EventParticipants WHERE EventId = ?',
      { replacements: [event.id], type: db.sequelize.QueryTypes.SELECT }
    );
    const participantsCount = participantsRows.length;
    const participantIds = participantsRows.map(row => row.UserId);
    
    res.json({
      ...event.toJSON(),
      participantsCount,
      participants: participantIds
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки похода' });
  }
};

// Получить сообщения чата
exports.getEventMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { eventId: req.params.id },
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки сообщений' });
  }
};

// Получить участников события
exports.getEventParticipants = async (req, res) => {
  try {
    const eventId = req.params.id;
    const participantsRows = await db.sequelize.query(
      `SELECT Users.id, Users.name FROM EventParticipants
       JOIN Users ON EventParticipants.UserId = Users.id
       WHERE EventParticipants.EventId = ?`,
      { replacements: [eventId], type: db.sequelize.QueryTypes.SELECT }
    );
    res.json(participantsRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки участников' });
  }
};