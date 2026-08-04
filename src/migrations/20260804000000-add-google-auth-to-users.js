'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addCol = async (colName, typeOpts) => {
      try {
        await queryInterface.addColumn('Users', colName, typeOpts);
      } catch (e) {
        if (!e.message.includes('duplicate column')) throw e;
      }
    };

    // 2. Добавить новые столбцы
    await addCol('provider', {
      type: Sequelize.STRING,
      defaultValue: 'local'
    });
    
    await addCol('googleId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await addCol('emailVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    
    await addCol('lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Обратные действия
    await queryInterface.removeColumn('Users', 'lastLoginAt');
    await queryInterface.removeColumn('Users', 'emailVerified');
    await queryInterface.removeColumn('Users', 'googleId');
    await queryInterface.removeColumn('Users', 'provider');
  }
};
