const mongoose = require('mongoose');
const config = require('../config/database');

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  migrateRelationships().then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}).catch(error => {
  console.error('Failed to connect to MongoDB:', error);
  process.exit(1);
});

// Import models
const PlanComidasOptimizado = require('../models/OptimizedPlanComidas');
const ClienteOptimizado = require('../models/OptimizedCliente');
const RecetaOptimizada = require('../models/OptimizedReceta');

async function migrateRelationships() {
  console.log('Starting migration...');
  
  // Get all meal plans
  const planes = await PlanComidasOptimizado.find({});
  console.log(`Found ${planes.length} meal plans to migrate`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const plan of planes) {
    try {
      console.log(`Processing plan: ${plan.nombre} (${plan._id})`);
      
      // 1. Get client data
      const cliente = await ClienteOptimizado.findById(plan.clienteId);
      if (!cliente) {
        console.warn(`Client not found for plan ${plan._id}, skipping...`);
        continue;
      }
      
      // 2. Update plan with client preferences
      plan.preferenciasCliente = {
        restriccionesDieteticas: cliente.preferenciasDieteticas.restricciones.map(r => ({
          tipo: r.tipo,
          nivel: r.nivel
        })),
        alergias: cliente.preferenciasDieteticas.alergias.map(a => ({
          alergeno: a.alergeno,
          severidad: a.severidad
        })),
        miembrosHogar: cliente.miembrosHogar,
        preferenciasCocina: {
          nivelCocina: cliente.preferenciasPlanes.nivelCocina,
          equipoDisponible: cliente.preferenciasPlanes.equipoCocina,
          tiempoMaximoPreparacion: cliente.preferenciasPlanes.tiempoPreparacionMaximo
        }
      };
      
      // 3. Update each meal with recipe info
      for (const dia of plan.dias) {
        const tiposComida = ['desayuno', 'almuerzo', 'cena'];
        
        // Process regular meals
        for (const tipo of tiposComida) {
          const comida = dia.comidas[tipo];
          if (comida?.recetaId) {
            await updateComidaWithRecipeInfo(comida);
          }
        }
        
        // Process comida (lunch) which has multiple components
        if (dia.comidas.comida) {
          const componentes = ['sopa', 'principal', 'guarnicion'];
          for (const componente of componentes) {
            const comida = dia.comidas.comida[componente];
            if (comida?.recetaId) {
              await updateComidaWithRecipeInfo(comida);
            }
          }
        }
        
        // Process snacks
        if (dia.comidas.colaciones) {
          for (const comida of dia.comidas.colaciones) {
            if (comida?.recetaId) {
              await updateComidaWithRecipeInfo(comida);
            }
          }
        }
      }
      
      // 4. Save updated plan
      await plan.save();
      successCount++;
      console.log(`Successfully migrated plan: ${plan.nombre}`);
      
    } catch (error) {
      errorCount++;
      console.error(`Error migrating plan ${plan._id}:`, error);
    }
  }
  
  console.log('\nMigration Summary:');
  console.log(`Total plans processed: ${planes.length}`);
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Failed to migrate: ${errorCount}`);
}

async function updateComidaWithRecipeInfo(comida) {
  const receta = await RecetaOptimizada.findById(comida.recetaId);
  if (!receta) {
    console.warn(`Recipe not found for meal ${comida._id}, skipping...`);
    return;
  }
  
  comida.recetaInfo = {
    nombre: receta.nombre,
    categoria: receta.categoria,
    tiempoPreparacion: receta.tiempoPreparacion,
    tiempoCoccion: receta.tiempoCoccion,
    dificultad: receta.dificultad,
    porcionesBase: receta.porcionesBase,
    nutricionPorPorcion: receta.nutricionPorPorcion,
    ingredientesPrincipales: receta.ingredientes.slice(0, 5).map(ing => ({
      nombre: ing.nombre,
      cantidad: ing.cantidad,
      unidad: ing.unidad,
      categoria: ing.categoria
    })),
    restriccionesDieteticas: receta.restriccionesDieteticas
  };
} 