const mongoose = require('mongoose');
const PlanComidasOptimizado = require('../schemas/OptimizedPlanComidas');
require('dotenv').config();

async function migrateMealPlans(options = {}) {
  const {
    dryRun = false,
    backupOld = true,
    clearNew = false,
    strategy = 'basic' // 'basic', 'fresh', 'sample'
  } = options;

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log(`\n🚀 Starting meal plan migration with strategy: ${strategy}\n`);

    if (strategy === 'basic') {
      await basicMealPlanMigration(db, { dryRun, backupOld, clearNew });
    } else if (strategy === 'fresh') {
      await freshMealPlanStart(db, { dryRun, clearNew });
    } else if (strategy === 'sample') {
      await sampleMealPlanData(db);
    }

  } catch (error) {
    console.error('❌ Meal plan migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Strategy 1: Basic migration from old Plan + PlanReceta structure
async function basicMealPlanMigration(db, { dryRun, backupOld, clearNew }) {
  console.log('📋 Strategy: Basic Migration from Plan + PlanReceta');
  console.log('This will migrate existing meal plans to the new embedded structure.\n');

  // Step 1: Backup old data if requested
  if (backupOld && !dryRun) {
    console.log('📦 Creating backup of old meal plan data...');
    const oldPlans = await db.collection('plans').find({}).toArray();
    const oldPlanRecetas = await db.collection('planrecetas').find({}).toArray();
    
    const timestamp = Date.now();
    await db.collection(`plans_backup_${timestamp}`).insertMany(oldPlans);
    await db.collection(`planrecetas_backup_${timestamp}`).insertMany(oldPlanRecetas);
    
    console.log(`✅ Backup created: plans_backup_${timestamp} (${oldPlans.length} plans)`);
    console.log(`✅ Backup created: planrecetas_backup_${timestamp} (${oldPlanRecetas.length} plan-recipes)`);
  }

  // Step 2: Clear new collection if requested
  if (clearNew && !dryRun) {
    console.log('\n🗑️  Clearing existing optimized meal plans...');
    await PlanComidasOptimizado.deleteMany({});
    console.log('✅ Cleared optimized meal plans collection');
  }

  // Step 3: Get old data
  console.log('\n📊 Analyzing existing meal plan data...');
  const oldPlans = await db.collection('plans').find({}).toArray();
  const oldPlanRecetas = await db.collection('planrecetas').find({}).toArray();
  const optimizedRecipes = await db.collection('recetas_optimizadas').find({}).toArray();
  
  console.log(`Found ${oldPlans.length} old meal plans`);
  console.log(`Found ${oldPlanRecetas.length} plan-recipe relationships`);
  console.log(`Found ${optimizedRecipes.length} optimized recipes`);

  // Create recipe lookup map (old ID to new ObjectId)
  const recipeMap = new Map();
  optimizedRecipes.forEach(recipe => {
    // Try to find the original ID in tags
    const originalIdTag = recipe.tags?.find(tag => tag.startsWith('migrado-id-'));
    if (originalIdTag) {
      const originalId = originalIdTag.replace('migrado-id-', '');
      recipeMap.set(parseInt(originalId), recipe._id);
    }
  });

  // Group plan recipes by plan ID
  const planRecipeMap = new Map();
  oldPlanRecetas.forEach(pr => {
    const planId = pr.idPlan?.toString();
    if (planId) {
      if (!planRecipeMap.has(planId)) {
        planRecipeMap.set(planId, []);
      }
      planRecipeMap.get(planId).push(pr);
    }
  });

  // Step 4: Migrate meal plans
  console.log('\n🔄 Starting meal plan migration...');
  const migratedPlans = [];
  const errors = [];

  for (const oldPlan of oldPlans) {
    try {
      const planId = oldPlan._id.toString();
      const planRecetas = planRecipeMap.get(planId) || [];

      // Create new optimized meal plan structure
      const newPlan = {
        nombre: oldPlan.nombrePlan || 'Plan Migrado',
        clienteId: new mongoose.Types.ObjectId(), // Will need to be mapped to actual client
        fechaInicio: oldPlan.fechaInicio || new Date(),
        fechaFin: oldPlan.fechaFin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        porcionesBase: oldPlan.racion || 4,
        dias: [],
        estado: mapPlanStatus(oldPlan.estado),
        preferencias: {
          evitarRepetirRecetas: true
        },
        resumen: {
          totalRecetas: 0,
          costoTotalEstimado: 0,
          costoPromedioDiario: 0,
          tiempoTotalPreparacion: 0
        }
      };

      // Process each day's recipes
      const dayMap = new Map();
      
      for (const planReceta of planRecetas) {
        const diaSemana = planReceta.diaSemana;
        const tipoComida = planReceta.tipoComida || 'comida';
        
        if (!dayMap.has(diaSemana)) {
          dayMap.set(diaSemana, {
            fecha: calculateDateForDay(newPlan.fechaInicio, diaSemana),
            diaSemana: diaSemana,
            comidas: {
              desayuno: null,
              almuerzo: null,
              comida: {
                sopa: null,
                principal: null,
                guarnicion: null
              },
              cena: null,
              colaciones: []
            },
            nutricionDiaria: {
              calorias: 0,
              proteinas: 0,
              carbohidratos: 0,
              grasas: 0,
              fibra: 0,
              sodio: 0
            },
            costoEstimadoDia: 0,
            completado: false,
            porcentajeCompletado: 0
          });
        }

        const dayData = dayMap.get(diaSemana);

        // Map recipes to the new structure
        if (tipoComida === 'comida') {
          // Handle lunch with sopa, principal, guarnicion
          if (planReceta.idSoup && recipeMap.has(planReceta.idSoup)) {
            dayData.comidas.comida.sopa = createMealEntry(recipeMap.get(planReceta.idSoup), planReceta);
          }
          if (planReceta.idMain && recipeMap.has(planReceta.idMain)) {
            dayData.comidas.comida.principal = createMealEntry(recipeMap.get(planReceta.idMain), planReceta);
          }
          if (planReceta.idSide && recipeMap.has(planReceta.idSide)) {
            dayData.comidas.comida.guarnicion = createMealEntry(recipeMap.get(planReceta.idSide), planReceta);
          }
        } else {
          // Handle other meal types
          const recipeId = planReceta.idReceta || planReceta.idMain || planReceta.idSoup || planReceta.idSide;
          if (recipeId && recipeMap.has(recipeId)) {
            const mealEntry = createMealEntry(recipeMap.get(recipeId), planReceta);
            
            if (tipoComida === 'desayuno') {
              dayData.comidas.desayuno = mealEntry;
            } else if (tipoComida === 'cena') {
              dayData.comidas.cena = mealEntry;
            } else {
              dayData.comidas.almuerzo = mealEntry;
            }
          }
        }
      }

      // Convert day map to array
      newPlan.dias = Array.from(dayMap.values());

      migratedPlans.push(newPlan);

      if (dryRun) {
        console.log(`✓ Would migrate: ${newPlan.nombre} (${newPlan.dias.length} days, ${planRecetas.length} recipes)`);
      } else {
        const savedPlan = await PlanComidasOptimizado.create(newPlan);
        console.log(`✅ Migrated: ${savedPlan.nombre} (${savedPlan.dias.length} days)`);
      }

    } catch (error) {
      const errorMsg = `Error migrating plan ${oldPlan.nombrePlan}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  // Summary
  console.log('\n📋 Migration Summary:');
  console.log(`✅ Successfully processed: ${migratedPlans.length} meal plans`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes were made to the database');
    console.log('Run with dryRun: false to apply changes');
  } else {
    console.log('\n🎉 Meal plan migration completed successfully!');
    
    // Verify migration
    const newCount = await PlanComidasOptimizado.countDocuments();
    console.log(`📊 New optimized meal plans collection now has: ${newCount} documents`);
  }
}

// Strategy 2: Fresh start with sample meal plans
async function freshMealPlanStart(db, { dryRun, clearNew }) {
  console.log('🆕 Strategy: Fresh Start with Sample Meal Plans');
  console.log('This will clear existing data and create sample meal plans.\n');

  if (clearNew && !dryRun) {
    await PlanComidasOptimizado.deleteMany({});
    console.log('🗑️  Cleared optimized meal plans');
  }

  // Get some optimized recipes to use in sample plans
  const sampleRecipes = await db.collection('recetas_optimizadas').find({}).limit(10).toArray();
  
  if (sampleRecipes.length === 0) {
    console.log('❌ No optimized recipes found. Please run recipe migration first.');
    return;
  }

  const samplePlans = [
    {
      nombre: 'Plan Semanal Básico',
      clienteId: new mongoose.Types.ObjectId(),
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      porcionesBase: 4,
      estado: 'activo',
      dias: [
        {
          fecha: new Date(),
          diaSemana: 'lunes',
          comidas: {
            desayuno: sampleRecipes[0] ? createMealEntry(sampleRecipes[0]._id) : null,
            comida: {
              sopa: sampleRecipes[1] ? createMealEntry(sampleRecipes[1]._id) : null,
              principal: sampleRecipes[2] ? createMealEntry(sampleRecipes[2]._id) : null,
              guarnicion: sampleRecipes[3] ? createMealEntry(sampleRecipes[3]._id) : null
            },
            cena: sampleRecipes[4] ? createMealEntry(sampleRecipes[4]._id) : null
          },
          nutricionDiaria: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0, sodio: 0 },
          costoEstimadoDia: 0,
          completado: false,
          porcentajeCompletado: 0
        }
      ]
    }
  ];

  if (!dryRun) {
    const insertedPlans = await PlanComidasOptimizado.insertMany(samplePlans);
    console.log(`✅ Inserted ${insertedPlans.length} sample meal plans`);
    insertedPlans.forEach(plan => {
      console.log(`  - ${plan.nombre} (${plan.dias.length} days)`);
    });
  } else {
    console.log(`✓ Would create ${samplePlans.length} sample meal plans`);
  }
}

// Strategy 3: Show current meal plan data
async function sampleMealPlanData(db) {
  console.log('📋 Strategy: Current Meal Plan Data Status');
  console.log('This will show the current status of meal plan data.\n');

  const currentCount = await PlanComidasOptimizado.countDocuments();
  console.log(`Current optimized meal plans: ${currentCount}`);

  if (currentCount > 0) {
    const plans = await PlanComidasOptimizado.find({}).select('nombre dias estado').limit(5);
    console.log('\nCurrent meal plans:');
    plans.forEach(plan => {
      console.log(`  - ${plan.nombre} (${plan.dias.length} days, ${plan.estado})`);
    });
  } else {
    console.log('No optimized meal plans found. Run with strategy "fresh" to add sample data.');
  }

  // Show old data
  const oldPlansCount = await db.collection('plans').countDocuments();
  const oldPlanRecetasCount = await db.collection('planrecetas').countDocuments();
  console.log(`\nOld meal plan data:`);
  console.log(`  - Plans: ${oldPlansCount}`);
  console.log(`  - Plan-Recipes: ${oldPlanRecetasCount}`);
}

// Helper functions
function createMealEntry(recipeId, planReceta = {}) {
  return {
    recetaId: recipeId,
    porcionesPersonalizadas: null,
    modificaciones: {
      ingredientesOmitidos: [],
      ingredientesAdicionales: [],
      instruccionesAdicionales: '',
      notas: planReceta.notas || ''
    },
    horaPreferida: '',
    tiempoPreparacion: null,
    preparado: false,
    fechaPreparacion: null,
    calificacion: null,
    comentarios: ''
  };
}

function mapPlanStatus(oldStatus) {
  const statusMap = {
    'borrador': 'borrador',
    'activo': 'activo',
    'completado': 'completado',
    'archivado': 'pausado'
  };
  return statusMap[oldStatus] || 'borrador';
}

function calculateDateForDay(startDate, diaSemana) {
  const dayMap = {
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6,
    'domingo': 0
  };
  
  const targetDay = dayMap[diaSemana];
  const start = new Date(startDate);
  const currentDay = start.getDay();
  
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  
  const resultDate = new Date(start);
  resultDate.setDate(start.getDate() + daysToAdd);
  return resultDate;
}

// CLI interface
if (require.main === module) {
  const strategy = process.argv[2] || 'basic';
  const dryRun = process.argv.includes('--dry-run');
  const noBackup = process.argv.includes('--no-backup');
  const clearNew = process.argv.includes('--clear-new');
  
  console.log('🎯 Available meal plan migration strategies:');
  console.log('  basic  - Migrate existing Plan + PlanReceta to embedded structure');
  console.log('  fresh  - Clear all and start with sample meal plans');
  console.log('  sample - Show current meal plan data status');
  console.log('\n🔧 Options:');
  console.log('  --dry-run    - Preview changes without applying them');
  console.log('  --no-backup  - Skip creating backup of old data');
  console.log('  --clear-new  - Clear existing optimized meal plans before migration');
  console.log(`\nUsing strategy: ${strategy}\n`);

  migrateMealPlans({
    strategy,
    dryRun,
    backupOld: !noBackup,
    clearNew
  });
}

module.exports = migrateMealPlans; 