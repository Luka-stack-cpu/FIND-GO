const { Event, Place, User, Message } = require('../models');

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
      const participants = await event.getParticipants();
      const participantsCount = participants.length;
      const participantIds = participants.map(p => p.id);
      
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
    
    const participantsCount = await event.countParticipants();
    if (participantsCount >= event.maxParticipants) {
      return res.status(400).json({ message: 'Максимум участников достигнут' });
    }
    
    await event.addParticipant(userId);
    const updatedEvent = await Event.findByPk(eventId, {
      include: [
        { model: Place, as: 'place' },
        { model: User, as: 'participants', attributes: ['id', 'name'] }
      ]
    });
    
    const participantsList = await updatedEvent.getParticipants();
    res.json({
      ...updatedEvent.toJSON(),
      participantsCount: participantsList.length,
      participants: participantsList.map(p => p.id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при присоединении' });
  }
};

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
    
    const participants = await event.getParticipants();
    res.json({
      ...event.toJSON(),
      participantsCount: participants.length,
      participants: participants.map(p => p.id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки похода' });
  }
};

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

exports.getEventParticipants = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Поход не найден' });
        }
        const participants = await event.getParticipants({
            attributes: ['id', 'name']
        });
        res.json(participants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка загрузки участников' });
    }
};