'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Delete Issyk-Kul first if it exists
    await queryInterface.bulkDelete('Places', {
      name: ['Озеро Иссык-Куль', 'Иссык-Куль']
    }, {});

    const [results] = await queryInterface.sequelize.query('SELECT count(*) AS count FROM "Places"');
    const count = parseInt(results[0].count, 10);

    // If there is only the original set, recreate it, or update it
    if (count > 5) {
      console.log(`✅ В базе уже ${count} мест. Пропускаем сидирование.`);
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert('Places', [
      { id: 1, name: "Бульвар Эркиндик", description: "Самый любимый бульвар горожан. Идеальное место для неспешных прогулок под тенью деревьев.", category: "парк", image: "/img/place_1_1.jpg", safetyScore: 8.9, safetyVotes: 150, safetyHistory: '[8.9]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 2, name: "Бишкек Парк", description: "Популярный торговый центр в самом сердце города с магазинами, фуд-кортом и развлечениями.", category: "трц", image: "/img/place_2_1.jpg", safetyScore: 8.9, safetyVotes: 120, safetyHistory: '[8.9]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 3, name: "Нацпарк Ала-Арча", description: "Национальный природный парк всего в 40 минутах от города. Величественные горы, водопады и свежий воздух.", category: "природа", image: "/img/place_3_1.jpg", safetyScore: 6.2, safetyVotes: 95, safetyHistory: '[6.2]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 4, name: "Дубовый парк", description: "Старейший парк города. Здесь расположена галерея скульптур под открытым небом и вековые дубы.", category: "парк", image: "/img/place_4_1.jpg", safetyScore: 6.2, safetyVotes: 78, safetyHistory: '[6.2]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 6, name: "Кафе Бублик", description: "Уютное место для завтраков и душевных встреч. Свежая выпечка и отличный кофе в центре Бишкека.", category: "кафе", image: "/img/place_6_1.jpg", safetyScore: 8.9, safetyVotes: 110, safetyHistory: '[8.9]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 7, name: "Парк Евразия", description: "Новый современный парк с красивыми аллеями, зонами для отдыха и красивой вечерней подсветкой.", category: "парк", image: "/img/place_7_1.jpg", safetyScore: 8.9, safetyVotes: 65, safetyHistory: '[8.9]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 8, name: "Парк Ынтымак", description: "Отличное место для активного отдыха, скейтбординга и семейных прогулок в южной части города.", category: "парк", image: "/img/place_8_1.jpg", safetyScore: 6.2, safetyVotes: 130, safetyHistory: '[6.2]', isDangerous: true, createdAt: now, updatedAt: now },
      { id: 9, name: "Площадь Ала-Тоо", description: "Центральная площадь Бишкека, сердце города. Здесь проходят все главные праздники, военные парады и народные гуляния.", category: "парк", image: "/img/place_9_1.jpg", safetyScore: 8.9, safetyVotes: 210, safetyHistory: '[8.9]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 10, name: "Ущелье Чункурчак", description: "Живописное ущелье с альпийскими лугами и современными горнолыжными базами. Отлично подходит для отдыха в любой сезон.", category: "природа", image: "/img/place_10_1.jpg", safetyScore: 6.2, safetyVotes: 40, safetyHistory: '[6.2]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 11, name: "Торговый центр Азия Молл", description: "Самый современный ТРЦ города. Брендовые магазины, фуд-корт с кухнями мира и отличный кинотеатр.", category: "трц", image: "/img/place_11_1.jpg", safetyScore: 6.2, safetyVotes: 145, safetyHistory: '[6.2]', isDangerous: true, createdAt: now, updatedAt: now },
      { id: 12, name: "Кинотеатр Дордой Плаза", description: "Один из лучших кинотеатров в Бишкеке, расположенный в крупном торговом комплексе Dordoi Plaza. IMAX и комфортные залы.", category: "трц", image: "/img/place_12_1.jpg", safetyScore: 8.9, safetyVotes: 88, safetyHistory: '[8.9]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 13, name: "Чайхана Navat", description: "Традиционная кыргызская кухня в богатом национальном интерьере. Отличное место для знакомства с культурой.", category: "кафе", image: "/img/place_13_1.jpg", safetyScore: 8.9, safetyVotes: 105, safetyHistory: '[8.9]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 14, name: "Promzona Club", description: "Легендарный рок-клуб Бишкека. Живой звук, отличная кухня и неповторимая атмосфера свободы.", category: "паб", image: "/img/place_14_1.jpg", safetyScore: 6.2, safetyVotes: 72, safetyHistory: '[6.2]', isDangerous: false, createdAt: now, updatedAt: now },
      { id: 15, name: "Кофейня Capito", description: "Стильная и современная кофейня для работы и встреч. Прекрасный интерьер, спешалти кофе и авторские десерты.", category: "кафе", image: "/img/place_15_1.jpg", safetyScore: 8.9, safetyVotes: 50, safetyHistory: '[8.9]', isDangerous: false, createdAt: now, updatedAt: now },
      
      { id: 16, name: "Арча-Бешик", description: "Жилой массив на окраине города. Рекомендуется соблюдать повышенную осторожность в темное время суток.", category: "природа", image: "/img/place_danger_1.jpg", safetyScore: 3.4, safetyVotes: 154, safetyHistory: '[3.4]', isDangerous: true, createdAt: now, updatedAt: now },
      { id: 17, name: "Рабочий городок", description: "Исторический район с частной застройкой. Стоит проявлять бдительность при посещении.", category: "природа", image: "/img/place_danger_2.jpg", safetyScore: 3.1, safetyVotes: 132, safetyHistory: '[3.1]', isDangerous: true, createdAt: now, updatedAt: now },
      { id: 18, name: "Аламедин-1", description: "Спальный микрорайон на востоке города. В вечернее время рекомендуется избегать неосвещенных мест.", category: "природа", image: "/img/place_danger_3.jpg", safetyScore: 3.2, safetyVotes: 142, safetyHistory: '[3.2]', isDangerous: true, createdAt: now, updatedAt: now },
      { id: 19, name: "Кызыл-Аскер", description: "Промышленно-жилой район. Характеризуется повышенным уровнем риска в темное время суток.", category: "природа", image: "/img/place_danger_4.jpg", safetyScore: 2.9, safetyVotes: 168, safetyHistory: '[2.9]', isDangerous: true, createdAt: now, updatedAt: now }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Places', null, {});
  }
};
