const { Invite, User, Event, Place } = require('../models');
const db = require('../models');
const { createNotification } = require('./notificationController');

// ✅ БАГ 5: Отправить приглашение — создаём уведомление получателю
exports.sendInvite = async (req, res) => {
    try {
        const { toUserId, eventId, placeName, placeId } = req.body;
        const fromUserId = req.user.id;

        if (!toUserId || !placeName) {
            return res.status(400).json({ message: 'Не указан получатель или место' });
        }

        const existing = await Invite.findOne({
            where: { fromUserId, toUserId, status: 'pending', eventId: eventId || null }
        });
        if (existing) {
            return res.status(400).json({ message: 'Приглашение уже отправлено' });
        }

        const invite = await Invite.create({ fromUserId, toUserId, eventId: eventId || null, placeName, placeId });

        // ✅ БАГ 5: создаём уведомление для получателя
        const sender = await User.findByPk(fromUserId, { attributes: ['name'] });
        await createNotification(
            toUserId,
            '📩 Новое приглашение',
            `${sender?.name || 'Пользователь'} приглашает тебя в "${placeName}"`,
            'invite',
            '/'
        );

        res.status(201).json(invite);
    } catch (error) {
        console.error('❌ sendInvite:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке приглашения' });
    }
};

// ✅ БАГ 3: acceptInvite теперь возвращает eventId и eventPlaceName
exports.acceptInvite = async (req, res) => {
    try {
        const inviteId = req.params.id;
        const userId = req.user.id;

        const invite = await Invite.findByPk(inviteId);
        if (!invite) return res.status(404).json({ message: 'Приглашение не найдено' });
        if (invite.toUserId !== userId) return res.status(403).json({ message: 'Не ваше приглашение' });

        let eventId = invite.eventId;
        let eventPlaceName = invite.placeName;

        const now = new Date();

        let event;
        // Если это персональное приглашение (eventId == null), создаём персональное событие
        if (!eventId) {
            event = await Event.create({
                creatorId: invite.fromUserId,
                placeId: invite.placeId || 1, // Если нет ID, используем 1
                datetime: now,
                maxParticipants: 2,
                description: `Персональный чат: ${invite.placeName}`,
                isPersonal: true
            });
            eventId = event.id;
            
            // Добавляем отправителя приглашения в участники
            await event.addParticipant(invite.fromUserId);
        } else {
            event = await Event.findByPk(eventId);
        }

        // Добавляем текущего пользователя (кто принял) в участники
        if (event) {
            await event.addParticipant(userId);
        }

        invite.status = 'accepted';
        invite.eventId = eventId; // Привязываем созданное событие к приглашению
        await invite.save();

        // ✅ БАГ 5: уведомляем обоих пользователей о создании чата
        const acceptor = await User.findByPk(userId, { attributes: ['name'] });
        const sender = await User.findByPk(invite.fromUserId, { attributes: ['name'] });
        
        await createNotification(
            invite.fromUserId,
            '✅ Приглашение принято',
            `${acceptor?.name || 'Пользователь'} принял твоё приглашение в "${eventPlaceName}"`,
            'accepted',
            `/chat.html?eventId=${eventId}`
        );

        // Уведомление для того, кто принял (чтобы у него осталась ссылка)
        await createNotification(
            userId,
            '🤝 Встреча подтверждена',
            `Вы приняли приглашение от ${sender?.name || 'Пользователя'} в "${eventPlaceName}". Чат создан!`,
            'accepted',
            `/chat.html?eventId=${eventId}`
        );

        res.json({
            message: 'Приглашение принято! Чат создан.',
            eventId,
            eventPlaceName
        });
    } catch (error) {
        console.error('❌ acceptInvite:', error.message);
        res.status(500).json({ message: 'Ошибка при принятии приглашения' });
    }
};

// Отклонить приглашение
exports.rejectInvite = async (req, res) => {
    try {
        const inviteId = req.params.id;
        const invite = await Invite.findByPk(inviteId);
        if (!invite) return res.status(404).json({ message: 'Приглашение не найдено' });
        if (invite.toUserId !== req.user.id) return res.status(403).json({ message: 'Доступ запрещён' });

        invite.status = 'rejected';
        await invite.save();
        res.json({ message: 'Приглашение отклонено' });
    } catch (error) {
        console.error('❌ rejectInvite:', error.message);
        res.status(500).json({ message: 'Ошибка при отклонении приглашения' });
    }
};

// Получить все приглашения
exports.getInvites = async (req, res) => {
    try {
        const userId = req.user.id;
        const incoming = await Invite.findAll({
            where: { toUserId: userId, status: 'pending' },
            include: [{ model: User, as: 'fromUser', attributes: ['id', 'name', 'avatar'] }]
        });
        const outgoing = await Invite.findAll({
            where: { fromUserId: userId },
            include: [{ model: User, as: 'toUser', attributes: ['id', 'name', 'avatar'] }]
        });
        res.json({ incoming, outgoing });
    } catch (error) {
        console.error('❌ getInvites:', error.message);
        res.status(500).json({ message: 'Ошибка загрузки приглашений' });
    }
};

// ✅ БАГ 4: Количество входящих pending-приглашений (для бейджа конверта)
exports.getPendingCount = async (req, res) => {
    try {
        const count = await Invite.count({
            where: { toUserId: req.user.id, status: 'pending' }
        });
        res.json({ count });
    } catch (error) {
        console.error('❌ getPendingCount:', error.message);
        res.status(500).json({ message: 'Ошибка' });
    }
};

// ✅ Количество pending-приглашений для бейджа (дубликат удален)