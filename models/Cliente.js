const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,required: true,
    index: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  comentarios: {
    type: String
  },
  idCliente: {
    type: Number,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// Create text index for search
clienteSchema.index({ nombre: 'text', email: 'text' });

module.exports = mongoose.model('Cliente', clienteSchema, 'clientes');