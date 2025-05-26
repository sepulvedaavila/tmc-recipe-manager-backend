const mongoose = require('mongoose');
const RecetaOptimizada = require('../schemas/OptimizedReceta');
require('dotenv').config();

async function simpleMigration(strategy = 'basic') {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    console.log(`\n🚀 Starting ${strategy} migration strategy...\n`);

    if (strategy === 'basic') {
      await basicMigration(db);
    } else if (strategy === 'fresh') {
      await freshStart(db);
    } else if (strategy === 'sample') {
      await sampleDataOnly(db);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Strategy 1: Basic migration with generic ingredients
async function basicMigration(db) {
  console.log('📋 Strategy: Basic Migration with Generic Ingredients');
  console.log('This will migrate recipe names and descriptions, adding generic ingredients.\n');

  // Get old recipes
  const oldRecipes = await db.collection('recetas').find({}).toArray();
  console.log(`Found ${oldRecipes.length} recipes to migrate`);

  const migratedCount = 0;
  const errors = [];

  for (const oldRecipe of oldRecipes) {
    try {
      // Create new recipe with basic structure
      const newRecipe = {
        nombre: oldRecipe.nombre || 'Receta Migrada',
        descripcion: oldRecipe.descripcion || 'Descripción migrada desde el sistema anterior',
        categoria: mapCategory(oldRecipe.tipoPlatillo),
        ingredientes: [
          {
            nombre: 'ingrediente principal',
            cantidad: 1,
            unidad: 'piezas',
            categoria: 'otros',
            costoUnitario: 0
          }
        ],
        porcionesBase: oldRecipe.racion || 4,
        fuente: oldRecipe.fuente || 'Sistema Anterior',
        fechaCreacion: oldRecipe.createdAt || new Date(),
        // Add original ID for reference
        tags: [`migrado-id-${oldRecipe.idReceta || oldRecipe._id}`]
      };

      const savedRecipe = await RecetaOptimizada.create(newRecipe);
      console.log(`✅ Migrated: ${savedRecipe.nombre}`);

    } catch (error) {
      const errorMsg = `Error migrating ${oldRecipe.nombre}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  console.log(`\n📊 Migration completed: ${migratedCount} recipes migrated, ${errors.length} errors`);
}

// Strategy 2: Fresh start with sample data
async function freshStart(db) {
  console.log('🆕 Strategy: Fresh Start');
  console.log('This will clear existing data and start with sample recipes.\n');

  // Clear all recipe collections
  await db.collection('recetas_optimizadas').deleteMany({});
  console.log('🗑️  Cleared optimized recipes');

  // Use the existing seed data
  const sampleRecipes = require('../data/sample-recipes');
  const insertedRecipes = await RecetaOptimizada.insertMany(sampleRecipes);
  
  console.log(`✅ Inserted ${insertedRecipes.length} sample recipes`);
  insertedRecipes.forEach(recipe => {
    console.log(`  - ${recipe.nombre} (${recipe.ingredientes.length} ingredients)`);
  });
}

// Strategy 3: Keep sample data only
async function sampleDataOnly(db) {
  console.log('📋 Strategy: Sample Data Only');
  console.log('This will keep the existing sample data and show current status.\n');

  const currentCount = await RecetaOptimizada.countDocuments();
  console.log(`Current optimized recipes: ${currentCount}`);

  if (currentCount > 0) {
    const recipes = await RecetaOptimizada.find({}).select('nombre ingredientes').limit(10);
    console.log('\nCurrent recipes:');
    recipes.forEach(recipe => {
      console.log(`  - ${recipe.nombre} (${recipe.ingredientes.length} ingredients)`);
    });
  } else {
    console.log('No optimized recipes found. Run with strategy "sample" to add sample data.');
  }
}

// Helper function to map categories
function mapCategory(tipoPlatillo) {
  const categoryMap = {
    'Sopa': 'sopa',
    'Plato Fuerte': 'plato-fuerte',
    'Plato fuerte': 'plato-fuerte',
    'Guarnición': 'guarnicion',
    'Postre': 'postre',
    'Bebida': 'bebida',
    'Entrada': 'entrada'
  };
  return categoryMap[tipoPlatillo] || 'plato-fuerte';
}

// CLI interface
if (require.main === module) {
  const strategy = process.argv[2] || 'basic';
  
  console.log('🎯 Available migration strategies:');
  console.log('  basic  - Migrate old recipes with generic ingredients');
  console.log('  fresh  - Clear all and start with sample data');
  console.log('  sample - Show current sample data status');
  console.log(`\nUsing strategy: ${strategy}\n`);

  simpleMigration(strategy);
}

module.exports = simpleMigration; 