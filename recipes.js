const mongoose = require('mongoose');

// MongoDB connection function with better error handling
const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    
    // Check if currently connecting
    if (mongoose.connection.readyState === 2) {
      return new Promise((resolve, reject) => {
        mongoose.connection.once('connected', () => resolve(mongoose.connection));
        mongoose.connection.once('error', reject);
      });
    }
    
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Connect with appropriate options for serverless
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1, // Reduced for serverless
      retryWrites: true,
      w: 'majority',
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    });
    
    console.log("Connected to MongoDB!");
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Recipe schema (redefine to avoid caching issues)
const recetaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  fuente: { type: String, default: "" },
  descripcion: { type: String, required: true },
  tags: { type: [String], default: [] },
  idReceta: { type: Number },
  tipoPlatillo: { type: String, required: true },
  racion: { type: Number, required: true, default: 4 },
  ingredientes: { type: Array, default: [] }
}, {
  timestamps: false,
  strict: false,
  collection: 'recetas'
});

// Use a different approach to avoid model caching issues in serverless
const getRecetaModel = () => {
  try {
    return mongoose.model('Receta');
  } catch (error) {
    return mongoose.model('Receta', recetaSchema, 'recetas');
  }
};

module.exports = async (req, res) => {
  // Set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log(`[${new Date().toISOString()}] Processing ${req.method} request to /api/recipes`);
    
    // Connect to database
    await connectDB();
    console.log('Database connection established');
    
    if (req.method === 'GET') {
      console.log('Fetching recipes from database...');
      
      const Receta = getRecetaModel();
      const recetas = await Receta.find({}).lean().exec();
      
      console.log(`Successfully fetched ${recetas.length} recipes`);
      
      // Format the response to match expected structure
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
        ingredientes: (recipe.ingredientes || []).map(ing => ({
          ingrediente: ing.ingrediente || 'Unknown',
          unidad: ing.unidad || '',
          por_persona: ing.por_persona || 0,
          cantidad_total: ing.cantidad_total || 0
        }))
      }));
      
      return res.status(200).json({ 
        recipeResult: formattedRecetas,
        pagination: {
          total: recetas.length,
          page: 1,
          limit: recetas.length,
          pages: 1
        }
      });
    }
    
    // Handle other HTTP methods
    return res.status(405).json({ 
      success: false,
      message: `Method ${req.method} not allowed` 
    });
    
  } catch (error) {
    console.error('Error in recipes API:', error);
    
    // More detailed error response
    const errorResponse = {
      success: false,
      message: 'Error al obtener las recetas',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    // Add more details in development
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = error.stack;
      errorResponse.mongodbUri = process.env.MONGODB_URI ? 'Set' : 'Not set';
    }
    
    return res.status(500).json(errorResponse);
  } finally {
    // Don't close the connection in serverless - let it be reused
    console.log('Request completed');
  }
}; 