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
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // pending, accepted, rejected
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

Invite.belongsTo(User, { as: 'fromUser', foreignKey: 'fromUserId' });
Invite.belongsTo(User, { as: 'toUser', foreignKey: 'toUserId' });

module.exports = Invite;