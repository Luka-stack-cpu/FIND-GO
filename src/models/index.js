const sequelize = require('../config/database');
const User = require('./User');
const Place = require('./Place');
const Event = require('./Event');
const Message = require('./Message');
const Invite = require('./Invite');
const Notification = require('./Notification'); // ✅ БАГ 9

// Базовые ассоциации
Event.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Event.belongsTo(Place, { as: 'place', foreignKey: 'placeId' });

Invite.belongsTo(User, { as: 'fromUser', foreignKey: 'fromUserId' });
Invite.belongsTo(User, { as: 'toUser', foreignKey: 'toUserId' });
Invite.belongsTo(Event, { as: 'event', foreignKey: 'eventId' });
User.hasMany(Invite, { as: 'sentInvites', foreignKey: 'fromUserId' });
User.hasMany(Invite, { as: 'receivedInvites', foreignKey: 'toUserId' });

// ✅ Ассоциации уведомлений
User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

const db = { sequelize, User, Place, Event, Message, Invite, Notification };
module.exports = db;