const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    const user = await User.create({ name, email, password });

res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
    interests: user.interests,
    token: generateToken(user.id)
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
    interests: user.interests,
    token: generateToken(user.id)
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.updateInterests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { interests } = req.body;
        await User.update({ interests: JSON.stringify(interests) }, { where: { id: userId } });
        res.json({ message: 'Интересы обновлены' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка обновления интересов' });
    }
};

exports.getInterests = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'interests']
    });
    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      interests: u.interests
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка загрузки интересов' });
  }
};