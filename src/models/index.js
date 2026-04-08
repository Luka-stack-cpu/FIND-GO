const sequelize = require('../config/database');
const User = require('./User');
const Place = require('./Place');
const Event = require('./Event');
const Message = require('./Message');

const db = {
  sequelize,
  User,
  Place,
  Event,
  Message
};

module.exports = db;