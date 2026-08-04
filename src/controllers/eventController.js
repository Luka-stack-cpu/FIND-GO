const { Event, Place, User, Message } = require('../models');
const db = require('../models'); // для прямых SQL-запросов
const { getEventAgeGroupType, getAllowedEventAgeGroups } = require('../utils/ageGroupHelpers');

// ========== СОЗДАТЬ ПОХОД ==========
exports.createEvent = async (req, res) => {
  try {
    const { placeId, datetime, maxParticipants, description, title, category, ageGroup } = req.body;
    const creatorId = req.user.id;
    
    const userAgeGroup = req.user.ageGroup || 'adult';
    const targetAgeGroup = ageGroup || (userAgeGroup === 'teenager' ? '14-16' : '18-21');
    
    // Validate target event ageGroup
    const allowedGroups = getAllowedEventAgeGroups(userAgeGroup);
    if (!allowedGroups.includes(targetAgeGroup)) {
        return res.status(403).json({ message: 'Недопустимая возрастная группа для вашего возраста' });
    }

    const event = await Event.create({
      creatorId,
      placeId,
      title: title || 'Встреча',
      category: category || 'другое',
      ageGroup: targetAgeGroup,
      datetime,
      maxParticipants: maxParticipants || 5,
      description,
      isClubEvent: req.body.isClubEvent || false,
      interestSlug: req.body.interestSlug || null,
      subcategory: req.body.subcategory || null
    });

    // ✅ Добавляем создателя в участники
    await event.addParticipant(creatorId);
    
    res.status(201).json(event);
  } catch (error) {
    console.error('❌ createEvent Error:', error.message);
    res.status(500).json({ message: 'Ошибка при создании события: ' + error.message });
  }
};

// ========== АКТИВНЫЕ ПОХОДЫ (С КОЛИЧЕСТВОМ УЧАСТНИКОВ) ==========
exports.getActiveEvents = async (req, res) => {
  try {
    console.log('🔍 Запрос активных походов...');
    const userAgeGroup = req.user.ageGroup || 'adult';
    const allowedGroups = getAllowedEventAgeGroups(userAgeGroup);

    const events = await Event.findAll({
      where: { 
        status: 'active',
        ageGroup: { [require('sequelize').Op.in]: allowedGroups },
        isClubEvent: false // Исключаем клубные события с главной страницы
      },
      include: [
        {
          model: Place,
          as: 'place',
          attributes: ['id', 'name', 'description', 'image', 'category', 'address']
        },
        { 
          model: User, 
          as: 'creator', 
          attributes: ['id', 'name', 'avatar', 'ageGroup'],
          where: {
            ageGroup: userAgeGroup,
            isHidden: false,
            isBanned: false
          }
        }
      ],
      order: [['datetime', 'ASC']]
    });
    console.log(`✅ Найдено событий: ${events.length}`);
    
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      try {
        const participants = await event.getParticipants();
        const participantsIds = participants.map(p => p.id);

        return {
          ...event.toJSON(),
          participantsCount: participantsIds.length,
          participants: participantsIds
        };
      } catch (innerError) {
        console.error(`⚠️ Ошибка участников для события ${event.id}:`, innerError.message);
        return {
          ...event.toJSON(),
          participantsCount: 0,
          participants: []
        };
      }
    }));
    
    res.json(eventsWithDetails);
  } catch (error) {
    console.error('❌ Ошибка getActiveEvents:', error);
    res.status(500).json({ message: 'Ошибка загрузки событий: ' + error.message });
  }
};

// ========== ПРИСОЕДИНИТЬСЯ К ПОХОДУ (ЧИСТЫЙ SQL) ==========
exports.joinEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const event = await Event.findByPk(eventId, {
      include: [{ model: User, as: 'creator', attributes: ['ageGroup'] }]
    });
    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }

    const userAgeGroup = req.user.ageGroup || 'adult';
    const allowedGroups = getAllowedEventAgeGroups(userAgeGroup);
    if (event.creator.ageGroup !== userAgeGroup || !allowedGroups.includes(event.ageGroup)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    
    // Проверка, не присоединился ли уже
    const isParticipant = await event.hasParticipant(userId);
    if (isParticipant) {
      return res.status(400).json({ message: 'Вы уже присоединились к этому походу' });
    }
    
    // Количество участников
    const participantsCount = await event.countParticipants();
    if (participantsCount >= event.maxParticipants) {
      return res.status(400).json({ message: 'Максимум участников достигнут' });
    }
    
    // Добавляем участника
    await event.addParticipant(userId);
    
    // ✅ Отправляем обновление через Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('global_updates').emit('eventParticipantUpdated', { 
        eventId: parseInt(eventId), 
        participantsCount: participantsCount + 1 
      });
    }
    
    res.json({ 
      ...event.toJSON(),
      participantsCount: participantsCount + 1
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
      include: [{ model: Place, as: 'place', attributes: ['id', 'name', 'description', 'image', 'category', 'address'] }],
      order: [['datetime', 'ASC']]
    });
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      const participants = await event.getParticipants();
      const participantsIds = participants.map(p => p.id);
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
        { model: Place, as: 'place', attributes: ['id', 'name', 'description', 'image', 'category', 'address'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar', 'ageGroup'] }
      ]
    });
    if (!event) {
      return res.status(404).json({ message: 'Поход не найден' });
    }
    
    const userAgeGroup = req.user.ageGroup || 'adult';
    const allowedGroups = getAllowedEventAgeGroups(userAgeGroup);
    if (event.creator.ageGroup !== userAgeGroup || !allowedGroups.includes(event.ageGroup)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    const participantUsers = await event.getParticipants({
      attributes: ['id', 'name', 'avatar', 'ageGroup']
    });
    res.json({
      ...event.toJSON(),
      participantsCount: participantUsers.length,
      participants: participantUsers.map(p => p.id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки похода' });
  }
};

// ========== ПОЛУЧИТЬ УЧАСТНИКОВ ПОХОДА ==========
exports.getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['ageGroup'] }]
    });
    if (!event) return res.status(404).json({ message: 'Событие не найдено' });

    const userAgeGroup = req.user.ageGroup || 'adult';
    if (event.creator.ageGroup !== userAgeGroup) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    const participants = await event.getParticipants({
        attributes: ['id', 'name', 'avatar', 'ageGroup'],
        joinTableAttributes: []
    });
    res.json(participants.filter(p => p.ageGroup === userAgeGroup));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки участников' });
  }
};

// ========== ИСТОРИЯ ЧАТА (С АВАТАРКАМИ) ==========
exports.getEventMessages = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Неверный формат ID чата' });
    }

    const event = await Event.findByPk(eventId, {
      include: [{ model: User, as: 'creator', attributes: ['ageGroup'] }]
    });
    if (!event) {
      return res.status(404).json({ message: 'Поход не найден' });
    }

    const userAgeGroup = req.user.ageGroup || 'adult';
    if (event.creator.ageGroup !== userAgeGroup) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    const messages = await db.sequelize.query(
      `SELECT "Messages".*, "Users".avatar as "userAvatar", "Users".name as "userName" 
       FROM "Messages" 
       JOIN "Users" ON "Messages"."userId" = "Users".id 
       WHERE "Messages"."eventId" = ? 
       ORDER BY "Messages"."createdAt" ASC`,
      { replacements: [eventId], type: db.sequelize.QueryTypes.SELECT }
    );
    res.json(messages);
  } catch (error) {
    console.error('Ошибка в getEventMessages:', error);
    res.status(500).json({ message: 'Ошибка загрузки сообщений. Подробности: ' + error.message });
  }
};

// ========== РЕДАКТИРОВАТЬ ПОХОД ==========
exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { datetime, maxParticipants, description, title, category, ageGroup } = req.body;
    
    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ message: 'Поход не найден' });
    
    // Разрешаем создателю, либо любому участнику личной встречи
    let isAllowed = event.creatorId === userId;
    if (!isAllowed && event.isPersonal) {
      const participants = await event.getParticipants();
      isAllowed = participants.some(p => p.id === userId);
    }
    
    if (!isAllowed) {
      return res.status(403).json({ message: 'Только создатель или участник личного чата может редактировать' });
    }

    if (ageGroup) {
      const allowedGroups = getAllowedEventAgeGroups(req.user.ageGroup || 'adult');
      if (!allowedGroups.includes(ageGroup)) {
        return res.status(403).json({ message: 'Недопустимая возрастная группа для вашего возраста' });
      }
    }
    
    await event.update({ datetime, maxParticipants, description, title, category, ageGroup });
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
    await event.setParticipants([]);
    
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

// ========== ПОХОДЫ ДЛЯ LANDING PAGE (СЛУЧАЙНЫЕ АКТИВНЫЕ + ОБЩЕЕ КОЛИЧЕСТВО) ==========
exports.getLandingEvents = async (req, res) => {
  try {
    const totalEvents = await Event.count({
      where: {
        ageGroup: { [require('sequelize').Op.in]: ['18-21', '21-25', '25-30', '30+', 'adult'] }
      }
    });
    
    const events = await Event.findAll({
      where: { 
        status: 'active',
        ageGroup: { [require('sequelize').Op.in]: ['18-21', '21-25', '25-30', '30+', 'adult'] }
      },
      include: [
        { model: Place, as: 'place', attributes: ['id', 'name', 'description', 'image', 'category', 'address'] },
        { 
          model: User, 
          as: 'creator', 
          attributes: ['id', 'name', 'avatar', 'ageGroup'],
          where: {
            ageGroup: 'adult'
          }
        }
      ]
    });
    
    // Перемешиваем и берем 8 штук
    const shuffled = events.sort(() => 0.5 - Math.random()).slice(0, 8);
    
    const eventsWithDetails = await Promise.all(shuffled.map(async (event) => {
      const participants = await event.getParticipants();
      return {
        ...event.toJSON(),
        participantsCount: participants.length
      };
    }));
    
    res.json({
      totalCount: totalEvents,
      events: eventsWithDetails
    });
  } catch (error) {
    console.error('❌ Ошибка getLandingEvents:', error);
    res.status(500).json({ message: 'Ошибка загрузки событий для лендинга: ' + error.message });
  }
};