const multer = require('multer');
const path = require('path');
const { User } = require('../models');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

let supabase = null;
function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are missing from environment variables');
        }
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    return supabase;
}

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

            const supabaseClient = getSupabaseClient();
            
            // Загружаем файл в Supabase Storage
            const { data, error } = await supabaseClient.storage
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
            const { data: publicUrlData } = supabaseClient.storage
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

const { parseAndValidateBirthday, calculateAge, determineAgeGroup } = require('../utils/ageUtils');

// ============================================================
// PUT /api/user/profile — обновление bio и других полей профиля
// (Запрещено изменять birthday и ageGroup)
// ============================================================
exports.updateProfile = async (req, res) => {
    try {
        const { bio, name } = req.body;
        const updateData = {};

        // ЗАЩИТА: Пользователь НЕ может самостоятельно изменить дату рождения или ageGroup
        delete req.body.birthday;
        delete req.body.ageGroup;
        delete req.body.isAgeVerified;
        delete req.body.verificationStatus;

        if (name !== undefined && name !== null) {
            const nameStr = String(name).trim();
            if (nameStr.length >= 2) {
                updateData.name = nameStr.substring(0, 50);
            }
        }

        if (bio !== undefined && bio !== null) {
            // Если bio - объект (например JSON-строка с фактами), то преобразуем его безопасно
            const bioString = typeof bio === 'object' ? JSON.stringify(bio) : String(bio);
            updateData.bio = bioString.substring(0, 1000);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Нет разрешённых данных для обновления' });
        }

        await User.update(updateData, { where: { id: req.user.id } });
        res.json({ message: 'Профиль обновлён' });
    } catch (error) {
        console.error('❌ updateProfile:', error.message);
        res.status(500).json({ message: 'Ошибка обновления профиля' });
    }
};

// ============================================================
// PUT /api/admin/users/:id/birthday — изменение возраста только администратором
// ============================================================
exports.adminUpdateUserAge = async (req, res) => {
    try {
        const userId = req.params.id;
        const { day, month, year } = req.body;

        // Только администраторы могут менять возраст
        const requestingUser = await User.findByPk(req.user.id);
        if (!requestingUser || (requestingUser.role !== 'admin' && !requestingUser.isAdmin)) {
            return res.status(403).json({ message: 'Доступ запрещён. Изменять дату рождения может только администратор.' });
        }

        const dateValidation = parseAndValidateBirthday(day, month, year);
        if (!dateValidation.valid) {
            return res.status(400).json({ message: dateValidation.error });
        }

        const age = calculateAge(dateValidation.birthday);
        const ageGroupResult = determineAgeGroup(age);
        if (!ageGroupResult.valid) {
            return res.status(400).json({ message: ageGroupResult.error });
        }

        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        await targetUser.update({
            birthday: dateValidation.dateString,
            ageGroup: ageGroupResult.ageGroup
        });

        res.json({
            message: 'Дата рождения и возрастная группа успешно обновлены администратором',
            birthday: dateValidation.dateString,
            ageGroup: ageGroupResult.ageGroup
        });
    } catch (error) {
        console.error('❌ adminUpdateUserAge:', error.message);
        res.status(500).json({ message: 'Ошибка обновления возраста' });
    }
};