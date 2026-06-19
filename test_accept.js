require('dotenv').config();
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 5 }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
console.log(token);
