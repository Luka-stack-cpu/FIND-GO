const BISHKEK_PLACES = [
    {
        "id": 1,
        "name": "Бульвар Эркиндик",
        "tag": "Прогулки",
        "category": "парк",
        "desc": "Самый любимый бульвар горожан. Идеальное место для неспешных прогулок под тенью деревьев.",
        "img": "/img/place_1_1.jpg",
        "photos": [
            "/img/place_1_1.jpg",
            "/img/place_1_2.jpg",
            "/img/place_1_3.jpg",
            "/img/place_1_4.jpg",
            "/img/place_1_5.jpg"
        ],
        "address": "бул. Эркиндик",
        "gisLink": "https://2gis.kg/bishkek/geo/15763234351059920",
        "instagram": "bishkek_city",
        "lat": 42.875,
        "lng": 74.6065
    },
    {
        "id": 2,
        "name": "Бишкек Парк",
        "tag": "Торговый центр",
        "category": "трц",
        "desc": "Популярный торговый центр в самом сердце города с магазинами, фуд-кортом и развлечениями.",
        "img": "/img/place_2_1.jpg",
        "photos": [
            "/img/place_2_1.jpg",
            "/img/place_2_2.jpg",
            "/img/place_2_3.jpg",
            "/img/place_2_4.jpg",
            "/img/place_2_5.jpg"
        ],
        "address": "ул. Киевская, 148",
        "gisLink": "https://2gis.kg/bishkek/search/bishkek park",
        "instagram": "bishkekpark",
        "lat": 42.874,
        "lng": 74.59
    },
    {
        "id": 3,
        "name": "Нацпарк Ала-Арча",
        "tag": "Горы и хайкинг",
        "category": "природа",
        "desc": "Национальный природный парк всего в 40 минутах от города. Величественные горы, водопады и свежий воздух.",
        "img": "/img/place_3_1.jpg",
        "photos": [
            "/img/place_3_1.jpg",
            "/img/place_3_2.jpg",
            "/img/place_3_3.jpg",
            "/img/place_3_4.jpg",
            "/img/place_3_5.jpg"
        ],
        "address": "Кыргызстан, Чуйская область",
        "gisLink": "https://2gis.kg/bishkek/geo/15763234351061234",
        "instagram": "alaarcha_nationalpark",
        "lat": 42.5975,
        "lng": 74.4842
    },
    {
        "id": 4,
        "name": "Дубовый парк",
        "tag": "Природа и искусство",
        "category": "парк",
        "desc": "Старейший парк города. Здесь расположена галерея скульптур под открытым небом и вековые дубы.",
        "img": "/img/place_4_1.jpg",
        "photos": [
            "/img/place_4_1.jpg",
            "/img/place_4_2.jpg",
            "/img/place_4_3.jpg",
            "/img/place_4_4.jpg",
            "/img/place_4_5.jpg"
        ],
        "address": "ул. Пушкина / ул. Тыныстанова",
        "gisLink": "https://2gis.kg/bishkek/geo/15763234351059918",
        "instagram": "bishkek_parks",
        "lat": 42.8789,
        "lng": 74.6075
    },
    {
        "id": 5,
        "name": "Озеро Иссык-Куль",
        "tag": "Жемчужина Азии",
        "category": "природа",
        "desc": "Высокогорное озеро, одно из крупнейших и глубочайших в мире. Идеальное место для летнего отдыха и туризма.",
        "img": "/img/place_5_1.jpg",
        "photos": [
            "/img/place_5_1.jpg",
            "/img/place_5_2.jpg",
            "/img/place_5_3.jpg",
            "/img/place_5_4.jpg",
            "/img/place_5_5.jpg"
        ],
        "address": "Иссык-Кульская область",
        "gisLink": "https://2gis.kg/bishkek/search/иссык-куль",
        "instagram": "issyk_kul_kg",
        "lat": 42.6167,
        "lng": 77.2
    },
    {
        "id": 6,
        "name": "Кафе Бублик",
        "tag": "Завтраки и кофе",
        "category": "кафе",
        "desc": "Уютное место для завтраков и душевных встреч. Свежая выпечка и отличный кофе в центре Бишкека.",
        "img": "/img/place_6_1.jpg",
        "photos": [
            "/img/place_6_1.jpg",
            "/img/place_6_2.jpg",
            "/img/place_6_3.jpg",
            "/img/place_6_4.jpg",
            "/img/place_6_5.jpg"
        ],
        "address": "бул. Эркиндик, 35",
        "gisLink": "https://2gis.kg/bishkek/search/бублик",
        "instagram": "bublik_kg",
        "lat": 42.8742,
        "lng": 74.6068
    },
    {
        "id": 7,
        "name": "Парк Евразия",
        "tag": "Современный парк",
        "category": "парк",
        "desc": "Новый современный парк с красивыми аллеями, зонами для отдыха и красивой вечерней подсветкой.",
        "img": "/img/place_7_1.jpg",
        "photos": [
            "/img/place_7_1.jpg",
            "/img/place_7_2.jpg",
            "/img/place_7_3.jpg",
            "/img/place_7_4.jpg",
            "/img/place_7_5.jpg"
        ],
        "address": "Южная магистраль",
        "gisLink": "https://2gis.kg/bishkek/search/евразия",
        "instagram": "bishkek_parks",
        "lat": 42.825,
        "lng": 74.6
    },
    {
        "id": 8,
        "name": "Парк Ынтымак",
        "tag": "Спорт и отдых",
        "category": "парк",
        "desc": "Отличное место для активного отдыха, скейтбординга и семейных прогулок в южной части города.",
        "img": "/img/place_8_1.jpg",
        "photos": [
            "/img/place_8_1.jpg",
            "/img/place_8_2.jpg",
            "/img/place_8_3.jpg",
            "/img/place_8_4.jpg",
            "/img/place_8_5.jpg"
        ],
        "address": "пр. Чингиза Айтматова",
        "gisLink": "https://2gis.kg/bishkek/search/ынтымак",
        "instagram": "yntymak_park",
        "lat": 42.821,
        "lng": 74.587
    },
    {
        "id": 9,
        "name": "Площадь Ала-Тоо",
        "tag": "Центр города",
        "category": "парк",
        "desc": "Центральная площадь Бишкека, сердце города. Здесь проходят все главные праздники, военные парады и народные гуляния.",
        "img": "/img/place_9_1.jpg",
        "photos": [
            "/img/place_9_1.jpg",
            "/img/place_9_2.jpg",
            "/img/place_9_3.jpg",
            "/img/place_9_4.jpg",
            "/img/place_9_5.jpg"
        ],
        "address": "просп. Чуй",
        "gisLink": "https://2gis.kg/bishkek/geo/70030076150117070",
        "instagram": "bishkek_city",
        "lat": 42.8765,
        "lng": 74.6037
    },
    {
        "id": 10,
        "name": "Ущелье Чункурчак",
        "tag": "Природа",
        "category": "природа",
        "desc": "Живописное ущелье с альпийскими лугами и современными горнолыжными базами. Отлично подходит для отдыха в любой сезон.",
        "img": "/img/place_10_1.jpg",
        "photos": [
            "/img/place_10_1.jpg",
            "/img/place_10_2.jpg",
            "/img/place_10_3.jpg",
            "/img/place_10_4.jpg",
            "/img/place_10_5.jpg"
        ],
        "address": "с. Таш-Добо",
        "gisLink": "https://2gis.kg/bishkek/geo/15763234351061235",
        "instagram": "chunkurchak_resort",
        "lat": 42.6333,
        "lng": 74.6167
    },
    {
        "id": 11,
        "name": "Торговый центр Азия Молл",
        "tag": "Шопинг",
        "category": "трц",
        "desc": "Самый современный ТРЦ города. Брендовые магазины, фуд-корт с кухнями мира и отличный кинотеатр.",
        "img": "/img/place_11_1.jpg",
        "photos": [
            "/img/place_11_1.jpg",
            "/img/place_11_2.jpg",
            "/img/place_11_3.jpg",
            "/img/place_11_4.jpg",
            "/img/place_11_5.jpg"
        ],
        "address": "просп. Ч. Айтматова, 3",
        "gisLink": "https://2gis.kg/bishkek/search/asia mall",
        "instagram": "asiamall.kg",
        "lat": 42.8645,
        "lng": 74.5875
    },
    {
        "id": 12,
        "name": "Кинотеатр Дордой Плаза",
        "tag": "Кино",
        "category": "трц",
        "desc": "Один из лучших кинотеатров в Бишкеке, расположенный в крупном торговом комплексе Dordoi Plaza. IMAX и комфортные залы.",
        "img": "/img/place_12_1.jpg",
        "photos": [
            "/img/place_12_1.jpg",
            "/img/place_12_2.jpg",
            "/img/place_12_3.jpg",
            "/img/place_12_4.jpg",
            "/img/place_12_5.jpg"
        ],
        "address": "ул. Ибраимова, 115",
        "gisLink": "https://2gis.kg/bishkek/search/дордой плаза кино",
        "instagram": "dordoiplaza",
        "lat": 42.8755,
        "lng": 74.615
    },
    {
        "id": 13,
        "name": "Чайхана Navat",
        "tag": "Национальная кухня",
        "category": "кафе",
        "desc": "Традиционная кыргызская кухня в богатом национальном интерьере. Отличное место для знакомства с культурой.",
        "img": "/img/place_13_1.jpg",
        "photos": [
            "/img/place_13_1.jpg",
            "/img/place_13_2.jpg",
            "/img/place_13_3.jpg",
            "/img/place_13_4.jpg",
            "/img/place_13_5.jpg"
        ],
        "address": "ул. Тоголок Молдо, 114",
        "gisLink": "https://2gis.kg/bishkek/search/navat",
        "instagram": "navat_kg",
        "lat": 42.8815,
        "lng": 74.5915
    },
    {
        "id": 14,
        "name": "Promzona Club",
        "tag": "Ночная жизнь",
        "category": "паб",
        "desc": "Легендарный рок-клуб Бишкека. Живой звук, отличная кухня и неповторимая атмосфера свободы.",
        "img": "/img/place_14_1.jpg",
        "photos": [
            "/img/place_14_1.jpg",
            "/img/place_14_2.jpg",
            "/img/place_14_3.jpg",
            "/img/place_14_4.jpg",
            "/img/place_14_5.jpg"
        ],
        "address": "ул. Чолпон-Атинская, 16",
        "gisLink": "https://2gis.kg/bishkek/search/promzona",
        "instagram": "promzonaclub",
        "lat": 42.8745,
        "lng": 74.6735
    },
    {
        "id": 15,
        "name": "Кофейня Capito",
        "tag": "Кофейня",
        "category": "кафе",
        "desc": "Стильная и современная кофейня для работы и встреч. Прекрасный интерьер, спешалти кофе и авторские десерты.",
        "img": "/img/place_15_1.jpg",
        "photos": [
            "/img/place_15_1.jpg",
            "/img/place_15_2.jpg",
            "/img/place_15_3.jpg",
            "/img/place_15_4.jpg",
            "/img/place_15_5.jpg"
        ],
        "address": "ул. Токтогула, 125",
        "gisLink": "https://2gis.kg/bishkek/search/capito",
        "instagram": "capito_coffee",
        "lat": 42.8725,
        "lng": 74.594
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BISHKEK_PLACES };
}
