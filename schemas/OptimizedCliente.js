const mongoose = require('mongoose');

// Dietary preferences schema
const preferenciasDieteticasSchema = new mongoose.Schema({
  restricciones: [{
    tipo: {
      type: String,
      enum: ['vegetariano', 'vegano', 'sin-gluten', 'sin-lacteos', 'keto', 'paleo', 'bajo-sodio', 'diabetico'],
      required: true
    },
    nivel: {
      type: String,
      enum: ['estricto', 'moderado', 'ocasional'],
      default: 'estricto'
    },
    fechaInicio: { type: Date, default: Date.now },
    notas: String
  }],
  
  alergias: [{
    alergeno: {
      type: String,
      enum: ['gluten', 'lacteos', 'huevos', 'nueces', 'mariscos', 'soya', 'pescado', 'cacahuates'],
      required: true
    },
    severidad: {
      type: String,
      enum: ['leve', 'moderada', 'severa'],
      default: 'moderada'
    },
    notas: String
  }],
  
  ingredientesNoDeseados: [{
    nombre: { type: String, required: true, lowercase: true },
    razon: String, // "no me gusta", "textura", "olor", etc.
    alternativas: [String]
  }],
  
  platillosFavoritos: [{
    recetaId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecetaOptimizada' },
    frecuenciaDeseada: {
      type: String,
      enum: ['diario', 'semanal', 'quincenal', 'mensual'],
      default: 'semanal'
    },
    ultimaVez: Date
  }],
  
  objetivosNutricionales: {
    calorias: { min: Number, max: Number },
    proteinas: { min: Number, max: Number }, // grams
    carbohidratos: { min: Number, max: Number }, // grams
    grasas: { min: Number, max: Number }, // grams
    sodio: { max: Number }, // mg
    fibra: { min: Number } // grams
  }
}, { _id: false });

// Billing information schema
const facturacionSchema = new mongoose.Schema({
  tipoSuscripcion: {
    type: String,
    enum: ['basico', 'premium', 'empresarial'],
    default: 'basico'
  },
  fechaInicio: { type: Date, default: Date.now },
  fechaVencimiento: Date,
  estado: {
    type: String,
    enum: ['activo', 'suspendido', 'cancelado', 'prueba'],
    default: 'prueba'
  },
  metodoPago: {
    tipo: { type: String, enum: ['tarjeta', 'transferencia', 'efectivo'] },
    ultimosCuatroDigitos: String,
    fechaUltimoPago: Date
  },
  historialPagos: [{
    fecha: { type: Date, default: Date.now },
    monto: Number,
    concepto: String,
    estado: { type: String, enum: ['pagado', 'pendiente', 'fallido'], default: 'pendiente' }
  }]
}, { _id: false });

// Main client schema
const clienteOptimizadoSchema = new mongoose.Schema({
  // Basic information
  nombre: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  apellido: {
    type: String,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  telefono: {
    type: String,
    trim: true
  },
  
  // Demographics for better meal planning
  edad: Number,
  genero: {
    type: String,
    enum: ['masculino', 'femenino', 'otro', 'prefiero-no-decir']
  },
  
  // Household information
  miembrosHogar: {
    adultos: { type: Number, default: 1, min: 1 },
    ninos: { type: Number, default: 0, min: 0 },
    edadesNinos: [Number]
  },
  
  // Location for delivery/shopping lists
  direccion: {
    calle: String,
    ciudad: String,
    estado: String,
    codigoPostal: String,
    pais: { type: String, default: 'México' }
  },
  
  // Dietary preferences and restrictions
  preferenciasDieteticas: preferenciasDieteticasSchema,
  
  // Meal planning preferences
  preferenciasPlanes: {
    diasPreferidos: [{
      type: String,
      enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    }],
    tiempoPreparacionMaximo: { type: Number, default: 60 }, // minutes
    presupuestoSemanal: { min: Number, max: Number },
    equipoCocina: [String], // "horno", "licuadora", "olla express", etc.
    nivelCocina: {
      type: String,
      enum: ['principiante', 'intermedio', 'avanzado'],
      default: 'intermedio'
    }
  },
  
  // Communication preferences
  notificaciones: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    frecuencia: {
      type: String,
      enum: ['inmediata', 'diaria', 'semanal'],
      default: 'diaria'
    }
  },
  
  // Billing information
  facturacion: facturacionSchema,
  
  // Usage analytics
  estadisticas: {
    planesCreados: { type: Number, default: 0 },
    recetasFavoritas: { type: Number, default: 0 },
    ultimaActividad: Date,
    tiempoPromedioSesion: Number, // minutes
    funcionalidadMasUsada: String
  },
  
  // Status
  activo: { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now },
  ultimoAcceso: Date,
  
  // Notes for customer service
  notas: String
  
}, {
  timestamps: true,
  collection: 'clientes_optimizados'
});

// Indexes for performance
clienteOptimizadoSchema.index({ email: 1 }, { unique: true });
clienteOptimizadoSchema.index({ nombre: 'text', apellido: 'text', email: 'text' });
clienteOptimizadoSchema.index({ 'facturacion.estado': 1, 'facturacion.fechaVencimiento': 1 });
clienteOptimizadoSchema.index({ activo: 1, ultimoAcceso: -1 });
clienteOptimizadoSchema.index({ 'preferenciasDieteticas.restricciones.tipo': 1 });

// Virtual for full name
clienteOptimizadoSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido || ''}`.trim();
});

// Method to check if client has specific dietary restriction
clienteOptimizadoSchema.methods.tieneRestriccion = function(tipoRestriccion) {
  return this.preferenciasDieteticas.restricciones.some(
    restriccion => restriccion.tipo === tipoRestriccion
  );
};

// Method to check if client is allergic to ingredient
clienteOptimizadoSchema.methods.esAlergico = function(alergeno) {
  return this.preferenciasDieteticas.alergias.some(
    alergia => alergia.alergeno === alergeno
  );
};

// Method to get recommended portion size based on household
clienteOptimizadoSchema.methods.obtenerPorcionesRecomendadas = function() {
  const adultos = this.miembrosHogar.adultos;
  const ninos = this.miembrosHogar.ninos;
  
  // Children count as 0.7 of an adult portion
  return adultos + (ninos * 0.7);
};

// Pre-save hook to update statistics
clienteOptimizadoSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.ultimoAcceso = new Date();
  }
  next();
});

// Add pre-save hook to update meal plans
clienteOptimizadoSchema.pre('save', async function(next) {
  try {
    // Check if relevant fields have been modified
    if (this.isModified('preferenciasDieteticas') || 
        this.isModified('miembrosHogar') || 
        this.isModified('preferenciasPlanes')) {
      
      // Get all active meal plans for this client
      const PlanComidasOptimizado = mongoose.model('PlanComidasOptimizado');
      const planes = await PlanComidasOptimizado.find({
        clienteId: this._id,
        estado: 'activo'
      });
      
      // Update each plan's denormalized client preferences
      for (const plan of planes) {
        plan.preferenciasCliente = {
          restriccionesDieteticas: this.preferenciasDieteticas.restricciones.map(r => ({
            tipo: r.tipo,
            nivel: r.nivel
          })),
          alergias: this.preferenciasDieteticas.alergias.map(a => ({
            alergeno: a.alergeno,
            severidad: a.severidad
          })),
          miembrosHogar: this.miembrosHogar,
          preferenciasCocina: {
            nivelCocina: this.preferenciasPlanes.nivelCocina,
            equipoDisponible: this.preferenciasPlanes.equipoCocina,
            tiempoMaximoPreparacion: this.preferenciasPlanes.tiempoPreparacionMaximo
          }
        };
        
        await plan.save();
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ClienteOptimizado', clienteOptimizadoSchema, 'clientes_optimizados'); 