const multer = require('multer');
const path = require('path');
const { User } = require('../models');

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

exports.uploadAvatar = (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка загрузки файла' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не выбран' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    await User.update({ avatar: avatarUrl }, { where: { id: req.user.id } });
    res.json({ avatarUrl });
  });
};