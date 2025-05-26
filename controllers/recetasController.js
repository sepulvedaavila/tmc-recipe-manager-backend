const Receta = require('../models/Receta');
const Ingrediente = require('../models/Ingrediente');
const mongoose = require('mongoose');

// Get all recipes with optional filters
exports.getAll = async (req, res) => {
  try {
    console.log('Starting getAll recipes request...');
    
    // Check database connection first
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error',
        error: 'Database not connected'
      });
    }

    console.log('Database connected. Attempting to query recipes...');

    // Get all recipes
    const recetas = await Receta.find({}).lean();
    console.log(`Found ${recetas.length} recipes`);

    // Get all ingredients for these recipes
    const recipeIds = recetas.map(r => r.idReceta).filter(id => id != null);
    const ingredientes = await Ingrediente.find({ idReceta: { $in: recipeIds } }).lean();
    console.log(`Found ${ingredientes.length} ingredients`);

    // Group ingredients by recipe ID
    const ingredientesByRecipe = {};
    ingredientes.forEach(ing => {
      if (!ingredientesByRecipe[ing.idReceta]) {
        ingredientesByRecipe[ing.idReceta] = [];
      }
      ingredientesByRecipe[ing.idReceta].push({
        ingrediente: ing.ingrediente || 'Unknown',
        unidad: ing.unidad || '',
        por_persona: ing.porPersona || 0,
        cantidad_total: ing.cantidadTotal || 0
      });
    });

    // Format response to match what the frontend expects
    const formattedRecetas = recetas.map(recipe => ({
      recipe_id: recipe._id,
      _id: recipe._id,
      idReceta: recipe.idReceta,
      nombre: recipe.nombre,
      fuente: recipe.fuente || '',
      racion: recipe.racion,
      tipo_platillo: recipe.tipoPlatillo,
      descripcion: recipe.descripcion,
      tags: recipe.tags || [],
      ingredientes: ingredientesByRecipe[recipe.idReceta] || []
    }));

    console.log('Successfully formatted recipes. Sending response...');

    // Return in the format expected by the frontend
    return res.status(200).json({ 
      recipeResult: formattedRecetas,
      pagination: {
        total: recetas.length,
        page: 1,
        limit: recetas.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error retrieving recipes:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener las recetas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get recipe by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid MongoDB ID format: ${id}`);
      return res.status(400).json({ 
        message: 'ID de receta inválido',
        error: 'Invalid MongoDB ID format'
      });
    }

    // Use findById with error handling
    const receta = await Receta.findById(id).lean();

    if (!receta) {
      console.warn(`Recipe not found with ID: ${id}`);
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    console.log(`Recipe found: ${receta.nombre}`);

    // Get ingredients for this recipe
    const ingredientes = await Ingrediente.find({ idReceta: receta.idReceta }).lean();
    console.log(`Found ${ingredientes.length} ingredients for recipe ${receta.idReceta}`);

    // Format response
    const formattedReceta = {
      recipe_id: receta._id,
      nombre: receta.nombre,
      fuente: receta.fuente || '',
      racion: receta.racion,
      tipo_platillo: receta.tipoPlatillo,
      descripcion: receta.descripcion,
      tags: receta.tags || [],
      ingredientes: ingredientes.map(ing => ({
        ingrediente: ing.ingrediente || 'Unknown',
        unidad: ing.unidad || '',
        por_persona: ing.porPersona || 0,
        cantidad_total: ing.cantidadTotal || 0
      }))
    };

    return res.status(200).json(formattedReceta);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return res.status(500).json({
      message: 'Error al obtener la receta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Create new recipe
exports.create = async (req, res) => {
  try {
    const receta = req.body;
    console.log('Creating new recipe:', JSON.stringify(receta));

    // Validate required fields
    if (!receta.titulo && !receta.nombre) {
      return res.status(400).json({ 
        message: 'Nombre de receta requerido',
        error: 'Missing required field: nombre/titulo'
      });
    }

    if (!receta.tipoPlatillo) {
      return res.status(400).json({ 
        message: 'Tipo de platillo requerido',
        error: 'Missing required field: tipoPlatillo'
      });
    }

    if (!receta.descripcion) {
      return res.status(400).json({ 
        message: 'Descripción requerida',
        error: 'Missing required field: descripcion'
      });
    }

    // Create new recipe document (without embedded ingredients)
    const newReceta = new Receta({
      nombre: receta.titulo || receta.nombre,
      fuente: receta.fuente || '',
      tipoPlatillo: receta.tipoPlatillo,
      racion: receta.racion || 4,
      descripcion: receta.descripcion,
      tags: receta.tags || []
    });

    // Save to MongoDB with explicit error handling
    try {
      const savedReceta = await newReceta.save();
      console.log('Recipe created successfully:', savedReceta._id);
      
      // Get the next idReceta number
      const maxIdReceta = await Receta.findOne({}, { idReceta: 1 }).sort({ idReceta: -1 }).lean();
      const nextIdReceta = (maxIdReceta?.idReceta || 0) + 1;
      
      // Update the recipe with the idReceta
      await Receta.findByIdAndUpdate(savedReceta._id, { idReceta: nextIdReceta });
      
      // Save ingredients to separate collection if provided
      if (Array.isArray(receta.ingredientes) && receta.ingredientes.length > 0) {
        const ingredientesToSave = receta.ingredientes.map((ing, index) => ({
          ingrediente: ing.ingrediente,
          unidad: ing.unidad || '',
          idIngrediente: index + 1, // Simple incremental ID
          idReceta: nextIdReceta,
          porPersona: ing.cantidad / (receta.racion || 4),
          cantidadTotal: ing.cantidad
        }));
        
        await Ingrediente.insertMany(ingredientesToSave);
        console.log(`Saved ${ingredientesToSave.length} ingredients for recipe ${nextIdReceta}`);
      }
      
      return res.status(201).json({ 
        message: 'Receta guardada con éxito!',
        recipeId: savedReceta._id,
        idReceta: nextIdReceta
      });
    } catch (saveError) {
      console.error('Error saving to MongoDB:', saveError);
      return res.status(500).json({
        message: 'Error al guardar la receta en la base de datos',
        error: process.env.NODE_ENV === 'development' ? saveError.message : 'Database error'
      });
    }
  } catch (error) {
    console.error('Error creating recipe:', error);
    return res.status(500).json({
      message: 'Error al crear la receta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Update recipe
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get the current recipe to get its idReceta
    const currentReceta = await Receta.findById(id);
    if (!currentReceta) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    // Remove ingredients from updates (they'll be handled separately)
    const ingredientesUpdate = updates.ingredientes;
    delete updates.ingredientes;

    // Update recipe document
    const updatedReceta = await Receta.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...updates,
          updatedAt: Date.now()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedReceta) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    // Update ingredients in separate collection if provided
    if (ingredientesUpdate && Array.isArray(ingredientesUpdate)) {
      // Delete existing ingredients for this recipe
      await Ingrediente.deleteMany({ idReceta: currentReceta.idReceta });
      
      // Add new ingredients
      if (ingredientesUpdate.length > 0) {
        const ingredientesToSave = ingredientesUpdate.map((ing, index) => ({
          ingrediente: ing.ingrediente,
          unidad: ing.unidad || '',
          idIngrediente: index + 1,
          idReceta: currentReceta.idReceta,
          porPersona: ing.cantidad / (updates.racion || currentReceta.racion || 4),
          cantidadTotal: ing.cantidad
        }));
        
        await Ingrediente.insertMany(ingredientesToSave);
        console.log(`Updated ${ingredientesToSave.length} ingredients for recipe ${currentReceta.idReceta}`);
      }
    }

    console.log('Recipe updated:', id);
    
    return res.status(200).json({ 
      message: 'Receta actualizada con éxito!',
      recipe: updatedReceta
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return res.status(500).json({
      message: 'Error al actualizar la receta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Delete recipe
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the recipe first to get its idReceta
    const receta = await Receta.findById(id);
    if (!receta) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    // Delete the recipe
    const deletedReceta = await Receta.findByIdAndDelete(id);

    // Delete associated ingredients
    if (receta.idReceta) {
      const deletedIngredients = await Ingrediente.deleteMany({ idReceta: receta.idReceta });
      console.log(`Deleted ${deletedIngredients.deletedCount} ingredients for recipe ${receta.idReceta}`);
    }

    console.log('Recipe deleted:', id);
    
    return res.status(200).json({ 
      message: 'Receta eliminada con éxito!'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return res.status(500).json({
      message: 'Error al eliminar la receta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};