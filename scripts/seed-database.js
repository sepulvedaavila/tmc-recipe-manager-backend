const mongoose = require('mongoose');
const RecetaOptimizada = require('../schemas/OptimizedReceta');
const sampleRecipes = require('../data/sample-recipes');
require('dotenv').config();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing recipes
    await RecetaOptimizada.deleteMany({});
    console.log('🗑️  Cleared existing recipes');

    // Insert sample recipes
    const insertedRecipes = await RecetaOptimizada.insertMany(sampleRecipes);
    console.log(`✅ Inserted ${insertedRecipes.length} sample recipes`);

    // Display inserted recipes
    console.log('\n📋 Inserted Recipes:');
    insertedRecipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.nombre}`);
      console.log(`   - Categoría: ${recipe.categoria}`);
      console.log(`   - Ingredientes: ${recipe.ingredientes.length}`);
      console.log(`   - Costo total: $${recipe.costoTotal.toFixed(2)}`);
      console.log(`   - Costo por porción: $${recipe.costoPorPorcion.toFixed(2)}`);
      console.log('');
    });

    console.log('🎉 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 