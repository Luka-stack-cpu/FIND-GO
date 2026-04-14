const sequelize = require('../config/database');
const User = require('./User');
const Place = require('./Place');
const Event = require('./Event');
const Message = require('./Message');
const EventParticipants = require('./EventParticipants');

Event.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Event.belongsTo(Place, { as: 'place', foreignKey: 'placeId' });
Event.belongsToMany(User, { through: EventParticipants, as: 'participants', foreignKey: 'EventId', otherKey: 'UserId' });
User.belongsToMany(Event, { through: EventParticipants, as: 'events', foreignKey: 'UserId', otherKey: 'EventId' });

const db = { sequelize, User, Place, Event, Message, EventParticipants };
module.exports = db;