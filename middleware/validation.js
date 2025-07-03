/**
 * Request validation middleware
 * Provides reusable validation functions for different endpoints
 */

// Generic validation helper
const validateRequiredFields = (fields, req, res, next) => {
  const missingFields = fields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  next();
};

// Meal Plan validation
const validateMealPlan = (req, res, next) => {
  const requiredFields = ['nombrePlan', 'diasPlanificados', 'planRecetas'];
  
  // Check required fields
  const missingFields = requiredFields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  // Validate diasPlanificados is an array and not empty
  if (!Array.isArray(req.body.diasPlanificados) || req.body.diasPlanificados.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'diasPlanificados must be a non-empty array'
    });
  }

  // Validate planRecetas is an array and not empty
  if (!Array.isArray(req.body.planRecetas) || req.body.planRecetas.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'planRecetas must be a non-empty array'
    });
  }

  // Validate each planReceta has required fields
  const invalidRecetas = req.body.planRecetas.filter(pr => {
    return !pr.diaSemana || !pr.tipoComida;
  });

  if (invalidRecetas.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Each planReceta must have diaSemana and tipoComida'
    });
  }

  next();
};

// Recipe validation
const validateRecipe = (req, res, next) => {
  const requiredFields = ['nombre', 'descripcion', 'tipoPlatillo'];
  
  const missingFields = requiredFields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  // Validate racion is a positive number
  if (req.body.racion && (isNaN(req.body.racion) || req.body.racion <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'racion must be a positive number'
    });
  }

  next();
};

// User validation
const validateUser = (req, res, next) => {
  const requiredFields = ['username', 'email', 'password'];
  
  const missingFields = requiredFields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  // Validate email format
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validate password length
  if (req.body.password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Validate username length
  if (req.body.username.length < 3 || req.body.username.length > 30) {
    return res.status(400).json({
      success: false,
      message: 'Username must be between 3 and 30 characters'
    });
  }

  next();
};

// Client validation
const validateClient = (req, res, next) => {
  const requiredFields = ['nombre', 'email'];
  
  const missingFields = requiredFields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  // Validate email format
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  next();
};

// Plan validation
const validatePlan = (req, res, next) => {
  const requiredFields = ['nombrePlan', 'cliente'];
  
  const missingFields = requiredFields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  // Validate cliente is a number
  if (isNaN(req.body.cliente)) {
    return res.status(400).json({
      success: false,
      message: 'cliente must be a valid number'
    });
  }

  next();
};

// Authentication validation
const validateLogin = (req, res, next) => {
  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email/username and password'
    });
  }

  next();
};

// ObjectId validation
const validateObjectId = (req, res, next) => {
  const mongoose = require('mongoose');
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  next();
};

// Pagination validation
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive number'
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }

  next();
};

module.exports = {
  validateRequiredFields,
  validateMealPlan,
  validateRecipe,
  validateUser,
  validateClient,
  validatePlan,
  validateLogin,
  validateObjectId,
  validatePagination
}; 