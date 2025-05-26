const express = require('express');
const router = express.Router();
const mealPlansController = require('../controllers/mealPlansController');

// GET /api/meal-plans - Get all meal plans with filters and pagination
router.get('/', mealPlansController.getAll);

// GET /api/meal-plans/:id - Get specific meal plan with complete details
router.get('/:id', mealPlansController.getById);

// POST /api/meal-plans - Create complete meal plan atomically
router.post('/', mealPlansController.create);

// PUT /api/meal-plans/:id - Update meal plan atomically
router.put('/:id', mealPlansController.update);

// DELETE /api/meal-plans/:id - Delete meal plan and all associated recipes
router.delete('/:id', mealPlansController.delete);

module.exports = router;