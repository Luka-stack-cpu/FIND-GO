const express = require('express');
const router = express.Router();
const { Company, User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// ============================================================
// СОЗДАТЬ КОМПАНИЮ
// ============================================================
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, interestSlug, schedule } = req.body;
        
        if (!name || !interestSlug) {
            return res.status(400).json({ message: 'Название и интерес обязательны' });
        }

        const company = await Company.create({
            name,
            description,
            interestSlug,
            schedule,
            creatorId: req.user.id
        });

        // Создатель автоматически вступает в компанию
        await company.addMember(req.user.id);

        res.status(201).json(company);
    } catch (err) {
        console.error('❌ Error creating company:', err.message);
        res.status(500).json({ message: 'Ошибка создания компании' });
    }
});

// ============================================================
// ПОЛУЧИТЬ КОМПАНИИ ПО ИНТЕРЕСУ
// ============================================================
router.get('/interest/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const companies = await Company.findAll({
            where: { interestSlug: slug },
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar'] },
                { model: User, as: 'members', attributes: ['id'], through: { attributes: [] } }
            ],
            order: [['createdAt', 'DESC']]
        });

        const result = companies.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            schedule: c.schedule,
            creator: c.creator,
            membersCount: c.members ? c.members.length : 0,
            members: c.members.map(m => m.id),
            createdAt: c.createdAt
        }));

        res.json(result);
    } catch (err) {
        console.error('❌ Error fetching companies:', err.message);
        res.status(500).json({ message: 'Ошибка получения компаний' });
    }
});

// ============================================================
// ПОЛУЧИТЬ МОИ КОМПАНИИ
// ============================================================
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Company,
                as: 'joinedCompanies',
                include: [{ model: User, as: 'members', attributes: ['id'], through: { attributes: [] } }]
            }]
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const result = user.joinedCompanies.map(c => ({
            id: c.id,
            name: c.name,
            schedule: c.schedule,
            membersCount: c.members ? c.members.length : 0
        }));

        res.json(result);
    } catch (err) {
        console.error('❌ Error fetching my companies:', err.message);
        res.status(500).json({ message: 'Ошибка получения ваших компаний' });
    }
});

// ============================================================
// ВСТУПИТЬ В КОМПАНИЮ
// ============================================================
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ message: 'Компания не найдена' });

        await company.addMember(req.user.id);
        res.json({ message: 'Вы успешно вступили в компанию' });
    } catch (err) {
        console.error('❌ Error joining company:', err.message);
        res.status(500).json({ message: 'Ошибка вступления' });
    }
});

// ============================================================
// ВЫЙТИ ИЗ КОМПАНИИ
// ============================================================
router.post('/:id/leave', authMiddleware, async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ message: 'Компания не найдена' });

        await company.removeMember(req.user.id);
        res.json({ message: 'Вы покинули компанию' });
    } catch (err) {
        console.error('❌ Error leaving company:', err.message);
        res.status(500).json({ message: 'Ошибка выхода' });
    }
});

module.exports = router;
