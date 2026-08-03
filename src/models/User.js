const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  interests: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
        const raw = this.getDataValue('interests');
        if (!raw) return [];
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            return []; // Фолбэк если данные повреждены (например пустая строка)
        }
    },
    set(value) {
        this.setDataValue('interests', JSON.stringify(value));
    }
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  ageGroup: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'adult'
  },
  isAgeVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationStatus: {
    type: DataTypes.STRING,
    defaultValue: 'unverified'
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user' // user, moderator, admin
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  banReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  banUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
});

User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;