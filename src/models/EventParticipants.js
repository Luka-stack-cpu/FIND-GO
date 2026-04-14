const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventParticipants = sequelize.define('EventParticipants', {
  EventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Events', key: 'id' }
  },
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  timestamps: true,
  // Явно указываем составной первичный ключ
  indexes: [
    {
      unique: true,
      fields: ['EventId', 'UserId']
    }
  ]
});

module.exports = EventParticipants;