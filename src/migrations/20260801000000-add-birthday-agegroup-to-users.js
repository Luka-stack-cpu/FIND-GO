'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Users').catch(() => null);
    
    if (tableInfo) {
      if (!tableInfo.birthday) {
        await queryInterface.addColumn('Users', 'birthday', {
          type: Sequelize.DATEONLY,
          allowNull: true
        });
      }
      if (!tableInfo.ageGroup) {
        await queryInterface.addColumn('Users', 'ageGroup', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'adult'
        });
      }
      if (!tableInfo.isAgeVerified) {
        await queryInterface.addColumn('Users', 'isAgeVerified', {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        });
      }
      if (!tableInfo.verificationStatus) {
        await queryInterface.addColumn('Users', 'verificationStatus', {
          type: Sequelize.STRING,
          defaultValue: 'unverified'
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Users').catch(() => null);
    if (tableInfo) {
      if (tableInfo.verificationStatus) await queryInterface.removeColumn('Users', 'verificationStatus');
      if (tableInfo.isAgeVerified) await queryInterface.removeColumn('Users', 'isAgeVerified');
      if (tableInfo.ageGroup) await queryInterface.removeColumn('Users', 'ageGroup');
      if (tableInfo.birthday) await queryInterface.removeColumn('Users', 'birthday');
    }
  }
};
