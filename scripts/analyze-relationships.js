const mongoose = require('mongoose');
require('dotenv').config();

async function analyzeRelationships() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get sample data
    console.log('\n📊 Analyzing data relationships...');
    
    // Sample recipes
    const recipes = await db.collection('recetas').find({}).limit(3).toArray();
    console.log('\n📄 Sample Recipes:');
    recipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.nombre} (ID: ${recipe._id}, idReceta: ${recipe.idReceta})`);
      console.log(`   Type: ${recipe.tipoPlatillo}`);
      console.log(`   Portions: ${recipe.racion}`);
    });

    // Sample ingredients
    const ingredients = await db.collection('ingredientes').find({}).limit(5).toArray();
    console.log('\n🥕 Sample Ingredients:');
    ingredients.forEach((ing, index) => {
      console.log(`${index + 1}. ${ing.nombre} (ID: ${ing._id})`);
      console.log(`   Category: ${ing.categoria}, Price: ${ing.precio}`);
    });

    // Sample plan-recipes relationships
    const planRecetas = await db.collection('planRecetas').find({}).limit(10).toArray();
    console.log('\n🔗 Sample Recipe-Ingredient Relationships:');
    planRecetas.forEach((pr, index) => {
      console.log(`${index + 1}. Recipe ID: ${pr.idReceta}, Ingredient ID: ${pr.idIngrediente}`);
      console.log(`   Quantity: ${pr.cantidad}, Unit: ${pr.unidad}`);
    });

    // Analyze relationships by recipe
    console.log('\n📈 Relationship Analysis:');
    const recipeIngredientCounts = await db.collection('planRecetas').aggregate([
      {
        $group: {
          _id: '$idReceta',
          ingredientCount: { $sum: 1 },
          ingredients: { $push: { id: '$idIngrediente', cantidad: '$cantidad', unidad: '$unidad' } }
        }
      },
      { $sort: { ingredientCount: -1 } }
    ]).toArray();

    console.log('\nRecipes with ingredient counts:');
    for (const item of recipeIngredientCounts.slice(0, 10)) {
      const recipe = await db.collection('recetas').findOne({ idReceta: item._id });
      console.log(`- ${recipe?.nombre || 'Unknown'} (ID: ${item._id}): ${item.ingredientCount} ingredients`);
    }

    // Check for orphaned relationships
    console.log('\n🔍 Checking for data integrity...');
    const totalPlanRecetas = await db.collection('planRecetas').countDocuments();
    const validRecipeIds = await db.collection('recetas').distinct('idReceta');
    const validIngredientIds = await db.collection('ingredientes').distinct('_id');

    console.log(`Total recipe-ingredient relationships: ${totalPlanRecetas}`);
    console.log(`Valid recipe IDs: ${validRecipeIds.length}`);
    console.log(`Valid ingredient IDs: ${validIngredientIds.length}`);

    // Check for missing references
    const orphanedRelationships = await db.collection('planRecetas').find({
      $or: [
        { idReceta: { $nin: validRecipeIds } },
        { idIngrediente: { $nin: validIngredientIds } }
      ]
    }).toArray();

    console.log(`Orphaned relationships: ${orphanedRelationships.length}`);

    if (orphanedRelationships.length > 0) {
      console.log('\n⚠️  Found orphaned relationships:');
      orphanedRelationships.slice(0, 5).forEach(rel => {
        console.log(`- Recipe ID: ${rel.idReceta}, Ingredient ID: ${rel.idIngrediente}`);
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing relationships:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the analysis
if (require.main === module) {
  analyzeRelationships();
}

module.exports = analyzeRelationships; 