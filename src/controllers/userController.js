const multer = require('multer');
const path = require('path');
const { User } = require('../models');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================
// Multer — загрузка аватаров
// ============================================================
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        if (!allowed.includes(ext)) {
            return cb(new Error('Недопустимый тип файла'));
        }
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Разрешены только изображения'));
        }
        cb(null, true);
    }
});

// ============================================================
// POST /api/avatar — загрузка аватара
// ============================================================
exports.uploadAvatar = async (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err.message);
            return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не выбран' });
        }

        try {
            const ext = path.extname(req.file.originalname).toLowerCase();
            const fileName = `${uuidv4()}${ext}`;

            // Загружаем файл в Supabase Storage
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (error) {
                console.error('Supabase upload error:', error.message);
                return res.status(500).json({ message: 'Ошибка загрузки файла в хранилище' });
            }

            // Получаем публичный URL загруженного файла
            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const avatarUrl = publicUrlData.publicUrl;

            // Обновляем пользователя в БД
            await User.update({ avatar: avatarUrl }, { where: { id: req.user.id } });
            res.json({ avatarUrl, message: 'Аватар обновлён' });
        } catch (dbError) {
            console.error('DB error:', dbError.message);
            res.status(500).json({ message: 'Ошибка сохранения аватара' });
        }
    });
};

// ============================================================
// PUT /api/user/profile — обновление bio и других полей профиля
// НОВЫЙ МАРШРУТ — нужен для сохранения фактов о себе
// ============================================================
exports.updateProfile = async (req, res) => {
    try {
        const { bio } = req.body;
        const updateData = {};

        if (bio !== undefined && bio !== null) {
            // Если bio - объект (например JSON-строка с фактами), то преобразуем его безопасно
            const bioString = typeof bio === 'object' ? JSON.stringify(bio) : String(bio);
            updateData.bio = bioString.substring(0, 1000);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Нет данных для обновления' });
        }

        await User.update(updateData, { where: { id: req.user.id } });
        res.json({ message: 'Профиль обновлён' });
    } catch (error) {
        console.error('❌ updateProfile:', error.message);
        res.status(500).json({ message: 'Ошибка обновления профиля' });
    }
};