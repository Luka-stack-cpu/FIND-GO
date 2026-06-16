'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    
    // Если таблица Users уже существует (как в случае с уже задеплоенной БД на Supabase),
    // мы пропускаем создание, чтобы не вызвать ошибку "relation already exists".
    if (tables.includes('Users') || tables.includes('users')) {
      console.log('✅ База данных уже инициализирована (таблицы существуют). Пропускаем начальную миграцию.');
      return;
    }

    // 1. Users
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      avatar: { type: Sequelize.STRING, defaultValue: '' },
      bio: { type: Sequelize.TEXT, defaultValue: '' },
      interests: { type: Sequelize.TEXT, defaultValue: '[]' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Places
    await queryInterface.createTable('Places', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, defaultValue: '' },
      image: { type: Sequelize.STRING, defaultValue: '' },
      category: { type: Sequelize.STRING, defaultValue: 'other' },
      address: { type: Sequelize.STRING, defaultValue: '' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. Events
    await queryInterface.createTable('Events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      creatorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      placeId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Places', key: 'id' }, onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Встреча' },
      category: { type: Sequelize.STRING, allowNull: false, defaultValue: 'другое' },
      ageGroup: { type: Sequelize.STRING, allowNull: false, defaultValue: '18-21' },
      datetime: { type: Sequelize.DATE, allowNull: false },
      maxParticipants: { type: Sequelize.INTEGER, defaultValue: 5 },
      status: { type: Sequelize.STRING, defaultValue: 'active' },
      description: { type: Sequelize.TEXT, defaultValue: '' },
      isPersonal: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 4. EventParticipants
    await queryInterface.createTable('EventParticipants', {
      EventId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Events', key: 'id' }, onDelete: 'CASCADE', primaryKey: true },
      UserId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE', primaryKey: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. Messages
    await queryInterface.createTable('Messages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      eventId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Events', key: 'id' }, onDelete: 'CASCADE' },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      userName: { type: Sequelize.STRING, allowNull: false },
      text: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 6. Invites
    await queryInterface.createTable('Invites', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      fromUserId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      toUserId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      eventId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Events', key: 'id' }, onDelete: 'CASCADE' },
      placeName: { type: Sequelize.STRING, allowNull: false },
      placeId: { type: Sequelize.INTEGER, allowNull: true },
      status: { type: Sequelize.STRING, defaultValue: 'pending' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 7. Notifications
    await queryInterface.createTable('Notifications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.STRING, defaultValue: 'info' },
      link: { type: Sequelize.STRING, allowNull: true },
      isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 8. Reviews
    await queryInterface.createTable('Reviews', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      fromUserId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      toUserId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      eventId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Events', key: 'id' }, onDelete: 'CASCADE' },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, defaultValue: '' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 9. PrivateMessages
    await queryInterface.createTable('PrivateMessages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      fromUserId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      toUserId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      text: { type: Sequelize.TEXT, allowNull: false },
      read: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PrivateMessages');
    await queryInterface.dropTable('Reviews');
    await queryInterface.dropTable('Notifications');
    await queryInterface.dropTable('Invites');
    await queryInterface.dropTable('Messages');
    await queryInterface.dropTable('EventParticipants');
    await queryInterface.dropTable('Events');
    await queryInterface.dropTable('Places');
    await queryInterface.dropTable('Users');
  }
};
