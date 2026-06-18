const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Place = sequelize.define('Place', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'other'
  },
  address: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  safetyScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 8.9
  },
  safetyVotes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  safetyHistory: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  },
  isDangerous: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

module.exports = Place;