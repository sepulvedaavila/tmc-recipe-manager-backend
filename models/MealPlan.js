const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
  },
  week: {
    type: String,
    required: true,
  },
  meals: [{
    day: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receta',
    },
    name: {
      type: String,
      required: true,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MealPlan', mealPlanSchema); 