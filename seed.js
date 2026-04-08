<<<<<<< HEAD
const db = require('./models');

const seed = async () => {
  await db.sequelize.sync({ force: true }); // Осторожно! Удалит все данные. Для разработки.
  
  await db.Place.bulkCreate([
    { name: 'Слеза Ала-Тоо', description: 'Красивый фонтан в центре Бишкека', category: 'прогулка', image: 'https://images.pexels.com/photos/2372720/pexels-photo-2372720.jpeg' },
    { name: 'Дубовый парк', description: 'Уютное место для прогулок', category: 'прогулка', image: 'https://images.pexels.com/photos/158028/bellingrath-gardens-bellingrath-gardens-mobile-al-spring-158028.jpeg' },
    { name: 'Южные ворота', description: 'Смотровая площадка с видом на горы', category: 'прогулка', image: 'https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg' }
  ]);
  
  console.log('База данных заполнена начальными местами');
  process.exit();
};
=======
const db = require('./src/models');

async function seed() {
  try {
    await db.sequelize.sync({ force: true });
    console.log('✅ Таблицы созданы');
    
    await db.Place.bulkCreate([
      { name: 'Квест «Тайна старого дома»', description: 'Интерактивный квест в центре Бишкека', category: 'квест' },
      { name: 'Квест «Побег из тюрьмы»', description: 'Адреналиновый квест', category: 'квест' },
      { name: 'Паб «Beer House»', description: 'Крафтовое пиво и спорт', category: 'паб' },
      { name: 'Бар «No Name»', description: 'Авторские коктейли', category: 'паб' },
      { name: 'Ирландский паб «Molly»', description: 'Виски и эль', category: 'паб' },
      { name: 'Кинотеатр «Ала-Тоо»', description: 'Новинки кино', category: 'кино' },
      { name: 'Кинотеатр «Кыргызстан»', description: 'Уютный кинотеатр', category: 'кино' },
      { name: 'Кинотеатр «Триумф»', description: 'Современный кинотеатр', category: 'кино' },
      { name: 'Арт-кафе «Старый Баку»', description: 'Уютное кафе с живой музыкой', category: 'кафе' },
      { name: 'Кофейня «Coffee House»', description: 'Ароматный кофе и десерты', category: 'кафе' },
      { name: 'Клуб «Metro»', description: 'Главный ночной клуб', category: 'клуб' },
      { name: 'Клуб «Restobar 12»', description: 'Ресторан и танцы', category: 'клуб' }
    ]);
    console.log('✅ Места добавлены!');
    process.exit();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}
>>>>>>> 2427114 (Initial commit)

seed();