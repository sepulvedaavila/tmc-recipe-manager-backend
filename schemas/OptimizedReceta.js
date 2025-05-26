const mongoose = require('mongoose');

// Nutritional information schema
const nutritionSchema = new mongoose.Schema({
  calorias: { type: Number, default: 0 },
  proteinas: { type: Number, default: 0 }, // grams
  carbohidratos: { type: Number, default: 0 }, // grams
  grasas: { type: Number, default: 0 }, // grams
  fibra: { type: Number, default: 0 }, // grams
  sodio: { type: Number, default: 0 }, // mg
  azucar: { type: Number, default: 0 } // grams
}, { _id: false });

// Ingredient schema with enhanced features
const ingredienteSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true // For consistent searching
  },
  cantidad: { 
    type: Number, 
    required: true,
    min: 0
  },
  unidad: { 
    type: String, 
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'piezas', 'tazas', 'cucharadas', 'cucharaditas', 'latas', 'paquetes'],
    default: 'g'
  },
  categoria: {
    type: String,
    enum: ['proteina', 'vegetales', 'frutas', 'lacteos', 'granos', 'especias', 'aceites', 'otros'],
    default: 'otros'
  },
  // For cost calculation and shopping lists
  costoUnitario: { type: Number, default: 0 }, // cost per unit
  proveedor: { type: String, trim: true },
  
  // Nutritional info per ingredient (optional)
  nutricion: nutritionSchema,
  
  // For dietary restrictions
  alergenos: [{ 
    type: String, 
    enum: ['gluten', 'lacteos', 'huevos', 'nueces', 'mariscos', 'soya', 'pescado']
  }],
  
  // Ingredient substitutions
  sustitutos: [{
    nombre: String,
    factor: { type: Number, default: 1 }, // conversion factor
    notas: String
  }]
}, { _id: false });

// Main recipe schema
const recetaOptimizadaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  descripcion: {
    type: String,
    required: true
  },
  
  // Enhanced categorization
  categoria: {
    type: String,
    enum: ['sopa', 'plato-fuerte', 'guarnicion', 'postre', 'bebida', 'entrada'],
    required: true,
    index: true
  },
  
  // Embedded ingredients (MongoDB strength)
  ingredientes: [ingredienteSchema],
  
  // Recipe metadata
  tiempoPreparacion: { type: Number, default: 0 }, // minutes
  tiempoCoccion: { type: Number, default: 0 }, // minutes
  dificultad: { 
    type: String, 
    enum: ['facil', 'medio', 'dificil'], 
    default: 'medio' 
  },
  
  // Scaling information
  porcionesBase: { 
    type: Number, 
    required: true, 
    default: 4,
    min: 1 
  },
  
  // Instructions with timing
  instrucciones: [{
    paso: { type: Number, required: true },
    descripcion: { type: String, required: true },
    tiempo: { type: Number, default: 0 }, // minutes for this step
    temperatura: String, // e.g., "180°C", "fuego medio"
    equipoNecesario: [String] // e.g., ["horno", "licuadora"]
  }],
  
  // Nutritional information (calculated from ingredients)
  nutricionTotal: nutritionSchema,
  nutricionPorPorcion: nutritionSchema,
  
  // Enhanced tagging and search
  tags: [{ 
    type: String, 
    lowercase: true,
    index: true 
  }],
  
  // Dietary classifications
  restriccionesDieteticas: [{
    type: String,
    enum: ['vegetariano', 'vegano', 'sin-gluten', 'sin-lacteos', 'keto', 'paleo', 'bajo-sodio']
  }],
  
  // Source and attribution
  fuente: { type: String, trim: true },
  autor: { type: String, trim: true },
  fechaCreacion: { type: Date, default: Date.now },
  
  // Client-specific modifications
  modificaciones: [{
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    cambios: {
      ingredientesModificados: [ingredienteSchema],
      instruccionesModificadas: [String],
      notas: String
    },
    fechaModificacion: { type: Date, default: Date.now }
  }],
  
  // Cost calculation
  costoTotal: { type: Number, default: 0 },
  costoPorPorcion: { type: Number, default: 0 },
  
  // Usage tracking
  vecesUsada: { type: Number, default: 0 },
  ultimoUso: Date,
  
  // Status
  activa: { type: Boolean, default: true },
  
}, {
  timestamps: true,
  collection: 'recetas_optimizadas'
});

// Indexes for performance
recetaOptimizadaSchema.index({ nombre: 'text', descripcion: 'text', tags: 'text' });
recetaOptimizadaSchema.index({ categoria: 1, restriccionesDieteticas: 1 });
recetaOptimizadaSchema.index({ 'ingredientes.nombre': 1 }); // For ingredient search
recetaOptimizadaSchema.index({ vecesUsada: -1, ultimoUso: -1 }); // For popular recipes
recetaOptimizadaSchema.index({ costoTotal: 1 }); // For budget filtering

// Virtual for total time
recetaOptimizadaSchema.virtual('tiempoTotal').get(function() {
  return this.tiempoPreparacion + this.tiempoCoccion;
});

// Method to scale recipe
recetaOptimizadaSchema.methods.escalarReceta = function(nuevasPorciones) {
  const factor = nuevasPorciones / this.porcionesBase;
  
  const recetaEscalada = this.toObject();
  recetaEscalada.ingredientes = recetaEscalada.ingredientes.map(ing => ({
    ...ing,
    cantidad: ing.cantidad * factor
  }));
  
  recetaEscalada.porcionesActuales = nuevasPorciones;
  recetaEscalada.costoTotal = this.costoTotal * factor;
  recetaEscalada.costoPorPorcion = this.costoPorPorcion;
  
  return recetaEscalada;
};

// Method to calculate nutrition
recetaOptimizadaSchema.methods.calcularNutricion = function() {
  const total = this.ingredientes.reduce((acc, ing) => {
    if (ing.nutricion) {
      acc.calorias += ing.nutricion.calorias * ing.cantidad;
      acc.proteinas += ing.nutricion.proteinas * ing.cantidad;
      acc.carbohidratos += ing.nutricion.carbohidratos * ing.cantidad;
      acc.grasas += ing.nutricion.grasas * ing.cantidad;
      acc.fibra += ing.nutricion.fibra * ing.cantidad;
      acc.sodio += ing.nutricion.sodio * ing.cantidad;
      acc.azucar += ing.nutricion.azucar * ing.cantidad;
    }
    return acc;
  }, { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0, sodio: 0, azucar: 0 });
  
  this.nutricionTotal = total;
  this.nutricionPorPorcion = {
    calorias: total.calorias / this.porcionesBase,
    proteinas: total.proteinas / this.porcionesBase,
    carbohidratos: total.carbohidratos / this.porcionesBase,
    grasas: total.grasas / this.porcionesBase,
    fibra: total.fibra / this.porcionesBase,
    sodio: total.sodio / this.porcionesBase,
    azucar: total.azucar / this.porcionesBase
  };
};

// Pre-save hook to calculate costs and nutrition
recetaOptimizadaSchema.pre('save', function(next) {
  // Calculate total cost
  this.costoTotal = this.ingredientes.reduce((total, ing) => {
    return total + (ing.costoUnitario * ing.cantidad);
  }, 0);
  
  this.costoPorPorcion = this.costoTotal / this.porcionesBase;
  
  // Calculate nutrition if ingredients have nutrition data
  this.calcularNutricion();
  
  next();
});

module.exports = mongoose.model('RecetaOptimizada', recetaOptimizadaSchema, 'recetas_optimizadas'); 