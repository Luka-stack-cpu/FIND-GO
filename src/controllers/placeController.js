const { Place, User } = require('../models');

exports.getPlaces = async (req, res) => {
  try {
    const places = await Place.findAll({
      attributes: ['id', 'name', 'description', 'category', 'image', 'address', 'safetyScore', 'safetyVotes', 'isDangerous']
    });
    res.json(places);
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

// Голосование за безопасность места
exports.voteSafety = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10) {
      return res.status(400).json({ message: 'Оценка должна быть числом от 1 до 10' });
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