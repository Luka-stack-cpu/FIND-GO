const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');

// Убеждаемся, что папка существует
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

exports.uploadAvatar = async (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ message: 'Ошибка загрузки файла: ' + err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не выбран' });
        }

        try {
            const avatarUrl = `/uploads/${req.file.filename}`;
            await User.update({ avatar: avatarUrl }, { where: { id: req.user.id } });
            res.json({ avatarUrl });
        } catch (dbError) {
            console.error('DB error:', dbError);
            res.status(500).json({ message: 'Ошибка сохранения аватара' });
        }
    });
};