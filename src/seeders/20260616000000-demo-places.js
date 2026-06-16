'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if places already exist to avoid duplicates if run multiple times
    const [results] = await queryInterface.sequelize.query('SELECT count(*) AS count FROM "Places"');
    const count = parseInt(results[0].count, 10);

    if (count > 0) {
      console.log(`✅ В базе уже ${count} мест. Пропускаем сидирование.`);
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert('Places', [
        { name: "Бульвар Эркиндик", description: "Самый любимый бульвар горожан. Идеальное место для неспешных прогулок под тенью деревьев.", category: "парк", image: "/img/place_1_1.jpg", createdAt: now, updatedAt: now },
        { name: "Бишкек Парк", description: "Популярный торговый центр в самом сердце города с магазинами, фуд-кортом и развлечениями.", category: "трц", image: "/img/place_2_1.jpg", createdAt: now, updatedAt: now },
        { name: "Нацпарк Ала-Арча", description: "Национальный природный парк всего в 40 минутах от города. Величественные горы, водопады и свежий воздух.", category: "природа", image: "/img/place_3_1.jpg", createdAt: now, updatedAt: now },
        { name: "Дубовый парк", description: "Старейший парк города. Здесь расположена галерея скульптур под открытым небом и вековые дубы.", category: "парк", image: "/img/place_4_1.jpg", createdAt: now, updatedAt: now },
        { name: "Озеро Иссык-Куль", description: "Высокогорное озеро, одно из крупнейших и глубочайших в мире. Идеальное место для летнего отдыха и туризма.", category: "природа", image: "/img/place_5_1.jpg", createdAt: now, updatedAt: now },
        { name: "Кафе Бублик", description: "Уютное место для завтраков и душевных встреч. Свежая выпечка и отличный кофе в центре Бишкека.", category: "кафе", image: "/img/place_6_1.jpg", createdAt: now, updatedAt: now },
        { name: "Парк Евразия", description: "Новый современный парк с красивыми аллеями, зонами для отдыха и красивой вечерней подсветкой.", category: "парк", image: "/img/place_7_1.jpg", createdAt: now, updatedAt: now },
        { name: "Парк Ынтымак", description: "Отличное место для активного отдыха, скейтбординга и семейных прогулок в южной части города.", category: "парк", image: "/img/place_8_1.jpg", createdAt: now, updatedAt: now },
        { name: "Площадь Ала-Тоо", description: "Центральная площадь Бишкека, сердце города. Здесь проходят все главные праздники, военные парады и народные гуляния.", category: "парк", image: "/img/place_9_1.jpg", createdAt: now, updatedAt: now },
        { name: "Ущелье Чункурчак", description: "Живописное ущелье с альпийскими лугами и современными горнолыжными базами. Отлично подходит для отдыха в любой сезон.", category: "природа", image: "/img/place_10_1.jpg", createdAt: now, updatedAt: now },
        { name: "Торговый центр Азия Молл", description: "Самый современный ТРЦ города. Брендовые магазины, фуд-корт с кухнями мира и отличный кинотеатр.", category: "трц", image: "/img/place_11_1.jpg", createdAt: now, updatedAt: now },
        { name: "Кинотеатр Дордой Плаза", description: "Один из лучших кинотеатров в Бишкеке, расположенный в крупном торговом комплексе Dordoi Plaza. IMAX и комфортные залы.", category: "трц", image: "/img/place_12_1.jpg", createdAt: now, updatedAt: now },
        { name: "Чайхана Navat", description: "Традиционная кыргызская кухня в богатом национальном интерьере. Отличное место для знакомства с культурой.", category: "кафе", image: "/img/place_13_1.jpg", createdAt: now, updatedAt: now },
        { name: "Promzona Club", description: "Легендарный рок-клуб Бишкека. Живой звук, отличная кухня и неповторимая атмосфера свободы.", category: "паб", image: "/img/place_14_1.jpg", createdAt: now, updatedAt: now },
        { name: "Кофейня Capito", description: "Стильная и современная кофейня для работы и встреч. Прекрасный интерьер, спешалти кофе и авторские десерты.", category: "кафе", image: "/img/place_15_1.jpg", createdAt: now, updatedAt: now }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Places', null, {});
  }
};
