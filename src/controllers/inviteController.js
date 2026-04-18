const { Invite, User } = require('../models');

// Отправить приглашение
exports.sendInvite = async (req, res) => {
  try {
    const { toUserId, placeName } = req.body;
    const fromUserId = req.user.id;

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Нельзя пригласить самого себя' });
    }

    const existing = await Invite.findOne({
      where: { fromUserId, toUserId, status: 'pending' }
    });
    if (existing) {
      return res.status(400).json({ message: 'Приглашение уже отправлено' });
    }

    const invite = await Invite.create({ fromUserId, toUserId, placeName });
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

// Принять приглашение
exports.acceptInvite = async (req, res) => {
  try {
    const inviteId = req.params.id;
    const invite = await Invite.findByPk(inviteId);
    if (!invite) return res.status(404).json({ message: 'Приглашение не найдено' });
    if (invite.toUserId !== req.user.id) return res.status(403).json({ message: 'Доступ запрещён' });

    invite.status = 'accepted';
    await invite.save();
    res.json({ message: 'Приглашение принято' });
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