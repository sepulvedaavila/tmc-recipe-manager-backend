# Relationship Optimization Plan

## Overview

This document outlines the optimization strategy for the relationships between Clients, Meal Plans, and Recipes in the MongoDB database. The goal is to improve query performance while maintaining data consistency.

## Current Structure

### Client-Meal Plan Relationship
```javascript
// In OptimizedPlanComidas
{
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClienteOptimizado',
    required: true,
    index: true
  }
}
```

### Recipe-Meal Plan Relationship
```javascript
// In OptimizedPlanComidas.dias.comidas
{
  recetaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecetaOptimizada',
    required: true
  }
}
```

## Optimization Strategy

### 1. Client-Meal Plan Optimization

#### Current Issues
- Frequent lookups to client collection for preferences
- Multiple queries needed for meal plan operations
- Potential performance impact on meal plan queries

#### Proposed Changes
```javascript
// In OptimizedPlanComidas
{
  // Keep the reference
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClienteOptimizado',
    required: true,
    index: true
  },
  
  // Add denormalized client preferences
  preferenciasCliente: {
    // Dietary restrictions
    restriccionesDieteticas: [{
      tipo: String,
      nivel: String
    }],
    
    // Allergies
    alergias: [{
      alergeno: String,
      severidad: String
    }],
    
    // Household info for portions
    miembrosHogar: {
      adultos: Number,
      ninos: Number
    },
    
    // Cooking preferences
    preferenciasCocina: {
      nivelCocina: String,
      equipoDisponible: [String],
      tiempoMaximoPreparacion: Number
    }
  }
}
```

#### Benefits
- Reduced client collection lookups
- Faster meal plan queries
- Better performance for meal plan operations

### 2. Recipe-Meal Plan Optimization

#### Current Issues
- Multiple recipe lookups for meal plan operations
- Performance impact when generating shopping lists
- Extra queries for recipe modifications

#### Proposed Changes
```javascript
// In OptimizedPlanComidas.dias.comidas
{
  // Keep the reference
  recetaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecetaOptimizada',
    required: true
  },
  
  // Add denormalized recipe data
  recetaInfo: {
    nombre: String,
    categoria: String,
    tiempoPreparacion: Number,
    tiempoCoccion: Number,
    dificultad: String,
    porcionesBase: Number,
    
    // Essential nutritional info
    nutricionPorPorcion: {
      calorias: Number,
      proteinas: Number,
      carbohidratos: Number,
      grasas: Number
    },
    
    // Essential ingredients for shopping list
    ingredientesPrincipales: [{
      nombre: String,
      cantidad: Number,
      unidad: String,
      categoria: String
    }],
    
    // Dietary classifications
    restriccionesDieteticas: [String]
  }
}
```

#### Benefits
- Reduced recipe collection lookups
- Faster shopping list generation
- Better performance for meal plan operations

## Implementation Steps

### 1. Schema Updates

1. **Update OptimizedPlanComidas Schema**
   ```javascript
   // Add new fields for denormalized data
   const planComidasOptimizadoSchema = new mongoose.Schema({
     // ... existing fields ...
     
     preferenciasCliente: {
       // ... new client preferences fields ...
     }
   });
   ```

2. **Update Meal Schema**
   ```javascript
   const comidaSchema = new mongoose.Schema({
     // ... existing fields ...
     
     recetaInfo: {
       // ... new recipe info fields ...
     }
   });
   ```

### 2. Migration Script

Create a migration script to:
1. Update existing meal plans with denormalized data
2. Validate data consistency
3. Handle edge cases and errors

```javascript
// scripts/migrate-relationships.js
async function migrateRelationships() {
  // 1. Get all meal plans
  const planes = await PlanComidasOptimizado.find({});
  
  for (const plan of planes) {
    // 2. Get client data
    const cliente = await ClienteOptimizado.findById(plan.clienteId);
    
    // 3. Update plan with client preferences
    plan.preferenciasCliente = {
      restriccionesDieteticas: cliente.preferenciasDieteticas.restricciones,
      alergias: cliente.preferenciasDieteticas.alergias,
      miembrosHogar: cliente.miembrosHogar,
      preferenciasCocina: cliente.preferenciasPlanes
    };
    
    // 4. Update each meal with recipe info
    for (const dia of plan.dias) {
      for (const tipoComida of ['desayuno', 'almuerzo', 'comida', 'cena']) {
        const comida = dia.comidas[tipoComida];
        if (comida) {
          const receta = await RecetaOptimizada.findById(comida.recetaId);
          comida.recetaInfo = {
            nombre: receta.nombre,
            categoria: receta.categoria,
            tiempoPreparacion: receta.tiempoPreparacion,
            tiempoCoccion: receta.tiempoCoccion,
            dificultad: receta.dificultad,
            porcionesBase: receta.porcionesBase,
            nutricionPorPorcion: receta.nutricionPorPorcion,
            ingredientesPrincipales: receta.ingredientes.slice(0, 5), // Top 5 ingredients
            restriccionesDieteticas: receta.restriccionesDieteticas
          };
        }
      }
    }
    
    // 5. Save updated plan
    await plan.save();
  }
}
```

### 3. Data Consistency

Implement hooks to maintain data consistency:

1. **Client Update Hook**
   ```javascript
   // In OptimizedCliente schema
   clienteOptimizadoSchema.pre('save', async function(next) {
     if (this.isModified('preferenciasDieteticas') || 
         this.isModified('miembrosHogar') || 
         this.isModified('preferenciasPlanes')) {
       // Update all active meal plans
       await PlanComidasOptimizado.updateMany(
         { clienteId: this._id, estado: 'activo' },
         { $set: { preferenciasCliente: { /* updated data */ } } }
       );
     }
     next();
   });
   ```

2. **Recipe Update Hook**
   ```javascript
   // In OptimizedReceta schema
   recetaOptimizadaSchema.pre('save', async function(next) {
     if (this.isModified()) {
       // Update all meal plans using this recipe
       await PlanComidasOptimizado.updateMany(
         { 'dias.comidas.recetaId': this._id },
         { $set: { 'dias.$[].comidas.$[].recetaInfo': { /* updated data */ } } }
       );
     }
     next();
   });
   ```

### 4. Index Updates

Add new indexes to support the optimized queries:

```javascript
// In OptimizedPlanComidas schema
planComidasOptimizadoSchema.index({ 
  'preferenciasCliente.restriccionesDieteticas.tipo': 1 
});

planComidasOptimizadoSchema.index({ 
  'preferenciasCliente.alergias.alergeno': 1 
});

planComidasOptimizadoSchema.index({ 
  'dias.comidas.recetaInfo.categoria': 1 
});
```

## Performance Benefits

### 1. Query Performance
- Reduced number of database queries
- Faster meal plan retrieval
- Improved shopping list generation

### 2. Data Access
- Single document retrieval for common operations
- Reduced need for joins/lookups
- Better caching opportunities

### 3. Scalability
- Better handling of concurrent operations
- Reduced database load
- Improved response times

## Monitoring and Maintenance

### 1. Performance Monitoring
- Track query execution times
- Monitor document sizes
- Watch for index usage

### 2. Data Consistency
- Regular validation of denormalized data
- Automated consistency checks
- Error logging and alerts

### 3. Maintenance Tasks
- Periodic cleanup of outdated data
- Index optimization
- Data rebalancing if needed

## Rollback Plan

In case of issues:

1. Keep old fields during migration
2. Maintain backward compatibility
3. Prepare rollback scripts
4. Monitor system performance

## Conclusion

This optimization plan will significantly improve the performance of meal plan operations while maintaining data consistency. The denormalized approach is well-suited for MongoDB and will provide better scalability for the application. 