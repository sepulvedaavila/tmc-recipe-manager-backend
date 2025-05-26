# Embedded Meal Plans Implementation

## Overview

This document describes the implementation of embedded meal plans following the same pattern established for OptimizedReceta.js. The new structure embeds daily plans within meal plan documents for efficient retrieval and atomic operations.

## Architecture

### Old Structure (Relational)
```
Plan (Collection) → PlanReceta (Collection) → Receta (Collection)
```
- Multiple collections requiring joins
- Complex queries for complete meal plans
- Potential consistency issues

### New Structure (Embedded)
```
OptimizedPlanComidas (Collection)
├── Basic plan info
├── Client preferences
├── Embedded dias[] array
│   ├── Daily meal structure
│   ├── Nutrition totals
│   └── Completion tracking
├── Shopping list
└── Plan summaries
```

## Schema Structure

### Main Schema: `OptimizedPlanComidas.js`

#### Individual Meal Schema (`comidaSchema`)
```javascript
{
  recetaId: ObjectId,              // Reference to OptimizedReceta
  porcionesPersonalizadas: Number, // Custom portions for this meal
  modificaciones: {
    ingredientesOmitidos: [String],
    ingredientesAdicionales: [{
      nombre: String,
      cantidad: Number,
      unidad: String
    }],
    instruccionesAdicionales: String,
    notas: String
  },
  horaPreferida: String,           // "08:00", "13:00", "19:00"
  tiempoPreparacion: Number,       // minutes
  preparado: Boolean,
  fechaPreparacion: Date,
  calificacion: Number,            // 1-5 stars
  comentarios: String
}
```

#### Daily Plan Schema (`diaPlanSchema`)
```javascript
{
  fecha: Date,
  diaSemana: String,               // "lunes", "martes", etc.
  comidas: {
    desayuno: comidaSchema,
    almuerzo: comidaSchema,
    comida: {
      sopa: comidaSchema,
      principal: comidaSchema,
      guarnicion: comidaSchema
    },
    cena: comidaSchema,
    colaciones: [comidaSchema]     // Snacks
  },
  nutricionDiaria: {
    calorias: Number,
    proteinas: Number,
    carbohidratos: Number,
    grasas: Number,
    fibra: Number,
    sodio: Number
  },
  costoEstimadoDia: Number,
  notas: String,
  completado: Boolean,
  porcentajeCompletado: Number
}
```

#### Shopping List Item Schema
```javascript
{
  ingrediente: String,
  cantidadTotal: Number,
  unidad: String,
  categoria: String,               // "proteina", "vegetales", etc.
  seccionSupermercado: String,
  prioridad: String,               // "alta", "media", "baja"
  costoEstimado: Number,
  costoReal: Number,
  comprado: Boolean,
  fechaCompra: Date,
  recetasQueLoUsan: [{
    recetaId: ObjectId,
    nombreReceta: String,
    cantidadNecesaria: Number
  }]
}
```

#### Main Plan Schema
```javascript
{
  nombre: String,
  clienteId: ObjectId,
  fechaInicio: Date,
  fechaFin: Date,
  porcionesBase: Number,
  
  // Embedded daily plans (MongoDB strength!)
  dias: [diaPlanSchema],
  
  // Plan-level preferences
  preferencias: {
    presupuestoMaximo: Number,
    tiempoMaximoPreparacion: Number,
    evitarRepetirRecetas: Boolean,
    diasSinCocinar: [String],
    comidaFueraCasa: [Object]
  },
  
  // Generated shopping list
  listaCompras: [itemListaComprasSchema],
  
  // Plan analytics
  resumen: {
    totalRecetas: Number,
    costoTotalEstimado: Number,
    costoPromedioDiario: Number,
    tiempoTotalPreparacion: Number,
    nutricionPromedioDiaria: Object,
    distribucionCategorias: Object
  },
  
  // Usage tracking
  vecesUsado: Number,
  ultimaActividad: Date,
  calificacionGeneral: Number,
  comentariosGenerales: String,
  
  // Sharing capabilities
  compartido: Boolean,
  usuariosCompartidos: [Object]
}
```

## Implementation Files

### 1. Schema Definition
- **File**: `schemas/OptimizedPlanComidas.js`
- **Purpose**: Complete embedded meal plan schema with validation
- **Features**:
  - Nested meal structure with multiple meal types
  - Shopping list generation methods
  - Plan summary calculation methods
  - Template creation capabilities
  - Validation and business logic

### 2. Migration Scripts

#### Main Migration Script
- **File**: `scripts/migrate-meal-plans.js`
- **Strategies**:
  - `basic`: Migrate existing Plan + PlanReceta to embedded structure
  - `fresh`: Clear all and start with sample meal plans
  - `sample`: Show current meal plan data status
- **Features**:
  - Backup creation before migration
  - Recipe ID mapping using tags
  - Error handling and rollback
  - Dry-run capability

#### Sample Data Loader
- **File**: `scripts/load-sample-meal-plans.js`
- **Purpose**: Load comprehensive sample meal plans
- **Features**:
  - Three different meal plan scenarios
  - Complete embedded structure demonstration
  - Data verification and validation

### 3. Testing Framework

#### Comprehensive Test Suite
- **File**: `scripts/test-meal-plan-migration.js`
- **Test Categories**:
  1. **Basic Data Validation**: Document counts, required fields
  2. **Schema Validation**: Valid/invalid data testing
  3. **Relationship Integrity**: Recipe reference validation
  4. **Business Logic Validation**: Dates, portions, day sequences
  5. **Performance Validation**: Query timing, index usage
  6. **Embedded Operations**: CRUD operations on nested documents

#### Feature Demonstration
- **File**: `scripts/demo-meal-plan-features.js`
- **Demonstrations**:
  - Embedded document queries
  - Aggregation analysis
  - Shopping list operations
  - Meal completion tracking
  - Complex nested queries
  - Atomic updates

### 4. Sample Data
- **File**: `data/sample-meal-plans.js`
- **Examples**:
  - **Plan Semanal Familiar**: 7-day family plan with full meal structure
  - **Plan Vegetariano Semanal**: Vegetarian plan with modifications
  - **Plan Express 3 Días**: Quick 3-day plan with completion tracking

## Key Features Implemented

### 1. Embedded Document Structure
- **Single Document Retrieval**: Complete meal plan in one query
- **Atomic Operations**: Update multiple meals in single transaction
- **Nested Queries**: Efficient searching within embedded documents

### 2. Meal Management
- **Multiple Meal Types**: Breakfast, lunch, dinner, snacks
- **Structured Lunch**: Soup, main course, side dish
- **Meal Modifications**: Ingredient omissions, additions, custom instructions
- **Timing Preferences**: Preferred meal times and preparation duration

### 3. Completion Tracking
- **Meal Status**: Individual meal preparation tracking
- **Ratings & Comments**: User feedback on prepared meals
- **Progress Calculation**: Daily and plan-level completion percentages

### 4. Shopping List Integration
- **Automatic Generation**: From all plan recipes
- **Category Organization**: Grouped by ingredient type
- **Cost Tracking**: Estimated vs actual costs
- **Purchase Status**: Mark items as bought with timestamps

### 5. Nutritional Analysis
- **Daily Totals**: Calories, proteins, carbs, fats, fiber, sodium
- **Plan Averages**: Nutritional summaries across all days
- **Health Insights**: High-protein days, calorie distribution

### 6. Advanced Features
- **Plan Templates**: Reusable meal plan structures
- **Sharing Capabilities**: Share plans with other users
- **Budget Management**: Cost tracking and budget limits
- **Preference Handling**: Dietary restrictions and cooking preferences

## Migration Process

### Step 1: Backup Existing Data
```bash
node scripts/migrate-meal-plans.js basic --no-dry-run
```

### Step 2: Load Sample Data
```bash
node scripts/load-sample-meal-plans.js
```

### Step 3: Validate Migration
```bash
node scripts/test-meal-plan-migration.js --embedded
```

### Step 4: Demonstrate Features
```bash
node scripts/demo-meal-plan-features.js
```

## Query Examples

### Find Plans with Specific Meals
```javascript
// Plans with breakfast
await PlanComidasOptimizado.find({
  'dias.comidas.desayuno': { $ne: null }
});

// High-protein days
await PlanComidasOptimizado.find({
  'dias.nutricionDiaria.proteinas': { $gte: 100 }
});
```

### Aggregation Analysis
```javascript
// Average daily nutrition
await PlanComidasOptimizado.aggregate([
  { $unwind: '$dias' },
  {
    $group: {
      _id: null,
      avgCalories: { $avg: '$dias.nutricionDiaria.calorias' },
      avgProteins: { $avg: '$dias.nutricionDiaria.proteinas' }
    }
  }
]);
```

### Shopping List Operations
```javascript
// Shopping by category
await PlanComidasOptimizado.aggregate([
  { $unwind: '$listaCompras' },
  {
    $group: {
      _id: '$listaCompras.categoria',
      totalItems: { $sum: 1 },
      totalCost: { $sum: '$listaCompras.costoEstimado' }
    }
  }
]);
```

### Update Embedded Documents
```javascript
// Mark meal as prepared
plan.dias[0].comidas.desayuno.preparado = true;
plan.dias[0].comidas.desayuno.fechaPreparacion = new Date();
await plan.save();
```

## Performance Benefits

### 1. Reduced Query Complexity
- **Before**: Multiple joins across Plan, PlanReceta, Receta collections
- **After**: Single document retrieval with all meal plan data

### 2. Atomic Operations
- **Before**: Multiple operations across collections with potential inconsistency
- **After**: Single atomic update for complete meal plan changes

### 3. Efficient Aggregations
- **Embedded Arrays**: Direct aggregation on nested meal data
- **Shopping Lists**: Immediate access to all plan ingredients
- **Nutrition Analysis**: Real-time calculation from embedded nutrition data

### 4. Optimized Indexes
```javascript
// Compound indexes for efficient queries
{ clienteId: 1, fechaInicio: 1 }
{ estado: 1, fechaInicio: -1 }
{ 'dias.fecha': 1 }
{ 'dias.comidas.desayuno.preparado': 1 }
```

## Business Logic Features

### 1. Plan Validation
- Date range consistency
- Portion size limits
- Day sequence validation
- Meal type requirements

### 2. Cost Management
- Budget tracking per plan
- Daily cost calculations
- Shopping list cost estimation
- Actual vs estimated cost comparison

### 3. Nutritional Guidelines
- Daily calorie targets
- Protein requirements
- Balanced meal distribution
- Dietary restriction compliance

### 4. Usage Analytics
- Plan popularity tracking
- Meal completion rates
- User preference analysis
- Template usage statistics

## Integration Points

### 1. Recipe System
- References to `OptimizedReceta` collection
- Recipe scaling based on plan portions
- Ingredient aggregation for shopping lists

### 2. Client Management
- Integration with `OptimizedCliente` schema
- Personalized meal preferences
- Dietary restriction handling

### 3. Inventory System
- Shopping list to inventory mapping
- Ingredient availability checking
- Cost tracking integration

## Future Enhancements

### 1. AI-Powered Features
- Automatic meal plan generation
- Nutritional optimization
- Recipe recommendations
- Shopping list optimization

### 2. Mobile Integration
- Offline meal plan access
- Real-time completion tracking
- Shopping list mobile app
- Meal preparation timers

### 3. Social Features
- Plan sharing and rating
- Community meal plans
- Collaborative planning
- Recipe exchange

## Conclusion

The embedded meal plan implementation successfully follows the same pattern established for OptimizedReceta.js, providing:

- **Efficient Data Structure**: Single document retrieval for complete meal plans
- **Rich Functionality**: Comprehensive meal management with shopping lists and nutrition tracking
- **Scalable Architecture**: Embedded documents with proper indexing for performance
- **Business Logic Integration**: Cost management, completion tracking, and user preferences
- **Migration Path**: Smooth transition from relational to embedded structure

This implementation demonstrates the power of MongoDB's embedded document capabilities for complex, hierarchical data structures while maintaining data integrity and query performance. 