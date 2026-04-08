const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Place = require('./Place');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  placeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Place,
      key: 'id'
    }
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
  }
});

Event.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Event.belongsTo(Place, { as: 'place', foreignKey: 'placeId' });
Event.belongsToMany(User, { through: 'EventParticipants', as: 'participants' });

module.exports = Event;