// controllers/authController.js
const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password'
      });
    }

    // Find user by email or username with more explicit error handling
    let user;
    try {
      user = await User.findOne({
        $or: [
          { email: email || '' },
          { username: username || email || '' }
        ]
      });
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      
      // Check if it's a validation error related to preferences
      if (dbError.name === 'ValidationError' && dbError.message.includes('preferences.dietary')) {
        console.log('🔧 Detected corrupted user preferences, attempting to fix...');
        
        // Try to find and fix the user data
        try {
          const rawUser = await User.findOne({
            $or: [
              { email: email || '' },
              { username: username || email || '' }
            ]
          }).lean(); // Get raw data without validation
          
          if (rawUser) {
            // Fix the preferences data
            const fixedPreferences = {
              dietary: [],
              allergies: [],
              cuisinePreferences: [],
              servingSize: 2
            };
            
            // Update the user with fixed preferences
            await User.updateOne(
              { _id: rawUser._id },
              { 
                $set: { 
                  preferences: fixedPreferences 
                }
              }
            );
            
            console.log(`✅ Fixed preferences for user: ${rawUser.email}`);
            
            // Now try to find the user again
            user = await User.findById(rawUser._id);
          }
        } catch (fixError) {
          console.error('Failed to fix user preferences:', fixError);
          return res.status(500).json({
            success: false,
            message: 'User data corruption detected. Please contact support.',
            error: 'DATA_CORRUPTION'
          });
        }
      } else {
        // Other database errors
        return res.status(500).json({
          success: false,
          message: 'Database error occurred',
          error: dbError.message
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    let isMatch;
    try {
      isMatch = await user.comparePassword(password);
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return res.status(500).json({
        success: false,
        message: 'Authentication error occurred',
        error: passwordError.message
      });
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is not active'
      });
    }

    // Update login stats
    try {
      await user.updateLoginStats();
    } catch (statsError) {
      console.error('Failed to update login stats:', statsError);
      // Don't fail login for stats update errors
    }

    // Generate tokens
    let token, refreshToken;
    try {
      token = generateToken(user._id);
      refreshToken = generateRefreshToken(user._id);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate authentication tokens',
        error: tokenError.message
      });
    }

    // Save refresh token
    try {
      user.refreshToken = refreshToken;
      await user.save();
    } catch (saveError) {
      console.error('Failed to save refresh token:', saveError);
      // Continue with login even if refresh token save fails
    }

    // Successful login response
    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: user.toJSON() // This will exclude sensitive fields
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Error logging in';
    let errorCode = 'GENERAL_ERROR';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'User data validation failed';
      errorCode = 'VALIDATION_ERROR';
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid user data format';
      errorCode = 'CAST_ERROR';
    } else if (error.message.includes('preferences.dietary')) {
      errorMessage = 'User preferences data is corrupted';
      errorCode = 'PREFERENCES_CORRUPTION';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: errorCode
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create user with default preferences
    const userData = {
      username,
      email,
      password,
      role: role || 'user',
      preferences: {
        dietary: [],
        allergies: [],
        cuisinePreferences: [],
        servingSize: 2
      }
    };

    const user = await User.create(userData);

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Clear refresh token
    req.user.refreshToken = undefined;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_REFRESH_SECRET environment variable is required');
      }
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Save new refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
exports.verify = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // In production, you would send an email here
    // For now, we'll return the token (remove this in production!)
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken: resetToken // Remove this in production!
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id);

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};