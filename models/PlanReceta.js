const mongoose = require('mongoose');

const planRecetaSchema = new mongoose.Schema({
  idPlanReceta: {
    type: Number,
    sparse: true
  },
  idPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
    index: true
  },
  diaSemana: {
    type: String,
    enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    required: true,
    lowercase: true
  },
  // Simplified approach: store recipe IDs with their types
  recetas: {
    sopa: {
      type: Number,
      sparse: true,
      ref: 'Receta'
    },
    principal: {
      type: Number,
      sparse: true,
      ref: 'Receta'
    },
    guarnicion: {
      type: Number,
      sparse: true,
      ref: 'Receta'
    }
  },
  // Legacy fields for backward compatibility
  idReceta: {
    type: Number,
    sparse: true
  },
  idSoup: {
    type: Number,
    sparse: true,
    ref: 'Receta'
  },
  idMain: {
    type: Number,
    sparse: true,
    ref: 'Receta'
  },
  idSide: {
    type: Number,
    sparse: true,
    ref: 'Receta'
  },
  // Enhanced fields
  tipoComida: {
    type: String,
    enum: ['desayuno', 'comida', 'cena'],
    default: 'comida'
  },
  notas: {
    type: String,
    trim: true
  },
  // For portion adjustments specific to this day
  ajusteRacion: {
    type: Number,
    default: 0, // 0 means use plan's default racion
    min: -10,
    max: 10
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

// Enhanced indexing for better performance
planRecetaSchema.index({ idPlan: 1, diaSemana: 1, tipoComida: 1 }, { unique: true });
planRecetaSchema.index({ idPlan: 1, diaSemana: 1 });

// Pre-save validation to ensure at least one recipe is selected
planRecetaSchema.pre('save', function(next) {
  const hasNewRecipes = this.recetas && (this.recetas.sopa || this.recetas.principal || this.recetas.guarnicion);
  const hasLegacyRecipes = this.idSoup || this.idMain || this.idSide || this.idReceta;
  
  if (!hasNewRecipes && !hasLegacyRecipes) {
    next(new Error('Al menos una receta debe ser seleccionada'));
  } else {
    // Sync legacy fields with new structure
    if (hasNewRecipes) {
      this.idSoup = this.recetas.sopa || null;
      this.idMain = this.recetas.principal || null;
      this.idSide = this.recetas.guarnicion || null;
    }
    next();
  }
});

// Virtual to get total recipes for this day
planRecetaSchema.virtual('totalRecetas').get(function() {
  let count = 0;
  if (this.recetas) {
    if (this.recetas.sopa) count++;
    if (this.recetas.principal) count++;
    if (this.recetas.guarnicion) count++;
  }
  // Fallback to legacy fields
  if (count === 0) {
    if (this.idSoup) count++;
    if (this.idMain) count++;
    if (this.idSide) count++;
    if (this.idReceta) count++;
  }
  return count;
});

module.exports = mongoose.model('PlanReceta', planRecetaSchema, 'planRecetas');