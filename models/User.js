// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'chef', 'nutritionist'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  preferences: {
    dietary: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo']
    }],
    allergies: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    cuisinePreferences: [{
      type: String,
      trim: true
    }],
    servingSize: {
      type: Number,
      default: 2,
      min: 1,
      max: 20
    }
  },
  stats: {
    recipesCreated: {
      type: Number,
      default: 0
    },
    mealPlansCreated: {
      type: Number,
      default: 0
    },
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: String
}, {
  timestamps: true
});

// Add a pre-save hook to handle data migration/cleaning
userSchema.pre('save', async function(next) {
  try {
    // Handle password hashing
    if (this.isModified('password')) {
      // Check if password is already hashed
      if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
    }
    
    // Fix preferences.dietary data if it's corrupted
    if (this.preferences && this.preferences.dietary) {
      // Check if dietary is a string that looks like JSON
      if (typeof this.preferences.dietary === 'string') {
        try {
          const parsed = JSON.parse(this.preferences.dietary);
          // If it's an array with objects, extract the data properly
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            // Reset to empty array for now - you can customize this logic
            this.preferences.dietary = [];
            console.log('Fixed corrupted dietary preferences for user:', this.email);
          }
        } catch (e) {
          // If it's not valid JSON, reset to empty array
          this.preferences.dietary = [];
          console.log('Reset invalid dietary preferences for user:', this.email);
        }
      }
      
      // Ensure dietary is always an array
      if (!Array.isArray(this.preferences.dietary)) {
        this.preferences.dietary = [];
      }
      
      // Filter out any invalid enum values
      const validDietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto', 'paleo'];
      this.preferences.dietary = this.preferences.dietary.filter(item => 
        typeof item === 'string' && validDietaryOptions.includes(item)
      );
    }
    
    // Ensure allergies is always an array of strings
    if (this.preferences && this.preferences.allergies) {
      if (!Array.isArray(this.preferences.allergies)) {
        this.preferences.allergies = [];
      }
      this.preferences.allergies = this.preferences.allergies.filter(item => typeof item === 'string');
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Update stats on login
userSchema.methods.updateLoginStats = async function() {
  this.stats.lastLogin = new Date();
  this.stats.loginCount += 1;
  await this.save();
};

// Hide sensitive information when converting to JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  delete userObject.refreshToken;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;