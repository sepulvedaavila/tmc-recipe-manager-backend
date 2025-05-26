const mongoose = require('mongoose');

// Individual meal schema
const comidaSchema = new mongoose.Schema({
  recetaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecetaOptimizada',
    required: true
  },
  
  // Scaling for this specific meal
  porcionesPersonalizadas: Number, // If different from plan default
  
  // Client-specific modifications for this meal
  modificaciones: {
    ingredientesOmitidos: [String],
    ingredientesAdicionales: [{
      nombre: String,
      cantidad: Number,
      unidad: String
    }],
    instruccionesAdicionales: String,
    notas: String
  },
  
  // Timing information
  horaPreferida: String, // "08:00", "13:00", "19:00"
  tiempoPreparacion: Number, // minutes (can override recipe default)
  
  // Status tracking
  preparado: { type: Boolean, default: false },
  fechaPreparacion: Date,
  calificacion: {
    type: Number,
    min: 1,
    max: 5
  },
  comentarios: String
}, { _id: false });

// Daily meal plan schema
const diaPlanSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true
  },
  
  diaSemana: {
    type: String,
    enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    required: true
  },
  
  // Meals for the day
  comidas: {
    desayuno: comidaSchema,
    almuerzo: comidaSchema,
    comida: {
      sopa: comidaSchema,
      principal: comidaSchema,
      guarnicion: comidaSchema
    },
    cena: comidaSchema,
    colaciones: [comidaSchema] // Snacks
  },
  
  // Daily totals (calculated)
  nutricionDiaria: {
    calorias: { type: Number, default: 0 },
    proteinas: { type: Number, default: 0 },
    carbohidratos: { type: Number, default: 0 },
    grasas: { type: Number, default: 0 },
    fibra: { type: Number, default: 0 },
    sodio: { type: Number, default: 0 }
  },
  
  costoEstimadoDia: { type: Number, default: 0 },
  
  // Day-specific notes
  notas: String,
  
  // Completion status
  completado: { type: Boolean, default: false },
  porcentajeCompletado: { type: Number, default: 0 }
}, { _id: false });

// Shopping list item schema
const itemListaComprasSchema = new mongoose.Schema({
  ingrediente: {
    type: String,
    required: true,
    lowercase: true
  },
  
  cantidadTotal: {
    type: Number,
    required: true
  },
  
  unidad: {
    type: String,
    required: true
  },
  
  categoria: {
    type: String,
    enum: ['proteina', 'vegetales', 'frutas', 'lacteos', 'granos', 'especias', 'aceites', 'otros'],
    default: 'otros'
  },
  
  // For shopping organization
  seccionSupermercado: String, // "carnicería", "verdulería", "lácteos"
  prioridad: {
    type: String,
    enum: ['alta', 'media', 'baja'],
    default: 'media'
  },
  
  // Cost tracking
  costoEstimado: Number,
  costoReal: Number,
  
  // Shopping status
  comprado: { type: Boolean, default: false },
  fechaCompra: Date,
  
  // Which recipes need this ingredient
  recetasQueLoUsan: [{
    recetaId: mongoose.Schema.Types.ObjectId,
    nombreReceta: String,
    cantidadNecesaria: Number
  }]
}, { _id: false });

// Main meal plan schema
const planComidasOptimizadoSchema = new mongoose.Schema({
  // Basic information
  nombre: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClienteOptimizado',
    required: true,
    index: true
  },
  
  // Plan period
  fechaInicio: {
    type: Date,
    required: true,
    index: true
  },
  
  fechaFin: {
    type: Date,
    required: true
  },
  
  // Plan configuration
  porcionesBase: {
    type: Number,
    required: true,
    default: 4,
    min: 1
  },
  
  // Embedded daily plans (MongoDB strength!)
  dias: [diaPlanSchema],
  
  // Plan-level preferences
  preferencias: {
    presupuestoMaximo: Number,
    tiempoMaximoPreparacion: Number, // minutes per day
    evitarRepetirRecetas: { type: Boolean, default: true },
    diasSinCocinar: [String], // days to use leftovers or simple meals
    comidaFueraCasa: [{ // planned restaurant meals
      dia: String,
      comida: String, // "desayuno", "comida", "cena"
      restaurante: String,
      costoEstimado: Number
    }]
  },
  
  // Generated shopping list
  listaCompras: [itemListaComprasSchema],
  
  // Plan totals and analytics
  resumen: {
    totalRecetas: { type: Number, default: 0 },
    costoTotalEstimado: { type: Number, default: 0 },
    costoPromedioDiario: { type: Number, default: 0 },
    tiempoTotalPreparacion: { type: Number, default: 0 }, // minutes
    
    // Nutritional summary
    nutricionPromedioDiaria: {
      calorias: Number,
      proteinas: Number,
      carbohidratos: Number,
      grasas: Number,
      fibra: Number,
      sodio: Number
    },
    
    // Recipe distribution
    distribucionCategorias: {
      sopas: Number,
      platosFuertes: Number,
      guarniciones: Number,
      postres: Number
    }
  },
  
  // Plan status and tracking
  estado: {
    type: String,
    enum: ['borrador', 'activo', 'completado', 'pausado', 'cancelado'],
    default: 'borrador',
    index: true
  },
  
  // Template information
  esPlantilla: { type: Boolean, default: false },
  plantillaOriginal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlanComidasOptimizado'
  },
  
  // Usage tracking
  vecesUsado: { type: Number, default: 0 },
  ultimaActividad: Date,
  
  // Feedback and rating
  calificacionGeneral: {
    type: Number,
    min: 1,
    max: 5
  },
  
  comentariosGenerales: String,
  
  // Sharing and collaboration
  compartido: { type: Boolean, default: false },
  usuariosCompartidos: [{
    clienteId: mongoose.Schema.Types.ObjectId,
    permisos: {
      type: String,
      enum: ['lectura', 'edicion'],
      default: 'lectura'
    }
  }]
  
}, {
  timestamps: true,
  collection: 'planes_comidas_optimizados'
});

// Indexes for performance
planComidasOptimizadoSchema.index({ clienteId: 1, fechaInicio: -1 });
planComidasOptimizadoSchema.index({ estado: 1, fechaInicio: 1 });
planComidasOptimizadoSchema.index({ esPlantilla: 1, vecesUsado: -1 });
planComidasOptimizadoSchema.index({ 'dias.fecha': 1 });
planComidasOptimizadoSchema.index({ nombre: 'text', comentariosGenerales: 'text' });

// Virtual for plan duration
planComidasOptimizadoSchema.virtual('duracionDias').get(function() {
  const diffTime = Math.abs(this.fechaFin - this.fechaInicio);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

// Method to generate shopping list
planComidasOptimizadoSchema.methods.generarListaCompras = async function() {
  const ingredientesAgrupados = {};
  
  // Iterate through all meals in all days
  for (const dia of this.dias) {
    const comidas = [
      dia.comidas.desayuno,
      dia.comidas.almuerzo,
      dia.comidas.comida?.sopa,
      dia.comidas.comida?.principal,
      dia.comidas.comida?.guarnicion,
      dia.comidas.cena,
      ...(dia.comidas.colaciones || [])
    ].filter(Boolean);
    
    for (const comida of comidas) {
      if (comida?.recetaId) {
        // Get recipe and scale ingredients
        const RecetaOptimizada = mongoose.model('RecetaOptimizada');
        const receta = await RecetaOptimizada.findById(comida.recetaId);
        
        if (receta) {
          const porciones = comida.porcionesPersonalizadas || this.porcionesBase;
          const factor = porciones / receta.porcionesBase;
          
          receta.ingredientes.forEach(ing => {
            const key = `${ing.nombre}_${ing.unidad}`;
            
            if (!ingredientesAgrupados[key]) {
              ingredientesAgrupados[key] = {
                ingrediente: ing.nombre,
                cantidadTotal: 0,
                unidad: ing.unidad,
                categoria: ing.categoria,
                costoEstimado: 0,
                recetasQueLoUsan: []
              };
            }
            
            ingredientesAgrupados[key].cantidadTotal += ing.cantidad * factor;
            ingredientesAgrupados[key].costoEstimado += (ing.costoUnitario || 0) * ing.cantidad * factor;
            ingredientesAgrupados[key].recetasQueLoUsan.push({
              recetaId: receta._id,
              nombreReceta: receta.nombre,
              cantidadNecesaria: ing.cantidad * factor
            });
          });
        }
      }
    }
  }
  
  // Convert to array and sort by category
  this.listaCompras = Object.values(ingredientesAgrupados).sort((a, b) => {
    const categoriaOrder = ['proteina', 'vegetales', 'frutas', 'lacteos', 'granos', 'especias', 'aceites', 'otros'];
    return categoriaOrder.indexOf(a.categoria) - categoriaOrder.indexOf(b.categoria);
  });
  
  return this.listaCompras;
};

// Method to calculate plan summary
planComidasOptimizadoSchema.methods.calcularResumen = function() {
  let totalRecetas = 0;
  let costoTotal = 0;
  let tiempoTotal = 0;
  let nutricionTotal = {
    calorias: 0, proteinas: 0, carbohidratos: 0, 
    grasas: 0, fibra: 0, sodio: 0
  };
  
  this.dias.forEach(dia => {
    costoTotal += dia.costoEstimadoDia || 0;
    
    // Count meals
    if (dia.comidas.desayuno) totalRecetas++;
    if (dia.comidas.almuerzo) totalRecetas++;
    if (dia.comidas.comida?.sopa) totalRecetas++;
    if (dia.comidas.comida?.principal) totalRecetas++;
    if (dia.comidas.comida?.guarnicion) totalRecetas++;
    if (dia.comidas.cena) totalRecetas++;
    totalRecetas += (dia.comidas.colaciones || []).length;
    
    // Sum nutrition
    Object.keys(nutricionTotal).forEach(key => {
      nutricionTotal[key] += dia.nutricionDiaria[key] || 0;
    });
  });
  
  const numDias = this.dias.length;
  
  this.resumen = {
    totalRecetas,
    costoTotalEstimado: costoTotal,
    costoPromedioDiario: numDias > 0 ? costoTotal / numDias : 0,
    tiempoTotalPreparacion: tiempoTotal,
    nutricionPromedioDiaria: {
      calorias: numDias > 0 ? nutricionTotal.calorias / numDias : 0,
      proteinas: numDias > 0 ? nutricionTotal.proteinas / numDias : 0,
      carbohidratos: numDias > 0 ? nutricionTotal.carbohidratos / numDias : 0,
      grasas: numDias > 0 ? nutricionTotal.grasas / numDias : 0,
      fibra: numDias > 0 ? nutricionTotal.fibra / numDias : 0,
      sodio: numDias > 0 ? nutricionTotal.sodio / numDias : 0
    }
  };
};

// Method to duplicate plan as template
planComidasOptimizadoSchema.methods.crearPlantilla = function(nombrePlantilla) {
  const plantilla = this.toObject();
  delete plantilla._id;
  delete plantilla.clienteId;
  delete plantilla.createdAt;
  delete plantilla.updatedAt;
  
  plantilla.nombre = nombrePlantilla;
  plantilla.esPlantilla = true;
  plantilla.estado = 'borrador';
  plantilla.plantillaOriginal = this._id;
  
  // Remove specific dates and client-specific data
  plantilla.dias.forEach(dia => {
    delete dia.fecha;
    // Reset completion status
    dia.completado = false;
    dia.porcentajeCompletado = 0;
    
    // Reset meal completion status
    const resetComida = (comida) => {
      if (comida) {
        comida.preparado = false;
        delete comida.fechaPreparacion;
        delete comida.calificacion;
        delete comida.comentarios;
      }
    };
    
    resetComida(dia.comidas.desayuno);
    resetComida(dia.comidas.almuerzo);
    resetComida(dia.comidas.comida?.sopa);
    resetComida(dia.comidas.comida?.principal);
    resetComida(dia.comidas.comida?.guarnicion);
    resetComida(dia.comidas.cena);
    (dia.comidas.colaciones || []).forEach(resetComida);
  });
  
  return plantilla;
};

// Pre-save hook to calculate summary
planComidasOptimizadoSchema.pre('save', function(next) {
  this.calcularResumen();
  this.ultimaActividad = new Date();
  next();
});

module.exports = mongoose.model('PlanComidasOptimizado', planComidasOptimizadoSchema, 'planes_comidas_optimizados'); 