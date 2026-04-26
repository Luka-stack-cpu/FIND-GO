const { Invite, User, Event } = require('../models');

// Отправить приглашение
exports.sendInvite = async (req, res) => {
  try {
    const { toUserId, placeName, eventId } = req.body;  // ← добавили eventId
    const fromUserId = req.user.id;

    if (fromUserId === parseInt(toUserId)) {
      return res.status(400).json({ message: 'Нельзя пригласить самого себя' });
    }

    // Проверяем что eventId передан и событие существует
    if (!eventId) {
      return res.status(400).json({ message: 'Не указан поход' });
    }
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Поход не найден' });
    }

    // Не отправлять повторное pending-приглашение на тот же поход
    const existing = await Invite.findOne({
      where: { fromUserId, toUserId, eventId, status: 'pending' }
    });
    if (existing) {
      return res.status(400).json({ message: 'Приглашение уже отправлено' });
    }

    const invite = await Invite.create({ fromUserId, toUserId, placeName, eventId });
    res.status(201).json(invite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при отправке приглашения' });
  }
};

// Получить все приглашения для текущего пользователя
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
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки приглашений' });
  }
};

// Принять приглашение → автоматически добавляем в участники похода
exports.acceptInvite = async (req, res) => {
  try {
    const inviteId = req.params.id;
    const userId = req.user.id;

    const invite = await Invite.findByPk(inviteId);
    if (!invite) return res.status(404).json({ message: 'Приглашение не найдено' });
    if (invite.toUserId !== userId) return res.status(403).json({ message: 'Доступ запрещён' });
    if (invite.status !== 'pending') return res.status(400).json({ message: 'Приглашение уже обработано' });

    // Находим поход
    const event = await Event.findByPk(invite.eventId);
    if (!event) {
      invite.status = 'rejected';
      await invite.save();
      return res.status(404).json({ message: 'Поход не найден или уже удалён' });
    }

    // Проверяем есть ли ещё место
    const participantsCount = await event.countParticipants();
    if (participantsCount >= event.maxParticipants) {
      return res.status(400).json({ message: 'В походе уже нет мест' });
    }

    // Проверяем не является ли уже участником
    const participants = await event.getParticipants({ where: { id: userId } });
    if (participants.length === 0) {
      await event.addParticipant(userId);  // ← добавляем в EventParticipants
    }

    // Обновляем статус приглашения
    invite.status = 'accepted';
    await invite.save();

    res.json({
      message: 'Приглашение принято. Вы добавлены в поход!',
      eventId: event.id,           // ← отдаём eventId фронтенду для редиректа в чат
      eventPlaceName: invite.placeName
    });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ message: 'Ошибка при отклонении приглашения' });
  }
};