'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Places').catch(() => null);

    // Если таблица Places не существует — ничего не делаем (начальная миграция создаст её)
    if (!tableDescription) {
      console.log('⚠️ Таблица Places не найдена. Пропускаем добавление safety-колонок.');
      return;
    }

    // Добавляем safetyScore если нет
    if (!tableDescription.safetyScore) {
      await queryInterface.addColumn('Places', 'safetyScore', {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 8.9
      });
      console.log('✅ Добавлена колонка safetyScore');
    }

    // Добавляем safetyVotes если нет
    if (!tableDescription.safetyVotes) {
      await queryInterface.addColumn('Places', 'safetyVotes', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
      console.log('✅ Добавлена колонка safetyVotes');
    }

    // Добавляем safetyHistory если нет
    if (!tableDescription.safetyHistory) {
      await queryInterface.addColumn('Places', 'safetyHistory', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '[]'
      });
      console.log('✅ Добавлена колонка safetyHistory');
    }

    // Добавляем isDangerous если нет
    if (!tableDescription.isDangerous) {
      await queryInterface.addColumn('Places', 'isDangerous', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✅ Добавлена колонка isDangerous');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Places').catch(() => null);
    if (!tableDescription) return;

    if (tableDescription.safetyScore) await queryInterface.removeColumn('Places', 'safetyScore');
    if (tableDescription.safetyVotes) await queryInterface.removeColumn('Places', 'safetyVotes');
    if (tableDescription.safetyHistory) await queryInterface.removeColumn('Places', 'safetyHistory');
    if (tableDescription.isDangerous) await queryInterface.removeColumn('Places', 'isDangerous');
  }
};
