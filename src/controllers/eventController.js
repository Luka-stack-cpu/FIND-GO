const { Event, Place, User, Message } = require('../models');
const { Op } = require('sequelize');

// ============================================================
// ИСПРАВЛЕНИЕ #1: Убрали все сырые SQL-запросы (db.sequelize.query)
// Заменили на нормальные Sequelize методы через ассоциацию
// Это безопаснее и читаемее
// ============================================================

// Вспомогательная функция — форматирует событие с участниками
async function formatEvent(event) {
    const participants = await event.getParticipants({ attributes: ['id'] });
    return {
        ...event.toJSON(),
        participantsCount: participants.length,
        participants: participants.map(p => p.id)
    };
}

// ============================================================
// Создать событие
// ============================================================
exports.createEvent = async (req, res) => {
    try {
        const { placeId, datetime, maxParticipants, description } = req.body;

        // Валидация
        if (!placeId || !datetime) {
            return res.status(400).json({ message: 'Укажите место и дату' });
        }
        const parsedMax = parseInt(maxParticipants);
        if (isNaN(parsedMax) || parsedMax < 2 || parsedMax > 100) {
            return res.status(400).json({ message: 'Количество участников: от 2 до 100' });
        }

        // ИСПРАВЛЕНИЕ #2: проверяем что место существует
        const place = await Place.findByPk(placeId);
        if (!place) return res.status(404).json({ message: 'Место не найдено' });

        // ИСПРАВЛЕНИЕ #3: дата не должна быть в прошлом
        if (new Date(datetime) < new Date()) {
            return res.status(400).json({ message: 'Дата не может быть в прошлом' });
        }

        const event = await Event.create({
            creatorId: req.user.id,
            placeId,
            datetime,
            maxParticipants: parsedMax,
            description: description?.substring(0, 500) || ''
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('❌ createEvent:', error.message);
        res.status(500).json({ message: 'Ошибка при создании события' });
    }
};

// ============================================================
// Получить активные события (с пагинацией)
// НОВОЕ: ?page=1&limit=10&category=квест&search=текст
// ============================================================
exports.getActiveEvents = async (req, res) => {
    try {
        const page     = Math.max(1, parseInt(req.query.page)  || 1);
        const limit    = Math.min(50, parseInt(req.query.limit) || 20);
        const offset   = (page - 1) * limit;
        const category = req.query.category || null;
        const search   = req.query.search   || null;

        // Строим условия фильтрации
        const whereEvent = { status: 'active' };
        const wherePlace = {};
        if (category) wherePlace.category = category;
        if (search)   wherePlace.name = { [Op.like]: `%${search}%` };

        const { count, rows: events } = await Event.findAndCountAll({
            where: whereEvent,
            include: [
                {
                    model: Place,
                    as: 'place',
                    where: Object.keys(wherePlace).length ? wherePlace : undefined
                },
                { model: User, as: 'creator', attributes: ['id', 'name'] }
            ],
            order: [['datetime', 'ASC']],
            limit,
            offset
        });

        // ИСПРАВЛЕНИЕ #4: один запрос на участников через getParticipants
        // вместо N raw SQL запросов (N+1 проблема частично)
        const eventsWithParticipants = await Promise.all(
            events.map(event => formatEvent(event))
        );

        res.json({
            events: eventsWithParticipants,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('❌ getActiveEvents:', error.message);
        res.status(500).json({ message: 'Ошибка загрузки событий' });
    }
};

// ============================================================
// Присоединиться к событию
// ============================================================
exports.joinEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const userId  = req.user.id;

        const event = await Event.findByPk(eventId, {
            include: [{ model: Place, as: 'place' }]
        });
        if (!event) return res.status(404).json({ message: 'Событие не найдено' });
        if (event.status !== 'active') {
            return res.status(400).json({ message: 'Поход уже неактивен' });
        }

        // ИСПРАВЛЕНИЕ #5: используем Sequelize метод вместо raw INSERT
        const participants = await event.getParticipants({ where: { id: userId } });
        if (participants.length > 0) {
            return res.status(400).json({ message: 'Вы уже присоединились к этому походу' });
        }

        const allParticipants = await event.getParticipants({ attributes: ['id'] });
        if (allParticipants.length >= event.maxParticipants) {
            return res.status(400).json({ message: 'В походе нет свободных мест' });
        }

        await event.addParticipant(userId);

        const updatedParticipants = await event.getParticipants({ attributes: ['id'] });
        res.json({
            ...event.toJSON(),
            participantsCount: updatedParticipants.length,
            participants: updatedParticipants.map(p => p.id)
        });
    } catch (error) {
        console.error('❌ joinEvent:', error.message);
        res.status(500).json({ message: 'Ошибка при присоединении' });
    }
};

// ============================================================
// Редактировать событие
// ============================================================
exports.updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const { datetime, maxParticipants, description } = req.body;

        const event = await Event.findByPk(eventId);
        if (!event) return res.status(404).json({ message: 'Поход не найден' });
        if (event.creatorId !== req.user.id) {
            return res.status(403).json({ message: 'Только создатель может редактировать' });
        }

        // Проверяем что нельзя уменьшить maxParticipants ниже текущего числа участников
        if (maxParticipants) {
            const participants = await event.getParticipants({ attributes: ['id'] });
            if (parseInt(maxParticipants) < participants.length) {
                return res.status(400).json({
                    message: `Нельзя уменьшить до ${maxParticipants} — уже ${participants.length} участников`
                });
            }
        }

        await event.update({
            datetime: datetime || event.datetime,
            maxParticipants: maxParticipants ? parseInt(maxParticipants) : event.maxParticipants,
            description: description?.substring(0, 500) ?? event.description
        });

        res.json(event);
    } catch (error) {
        console.error('❌ updateEvent:', error.message);
        res.status(500).json({ message: 'Ошибка редактирования' });
    }
};

// ============================================================
// Удалить событие
// ============================================================
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);

        const event = await Event.findByPk(eventId);
        if (!event) return res.status(404).json({ message: 'Поход не найден' });
        if (event.creatorId !== req.user.id) {
            return res.status(403).json({ message: 'Только создатель может удалить' });
        }

        await event.destroy();
        res.json({ message: 'Поход удалён' });
    } catch (error) {
        console.error('❌ deleteEvent:', error.message);
        res.status(500).json({ message: 'Ошибка удаления' });
    }
};

// ============================================================
// Получить событие по ID
// ============================================================
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id, {
            include: [
                { model: Place, as: 'place' },
                { model: User, as: 'creator', attributes: ['id', 'name'] }
            ]
        });
        if (!event) return res.status(404).json({ message: 'Поход не найден' });

        res.json(await formatEvent(event));
    } catch (error) {
        console.error('❌ getEventById:', error.message);
        res.status(500).json({ message: 'Ошибка загрузки похода' });
    }
};

// ============================================================
// Получить сообщения чата
// ============================================================
exports.getEventMessages = async (req, res) => {
    try {
        // ИСПРАВЛЕНИЕ #6: проверяем что пользователь является участником
        // прежде чем отдавать сообщения чата
        const eventId = parseInt(req.params.id);
        const event = await Event.findByPk(eventId);
        if (!event) return res.status(404).json({ message: 'Поход не найден' });

        const isCreator     = event.creatorId === req.user.id;
        const participants  = await event.getParticipants({ where: { id: req.user.id } });
        const isParticipant = participants.length > 0;

        if (!isCreator && !isParticipant) {
            return res.status(403).json({ message: 'Вы не являетесь участником этого похода' });
        }

        const messages = await Message.findAll({
            where: { eventId },
            order: [['createdAt', 'ASC']],
            limit: 200 // не грузим слишком много
        });
        res.json(messages);
    } catch (error) {
        console.error('❌ getEventMessages:', error.message);
        res.status(500).json({ message: 'Ошибка загрузки сообщений' });
    }
};

// ============================================================
// Получить участников события
// ============================================================
exports.getEventParticipants = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) return res.status(404).json({ message: 'Поход не найден' });

        const participants = await event.getParticipants({
            attributes: ['id', 'name', 'avatar']
        });

        // Форматируем аватарки
        const formatted = participants.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar && p.avatar.startsWith('http')
                ? p.avatar
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`
        }));

        res.json(formatted);
    } catch (error) {
        console.error('❌ getEventParticipants:', error.message);
        res.status(500).json({ message: 'Ошибка загрузки участников' });
    }
};