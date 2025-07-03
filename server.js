const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Use the correct path for the database connection
const { connectDB, getConnectionStatus } = require('./db/mongodb');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { ensureDbConnection } = require('./middleware/dbMiddleware');
const { 
  requestMonitor, 
  performanceMonitor, 
  errorMonitor, 
  dbPerformanceMonitor, 
  memoryMonitor, 
  rateLimitMonitor,
  healthCheck: monitoringHealthCheck
} = require('./middleware/monitoring');

// Import routes
const recetasRoutes = require("./routes/recetas");
const planesRoutes = require("./routes/planes");
const clientesRoutes = require("./routes/clientes");
const planRecetasRoutes = require("./routes/planRecetas");
const mealPlansRoutes = require("./routes/mealPlans");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");

// Initialize express app
const app = express();

// Connect to MongoDB with proper error handling for production
(async () => {
  try {
    console.log("Initializing MongoDB connection...");
    await connectDB();
    console.log("MongoDB connection initialized successfully in server.js");
  } catch (err) {
    console.error("Failed to connect to MongoDB in server.js:", err);
    console.error(
      "MongoDB URI is set:",
      process.env.MONGODB_URI ? "Yes" : "No"
    );

    // In production, we'll let the middleware handle reconnection attempts
    // Don't exit the process, as Vercel needs the function to be available
    if (process.env.NODE_ENV !== "production") {
      console.error("Exiting due to database connection failure...");
      process.exit(1);
    } else {
      console.log(
        "Production environment: will attempt reconnection on request"
      );
    }
  }
})();

const corsOptions = {
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001", 
      "https://app.themenucompany.mx",
      "https://tmc-recipe-manager-frontend.vercel.app",
      "https://tmc-recipe-manager-backend.vercel.app"
    ];

    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For debugging: Allow the request but log it
      console.warn(`Allowing CORS request from unlisted origin: ${origin}`);
      callback(null, true); // TEMPORARY: Remove this line in production
      // callback(new Error('Not allowed by CORS')); // Uncomment this in production
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Request parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enhanced monitoring and logging middleware
app.use(requestMonitor);
app.use(performanceMonitor);
app.use(memoryMonitor);
app.use(rateLimitMonitor);

// Database performance monitoring (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(dbPerformanceMonitor);
}

// Request logging
app.use(requestLogger);

// Database connection middleware for all API routes
app.use(ensureDbConnection);

// API Routes - Mount routes to match frontend expectations
// Vercel routes /api/* to this function, so we need to handle the remaining path
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/recipes", recetasRoutes);
app.use("/api/clients", clientesRoutes);
app.use("/api/planes", planesRoutes);
app.use("/api/plans", planesRoutes);
app.use("/api/plan-recetas", planRecetasRoutes);
app.use("/api/meal-plans", mealPlansRoutes);
// Rerouting for frontend

// Test endpoint to verify API is working
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    headers: {
      host: req.get("host"),
      "x-forwarded-host": req.get("x-forwarded-host"),
      "x-vercel-id": req.get("x-vercel-id"),
    },
  });
});

// Enhanced health check endpoint for monitoring
app.get("/api/health", async (req, res) => {
  try {
    const connectionStatus = getConnectionStatus();
    const mongoose = require("mongoose");

    // Test database connectivity with ping
    let dbStatus = "disconnected";
    let dbPing = null;
    
    try {
      if (connectionStatus.readyState === 1) {
        await mongoose.connection.db.admin().ping();
        dbStatus = "connected";
        dbPing = "success";
        
        // Test basic database operations
        const Receta = require("./models/Receta");
        const count = await Receta.countDocuments();
        dbPing = { success: true, recipeCount: count };
      } else {
        dbStatus = "disconnected";
        dbPing = { success: false, reason: "Database not connected" };
      }
    } catch (pingError) {
      dbStatus = "error";
      dbPing = { success: false, error: pingError.message };
    }

    // Get system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      uptime: process.uptime()
    };

    // Always return 200 for health check, even if database is down
    const healthStatus = dbStatus === "connected" ? "healthy" : "degraded";

    res.status(200).json({
      status: healthStatus,
      message: healthStatus === "healthy" ? "API is running" : "API is running (database unavailable)",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        connection: connectionStatus,
        ping: dbPing
      },
      system: systemInfo,
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0"
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(200).json({
      status: "error",
      message: "Health check failed",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

// Monitoring dashboard endpoint
app.get("/api/monitoring", (req, res) => {
  monitoringHealthCheck(req, res);
});

// Diagnostic endpoint for debugging
app.get("/api/debug", async (req, res) => {
  try {
    // Check MongoDB connection using our helper function
    const connectionStatus = getConnectionStatus();

    // Get collection information
    const collections = {};
    if (connectionStatus.readyState === 1) {
      try {
        const Receta = require("./models/Receta");
        collections.recipes = await Receta.countDocuments();
        // Sample a recipe to verify schema connection
        const sampleRecipe = await Receta.findOne().lean();
        collections.sampleRecipeFields = sampleRecipe
          ? Object.keys(sampleRecipe)
          : [];
      } catch (err) {
        console.error("Error counting recipes:", err);
        collections.recipesError = err.message;
      }

      try {
        const Plan = require("./models/Plan");
        collections.plans = await Plan.countDocuments();
      } catch (err) {
        console.error("Error counting plans:", err);
        collections.plansError = err.message;
      }

      try {
        const Cliente = require("./models/Cliente");
        collections.clients = await Cliente.countDocuments();
      } catch (err) {
        console.error("Error counting clients:", err);
        collections.clientsError = err.message;
      }

      try {
        const PlanReceta = require("./models/PlanReceta");
        collections.planRecipes = await PlanReceta.countDocuments();
      } catch (err) {
        console.error("Error counting plan recipes:", err);
        collections.planRecipesError = err.message;
      }
    }

    // Get detailed MongoDB info
    let detailedDbInfo = {};
    try {
      const mongoose = require("mongoose");
      if (mongoose.connection.db) {
        // Get database stats
        detailedDbInfo = await mongoose.connection.db.stats();
      }
    } catch (err) {
      console.error("Error getting DB stats:", err);
      detailedDbInfo = { error: err.message };
    }

    res.status(200).json({
      api: {
        status: "running",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      },
      database: {
        connection: connectionStatus,
        mongodb_uri: process.env.MONGODB_URI ? "***set***" : "not set",
        collections,
        stats: detailedDbInfo,
      },
      system: {
        platform: process.platform,
        node_version: process.version,
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Add a specific recipes diagnostic endpoint
app.get("/api/recipes-debug", async (req, res) => {
  try {
    const Receta = require("./models/Receta");
    const mongoose = require("mongoose");

    // Attempt to get total count
    const count = await Receta.countDocuments();

    // Get sample recipes to verify structure
    const sampleRecipes = await Receta.find().limit(3).lean();

    // Get raw collection data to see actual field names
    const rawRecipes = await mongoose.connection.db
      .collection("recetas")
      .find({})
      .limit(3)
      .toArray();

    // Check if there's a separate ingredients collection
    let ingredientsCollection = null;
    try {
      const ingredientsCount = await mongoose.connection.db
        .collection("ingredientes")
        .countDocuments();

      const sampleIngredients = await mongoose.connection.db
        .collection("ingredientes")
        .find({})
        .limit(5)
        .toArray();

      ingredientsCollection = {
        count: ingredientsCount,
        samples: sampleIngredients,
      };
    } catch (err) {
      ingredientsCollection = { error: "Collection not found or accessible" };
    }

    // Get collection info
    const collectionInfo = await mongoose.connection.db
      .collection("recetas")
      .stats();

    // Analyze field structure
    const fieldAnalysis = {};
    if (rawRecipes.length > 0) {
      rawRecipes.forEach((recipe, index) => {
        fieldAnalysis[`recipe_${index + 1}_fields`] = Object.keys(recipe);
        if (recipe.ingredientes) {
          fieldAnalysis[`recipe_${index + 1}_ingredientes_type`] =
            Array.isArray(recipe.ingredientes)
              ? "array"
              : typeof recipe.ingredientes;
          fieldAnalysis[`recipe_${index + 1}_ingredientes_length`] =
            Array.isArray(recipe.ingredientes)
              ? recipe.ingredientes.length
              : "not_array";
          if (
            Array.isArray(recipe.ingredientes) &&
            recipe.ingredientes.length > 0
          ) {
            fieldAnalysis[`recipe_${index + 1}_first_ingredient_fields`] =
              Object.keys(recipe.ingredientes[0]);
          }
        }
      });
    }

    res.status(200).json({
      total_recipes: count,
      sample_recipes_mongoose: sampleRecipes,
      raw_recipes_from_db: rawRecipes,
      field_analysis: fieldAnalysis,
      ingredients_collection: ingredientsCollection,
      collection_info: collectionInfo,
    });
  } catch (error) {
    console.error("Error in recipes debug endpoint:", error);
    res.status(500).json({
      message: "Error accessing recipes",
      error: error.message,
    });
  }
});

// Catch all for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({ message: "Resource not found" });
});

// Enhanced error handling with monitoring
app.use(errorMonitor);
app.use(errorHandler);

// Export the app for Vercel (serverless functions don't need a listening server)
if (process.env.NODE_ENV !== "production") {
  // Start the server with improved environment handling (only for development)
  const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;
  const HOST = process.env.HOST || "localhost";
  const NODE_ENV = process.env.NODE_ENV || "development";

  const server = app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log(`🚀 Server running in ${NODE_ENV} mode`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 API available at: http://${HOST}:${PORT}`);
    console.log(`🏥 Health check: http://${HOST}:${PORT}/api/health`);
    console.log(`📊 Monitoring: http://${HOST}:${PORT}/api/monitoring`);
    console.log(`🔍 Debug endpoint: http://${HOST}:${PORT}/api/debug`);
    console.log(`🧪 Test endpoint: http://${HOST}:${PORT}/api/test`);
    console.log(`📝 Recipes endpoint: http://${HOST}:${PORT}/api/recipes`);
    if (NODE_ENV === "development") {
      console.log(`🎯 Frontend should proxy to: http://${HOST}:${PORT}`);
    }
    console.log("=".repeat(50));
  });

  // Handle server shutdown gracefully
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: shutting down gracefully");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err);
    server.close(() => {
      process.exit(1);
    });
  });
}

module.exports = app;
