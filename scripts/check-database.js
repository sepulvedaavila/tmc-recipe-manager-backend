const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('📍 Database:', mongoose.connection.name);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections in database:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Check if we have existing recipes
    const db = mongoose.connection.db;
    
    // Check old recipes collection
    try {
      const oldRecipesCount = await db.collection('recetas').countDocuments();
      console.log(`\n📊 Old recipes collection: ${oldRecipesCount} documents`);
      
      if (oldRecipesCount > 0) {
        const sampleOldRecipe = await db.collection('recetas').findOne();
        console.log('\n📄 Sample old recipe structure:');
        console.log(JSON.stringify(sampleOldRecipe, null, 2));
      }
    } catch (error) {
      console.log('\n📊 Old recipes collection: Not found');
    }

    // Check new optimized recipes collection
    try {
      const newRecipesCount = await db.collection('recetas_optimizadas').countDocuments();
      console.log(`\n📊 New optimized recipes collection: ${newRecipesCount} documents`);
      
      if (newRecipesCount > 0) {
        const sampleNewRecipe = await db.collection('recetas_optimizadas').findOne();
        console.log('\n📄 Sample new recipe structure:');
        console.log(JSON.stringify(sampleNewRecipe, null, 2));
      }
    } catch (error) {
      console.log('\n📊 New optimized recipes collection: Not found');
    }

    // Check ingredients collection
    try {
      const ingredientsCount = await db.collection('ingredientes').countDocuments();
      console.log(`\n📊 Ingredients collection: ${ingredientsCount} documents`);
    } catch (error) {
      console.log('\n📊 Ingredients collection: Not found');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check function if this file is executed directly
if (require.main === module) {
  checkDatabase();
}

module.exports = checkDatabase; 