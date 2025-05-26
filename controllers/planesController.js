const Plan = require('../models/Plan');
const PlanReceta = require('../models/PlanReceta');
const Receta = require('../models/Receta');
const mongoose = require('mongoose');

// Get all plans
exports.getAll = async (req, res) => {
  try {
    const { search, cliente, limit = 50, page = 1 } = req.query;

    // Build query
    const query = {};

    // Text search
    if (search) {
      query.nombrePlan = { $regex: search, $options: 'i' };
    }

    // Filter by client
    if (cliente) {
      query.cliente = parseInt(cliente);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Execute query with population of plan-recipes
    const planes = await Plan.find(query)
      .sort({ nombrePlan: 1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Plan.countDocuments(query);

    console.log(`Found ${planes.length} plans`);

    // Format the response to match frontend expectations
    const formattedPlanes = planes.map(plan => ({
      id_plan: plan._id,
      _id: plan._id,
      nombre_plan: plan.nombrePlan,
      nombrePlan: plan.nombrePlan,
      racion: plan.racion,
      cliente: plan.cliente,
      fechaCreacion: plan.fechaCreacion,
      recetas: [] // Will be populated with plan-recipe relationships
    }));

    return res.status(200).json({
      planResult: formattedPlanes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({
      message: 'Error al obtener los planes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get plan by ID with associated recipes
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find plan
    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // Find associated plan-recipes
    const planRecetas = await PlanReceta.find({ idPlan: plan.idPlan });

    // For each plan-recipe, get associated recipes
    const detailedPlanRecetas = await Promise.all(
      planRecetas.map(async (planReceta) => {
        // Get primary recipe if present
        let receta = null;
        if (planReceta.idReceta) {
          receta = await Receta.findOne({ idReceta: planReceta.idReceta });
        }

        // Get soup recipe if present
        let soup = null;
        if (planReceta.idSoup) {
          soup = await Receta.findOne({ idReceta: planReceta.idSoup });
        }

        // Get main dish recipe if present
        let main = null;
        if (planReceta.idMain) {
          main = await Receta.findOne({ idReceta: planReceta.idMain });
        }

        // Get side dish recipe if present
        let side = null;
        if (planReceta.idSide) {
          side = await Receta.findOne({ idReceta: planReceta.idSide });
        }

        return {
          ...planReceta.toObject(),
          receta: receta ? receta.toObject() : null,
          soup: soup ? soup.toObject() : null,
          main: main ? main.toObject() : null,
          side: side ? side.toObject() : null,
          diaSemana: planReceta.diaSemana
        };
      })
    );

    return res.status(200).json({
      ...plan.toObject(),
      planRecetas: detailedPlanRecetas
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return res.status(500).json({
      message: 'Error al obtener el plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Create new plan
exports.create = async (req, res) => {
  try {
    const { cliente, racion, nombrePlan } = req.body;

    // Validate required fields
    if (!nombrePlan) {
      return res.status(400).json({
        message: 'El nombre del plan es requerido'
      });
    }

    // Create new plan
    const newPlan = new Plan({
      cliente: cliente || 1,
      racion: racion || 4,
      nombrePlan: nombrePlan.trim(),
      fechaCreacion: new Date()
    });

    // Save to MongoDB
    const savedPlan = await newPlan.save();

    console.log('Plan created:', savedPlan._id);

    return res.status(201).json({
      message: 'Plan creado con éxito',
      planId: savedPlan._id,
      plan: {
        _id: savedPlan._id,
        nombrePlan: savedPlan.nombrePlan,
        cliente: savedPlan.cliente,
        racion: savedPlan.racion,
        fechaCreacion: savedPlan.fechaCreacion
      }
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({
      message: 'Error al crear el plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Update plan
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente, racion, nombrePlan } = req.body;

    // Update plan
    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      {
        $set: {
          cliente,
          racion,
          nombrePlan,
          updatedAt: Date.now()
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    console.log('Plan updated:', id);

    return res.status(200).json({
      message: 'Plan actualizado con éxito',
      plan: updatedPlan
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({
      message: 'Error al actualizar el plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Delete plan and associated plan-recipes
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Get plan to access idPlan
    const plan = await Plan.findById(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }
    
    // Delete associated plan-recipes
    await PlanReceta.deleteMany({ idPlan: plan.idPlan });
    
    // Delete the plan
    await Plan.findByIdAndDelete(id);

    console.log('Plan and associated recipes deleted:', id);

    return res.status(200).json({
      message: 'Plan eliminado con éxito'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({
      message: 'Error al eliminar el plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};