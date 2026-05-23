import re

with open("server.js", "r", encoding="utf-8") as f:
    content = f.read()

# Replace seed data
new_seed = """await db.Place.bulkCreate([
                { id: 1, name: "Бульвар Эркиндик", description: "Самый любимый бульвар горожан. Идеальное место для неспешных прогулок под тенью деревьев.", category: "парк", image: "/img/place_1_1.jpg" },
                { id: 2, name: "Бишкек Парк", description: "Популярный торговый центр в самом сердце города с магазинами, фуд-кортом и развлечениями.", category: "трц", image: "/img/place_2_1.jpg" },
                { id: 3, name: "Нацпарк Ала-Арча", description: "Национальный природный парк всего в 40 минутах от города. Величественные горы, водопады и свежий воздух.", category: "природа", image: "/img/place_3_1.jpg" },
                { id: 4, name: "Дубовый парк", description: "Старейший парк города. Здесь расположена галерея скульптур под открытым небом и вековые дубы.", category: "парк", image: "/img/place_4_1.jpg" },
                { id: 5, name: "Озеро Иссык-Куль", description: "Высокогорное озеро, одно из крупнейших и глубочайших в мире. Идеальное место для летнего отдыха и туризма.", category: "природа", image: "/img/place_5_1.jpg" },
                { id: 6, name: "Кафе Бублик", description: "Уютное место для завтраков и душевных встреч. Свежая выпечка и отличный кофе в центре Бишкека.", category: "кафе", image: "/img/place_6_1.jpg" },
                { id: 7, name: "Парк Евразия", description: "Новый современный парк с красивыми аллеями, зонами для отдыха и красивой вечерней подсветкой.", category: "парк", image: "/img/place_7_1.jpg" },
                { id: 8, name: "Парк Ынтымак", description: "Отличное место для активного отдыха, скейтбординга и семейных прогулок в южной части города.", category: "парк", image: "/img/place_8_1.jpg" },
                { id: 9, name: "Площадь Ала-Тоо", description: "Центральная площадь Бишкека, сердце города. Здесь проходят все главные праздники, военные парады и народные гуляния.", category: "парк", image: "/img/place_9_1.jpg" },
                { id: 10, name: "Ущелье Чункурчак", description: "Живописное ущелье с альпийскими лугами и современными горнолыжными базами. Отлично подходит для отдыха в любой сезон.", category: "природа", image: "/img/place_10_1.jpg" },
                { id: 11, name: "Торговый центр Азия Молл", description: "Самый современный ТРЦ города. Брендовые магазины, фуд-корт с кухнями мира и отличный кинотеатр.", category: "трц", image: "/img/place_11_1.jpg" },
                { id: 12, name: "Кинотеатр Дордой Плаза", description: "Один из лучших кинотеатров в Бишкеке, расположенный в крупном торговом комплексе Dordoi Plaza. IMAX и комфортные залы.", category: "трц", image: "/img/place_12_1.jpg" },
                { id: 13, name: "Чайхана Navat", description: "Традиционная кыргызская кухня в богатом национальном интерьере. Отличное место для знакомства с культурой.", category: "кафе", image: "/img/place_13_1.jpg" },
                { id: 14, name: "Promzona Club", description: "Легендарный рок-клуб Бишкека. Живой звук, отличная кухня и неповторимая атмосфера свободы.", category: "паб", image: "/img/place_14_1.jpg" },
                { id: 15, name: "Кофейня Capito", description: "Стильная и современная кофейня для работы и встреч. Прекрасный интерьер, спешалти кофе и авторские десерты.", category: "кафе", image: "/img/place_15_1.jpg" }
            ]);"""

content = re.sub(r'await db\.Place\.bulkCreate\(\[\s*\{.*?\}\s*\]\);', new_seed, content, flags=re.DOTALL)
content = content.replace("16 мест", "15 мест")

# Remove lines 286 to 316 (The "Форсированное обновление картинок")
content = re.sub(r'// 7\. Форсированное обновление картинок.*?\} catch \(e\) \{ console\.error\(\'⚠️ Ошибка при обновлении фото:\', e\.message\); \}', '', content, flags=re.DOTALL)

with open("server.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated server.js")
