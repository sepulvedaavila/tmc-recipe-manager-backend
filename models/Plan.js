const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  cliente: {
    type: Number,
    required: true,
    index: true
  },
  nombrePlan: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  racion: {
    type: Number,
    required: true,
    default: 4,
    min: 1,
    max: 20
  },
  // Enhanced fields for better meal plan management
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaFin: {
    type: Date,
    // Default to 7 days from start
    default: function() {
      const startDate = this.fechaInicio || new Date();
      return new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    }
  },
  diasPlanificados: {
    type: [String],
    enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Debe incluir al menos un día en el plan'
    }
  },
  estado: {
    type: String,
    enum: ['borrador', 'activo', 'completado', 'archivado'],
    default: 'borrador'
  },
  descripcion: {
    type: String,
    trim: true
  },
  // Legacy field for compatibility
  idPlan: {
    type: Number,
    sparse: true
  },
  fechaCreacion: {
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

// Indexes for performance
planSchema.index({ cliente: 1, fechaCreacion: -1 });
planSchema.index({ estado: 1, fechaCreacion: -1 });

// Pre-save hook to update the updatedAt field
planSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for plan duration in days
planSchema.virtual('duracionDias').get(function() {
  if (this.fechaInicio && this.fechaFin) {
    const diffTime = Math.abs(this.fechaFin - this.fechaInicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

module.exports = mongoose.model('Plan', planSchema, 'planes');
