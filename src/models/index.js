const sequelize = require('../config/database');
const User = require('./User');
const Place = require('./Place');
const Event = require('./Event');
const Message = require('./Message');

// Ассоциации
Event.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Event.belongsTo(Place, { as: 'place', foreignKey: 'placeId' });

// Связь многие-ко-многим через таблицу 'EventParticipants'
Event.belongsToMany(User, {
  through: 'EventParticipants',
  as: 'participants',
  foreignKey: 'EventId',
  otherKey: 'UserId',
  uniqueKey: false,  // Отключаем уникальность, чтобы в один поход могло записаться несколько человек
});

User.belongsToMany(Event, {
  through: 'EventParticipants',
  as: 'events',
  foreignKey: 'UserId',
  otherKey: 'EventId',
  uniqueKey: false,
});

const db = { sequelize, User, Place, Event, Message };
module.exports = db;