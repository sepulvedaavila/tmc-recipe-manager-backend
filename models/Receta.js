const mongoose = require('mongoose');

// Define ingrediente schema to match your MongoDB collection's structure
//connectDB();
//mongoose.connect('mongodb+srv://tmc-app-mgr:zo20wf9XLFJG6fUI@cluster0.wbsaj.mongodb.net/?appName=Cluster0');
const ingredienteSchema = new mongoose.Schema({
  ingrediente: {
    type: String,
    required: true
  },
  unidad: {
    type: String,
    default: ""
  },
  // Use the exact field names from your MongoDB collection
  por_persona: {
    type: Number,
    default: 0
  },
  cantidad_total: {
    type: Number,
    default: 0
  },
  // Optional fields that might exist in your collection
  idIngrediente: Number,
  idReceta: Number
}, { _id: true, strict: false });

// Define recipe schema to match your MongoDB collection's structure
const recetaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  fuente: {
    type: String,
    default: ""
  },
  descripcion: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  plan: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  idReceta: {
    type: Number
  },
  tipoPlatillo: {
    type: String,
    required: true
  },
  racion: {
    type: Number,
    required: true,
    default: 4
  },
  ingredientes: {
    type: [ingredienteSchema],
    default: []
  }
}, {
  // Add these options for better MongoDB compatibility
  timestamps: false,
  strict: false, // Allow fields not specified in the schema
  collection: 'recetas' // Explicitly name the collection
});

// Add text index for search
recetaSchema.index({ nombre: 'text', descripcion: 'text' });

// Add a helper method to make sure field names match collection
recetaSchema.methods.toJSON = function() {
  const recipeObject = this.toObject();
  
  // Ensure ingredientes array has the right field names
  if (recipeObject.ingredientes && Array.isArray(recipeObject.ingredientes)) {
    recipeObject.ingredientes = recipeObject.ingredientes.map(ing => ({
      ingrediente: ing.ingrediente,
      unidad: ing.unidad || '',
      por_persona: ing.por_persona || 0,
      cantidad_total: ing.cantidad_total || 0
    }));
  }
  
  return recipeObject;
};

// Create and export the model with explicit collection name
module.exports = mongoose.model('Receta', recetaSchema, 'recetas');

