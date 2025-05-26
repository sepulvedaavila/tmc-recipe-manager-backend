const mongoose = require('mongoose');
const PlanComidasOptimizado = require('../schemas/OptimizedPlanComidas');
const sampleMealPlans = require('../data/sample-meal-plans');
require('dotenv').config();

async function loadSampleMealPlans() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🍽️  Loading Comprehensive Sample Meal Plans\n');

    // Clear existing optimized meal plans
    await PlanComidasOptimizado.deleteMany({});
    console.log('🗑️  Cleared existing optimized meal plans');

    // Insert sample meal plans
    const insertedPlans = await PlanComidasOptimizado.insertMany(sampleMealPlans);
    console.log(`✅ Inserted ${insertedPlans.length} comprehensive sample meal plans:`);

    insertedPlans.forEach(plan => {
      console.log(`  📋 ${plan.nombre}`);
      console.log(`     - Duration: ${plan.dias.length} days`);
      console.log(`     - Portions: ${plan.porcionesBase}`);
      console.log(`     - Status: ${plan.estado}`);
      console.log(`     - Budget: $${plan.preferencias?.presupuestoMaximo || 'N/A'}`);
      console.log(`     - Shopping items: ${plan.listaCompras?.length || 0}`);
      console.log(`     - Total recipes: ${plan.resumen?.totalRecetas || 0}`);
      console.log(`     - Estimated cost: $${plan.resumen?.costoTotalEstimado || 0}`);
      console.log('');
    });

    // Verify the data
    console.log('🔍 Verifying loaded data...');
    const totalPlans = await PlanComidasOptimizado.countDocuments();
    const activePlans = await PlanComidasOptimizado.countDocuments({ estado: 'activo' });
    const totalDays = await PlanComidasOptimizado.aggregate([
      { $unwind: '$dias' },
      { $count: 'totalDays' }
    ]);

    console.log(`✓ Total meal plans: ${totalPlans}`);
    console.log(`✓ Active meal plans: ${activePlans}`);
    console.log(`✓ Total planned days: ${totalDays[0]?.totalDays || 0}`);

    // Test embedded document queries
    console.log('\n🧪 Testing embedded document queries...');
    
    const plansWithBreakfast = await PlanComidasOptimizado.countDocuments({
      'dias.comidas.desayuno': { $ne: null }
    });
    
    const plansWithShoppingList = await PlanComidasOptimizado.countDocuments({
      'listaCompras.0': { $exists: true }
    });

    const completedMeals = await PlanComidasOptimizado.aggregate([
      { $unwind: '$dias' },
      { $unwind: { path: '$dias.comidas.desayuno', preserveNullAndEmptyArrays: true } },
      { $match: { 'dias.comidas.desayuno.preparado': true } },
      { $count: 'completedBreakfasts' }
    ]);

    console.log(`✓ Plans with breakfast: ${plansWithBreakfast}`);
    console.log(`✓ Plans with shopping lists: ${plansWithShoppingList}`);
    console.log(`✓ Completed breakfast meals: ${completedMeals[0]?.completedBreakfasts || 0}`);

    console.log('\n🎉 Sample meal plans loaded successfully!');
    console.log('The embedded meal plan structure is now ready for use.');

  } catch (error) {
    console.error('❌ Failed to load sample meal plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// CLI interface
if (require.main === module) {
  console.log('🍽️  Sample Meal Plans Loader');
  console.log('This will load comprehensive sample meal plans with embedded structure.\n');
  
  loadSampleMealPlans();
}

module.exports = loadSampleMealPlans; 