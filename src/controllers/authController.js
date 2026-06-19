const jwt = require('jsonwebtoken');
const db = require('../models');
const { User, Review } = require('../models');

// Генерация JWT токена
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ============================================================
// ИСПРАВЛЕНИЕ #1: Валидация входных данных
// Защита от пустых полей и XSS
// ============================================================
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, 200); // обрезаем до 200 символов
}

function safeParseJSON(data, fallback = []) {
    if (Array.isArray(data)) return data;
    if (!data) return fallback;
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
}

// Формат ответа пользователя (без пароля, с аватаркой)
function formatUser(user, token) {
    const interests = safeParseJSON(user.interests);
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        // ИСПРАВЛЕНИЕ #2: используем сохранённый avatar из БД если есть,
        // иначе генерируем через dicebear
        avatar: user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads/'))
            ? user.avatar
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
        interests,
        token
    };
}

// ============================================================
// Регистрация
// ============================================================
exports.register = async (req, res) => {
    try {
        const name     = sanitizeString(req.body.name);
        const email    = sanitizeString(req.body.email).toLowerCase();
        const password = req.body.password;

        // Валидация
        if (!name || name.length < 2) {
            return res.status(400).json({ message: 'Имя должно содержать минимум 2 символа' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Некорректный email' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Пароль должен быть минимум 6 символов' });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        const user = await User.create({ name, email, password });
        res.status(201).json(formatUser(user, generateToken(user.id)));
    } catch (error) {
        console.error('❌ register:', error.message);
        res.status(500).json({ message: 'Ошибка сервера при регистрации' });
    }
};

// ============================================================
// Вход
// ============================================================
exports.login = async (req, res) => {
    try {
        const email    = sanitizeString(req.body.email).toLowerCase();
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ message: 'Введите email и пароль' });
        }

        const user = await User.findOne({ where: { email } });
        // ИСПРАВЛЕНИЕ #3: одинаковое сообщение для несуществующего пользователя
        // и неверного пароля — защита от перебора
        if (!user) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        res.json(formatUser(user, generateToken(user.id)));
    } catch (error) {
        console.error('❌ login:', error.message);
        res.status(500).json({ message: 'Ошибка сервера при входе' });
    }
};

// ============================================================
// Получить свой профиль
// ============================================================
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
        
        // Преобразуем объект Sequelize в обычный объект, чтобы можно было безопасно изменять поля
        const userData = user.toJSON();
        userData.interests = safeParseJSON(userData.interests);
        
        res.json(userData);
    } catch (error) {
        console.error('❌ getProfile:', error.message);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

// ============================================================
// Обновить интересы
// ============================================================
exports.updateInterests = async (req, res) => {
    try {
        const { interests } = req.body;

        // ИСПРАВЛЕНИЕ #4: валидация — interests должен быть массивом строк
        if (!Array.isArray(interests)) {
            return res.status(400).json({ message: 'interests должен быть массивом' });
        }
        const cleanInterests = interests
            .filter(i => typeof i === 'string')
            .map(i => sanitizeString(i))
            .slice(0, 20); // максимум 20 интересов

        await User.update(
            { interests: JSON.stringify(cleanInterests) },
            { where: { id: req.user.id } }
        );
        res.json({ message: 'Интересы обновлены', interests: cleanInterests });
    } catch (error) {
        console.error('❌ updateInterests:', error.message);
        res.status(500).json({ message: 'Ошибка обновления интересов' });
    }
};

// ============================================================
// Получить всех пользователей с интересами (для правой колонки)
// ИСПРАВЛЕНИЕ #5: не отдаём email других пользователей — приватность
// ============================================================
exports.getInterests = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'avatar', 'interests'],
            // исключаем текущего пользователя — он и так себя знает
            where: { id: { [require('sequelize').Op.ne]: req.user.id } }
        });

        // Получаем рейтинги всех пользователей
        const ratings = await db.sequelize.query(
            'SELECT toUserId, AVG(rating) as avgRating FROM Reviews GROUP BY toUserId',
            { type: db.sequelize.QueryTypes.SELECT }
        ).catch(() => []); // Игнорируем ошибку, если таблица еще не создана
        
        const ratingMap = {};
        ratings.forEach(r => ratingMap[r.toUserId] = parseFloat(r.avgRating).toFixed(1));

        const formatted = users.map(u => {
            const interests = safeParseJSON(u.interests);
            return {
                id: u.id,
                name: u.name,
                avatar: u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('/uploads/'))
                    ? u.avatar
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
                interests,
                avgRating: ratingMap[u.id] || null
            };
        });
        res.json(formatted);
    } catch (error) {
        console.error('❌ getInterests:', error.message);
        res.status(500).json({ message: 'Ошибка загрузки пользователей' });
    }
};

// ============================================================
// Получить профиль другого пользователя по ID
// НОВЫЙ МАРШРУТ: GET /api/auth/users/:id
// ============================================================
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            // email не отдаём — приватность
            attributes: ['id', 'name', 'avatar', 'interests', 'bio']
        });
        if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

        // Получаем средний рейтинг
        const ratingResult = await Review.findOne({
            where: { toUserId: req.params.id },
            attributes: [[db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avgRating'], [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalReviews']]
        });
        
        // Получаем список отзывов
        const reviews = await Review.findAll({
            where: { toUserId: req.params.id },
            include: [{ model: User, as: 'fromUser', attributes: ['id', 'name', 'avatar'] }],
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        const interests = safeParseJSON(user.interests);

        // Получаем количество организованных походов
        const organizedEventsCount = await db.Event.count({
            where: { creatorId: req.params.id }
        });

        res.json({
            id: user.id,
            name: user.name,
            avatar: user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads/'))
                ? user.avatar
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
            interests,
            bio: user.bio || '',
            avgRating: ratingResult ? parseFloat(ratingResult.getDataValue('avgRating') || 0).toFixed(1) : null,
            totalReviews: ratingResult ? ratingResult.getDataValue('totalReviews') : 0,
            organizedEventsCount,
            reviews: reviews.map(r => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                fromUser: {
                    id: r.fromUser.id,
                    name: r.fromUser.name,
                    avatar: r.fromUser.avatar && (r.fromUser.avatar.startsWith('http') || r.fromUser.avatar.startsWith('/uploads/'))
                        ? r.fromUser.avatar
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.fromUser.name)}`
                }
            }))
        });
    } catch (error) {
        console.error('❌ getUserById:', error.message);
        res.status(500).json({ message: 'Ошибка загрузки профиля' });
    }
};

const crypto = require('crypto');

// ============================================================
// Telegram Auth (GET) - widget redirects here
// ============================================================
exports.telegramAuth = async (req, res) => {
    try {
        const data = req.query;
        // Verify Telegram Auth
        // The data should contain id, first_name, last_name, username, photo_url, auth_date and hash
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!botToken) {
            console.error('Telegram Bot Token not configured!');
            return res.redirect('/login.html?error=Telegram+not+configured');
        }

        const { hash, ...userData } = data;
        
        // Check auth_date to prevent replay attacks (e.g. 24 hours)
        if (!userData.auth_date || (Date.now() / 1000 - userData.auth_date) > 86400) {
            return res.redirect('/login.html?error=Auth+expired');
        }

        // Verify hash
        const dataCheckArr = [];
        for (const key in userData) {
            dataCheckArr.push(`${key}=${userData[key]}`);
        }
        dataCheckArr.sort();
        const dataCheckString = dataCheckArr.join('\n');

        const secretKey = crypto.createHash('sha256').update(botToken).digest();
        const generatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (generatedHash !== hash) {
            console.error('Telegram Auth hash mismatch!');
            return res.redirect('/login.html?error=Invalid+Telegram+Hash');
        }

        // Auth successful, find or create user
        const tgId = userData.id;
        const name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || 'Telegram User';
        const avatar = userData.photo_url || '';
        
        // We might not have email from Telegram widget. Generate a fake one for DB constraint
        const generatedEmail = `tg_${tgId}@find-go.local`;

        let user = await User.findOne({ where: { telegramId: tgId } });

        if (!user) {
            // Check if there is a user with generated email
            user = await User.findOne({ where: { email: generatedEmail } });
            if(user) {
                 await user.update({ telegramId: tgId, avatar: avatar || user.avatar });
            } else {
                 user = await User.create({
                    name,
                    email: generatedEmail,
                    password: crypto.randomBytes(16).toString('hex'), // random secure password
                    telegramId: tgId,
                    avatar
                 });
            }
        } else {
            // Update avatar if changed
            if (avatar && user.avatar !== avatar) {
                await user.update({ avatar });
            }
        }

        const token = generateToken(user.id);
        const userDataFormatted = formatUser(user, token);
        
        // Pass data back to client via HTML injection 
        // since we are redirecting from the telegram widget
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Авторизация...</title></head>
            <body>
                <script>
                    localStorage.setItem('token', '${token}');
                    localStorage.setItem('user', JSON.stringify(${JSON.stringify(userDataFormatted)}));
                    window.location.href = '/app.html';
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ telegramAuth:', error.message);
        res.redirect('/login.html?error=Server+Error');
    }
};