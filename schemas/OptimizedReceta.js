const mongoose = require('mongoose');

// Nutritional information schema with validation
const nutritionSchema = new mongoose.Schema({
  calorias: { 
    type: Number, 
    default: 0,
    min: [0, 'Las calorías no pueden ser negativas'],
    max: [10000, 'Las calorías no pueden exceder 10000']
  },
  proteinas: { 
    type: Number, 
    default: 0,
    min: [0, 'Las proteínas no pueden ser negativas'],
    max: [1000, 'Las proteínas no pueden exceder 1000g']
  }, // grams
  carbohidratos: { 
    type: Number, 
    default: 0,
    min: [0, 'Los carbohidratos no pueden ser negativos'],
    max: [1000, 'Los carbohidratos no pueden exceder 1000g']
  }, // grams
  grasas: { 
    type: Number, 
    default: 0,
    min: [0, 'Las grasas no pueden ser negativas'],
    max: [1000, 'Las grasas no pueden exceder 1000g']
  }, // grams
  fibra: { 
    type: Number, 
    default: 0,
    min: [0, 'La fibra no puede ser negativa'],
    max: [200, 'La fibra no puede exceder 200g']
  }, // grams
  sodio: { 
    type: Number, 
    default: 0,
    min: [0, 'El sodio no puede ser negativo'],
    max: [50000, 'El sodio no puede exceder 50000mg']
  }, // mg
  azucar: { 
    type: Number, 
    default: 0,
    min: [0, 'El azúcar no puede ser negativo'],
    max: [1000, 'El azúcar no puede exceder 1000g']
  } // grams
}, { _id: false });

// Ingredient schema with enhanced features and validation
const ingredienteSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: [true, 'El nombre del ingrediente es obligatorio'],
    trim: true,
    lowercase: true, // For consistent searching
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    validate: {
      validator: function(v) {
        return /^[a-záéíóúñü0-9\s\-.,()]+$/i.test(v);
      },
      message: 'El nombre contiene caracteres no válidos'
    }
  },
  cantidad: { 
    type: Number, 
    required: [true, 'La cantidad es obligatoria'],
    min: [0.001, 'La cantidad debe ser mayor a 0'],
    max: [10000, 'La cantidad no puede exceder 10000'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v > 0;
      },
      message: 'La cantidad debe ser un número válido mayor a 0'
    }
  },
  unidad: { 
    type: String, 
    required: [true, 'La unidad es obligatoria'],
    enum: {
      values: ['kg', 'g', 'l', 'ml', 'piezas', 'tazas', 'cucharadas', 'cucharaditas', 'latas', 'paquetes'],
      message: 'Unidad no válida. Debe ser: kg, g, l, ml, piezas, tazas, cucharadas, cucharaditas, latas, paquetes'
    },
    default: 'g'
  },
  categoria: {
    type: String,
    enum: {
      values: ['proteina', 'vegetales', 'frutas', 'lacteos', 'granos', 'especias', 'aceites', 'otros'],
      message: 'Categoría no válida'
    },
    default: 'otros'
  },
  // For cost calculation and shopping lists
  costoUnitario: { 
    type: Number, 
    default: 0,
    min: [0, 'El costo unitario no puede ser negativo'],
    max: [10000, 'El costo unitario no puede exceder 10000'],
    validate: {
      validator: function(v) {
        return v === 0 || (Number.isFinite(v) && v >= 0);
      },
      message: 'El costo unitario debe ser un número válido mayor o igual a 0'
    }
  },
  proveedor: { 
    type: String, 
    trim: true,
    maxlength: [100, 'El nombre del proveedor no puede exceder 100 caracteres']
  },
  
  // Nutritional info per ingredient (optional)
  nutricion: nutritionSchema,
  
  // For dietary restrictions
  alergenos: [{ 
    type: String, 
    enum: {
      values: ['gluten', 'lacteos', 'huevos', 'nueces', 'mariscos', 'soya', 'pescado'],
      message: 'Alérgeno no válido'
    }
  }],
  
  // Ingredient substitutions
  sustitutos: [{
    nombre: {
      type: String,
      trim: true,
      maxlength: [100, 'El nombre del sustituto no puede exceder 100 caracteres']
    },
    factor: { 
      type: Number, 
      default: 1,
      min: [0.1, 'El factor de conversión debe ser al menos 0.1'],
      max: [10, 'El factor de conversión no puede exceder 10']
    },
    notas: {
      type: String,
      trim: true,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    }
  }]
}, { _id: false });

// Main recipe schema with enhanced validation
const recetaOptimizadaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la receta es obligatorio'],
    trim: true,
    index: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    maxlength: [200, 'El nombre no puede exceder 200 caracteres'],
    validate: {
      validator: function(v) {
        return /^[a-záéíóúñü0-9\s\-.,()]+$/i.test(v);
      },
      message: 'El nombre contiene caracteres no válidos'
    }
  },
  
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  
  // Enhanced categorization
  categoria: {
    type: String,
    enum: {
      values: ['sopa', 'plato-fuerte', 'guarnicion', 'postre', 'bebida', 'entrada'],
      message: 'Categoría no válida'
    },
    required: [true, 'La categoría es obligatoria'],
    index: true
  },
  
  // Embedded ingredients (MongoDB strength) - at least one ingredient required
  ingredientes: {
    type: [ingredienteSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'La receta debe tener al menos un ingrediente'
    }
  },
  
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