const { User, PrivateMessage } = require('../models');
const { Op } = require('sequelize');

// Получить историю переписки с конкретным пользователем
exports.getChatHistory = async (req, res) => {
    try {
        const myId = req.user.id;
        const targetId = req.params.userId;

        const messages = await PrivateMessage.findAll({
            where: {
                [Op.or]: [
                    { fromUserId: myId, toUserId: targetId },
                    { fromUserId: targetId, toUserId: myId }
                ]
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        // Отмечаем сообщения как прочитанные
        await PrivateMessage.update(
            { read: true },
            { where: { fromUserId: targetId, toUserId: myId, read: false } }
        );

        res.json(messages);
    } catch (error) {
        console.error('❌ getChatHistory:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// Получить список всех активных чатов (последние сообщения от каждого собеседника)
exports.getConversations = async (req, res) => {
    try {
        const myId = req.user.id;
        
        // Это более сложный запрос, для начала можно просто получить всех, кому писали или кто писал
        const messages = await PrivateMessage.findAll({
            where: {
                [Op.or]: [{ fromUserId: myId }, { toUserId: myId }]
            },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
                { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        const conversations = new Map();
        messages.forEach(msg => {
            const partner = msg.fromUserId === myId ? msg.receiver : msg.sender;
            if (!conversations.has(partner.id)) {
                conversations.set(partner.id, {
                    partner,
                    lastMessage: msg.text,
                    time: msg.createdAt,
                    unread: !msg.read && msg.toUserId === myId
                });
            }
        });

        res.json(Array.from(conversations.values()));
    } catch (error) {
        console.error('❌ getConversations:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};
