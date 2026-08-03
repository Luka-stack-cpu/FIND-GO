const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interest = sequelize.define('Interest', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '🔖'
  },
  category_group: {
    type: DataTypes.STRING,
    defaultValue: 'Общее'
  },
  // Маппинг на category поля Event (для фильтрации мероприятий)
  event_category: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Interest;
