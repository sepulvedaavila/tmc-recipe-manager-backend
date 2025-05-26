const Plan = require('../models/Plan');
const PlanReceta = require('../models/PlanReceta');
const Receta = require('../models/Receta');
const mongoose = require('mongoose');

// Create complete meal plan atomically
exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { 
        nombrePlan, 
        cliente, 
        racion, 
        descripcion, 
        diasPlanificados, 
        fechaInicio, 
        planRecetas 
      } = req.body;

      // Validate required fields
      if (!nombrePlan?.trim()) {
        throw new Error('El nombre del plan es requerido');
      }

      if (!diasPlanificados || diasPlanificados.length === 0) {
        throw new Error('Debe seleccionar al menos un día para el plan');
      }

      if (!planRecetas || planRecetas.length === 0) {
        throw new Error('Debe incluir al menos una comida en el plan');
      }

      // Validate all recipes exist
      const allRecipeIds = [];
      planRecetas.forEach(pr => {
        if (pr.idSoup) allRecipeIds.push(pr.idSoup);
        if (pr.idMain) allRecipeIds.push(pr.idMain);
        if (pr.idSide) allRecipeIds.push(pr.idSide);
      });

      const existingRecipes = await Receta.find({ 
        idReceta: { $in: allRecipeIds } 
      }).session(session);

      const existingRecipeIds = existingRecipes.map(r => r.idReceta);
      const missingRecipes = allRecipeIds.filter(id => !existingRecipeIds.includes(id));

      if (missingRecipes.length > 0) {
        throw new Error(`Las siguientes recetas no existen: ${missingRecipes.join(', ')}`);
      }

      // Create the plan
      const newPlan = new Plan({
        nombrePlan: nombrePlan.trim(),
        cliente: parseInt(cliente) || 1,
        racion: parseInt(racion) || 4,
        descripcion: descripcion?.trim() || '',
        diasPlanificados: diasPlanificados,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        estado: 'activo'
      });

      const savedPlan = await newPlan.save({ session });

      // Create plan-recipe relationships
      const planRecetaDocuments = planRecetas.map(pr => ({
        idPlan: savedPlan._id,
        diaSemana: pr.diaSemana.toLowerCase(),
        idSoup: pr.idSoup || null,
        idMain: pr.idMain || null,
        idSide: pr.idSide || null,
        tipoComida: pr.tipoComida || 'comida',
        notas: pr.notas || '',
        // Use new structure as well
        recetas: {
          sopa: pr.idSoup || null,
          principal: pr.idMain || null,
          guarnicion: pr.idSide || null
        }
      }));

      const savedPlanRecetas = await PlanReceta.insertMany(planRecetaDocuments, { session });

      console.log('Meal plan created successfully:', savedPlan._id);

      return res.status(201).json({
        message: 'Plan de comidas creado exitosamente',
        planId: savedPlan._id,
        plan: {
          _id: savedPlan._id,
          nombrePlan: savedPlan.nombrePlan,
          cliente: savedPlan.cliente,
          racion: savedPlan.racion,
          descripcion: savedPlan.descripcion,
          diasPlanificados: savedPlan.diasPlanificados,
          fechaInicio: savedPlan.fechaInicio,
          estado: savedPlan.estado,
          totalRecetas: savedPlanRecetas.length
        }
      });
    });

  } catch (error) {
    console.error('Error creating meal plan:', error);
    
    return res.status(400).json({
      message: 'Error al crear el plan de comidas',
      error: error.message
    });
  } finally {
    await session.endSession();
  }
};

// Get meal plan with complete details
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de plan inválido' });
    }

    // Get plan
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // Get plan recipes with populated recipe details
    const planRecetas = await PlanReceta.find({ idPlan: plan._id });

    // Get all recipe details efficiently
    const allRecipeIds = [];
    planRecetas.forEach(pr => {
      if (pr.idSoup) allRecipeIds.push(pr.idSoup);
      if (pr.idMain) allRecipeIds.push(pr.idMain);
      if (pr.idSide) allRecipeIds.push(pr.idSide);
    });

    const recipes = await Receta.find({ idReceta: { $in: allRecipeIds } });
    const recipeMap = recipes.reduce((acc, recipe) => {
      acc[recipe.idReceta] = recipe;
      return acc;
    }, {});

    // Build detailed plan with recipes
    const detailedPlanRecetas = planRecetas.map(pr => ({
      _id: pr._id,
      diaSemana: pr.diaSemana,
      tipoComida: pr.tipoComida,
      notas: pr.notas,
      soup: pr.idSoup ? {
        id: pr.idSoup,
        ...recipeMap[pr.idSoup]?.toObject()
      } : null,
      main: pr.idMain ? {
        id: pr.idMain,
        ...recipeMap[pr.idMain]?.toObject()
      } : null,
      side: pr.idSide ? {
        id: pr.idSide,
        ...recipeMap[pr.idSide]?.toObject()
      } : null
    }));

    return res.status(200).json({
      ...plan.toObject(),
      planRecetas: detailedPlanRecetas,
      totalDays: plan.diasPlanificados.length,
      totalMeals: detailedPlanRecetas.reduce((total, pr) => {
        return total + (pr.soup ? 1 : 0) + (pr.main ? 1 : 0) + (pr.side ? 1 : 0);
      }, 0)
    });

  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return res.status(500).json({
      message: 'Error al obtener el plan de comidas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Update meal plan atomically
exports.update = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de plan inválido' });
    }

    await session.withTransaction(async () => {
      const { 
        nombrePlan, 
        racion, 
        descripcion, 
        diasPlanificados, 
        planRecetas,
        estado 
      } = req.body;

      // Update plan
      const updatedPlan = await Plan.findByIdAndUpdate(
        id,
        {
          $set: {
            nombrePlan: nombrePlan?.trim(),
            racion: racion ? parseInt(racion) : undefined,
            descripcion: descripcion?.trim(),
            diasPlanificados,
            estado,
            updatedAt: Date.now()
          }
        },
        { new: true, runValidators: true, session }
      );

      if (!updatedPlan) {
        throw new Error('Plan no encontrado');
      }

      // If planRecetas are provided, update them
      if (planRecetas) {
        // Remove existing plan recipes
        await PlanReceta.deleteMany({ idPlan: updatedPlan._id }, { session });

        // Add new plan recipes
        if (planRecetas.length > 0) {
          const planRecetaDocuments = planRecetas.map(pr => ({
            idPlan: updatedPlan._id,
            diaSemana: pr.diaSemana.toLowerCase(),
            idSoup: pr.idSoup || null,
            idMain: pr.idMain || null,
            idSide: pr.idSide || null,
            tipoComida: pr.tipoComida || 'comida',
            notas: pr.notas || '',
            recetas: {
              sopa: pr.idSoup || null,
              principal: pr.idMain || null,
              guarnicion: pr.idSide || null
            }
          }));

          await PlanReceta.insertMany(planRecetaDocuments, { session });
        }
      }

      return res.status(200).json({
        message: 'Plan de comidas actualizado exitosamente',
        plan: updatedPlan
      });
    });

  } catch (error) {
    console.error('Error updating meal plan:', error);
    return res.status(400).json({
      message: 'Error al actualizar el plan de comidas',
      error: error.message
    });
  } finally {
    await session.endSession();
  }
};

// Delete meal plan and all associated recipes
exports.delete = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de plan inválido' });
    }

    await session.withTransaction(async () => {
      // Delete plan recipes first
      await PlanReceta.deleteMany({ idPlan: id }, { session });
      
      // Delete the plan
      const deletedPlan = await Plan.findByIdAndDelete(id, { session });
      
      if (!deletedPlan) {
        throw new Error('Plan no encontrado');
      }

      console.log('Meal plan deleted successfully:', id);
    });

    return res.status(200).json({
      message: 'Plan de comidas eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return res.status(400).json({
      message: 'Error al eliminar el plan de comidas',
      error: error.message
    });
  } finally {
    await session.endSession();
  }
};

// Get all meal plans with pagination and filters
exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      cliente, 
      estado, 
      search,
      fechaDesde,
      fechaHasta 
    } = req.query;

    // Build query
    const query = {};
    
    if (cliente) query.cliente = parseInt(cliente);
    if (estado) query.estado = estado;
    if (search) {
      query.$or = [
        { nombrePlan: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }
    if (fechaDesde || fechaHasta) {
      query.fechaInicio = {};
      if (fechaDesde) query.fechaInicio.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fechaInicio.$lte = new Date(fechaHasta);
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const plans = await Plan.find(query)
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Plan.countDocuments(query);

    // Get recipe counts for each plan
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const recipeCount = await PlanReceta.countDocuments({ idPlan: plan._id });
        return {
          ...plan.toObject(),
          totalRecetas: recipeCount
        };
      })
    );

    return res.status(200).json({
      plans: plansWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return res.status(500).json({
      message: 'Error al obtener los planes de comidas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}; 