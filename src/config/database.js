const { Sequelize } = require('sequelize');
const config = require('./config.js');

const env = process.env.NODE_ENV || (process.env.DATABASE_URL ? 'production' : 'development');
const dbConfig = config[env];

let sequelize;
if (dbConfig.url) {
  sequelize = new Sequelize(dbConfig.url, dbConfig);
} else {
  sequelize = new Sequelize(dbConfig);
}

if (!dbConfig.url && env === 'production') {
  console.error("DATABASE_URL is missing in production environment");
  process.exit(1);
}

module.exports = sequelize;