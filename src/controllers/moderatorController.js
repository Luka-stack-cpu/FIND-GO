const { Report, User, Event, Review, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Путь к лог-файлу действий модератора
const logFilePath = path.join(__dirname, '../../moderator_actions.log');

// Вспомогательная функция логирования
const logAction = (action, moderatorId, targetUserId, details = {}) => {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] MODERATOR_ID=${moderatorId} ACTION=${action} TARGET_USER_ID=${targetUserId} DETAILS=${JSON.stringify(details)}\n`;
    fs.appendFileSync(logFilePath, logLine, 'utf8');
    console.log(`📝 [Moderator Log]: ${logLine.trim()}`);
};

// Проверка на права модератора
const checkModerator = (req, res) => {
    if (!req.user || (req.user.role !== 'moderator' && req.user.role !== 'admin')) {
        res.status(403).json({ message: 'Доступ запрещен: требуется роль модератора или администратора' });
        return false;
    }
    return true;
};

// Система весов жалоб
const getReportPoints = (reason) => {
    const weights = {
        'spam': 2,
        'insult': 4,
        'harassment': 6,
        'fake': 5,
        'danger': 8
    };
    return weights[reason] || 3; // По умолчанию 3 балла
};

// Расчет рекомендуемого бана
const getRecommendedBan = (totalScore, totalReports) => {
    if (totalReports < 3) return null;
    if (totalScore < 5) return { value: 12, unit: 'hours', label: '12 часов' };
    if (totalScore <= 10) return { value: 3, unit: 'days', label: '3 дня' };
    return { value: 7, unit: 'days', label: '7 дней' };
};

// GET /api/moderator/reports - список всех новых (pending) жалоб
// Каждая карточка должна содержать:
// • фото пользователя, имя, возрастную группу, количество жалоб, причину, дату
exports.getNewReports = async (req, res) => {
    try {
        if (!checkModerator(req, res)) return;

        // Находим все pending жалобы
        const reports = await Report.findAll({
            where: { status: 'pending' },
            include: [
                {
                    model: User,
                    as: 'reportedUser',
                    attributes: ['id', 'name', 'avatar', 'ageGroup', 'createdAt']
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Для каждого нарушителя подсчитываем общее количество жалоб
        const formattedReports = await Promise.all(reports.map(async (report) => {
            const reportedUser = report.reportedUser;
            if (!reportedUser) return null;

            // Считаем все жалобы (и pending и resolved) для расчета баллов
            const userReports = await Report.findAll({
                where: { reportedUserId: report.reportedUserId }
            });

            const reportCount = userReports.length;
            const totalScore = userReports.reduce((sum, r) => sum + getReportPoints(r.reason), 0);
            const recommendedBan = getRecommendedBan(totalScore, reportCount);

            return {
                id: report.id,
                reason: report.reason,
                description: report.description,
                createdAt: report.createdAt,
                status: report.status,
                reporter: report.reporter ? {
                    id: report.reporter.id,
                    name: report.reporter.name
                } : null,
                reportedUser: {
                    id: reportedUser.id,
                    name: reportedUser.name,
                    avatar: reportedUser.avatar && (reportedUser.avatar.startsWith('http') || reportedUser.avatar.startsWith('/uploads/'))
                        ? reportedUser.avatar
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(reportedUser.name)}`,
                    ageGroup: reportedUser.ageGroup,
                    createdAt: reportedUser.createdAt,
                    reportCount,
                    totalScore,
                    recommendedBan
                }
            };
        }));

        res.json(formattedReports.filter(r => r !== null));
    } catch (error) {
        console.error('❌ getNewReports:', error.message);
        res.status(500).json({ message: 'Ошибка получения жалоб' });
    }
};

// GET /api/moderator/users/:id/details - полная информация по пользователю для детального окна модератора
// После открытия жалобы модератор должен увидеть:
// профиль пользователя, его мероприятия, историю жалоб, дату регистрации, рейтинг
exports.getUserDetailsForMod = async (req, res) => {
    try {
        if (!checkModerator(req, res)) return;

        const userId = req.params.id;
        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'avatar', 'bio', 'interests', 'ageGroup', 'isAgeVerified', 'verificationStatus', 'role', 'isHidden', 'isBanned', 'createdAt']
        });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // 1. Мероприятия пользователя
        const events = await Event.findAll({
            where: { creatorId: userId },
            order: [['datetime', 'DESC']]
        });

        // 2. История всех жалоб на этого пользователя
        const reportsHistory = await Report.findAll({
            where: { reportedUserId: userId },
            include: [{ model: User, as: 'reporter', attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']]
        });

        // 3. Расчёт рейтинга (средняя оценка)
        const ratingResult = await Review.findOne({
            where: { toUserId: userId },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
            ]
        });

        const avgRating = ratingResult ? parseFloat(ratingResult.getDataValue('avgRating') || 0).toFixed(1) : '0.0';
        const totalReviews = ratingResult ? ratingResult.getDataValue('totalReviews') : 0;

        // 4. Очки безопасности и рекомендация бана
        const reportCount = reportsHistory.length;
        const totalScore = reportsHistory.reduce((sum, r) => sum + getReportPoints(r.reason), 0);
        const recommendedBan = getRecommendedBan(totalScore, reportCount);

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads/'))
                    ? user.avatar
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
                bio: user.bio,
                interests: user.interests,
                ageGroup: user.ageGroup,
                isAgeVerified: user.isAgeVerified,
                role: user.role,
                isHidden: user.isHidden,
                isBanned: user.isBanned,
                createdAt: user.createdAt,
                avgRating,
                totalReviews,
                totalScore,
                recommendedBan
            },
            events,
            reportsHistory
        });
    } catch (error) {
        console.error('❌ getUserDetailsForMod:', error.message);
        res.status(500).json({ message: 'Ошибка получения детальной информации' });
    }
};

// POST /api/moderator/reports/:id/close - Закрыть жалобу (установить статус resolved)
exports.closeReport = async (req, res) => {
    try {
        if (!checkModerator(req, res)) return;

        const reportId = req.params.id;
        const report = await Report.findByPk(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Жалоба не найдена' });
        }

        report.status = 'resolved';
        await report.save();

        logAction('CLOSE_REPORT', req.user.id, report.reportedUserId, { reportId });

        res.json({ message: 'Жалоба успешно закрыта', report });
    } catch (error) {
        console.error('❌ closeReport:', error.message);
        res.status(500).json({ message: 'Ошибка при закрытии жалобы' });
    }
};

// POST /api/moderator/users/:id/hide - Скрыть профиль (переключить isHidden)
exports.hideProfile = async (req, res) => {
    try {
        if (!checkModerator(req, res)) return;

        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        user.isHidden = !user.isHidden;
        await user.save();

        // Сбросить кэш пользователя в authMiddleware
        const { invalidateUserCache } = require('../middleware/authMiddleware');
        if (invalidateUserCache) invalidateUserCache(user.id);

        logAction('TOGGLE_HIDE_PROFILE', req.user.id, user.id, { isHidden: user.isHidden });

        res.json({
            message: user.isHidden ? 'Профиль пользователя скрыт' : 'Профиль пользователя снова виден',
            isHidden: user.isHidden
        });
    } catch (error) {
        console.error('❌ hideProfile:', error.message);
        res.status(500).json({ message: 'Ошибка при изменении видимости профиля' });
    }
};

// POST /api/moderator/users/:id/ban - Заблокировать пользователя (переключить isBanned)
exports.banUser = async (req, res) => {
    try {
        if (!checkModerator(req, res)) return;

        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const willBan = !user.isBanned;

        if (willBan) {
            // Применяем бан с причиной и сроком
            const { banReason, banUntil, banUnit } = req.body;
            user.isBanned = true;
            user.banReason = banReason || 'Подозрительное поведение';
            
            if (banUntil) {
                // Если передано количество часов/дней, высчитываем дату
                const now = new Date();
                if (banUnit === 'hours') {
                    now.setHours(now.getHours() + parseInt(banUntil));
                } else {
                    now.setDate(now.getDate() + parseInt(banUntil));
                }
                user.banUntil = now;
            } else {
                user.banUntil = null; // бессрочно
            }
        } else {
            // Снимаем бан — сбрасываем все поля
            user.isBanned = false;
            user.banReason = null;
            user.banUntil = null;
        }

        await user.save();

        // Сбросить кэш
        const { invalidateUserCache } = require('../middleware/authMiddleware');
        if (invalidateUserCache) invalidateUserCache(user.id);

        logAction('TOGGLE_BAN_USER', req.user.id, user.id, {
            isBanned: user.isBanned,
            banReason: user.banReason,
            banUntil: user.banUntil
        });

        res.json({
            message: user.isBanned ? 'Пользователь заблокирован' : 'Пользователь разблокирован',
            isBanned: user.isBanned,
            banReason: user.banReason,
            banUntil: user.banUntil
        });
    } catch (error) {
        console.error('❌ banUser:', error.message);
        res.status(500).json({ message: 'Ошибка при блокировке пользователя' });
    }
};
