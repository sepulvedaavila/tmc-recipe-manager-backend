const Cliente = require('../models/Cliente');
const mongoose = require('mongoose');

// Get all clients
exports.getAll = async (req, res) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;

    // Build query
    const query = {};

    // Text search
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute query
    const clientes = await Cliente.find(query)
      .sort({ nombre: 1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Cliente.countDocuments(query);

    console.log(`Found ${clientes.length} clients`);

    return res.status(200).json({
      clientes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({
      message: 'Error al obtener los clientes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get client by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findById(id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    return res.status(200).json(cliente);
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({
      message: 'Error al obtener el cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Create new client
exports.create = async (req, res) => {
  try {
    const { nombre, telefono, email, comentarios } = req.body;

    // Create new client
    const newCliente = new Cliente({
      nombre,
      telefono: telefono || '',
      email: email || '',
      comentarios: comentarios || ''
    });

    // Save to MongoDB
    const savedCliente = await newCliente.save();

    console.log('Client created:', savedCliente._id);

    return res.status(201).json({
      message: 'Cliente creado con éxito',
      clienteId: savedCliente._id
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({
      message: 'Error al crear el cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Update client
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, comentarios } = req.body;

    // Update client
    const updatedCliente = await Cliente.findByIdAndUpdate(
      id,
      {
        $set: {
          nombre,
          telefono,
          email,
          comentarios,
          updatedAt: Date.now()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedCliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    console.log('Client updated:', id);

    return res.status(200).json({
      message: 'Cliente actualizado con éxito',
      cliente: updatedCliente
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({
      message: 'Error al actualizar el cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Delete client
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCliente = await Cliente.findByIdAndDelete(id);

    if (!deletedCliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    console.log('Client deleted:', id);

    return res.status(200).json({
      message: 'Cliente eliminado con éxito'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).json({
      message: 'Error al eliminar el cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};