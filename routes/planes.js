const express = require('express');
const router = express.Router();
const planesController = require('../controllers/planesController');

// GET /api/planes - Get all plans
router.get('/', planesController.getAll);

// GET /api/planes/:id - Get plan by ID with recipes
router.get('/:id', planesController.getById);

// POST /api/planes - Create a new plan
router.post('/', planesController.create);

// PUT /api/planes/:id - Update a plan
router.put('/:id', planesController.update);

// DELETE /api/planes/:id - Delete a plan and its recipes
router.delete('/:id', planesController.delete);

module.exports = router;
