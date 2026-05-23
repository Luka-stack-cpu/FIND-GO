const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invite = sequelize.define('Invite', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  placeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Events', key: 'id' }
  },
  placeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Invite;