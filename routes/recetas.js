const express = require('express');
const router = express.Router();
const recetasController = require('../controllers/recetasController');

// GET /api/recipes - Get all recipes with optional filters
router.get('/', recetasController.getAll);

// GET /api/recipes/:id - Get recipe by ID
router.get('/:id', recetasController.getById);

// POST /api/recipes - Create a new recipe
router.post('/', recetasController.create);

// PUT /api/recipes/:id - Update a recipe
router.put('/:id', recetasController.update);

// DELETE /api/recipes/:id - Delete a recipe
router.delete('/:id', recetasController.delete);

module.exports = router;
