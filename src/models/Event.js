const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  placeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Встреча'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'другое'
  },
  ageGroup: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '18-21'
  },
  datetime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  isPersonal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Event;