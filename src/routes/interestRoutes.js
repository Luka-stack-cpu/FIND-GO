const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Event, Interest } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================================
// Каталог интересов (статический справочник — используется
// и для seed БД, и для frontend)
// ============================================================
const INTERESTS_CATALOG = [
    { name: 'Активный отдых', slug: 'outdoor',    icon: '🏔', category_group: 'Активный отдых', event_category: 'поход' },
    { name: 'Спорт',          slug: 'sport',       icon: '⚽', category_group: 'Спорт',          event_category: 'спорт' },
    { name: 'IT',             slug: 'it',          icon: '💻', category_group: 'Технологии',     event_category: 'it' },
    { name: 'Бизнес',         slug: 'business',    icon: '🚀', category_group: 'Бизнес',         event_category: 'бизнес' },
    { name: 'Настольные игры',slug: 'boardgames',  icon: '🎲', category_group: 'Развлечения',    event_category: 'игры' },
    { name: 'Кофе',           slug: 'coffee',      icon: '☕', category_group: 'Социальное',     event_category: 'кофе' },
    { name: 'Книги',          slug: 'books',       icon: '📚', category_group: 'Культура',       event_category: 'книги' },
    { name: 'Музыка',         slug: 'music',       icon: '🎵', category_group: 'Творчество',     event_category: 'музыка' },
    { name: 'Творчество',     slug: 'art',         icon: '🎨', category_group: 'Творчество',     event_category: 'творчество' },
    { name: 'Языки',          slug: 'languages',   icon: '🇬🇧', category_group: 'Образование',  event_category: 'языки' },
];

module.exports.INTERESTS_CATALOG = INTERESTS_CATALOG;

// ============================================================
// GET /api/interests — список всех интересов с числом участников
// ============================================================
router.get('/interests', async (req, res) => {
    try {
        const allUsers = await User.findAll({
            where: { isHidden: false, isBanned: false },
            attributes: ['interests']
        });

        // Считаем участников по каждому слагу
        const countMap = {};
        INTERESTS_CATALOG.forEach(i => { countMap[i.slug] = 0; });

        allUsers.forEach(u => {
            const userInterests = u.interests || [];
            userInterests.forEach(slug => {
                if (countMap[slug] !== undefined) countMap[slug]++;
            });
        });

        const result = INTERESTS_CATALOG.map(interest => ({
            ...interest,
            participantsCount: countMap[interest.slug] || 0
        }));

        res.json(result);
    } catch (err) {
        console.error('❌ /api/interests error:', err.message);
        res.status(500).json({ message: 'Ошибка загрузки интересов' });
    }
});

// ============================================================
// GET /api/interests/:slug — детали интереса (статистика)
// ============================================================
router.get('/interests/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const interest = INTERESTS_CATALOG.find(i => i.slug === slug);
        if (!interest) return res.status(404).json({ message: 'Интерес не найден' });

        const allUsers = await User.findAll({
            where: { isHidden: false, isBanned: false },
            attributes: ['interests', 'updatedAt']
        });

        let participantsCount = 0;
        let activeToday = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        allUsers.forEach(u => {
            const userInterests = u.interests || [];
            if (userInterests.includes(slug)) {
                participantsCount++;
                if (new Date(u.updatedAt) >= today) activeToday++;
            }
        });

        // Число мероприятий с совпадающей категорией
        let eventsCount = 0;
        if (interest.event_category) {
            eventsCount = await Event.count({
                where: {
                    status: 'active',
                    category: { [Op.like]: `%${interest.event_category}%` },
                    datetime: { [Op.gt]: new Date() }
                }
            });
        }

        res.json({
            ...interest,
            participantsCount,
            activeToday,
            eventsCount
        });
    } catch (err) {
        console.error('❌ /api/interests/:slug error:', err.message);
        res.status(500).json({ message: 'Ошибка загрузки интереса' });
    }
});

// ============================================================
// GET /api/interests/:slug/people — люди с совпадением (скоринг)
// Требует auth для вычисления персонального скора
// ============================================================
router.get('/interests/:slug/people', authMiddleware, async (req, res) => {
    try {
        const { slug } = req.params;
        const interest = INTERESTS_CATALOG.find(i => i.slug === slug);
        if (!interest) return res.status(404).json({ message: 'Интерес не найден' });

        // Получаем текущего пользователя
        const currentUser = await User.findByPk(req.user.id, {
            attributes: ['id', 'interests', 'ageGroup', 'city']
        });
        if (!currentUser) return res.status(401).json({ message: 'Не авторизован' });

        const myInterests = currentUser.interests || [];

        // Все пользователи у которых есть этот интерес
        const allUsers = await User.findAll({
            where: {
                isHidden: false,
                isBanned: false,
                id: { [Op.ne]: currentUser.id }
            },
            attributes: ['id', 'name', 'avatar', 'bio', 'interests', 'ageGroup', 'city', 'birthday', 'updatedAt']
        });

        // Фильтруем и считаем скор
        const withInterest = allUsers
            .filter(u => (u.interests || []).includes(slug))
            .map(u => {
                const theirInterests = u.interests || [];
                const commonInterests = myInterests.filter(i => theirInterests.includes(i));
                const commonCount = commonInterests.length;

                const sameCity = currentUser.city && u.city && currentUser.city.toLowerCase() === u.city.toLowerCase();
                const sameAgeGroup = currentUser.ageGroup === u.ageGroup;

                // Скор по PRD: (common × 10) + (sameCity ? 15 : 0) + (sameAgeGroup ? 8 : 0)
                const score = (commonCount * 10) + (sameCity ? 15 : 0) + (sameAgeGroup ? 8 : 0);

                // Иконки общих интересов (максимум 4)
                const commonIcons = commonInterests
                    .slice(0, 4)
                    .map(s => INTERESTS_CATALOG.find(c => c.slug === s)?.icon || '🔖');

                // Возраст (только год, без точной даты)
                let ageDisplay = null;
                if (u.birthday) {
                    const birthYear = new Date(u.birthday).getFullYear();
                    const age = new Date().getFullYear() - birthYear;
                    ageDisplay = age;
                }

                return {
                    id: u.id,
                    name: u.name,
                    avatar: u.avatar || '/img/default-avatar.png',
                    ageDisplay,
                    ageGroup: u.ageGroup,
                    city: u.city,
                    bio: u.bio ? u.bio.slice(0, 100) : null,
                    commonInterestsCount: commonCount,
                    commonIcons,
                    sameCity,
                    sameAgeGroup,
                    score
                };
            });

        // Сортируем по убыванию скора
        withInterest.sort((a, b) => b.score - a.score);

        res.json(withInterest);
    } catch (err) {
        console.error('❌ /api/interests/:slug/people error:', err.message);
        res.status(500).json({ message: 'Ошибка загрузки людей' });
    }
});

// ============================================================
// GET /api/interests/:slug/events — мероприятия по интересу
// ============================================================
router.get('/interests/:slug/events', async (req, res) => {
    try {
        const { slug } = req.params;
        const interest = INTERESTS_CATALOG.find(i => i.slug === slug);
        if (!interest) return res.status(404).json({ message: 'Интерес не найден' });

        const where = {
            status: 'active',
            datetime: { [Op.gt]: new Date() },
            isPersonal: false
        };
        if (interest.event_category) {
            where.category = { [Op.like]: `%${interest.event_category}%` };
        }

        const events = await Event.findAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] },
                { model: require('../models/Place'), as: 'place', attributes: ['name', 'category'] },
                { model: User, as: 'participants', attributes: ['id'], through: { attributes: [] } }
            ],
            order: [['datetime', 'ASC']],
            limit: 20
        });

        const result = events.map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            datetime: e.datetime,
            maxParticipants: e.maxParticipants,
            participantsCount: e.participants ? e.participants.length : 0,
            description: e.description ? e.description.slice(0, 120) : '',
            creator: e.creator,
            place: e.place
        }));

        res.json(result);
    } catch (err) {
        console.error('❌ /api/interests/:slug/events error:', err.message);
        res.status(500).json({ message: 'Ошибка загрузки мероприятий' });
    }
});

// ============================================================
// PUT /api/interests/my — обновить список интересов пользователя
// ============================================================
router.put('/interests/my', authMiddleware, async (req, res) => {
    try {
        const { interests } = req.body;
        if (!Array.isArray(interests)) {
            return res.status(400).json({ message: 'interests должен быть массивом' });
        }
        const validSlugs = INTERESTS_CATALOG.map(i => i.slug);
        const filtered = interests.filter(s => validSlugs.includes(s));
        if (filtered.length < 1) {
            return res.status(400).json({ message: 'Выберите хотя бы 1 интерес' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        user.interests = filtered;
        await user.save();

        res.json({ message: 'Интересы обновлены', interests: filtered });
    } catch (err) {
        console.error('❌ PUT /api/interests/my error:', err.message);
        res.status(500).json({ message: 'Ошибка обновления интересов' });
    }
});

module.exports = router;
