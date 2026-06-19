const { Place, User, Event } = require('../models');

exports.getPlaces = async (req, res) => {
  try {
    const places = await Place.findAll();
    // Возвращаем данные с fallback-значениями для safety-полей
    const result = places.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      image: p.image,
      address: p.address,
      safetyScore: p.safetyScore ?? 8.9,
      safetyVotes: p.safetyVotes ?? 0,
      isDangerous: p.isDangerous ?? false
    }));
    res.json(result);
  } catch (error) {
    console.error('Ошибка загрузки мест:', error);
    res.status(500).json({ message: 'Ошибка загрузки мест' });
  }
};

// Получение мест по категории
exports.getPlacesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const places = await Place.findAll({
      where: { category: category },
      attributes: ['id', 'name', 'description', 'address', 'image', 'safetyScore', 'safetyVotes', 'isDangerous']
    });
    res.json(places);
  } catch (error) {
    console.error('Ошибка загрузки мест по категории:', error);
    res.status(500).json({ message: 'Ошибка загрузки мест по категории' });
  }
};

// Проверка, может ли пользователь голосовать за безопасность места
exports.checkCanVote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const hasCompletedEvent = await Event.findOne({
      where: {
        placeId: id,
        status: 'completed'
      },
      include: [{
        model: User,
        as: 'participants',
        where: { id: userId },
        required: true,
        attributes: ['id']
      }]
    });

    res.json({ canVote: !!hasCompletedEvent });
  } catch (error) {
    console.error('Ошибка проверки возможности голосования:', error);
    res.status(500).json({ message: 'Ошибка проверки голосования' });
  }
};

// Голосование за безопасность места
exports.voteSafety = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;
    
    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10) {
      return res.status(400).json({ message: 'Оценка должна быть числом от 1 до 10' });
    }

    // Проверяем наличие завершенного похода
    const hasCompletedEvent = await Event.findOne({
      where: {
        placeId: id,
        status: 'completed'
      },
      include: [{
        model: User,
        as: 'participants',
        where: { id: userId },
        required: true,
        attributes: ['id']
      }]
    });

    if (!hasCompletedEvent) {
      return res.status(403).json({ message: 'Вы можете оценить безопасность этого места только после того, как примете участие в завершенном походе туда.' });
    }

    const place = await Place.findByPk(id);
    if (!place) {
      return res.status(404).json({ message: 'Место не найдено' });
    }

    let history = [];
    try {
      if (place.safetyHistory) {
        history = JSON.parse(place.safetyHistory);
      }
    } catch (e) {
      history = [];
    }

    if (!Array.isArray(history)) {
      history = [];
    }

    // Push new rating to history
    history.push(parsedRating);

    // Recalculate average
    const sum = history.reduce((acc, val) => acc + val, 0);
    const newAverage = parseFloat((sum / history.length).toFixed(1));

    place.safetyHistory = JSON.stringify(history);
    place.safetyScore = newAverage;
    place.safetyVotes = history.length;

    await place.save();

    res.json({
      success: true,
      id: place.id,
      safetyScore: place.safetyScore,
      safetyVotes: place.safetyVotes
    });
  } catch (error) {
    console.error('Ошибка при оценке безопасности:', error);
    res.status(500).json({ message: 'Ошибка при оценке безопасности' });
  }
};

// Получение интересов всех пользователей
exports.getAllUsersInterests = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'interests']
        });
        const formatted = users.map(u => {
            let interestsArray = [];
            try {
                if (Array.isArray(u.interests)) interestsArray = u.interests;
                else if (u.interests) interestsArray = JSON.parse(u.interests);
            } catch (e) {
                interestsArray = [];
            }
            return {
                id: u.id,
                name: u.name,
                interests: Array.isArray(interestsArray) ? interestsArray : []
            };
        });
        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка загрузки интересов' });
    }
};