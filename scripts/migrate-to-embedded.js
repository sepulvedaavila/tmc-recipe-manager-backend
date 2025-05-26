const mongoose = require('mongoose');
const RecetaOptimizada = require('../schemas/OptimizedReceta');
require('dotenv').config();

async function migrateToEmbedded(options = {}) {
  const {
    dryRun = false,
    backupOld = true,
    clearNew = false
  } = options;

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmc-recipe-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Step 1: Backup old data if requested
    if (backupOld && !dryRun) {
      console.log('\n📦 Creating backup of old recipes...');
      const oldRecipes = await db.collection('recetas').find({}).toArray();
      const backupCollection = `recetas_backup_${Date.now()}`;
      await db.collection(backupCollection).insertMany(oldRecipes);
      console.log(`✅ Backup created: ${backupCollection} (${oldRecipes.length} documents)`);
    }

    // Step 2: Clear new collection if requested
    if (clearNew && !dryRun) {
      console.log('\n🗑️  Clearing existing optimized recipes...');
      await RecetaOptimizada.deleteMany({});
      console.log('✅ Cleared optimized recipes collection');
    }

    // Step 3: Get old recipes and ingredients
    console.log('\n📊 Analyzing existing data...');
    const oldRecipes = await db.collection('recetas').find({}).toArray();
    const ingredients = await db.collection('ingredientes').find({}).toArray();
    
    console.log(`Found ${oldRecipes.length} old recipes`);
    console.log(`Found ${ingredients.length} ingredients`);

    // Create ingredient lookup map
    const ingredientMap = new Map();
    ingredients.forEach(ing => {
      ingredientMap.set(ing._id.toString(), ing);
    });

    // Step 4: Get recipe-ingredient relationships
    const planRecetas = await db.collection('planRecetas').find({}).toArray();
    console.log(`Found ${planRecetas.length} recipe-ingredient relationships`);

    // Group ingredients by recipe
    const recipeIngredients = new Map();
    planRecetas.forEach(pr => {
      const recipeId = pr.idReceta?.toString();
      if (recipeId) {
        if (!recipeIngredients.has(recipeId)) {
          recipeIngredients.set(recipeId, []);
        }
        recipeIngredients.get(recipeId).push(pr);
      }
    });

    // Step 5: Migrate recipes
    console.log('\n🔄 Starting migration...');
    const migratedRecipes = [];
    const errors = [];

    for (const oldRecipe of oldRecipes) {
      try {
        const recipeId = oldRecipe.idReceta?.toString() || oldRecipe._id.toString();
        const recipeIngredientsList = recipeIngredients.get(recipeId) || [];

        // Map old recipe to new structure
        const newRecipe = {
          nombre: oldRecipe.nombre || 'Receta sin nombre',
          descripcion: oldRecipe.descripcion || 'Sin descripción disponible',
          categoria: mapCategory(oldRecipe.tipoPlatillo),
          ingredientes: [],
          porcionesBase: oldRecipe.racion || 4,
          fuente: oldRecipe.fuente || 'Migrado',
          fechaCreacion: oldRecipe.createdAt || new Date()
        };

        // Add ingredients
        for (const ri of recipeIngredientsList) {
          const ingredient = ingredientMap.get(ri.idIngrediente?.toString());
          if (ingredient) {
            newRecipe.ingredientes.push({
              nombre: ingredient.nombre?.toLowerCase() || 'ingrediente',
              cantidad: ri.cantidad || 1,
              unidad: mapUnit(ri.unidad) || 'g',
              categoria: mapIngredientCategory(ingredient.categoria),
              costoUnitario: ingredient.precio || 0
            });
          }
        }

        // Ensure at least one ingredient
        if (newRecipe.ingredientes.length === 0) {
          newRecipe.ingredientes.push({
            nombre: 'ingrediente genérico',
            cantidad: 1,
            unidad: 'piezas',
            categoria: 'otros',
            costoUnitario: 0
          });
        }

        migratedRecipes.push(newRecipe);

        if (dryRun) {
          console.log(`✓ Would migrate: ${newRecipe.nombre} (${newRecipe.ingredientes.length} ingredients)`);
        } else {
          const savedRecipe = await RecetaOptimizada.create(newRecipe);
          console.log(`✅ Migrated: ${savedRecipe.nombre} (${savedRecipe.ingredientes.length} ingredients)`);
        }

      } catch (error) {
        const errorMsg = `Error migrating recipe ${oldRecipe.nombre}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Step 6: Summary
    console.log('\n📋 Migration Summary:');
    console.log(`✅ Successfully processed: ${migratedRecipes.length} recipes`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    if (dryRun) {
      console.log('\n🔍 DRY RUN - No changes were made to the database');
      console.log('Run with dryRun: false to apply changes');
    } else {
      console.log('\n🎉 Migration completed successfully!');
      
      // Verify migration
      const newCount = await RecetaOptimizada.countDocuments();
      console.log(`📊 New optimized recipes collection now has: ${newCount} documents`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Helper functions
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

function mapUnit(unidad) {
  const unitMap = {
    'kg': 'kg',
    'g': 'g',
    'gramos': 'g',
    'kilogramos': 'kg',
    'l': 'l',
    'litros': 'l',
    'ml': 'ml',
    'mililitros': 'ml',
    'piezas': 'piezas',
    'pieza': 'piezas',
    'tazas': 'tazas',
    'taza': 'tazas',
    'cucharadas': 'cucharadas',
    'cucharada': 'cucharadas',
    'cucharaditas': 'cucharaditas',
    'cucharadita': 'cucharaditas',
    'latas': 'latas',
    'lata': 'latas',
    'paquetes': 'paquetes',
    'paquete': 'paquetes'
  };
  return unitMap[unidad?.toLowerCase()] || 'g';
}

function mapIngredientCategory(categoria) {
  const categoryMap = {
    'Proteína': 'proteina',
    'Proteina': 'proteina',
    'Vegetales': 'vegetales',
    'Verduras': 'vegetales',
    'Frutas': 'frutas',
    'Lácteos': 'lacteos',
    'Lacteos': 'lacteos',
    'Granos': 'granos',
    'Cereales': 'granos',
    'Especias': 'especias',
    'Condimentos': 'especias',
    'Aceites': 'aceites',
    'Grasas': 'aceites'
  };
  return categoryMap[categoria] || 'otros';
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    backupOld: !args.includes('--no-backup'),
    clearNew: args.includes('--clear-new')
  };

  console.log('🚀 Starting migration with options:', options);
  migrateToEmbedded(options);
}

module.exports = migrateToEmbedded; 