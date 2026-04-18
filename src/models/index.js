const sequelize = require('../config/database');
const User = require('./User');
const Place = require('./Place');
const Event = require('./Event');
const Message = require('./Message');
const Invite = require('./Invite');  // ← импорт

// ========== АССОЦИАЦИИ ДЛЯ INVITE ==========
Invite.belongsTo(User, { as: 'fromUser', foreignKey: 'fromUserId' });
Invite.belongsTo(User, { as: 'toUser', foreignKey: 'toUserId' });
User.hasMany(Invite, { as: 'sentInvites', foreignKey: 'fromUserId' });
User.hasMany(Invite, { as: 'receivedInvites', foreignKey: 'toUserId' });

// ========== АССОЦИАЦИИ ДЛЯ EVENT ==========
Event.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Event.belongsTo(Place, { as: 'place', foreignKey: 'placeId' });

Event.belongsToMany(User, {
  through: 'EventParticipants',
  as: 'participants',
  foreignKey: 'EventId',
  otherKey: 'UserId',
  uniqueKey: false
});

User.belongsToMany(Event, {
  through: 'EventParticipants',
  as: 'events',
  foreignKey: 'UserId',
  otherKey: 'EventId',
  uniqueKey: false
});

// ========== ЭКСПОРТ ==========
const db = {
  sequelize,
  User,
  Place,
  Event,
  Message,
  Invite  // ← Invite используется здесь, ошибка исчезнет
};

module.exports = db;