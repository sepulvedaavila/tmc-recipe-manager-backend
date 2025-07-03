const express = require('express');
const router = express.Router();
const mealPlansController = require('../controllers/mealPlansController');
const { validateMealPlan, validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/meal-plans - Get all meal plans with filters and pagination
router.get('/', validatePagination, mealPlansController.getAll);

// GET /api/meal-plans/:id - Get specific meal plan with complete details
router.get('/:id', validateObjectId, mealPlansController.getById);

// POST /api/meal-plans - Create complete meal plan atomically
router.post('/', authenticate, validateMealPlan, mealPlansController.create);

// PUT /api/meal-plans/:id - Update meal plan atomically
router.put('/:id', authenticate, validateObjectId, validateMealPlan, mealPlansController.update);

// DELETE /api/meal-plans/:id - Delete meal plan and all associated recipes
router.delete('/:id', authenticate, authorize('admin', 'chef'), validateObjectId, mealPlansController.delete);

module.exports = router;