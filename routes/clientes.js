const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// GET /api/clientes - Get all clients
router.get('/', clientesController.getAll);

// GET /api/clientes/:id - Get client by ID
router.get('/:id', clientesController.getById);

// POST /api/clientes - Create a new client
router.post('/', clientesController.create);

// PUT /api/clientes/:id - Update a client
router.put('/:id', clientesController.update);

// DELETE /api/clientes/:id - Delete a client
router.delete('/:id', clientesController.delete);

module.exports = router;