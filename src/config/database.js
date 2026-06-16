const { Sequelize } = require('sequelize');

let sequelize;

let dbUrl = process.env.DATABASE_URL;
// Fix double prefix issue if Render passes "DATABASE_URL=postgres://..."
if (dbUrl && dbUrl.startsWith('DATABASE_URL=')) {
  dbUrl = dbUrl.replace('DATABASE_URL=', '');
}

if (dbUrl) {
  // === Настройка для PostgreSQL на Render ===
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false, // Отключает вывод SQL-запросов в консоль, можно включить для отладки
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Обязательно для подключения к БД на Render
      },
    },
  });
} else {
  // === Локальная настройка для SQLite ===
  const path = require('path');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
  });
}
 
if (!dbUrl && process.env.NODE_ENV === 'production') {
  console.error("DATABASE_URL is missing in production environment");
  process.exit(1);
}

module.exports = sequelize;