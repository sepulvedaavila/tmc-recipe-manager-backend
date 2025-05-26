const mongoose = require('mongoose');
const PlanComidasOptimizado = require('../schemas/OptimizedPlanComidas');
require('dotenv').config();

async function testMealPlanMigration() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log('\n🧪 Testing Meal Plan Migration Data Integrity\n');

    // Test 1: Basic data validation
    await testBasicDataValidation(db);

    // Test 2: Schema validation
    await testSchemaValidation();

    // Test 3: Relationship integrity
    await testRelationshipIntegrity(db);

    // Test 4: Business logic validation
    await testBusinessLogicValidation();

    // Test 5: Performance validation
    await testPerformanceValidation();

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Test 1: Basic data validation
async function testBasicDataValidation(db) {
  console.log('📊 Test 1: Basic Data Validation');

  // Count documents
  const optimizedPlansCount = await PlanComidasOptimizado.countDocuments();
  const oldPlansCount = await db.collection('plans').countDocuments();
  const oldPlanRecetasCount = await db.collection('planrecetas').countDocuments();

  console.log(`  ✓ Optimized meal plans: ${optimizedPlansCount}`);
  console.log(`  ✓ Old plans: ${oldPlansCount}`);
  console.log(`  ✓ Old plan-recipes: ${oldPlanRecetasCount}`);

  // Validate that we have data
  if (optimizedPlansCount === 0 && oldPlansCount > 0) {
    console.log('  ⚠️  Warning: No optimized plans found but old plans exist. Migration may be needed.');
  } else if (optimizedPlansCount > 0) {
    console.log('  ✅ Optimized meal plans found');
  }

  // Check for required fields
  const plansWithMissingFields = await PlanComidasOptimizado.find({
    $or: [
      { nombre: { $exists: false } },
      { clienteId: { $exists: false } },
      { fechaInicio: { $exists: false } },
      { fechaFin: { $exists: false } },
      { dias: { $exists: false } }
    ]
  });

  if (plansWithMissingFields.length > 0) {
    console.log(`  ❌ Found ${plansWithMissingFields.length} plans with missing required fields`);
    plansWithMissingFields.forEach(plan => {
      console.log(`    - Plan: ${plan.nombre || 'Unnamed'} (${plan._id})`);
    });
  } else {
    console.log('  ✅ All plans have required fields');
  }
}

// Test 2: Schema validation
async function testSchemaValidation() {
  console.log('\n🔍 Test 2: Schema Validation');

  try {
    // Test creating a valid meal plan
    const testPlan = new PlanComidasOptimizado({
      nombre: 'Test Plan',
      clienteId: new mongoose.Types.ObjectId(),
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      porcionesBase: 4,
      dias: [
        {
          fecha: new Date(),
          diaSemana: 'lunes',
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
        }
      ]
    });

    const validationError = testPlan.validateSync();
    if (validationError) {
      console.log('  ❌ Schema validation failed:', validationError.message);
    } else {
      console.log('  ✅ Schema validation passed');
    }

    // Test invalid data
    const invalidPlan = new PlanComidasOptimizado({
      // Missing required fields
      porcionesBase: -1, // Invalid value
      estado: 'invalid_status' // Invalid enum value
    });

    const invalidValidationError = invalidPlan.validateSync();
    if (invalidValidationError) {
      console.log('  ✅ Schema correctly rejects invalid data');
    } else {
      console.log('  ❌ Schema should reject invalid data but didn\'t');
    }

  } catch (error) {
    console.log('  ❌ Schema validation test failed:', error.message);
  }
}

// Test 3: Relationship integrity
async function testRelationshipIntegrity(db) {
  console.log('\n🔗 Test 3: Relationship Integrity');

  // Get all optimized plans
  const plans = await PlanComidasOptimizado.find({}).limit(10);
  
  let validRecipeReferences = 0;
  let invalidRecipeReferences = 0;
  let totalMealEntries = 0;

  for (const plan of plans) {
    for (const dia of plan.dias) {
      const meals = [
        dia.comidas.desayuno,
        dia.comidas.almuerzo,
        dia.comidas.comida?.sopa,
        dia.comidas.comida?.principal,
        dia.comidas.comida?.guarnicion,
        dia.comidas.cena,
        ...(dia.comidas.colaciones || [])
      ].filter(Boolean);

      for (const meal of meals) {
        totalMealEntries++;
        
        if (meal.recetaId) {
          // Check if recipe exists
          const recipeExists = await db.collection('recetas_optimizadas').findOne({ _id: meal.recetaId });
          if (recipeExists) {
            validRecipeReferences++;
          } else {
            invalidRecipeReferences++;
            console.log(`    ❌ Invalid recipe reference: ${meal.recetaId} in plan ${plan.nombre}`);
          }
        }
      }
    }
  }

  console.log(`  ✓ Total meal entries checked: ${totalMealEntries}`);
  console.log(`  ✓ Valid recipe references: ${validRecipeReferences}`);
  
  if (invalidRecipeReferences > 0) {
    console.log(`  ❌ Invalid recipe references: ${invalidRecipeReferences}`);
  } else {
    console.log('  ✅ All recipe references are valid');
  }
}

// Test 4: Business logic validation
async function testBusinessLogicValidation() {
  console.log('\n💼 Test 4: Business Logic Validation');

  const plans = await PlanComidasOptimizado.find({}).limit(5);

  for (const plan of plans) {
    // Test 1: Date consistency
    if (plan.fechaFin <= plan.fechaInicio) {
      console.log(`  ❌ Plan ${plan.nombre}: End date should be after start date`);
    }

    // Test 2: Day sequence validation
    const dayDates = plan.dias.map(dia => dia.fecha).sort();
    let dateConsistencyValid = true;
    
    for (let i = 1; i < dayDates.length; i++) {
      const prevDate = new Date(dayDates[i-1]);
      const currentDate = new Date(dayDates[i]);
      const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
      
      if (dayDiff < 0 || dayDiff > 7) {
        dateConsistencyValid = false;
        break;
      }
    }

    if (!dateConsistencyValid) {
      console.log(`  ❌ Plan ${plan.nombre}: Day dates are not in proper sequence`);
    }

    // Test 3: Portion validation
    if (plan.porcionesBase <= 0 || plan.porcionesBase > 20) {
      console.log(`  ❌ Plan ${plan.nombre}: Invalid portion size (${plan.porcionesBase})`);
    }

    // Test 4: Day of week validation
    for (const dia of plan.dias) {
      const validDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      if (!validDays.includes(dia.diaSemana)) {
        console.log(`  ❌ Plan ${plan.nombre}: Invalid day of week (${dia.diaSemana})`);
      }
    }
  }

  console.log('  ✅ Business logic validation completed');
}

// Test 5: Performance validation
async function testPerformanceValidation() {
  console.log('\n⚡ Test 5: Performance Validation');

  // Test query performance
  const startTime = Date.now();
  
  // Test 1: Find plans by client (should use index)
  const clientPlans = await PlanComidasOptimizado.find({ 
    clienteId: new mongoose.Types.ObjectId() 
  }).limit(10);
  
  // Test 2: Find plans by date range (should use index)
  const datePlans = await PlanComidasOptimizado.find({
    fechaInicio: { 
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: new Date()
    }
  }).limit(10);

  // Test 3: Text search (should use text index)
  const searchPlans = await PlanComidasOptimizado.find({
    $text: { $search: "plan" }
  }).limit(5);

  // Test 4: Aggregation for summary data
  const summaryData = await PlanComidasOptimizado.aggregate([
    {
      $group: {
        _id: '$estado',
        count: { $sum: 1 },
        avgDuration: { $avg: { $subtract: ['$fechaFin', '$fechaInicio'] } }
      }
    }
  ]);

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  console.log(`  ✓ Query performance test completed in ${totalTime}ms`);
  console.log(`  ✓ Found ${clientPlans.length} plans by client`);
  console.log(`  ✓ Found ${datePlans.length} plans by date range`);
  console.log(`  ✓ Found ${searchPlans.length} plans by text search`);
  console.log(`  ✓ Generated summary for ${summaryData.length} status groups`);

  if (totalTime > 5000) {
    console.log('  ⚠️  Warning: Queries took longer than expected. Consider checking indexes.');
  } else {
    console.log('  ✅ Query performance is acceptable');
  }
}

// Test embedded document operations
async function testEmbeddedOperations() {
  console.log('\n📦 Test 6: Embedded Document Operations');

  try {
    // Test creating a plan with embedded days
    const testPlan = await PlanComidasOptimizado.create({
      nombre: 'Test Embedded Plan',
      clienteId: new mongoose.Types.ObjectId(),
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      porcionesBase: 4,
      dias: [
        {
          fecha: new Date(),
          diaSemana: 'lunes',
          comidas: {
            desayuno: {
              recetaId: new mongoose.Types.ObjectId(),
              preparado: false
            }
          },
          nutricionDiaria: { calorias: 500, proteinas: 20, carbohidratos: 60, grasas: 15, fibra: 5, sodio: 800 },
          costoEstimadoDia: 25.50
        }
      ]
    });

    // Test updating embedded documents
    testPlan.dias[0].comidas.desayuno.preparado = true;
    testPlan.dias[0].comidas.desayuno.fechaPreparacion = new Date();
    await testPlan.save();

    // Test adding a new day
    testPlan.dias.push({
      fecha: new Date(Date.now() + 24 * 60 * 60 * 1000),
      diaSemana: 'martes',
      comidas: {
        comida: {
          principal: {
            recetaId: new mongoose.Types.ObjectId(),
            preparado: false
          }
        }
      },
      nutricionDiaria: { calorias: 600, proteinas: 25, carbohidratos: 70, grasas: 18, fibra: 6, sodio: 900 },
      costoEstimadoDia: 30.00
    });
    await testPlan.save();

    // Test querying embedded documents
    const plansWithPreparedMeals = await PlanComidasOptimizado.find({
      'dias.comidas.desayuno.preparado': true
    });

    console.log('  ✅ Embedded document operations successful');
    console.log(`  ✓ Created test plan with ${testPlan.dias.length} days`);
    console.log(`  ✓ Found ${plansWithPreparedMeals.length} plans with prepared breakfast`);

    // Clean up test data
    await PlanComidasOptimizado.deleteOne({ _id: testPlan._id });
    console.log('  ✓ Test data cleaned up');

  } catch (error) {
    console.log('  ❌ Embedded operations test failed:', error.message);
  }
}

// CLI interface
if (require.main === module) {
  const includeEmbeddedTest = process.argv.includes('--embedded');
  
  console.log('🧪 Meal Plan Migration Test Suite');
  console.log('This will validate the integrity of migrated meal plan data.\n');
  
  if (includeEmbeddedTest) {
    console.log('Including embedded document operations test.\n');
  }

  testMealPlanMigration().then(() => {
    if (includeEmbeddedTest) {
      return testEmbeddedOperations();
    }
  });
}

module.exports = testMealPlanMigration; 