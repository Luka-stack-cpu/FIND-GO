const { Report, User } = require('../models');
const { Op } = require('sequelize');

exports.createReport = async (req, res) => {
    try {
        const reporterId = req.user.id;
        const { reportedUserId, reason, description } = req.body;

        if (!reportedUserId || !reason) {
            return res.status(400).json({ message: 'Укажите пользователя и причину жалобы' });
        }

        if (parseInt(reportedUserId, 10) === reporterId) {
            return res.status(400).json({ message: 'Нельзя пожаловаться на самого себя' });
        }

        // Проверяем существование целевого пользователя
        const targetUser = await User.findByPk(reportedUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const validReasons = [
            'Подозрительное поведение',
            'Домогательства',
            'Спам',
            'Фейковый профиль',
            'Другое'
        ];

        if (!validReasons.includes(reason)) {
            return res.status(400).json({ message: 'Некорректная причина жалобы' });
        }

        if (reason === 'Другое' && (!description || description.trim().length === 0)) {
            return res.status(400).json({ message: 'Пожалуйста, опишите причину подробнее' });
        }

        // Проверка от флуда/спама жалобами: 10 минутный интервал на одинаковую жалобу к одному пользователю
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const existingReport = await Report.findOne({
            where: {
                reporterId,
                reportedUserId,
                reason,
                createdAt: {
                    [Op.gt]: tenMinutesAgo
                }
            }
        });

        if (existingReport) {
            return res.status(400).json({ message: 'Вы уже отправляли такую жалобу недавно. Пожалуйста, подождите.' });
        }

        const report = await Report.create({
            reporterId,
            reportedUserId,
            reason,
            description: reason === 'Другое' ? description.trim() : (description ? description.trim() : null),
            status: 'pending'
        });

        res.status(201).json({
            message: 'Спасибо. Жалоба отправлена модератору.',
            report
        });
    } catch (error) {
        console.error('❌ createReport:', error.message);
        res.status(500).json({ message: 'Ошибка при отправке жалобы' });
    }
};
