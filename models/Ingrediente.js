const mongoose = require('mongoose');

const ingredienteSchema = new mongoose.Schema({
  ingrediente: {
    type: String,
    required: true
  },
  unidad: {
    type: String,
    default: ""
  },
  idIngrediente: {
    type: Number,
    required: true
  },
  idReceta: {
    type: Number,
    required: true,
    index: true // Index for efficient lookups
  },
  porPersona: {
    type: Number,
    default: 0
  },
  cantidadTotal: {
    type: Number,
    default: 0
  }
}, {
  timestamps: false,
  strict: false,
  collection: 'ingredientes' // Explicit collection name
});

// Index for efficient recipe lookups
ingredienteSchema.index({ idReceta: 1 });

module.exports = mongoose.model('Ingrediente', ingredienteSchema, 'ingredientes'); 