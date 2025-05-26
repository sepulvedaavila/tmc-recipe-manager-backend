const mongoose = require('mongoose');
const PlanComidasOptimizado = require('../schemas/OptimizedPlanComidas');
require('dotenv').config();

async function demonstrateMealPlanFeatures() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🎯 Demonstrating Embedded Meal Plan Features\n');

    // 1. Query embedded documents
    console.log('1️⃣  Querying Embedded Documents:');
    
    // Find plans with specific meal types
    const plansWithBreakfast = await PlanComidasOptimizado.find({
      'dias.comidas.desayuno': { $ne: null }
    }).select('nombre dias.diaSemana dias.comidas.desayuno');
    
    console.log(`   📋 Plans with breakfast: ${plansWithBreakfast.length}`);
    plansWithBreakfast.forEach(plan => {
      console.log(`      - ${plan.nombre}`);
      plan.dias.forEach(dia => {
        if (dia.comidas.desayuno) {
          console.log(`        ${dia.diaSemana}: ${dia.comidas.desayuno.horaPreferida || 'No time set'}`);
        }
      });
    });

    // 2. Aggregation on embedded documents
    console.log('\n2️⃣  Aggregation Analysis:');
    
    const nutritionSummary = await PlanComidasOptimizado.aggregate([
      { $unwind: '$dias' },
      {
        $group: {
          _id: null,
          avgCalories: { $avg: '$dias.nutricionDiaria.calorias' },
          avgProteins: { $avg: '$dias.nutricionDiaria.proteinas' },
          totalDays: { $sum: 1 },
          avgCost: { $avg: '$dias.costoEstimadoDia' }
        }
      }
    ]);

    if (nutritionSummary.length > 0) {
      const summary = nutritionSummary[0];
      console.log(`   🥗 Average daily calories: ${Math.round(summary.avgCalories)}`);
      console.log(`   🥩 Average daily proteins: ${Math.round(summary.avgProteins)}g`);
      console.log(`   💰 Average daily cost: $${summary.avgCost.toFixed(2)}`);
      console.log(`   📅 Total planned days: ${summary.totalDays}`);
    }

    // 3. Shopping list analysis
    console.log('\n3️⃣  Shopping List Analysis:');
    
    const shoppingAnalysis = await PlanComidasOptimizado.aggregate([
      { $unwind: '$listaCompras' },
      {
        $group: {
          _id: '$listaCompras.categoria',
          totalItems: { $sum: 1 },
          totalCost: { $sum: '$listaCompras.costoEstimado' },
          avgCost: { $avg: '$listaCompras.costoEstimado' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]);

    console.log('   🛒 Shopping by category:');
    shoppingAnalysis.forEach(category => {
      console.log(`      ${category._id}: ${category.totalItems} items, $${category.totalCost.toFixed(2)} total`);
    });

    // 4. Plan status and completion tracking
    console.log('\n4️⃣  Plan Status & Completion:');
    
    const statusSummary = await PlanComidasOptimizado.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
          avgBudget: { $avg: '$preferencias.presupuestoMaximo' },
          totalRecipes: { $sum: '$resumen.totalRecetas' }
        }
      }
    ]);

    statusSummary.forEach(status => {
      console.log(`   📊 ${status._id}: ${status.count} plans, avg budget: $${status.avgBudget || 0}, ${status.totalRecipes} recipes`);
    });

    // 5. Meal completion tracking
    console.log('\n5️⃣  Meal Completion Tracking:');
    
    const completionStats = await PlanComidasOptimizado.aggregate([
      { $unwind: '$dias' },
      {
        $project: {
          planName: '$nombre',
          dayOfWeek: '$dias.diaSemana',
          breakfastPrepared: '$dias.comidas.desayuno.preparado',
          lunchPrepared: '$dias.comidas.comida.principal.preparado',
          dinnerPrepared: '$dias.comidas.cena.preparado',
          dayCompletion: '$dias.porcentajeCompletado'
        }
      }
    ]);

    let totalMeals = 0;
    let preparedMeals = 0;
    
    completionStats.forEach(day => {
      if (day.breakfastPrepared !== undefined) {
        totalMeals++;
        if (day.breakfastPrepared) preparedMeals++;
      }
      if (day.lunchPrepared !== undefined) {
        totalMeals++;
        if (day.lunchPrepared) preparedMeals++;
      }
      if (day.dinnerPrepared !== undefined) {
        totalMeals++;
        if (day.dinnerPrepared) preparedMeals++;
      }
    });

    console.log(`   ✅ Prepared meals: ${preparedMeals}/${totalMeals} (${((preparedMeals/totalMeals)*100).toFixed(1)}%)`);

    // 6. Update embedded document (mark a meal as prepared)
    console.log('\n6️⃣  Updating Embedded Documents:');
    
    const planToUpdate = await PlanComidasOptimizado.findOne({
      'dias.comidas.desayuno.preparado': false
    });

    if (planToUpdate) {
      // Find the first unprepared breakfast
      const dayIndex = planToUpdate.dias.findIndex(dia => 
        dia.comidas.desayuno && !dia.comidas.desayuno.preparado
      );

      if (dayIndex !== -1) {
        planToUpdate.dias[dayIndex].comidas.desayuno.preparado = true;
        planToUpdate.dias[dayIndex].comidas.desayuno.fechaPreparacion = new Date();
        planToUpdate.dias[dayIndex].comidas.desayuno.calificacion = 4;
        planToUpdate.dias[dayIndex].comidas.desayuno.comentarios = 'Delicioso y nutritivo';
        
        await planToUpdate.save();
        
        console.log(`   ✅ Marked breakfast as prepared in "${planToUpdate.nombre}" for ${planToUpdate.dias[dayIndex].diaSemana}`);
      }
    }

    // 7. Complex queries on embedded arrays
    console.log('\n7️⃣  Complex Embedded Queries:');
    
    // Find plans with high-protein days
    const highProteinPlans = await PlanComidasOptimizado.find({
      'dias.nutricionDiaria.proteinas': { $gte: 100 }
    }).select('nombre dias.diaSemana dias.nutricionDiaria.proteinas');

    console.log(`   💪 Plans with high-protein days (≥100g): ${highProteinPlans.length}`);
    highProteinPlans.forEach(plan => {
      console.log(`      - ${plan.nombre}`);
      plan.dias.forEach(dia => {
        if (dia.nutricionDiaria.proteinas >= 100) {
          console.log(`        ${dia.diaSemana}: ${dia.nutricionDiaria.proteinas}g protein`);
        }
      });
    });

    // 8. Shopping list operations
    console.log('\n8️⃣  Shopping List Operations:');
    
    const planWithShopping = await PlanComidasOptimizado.findOne({
      'listaCompras.0': { $exists: true }
    });

    if (planWithShopping) {
      console.log(`   🛒 Shopping list for "${planWithShopping.nombre}":`);
      planWithShopping.listaCompras.forEach(item => {
        const status = item.comprado ? '✅' : '⏳';
        console.log(`      ${status} ${item.cantidadTotal} ${item.unidad} ${item.ingrediente} ($${item.costoEstimado || 0})`);
      });

      // Mark an item as purchased
      if (planWithShopping.listaCompras.length > 0 && !planWithShopping.listaCompras[0].comprado) {
        planWithShopping.listaCompras[0].comprado = true;
        planWithShopping.listaCompras[0].fechaCompra = new Date();
        await planWithShopping.save();
        console.log(`   ✅ Marked "${planWithShopping.listaCompras[0].ingrediente}" as purchased`);
      }
    }

    console.log('\n🎉 Embedded Meal Plan Features Demonstration Complete!');
    console.log('\n📋 Key Benefits Demonstrated:');
    console.log('   ✅ Single document retrieval for complete meal plans');
    console.log('   ✅ Efficient embedded document queries');
    console.log('   ✅ Atomic updates on nested structures');
    console.log('   ✅ Rich aggregation capabilities');
    console.log('   ✅ Shopping list integration');
    console.log('   ✅ Meal completion tracking');
    console.log('   ✅ Nutritional analysis');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// CLI interface
if (require.main === module) {
  console.log('🎯 Meal Plan Features Demonstration');
  console.log('This will showcase the power of embedded meal plan documents.\n');
  
  demonstrateMealPlanFeatures();
}

module.exports = demonstrateMealPlanFeatures; 