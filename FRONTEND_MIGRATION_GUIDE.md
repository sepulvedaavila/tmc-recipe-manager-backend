# Frontend Migration Guide: Embedded Meal Plans Implementation

## Overview

This document outlines the changes made to the meal plan data structure and API endpoints to support the new embedded meal plan implementation. The frontend team should use this guide to adapt their queries and data handling to ensure compatibility with the new structure.

## Data Structure Changes

### Old Structure (Relational)
```javascript
// Old Plan Structure
{
  id: ObjectId,
  nombre: String,
  clienteId: ObjectId,
  fechaInicio: Date,
  fechaFin: Date,
  porcionesBase: Number,
  estado: String
}

// Old PlanReceta Structure
{
  planId: ObjectId,
  recetaId: ObjectId,
  dia: Number,
  tipoComida: String,
  porciones: Number
}
```

### New Structure (Embedded)
```javascript
// New OptimizedPlanComidas Structure
{
  id: ObjectId,
  nombre: String,
  clienteId: ObjectId,
  fechaInicio: Date,
  fechaFin: Date,
  porcionesBase: Number,
  estado: String,
  
  // New embedded structure
  dias: [{
    fecha: Date,
    diaSemana: String,
    comidas: {
      desayuno: {
        recetaId: ObjectId,
        porcionesPersonalizadas: Number,
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
        horaPreferida: String,
        tiempoPreparacion: Number,
        preparado: Boolean,
        fechaPreparacion: Date,
        calificacion: Number,
        comentarios: String
      },
      almuerzo: { /* Same structure as desayuno */ },
      comida: {
        sopa: { /* Same structure as desayuno */ },
        principal: { /* Same structure as desayuno */ },
        guarnicion: { /* Same structure as desayuno */ }
      },
      cena: { /* Same structure as desayuno */ },
      colaciones: [{ /* Same structure as desayuno */ }]
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
  }],
  
  preferencias: {
    presupuestoMaximo: Number,
    tiempoMaximoPreparacion: Number,
    evitarRepetirRecetas: Boolean,
    diasSinCocinar: [String],
    comidaFueraCasa: [Object]
  },
  
  listaCompras: [{
    ingrediente: String,
    cantidadTotal: Number,
    unidad: String,
    categoria: String,
    seccionSupermercado: String,
    prioridad: String,
    costoEstimado: Number,
    costoReal: Number,
    comprado: Boolean,
    fechaCompra: Date,
    recetasQueLoUsan: [{
      recetaId: ObjectId,
      nombreReceta: String,
      cantidadNecesaria: Number
    }]
  }],
  
  resumen: {
    totalRecetas: Number,
    costoTotalEstimado: Number,
    costoPromedioDiario: Number,
    tiempoTotalPreparacion: Number,
    nutricionPromedioDiaria: Object,
    distribucionCategorias: Object
  }
}
```

## API Endpoint Changes

### 1. Get Meal Plan
```javascript
// Old
GET /api/planes/:id

// New
GET /api/planes/:id
// Returns complete embedded structure in one call
```

### 2. Create Meal Plan
```javascript
// Old
POST /api/planes
// Required multiple calls to create plan and plan recipes

// New
POST /api/planes
// Single call with complete embedded structure
```

### 3. Update Meal Plan
```javascript
// Old
PUT /api/planes/:id
PUT /api/planes/:id/recetas
// Required multiple calls to update plan and plan recipes

// New
PUT /api/planes/:id
// Single call to update entire plan structure
```

### 4. Delete Meal Plan
```javascript
// Old
DELETE /api/planes/:id
// Required cascade deletion of plan recipes

// New
DELETE /api/planes/:id
// Single call deletes entire plan structure
```

## Frontend Adaptation Guide

### 1. Data Fetching

#### Before
```javascript
// Multiple API calls required
const plan = await fetchPlan(planId);
const planRecetas = await fetchPlanRecetas(planId);
const recetas = await Promise.all(
  planRecetas.map(pr => fetchReceta(pr.recetaId))
);
```

#### After
```javascript
// Single API call
const plan = await fetchPlan(planId);
// All data is embedded in the plan object
```

### 2. Data Display

#### Meal Plan List
- No changes required for basic plan information
- Additional fields available for display:
  - `resumen.totalRecetas`
  - `resumen.costoTotalEstimado`
  - `resumen.costoPromedioDiario`

#### Meal Plan Detail
- New structure for displaying daily meals:
  ```javascript
  plan.dias.forEach(dia => {
    // Access meals directly
    const desayuno = dia.comidas.desayuno;
    const almuerzo = dia.comidas.almuerzo;
    const comida = dia.comidas.comida;
    const cena = dia.comidas.cena;
    const colaciones = dia.comidas.colaciones;
  });
  ```

#### Shopping List
- New structure for shopping list items:
  ```javascript
  plan.listaCompras.forEach(item => {
    // Access shopping list items directly
    const { ingrediente, cantidadTotal, unidad, categoria, comprado } = item;
  });
  ```

### 3. Data Updates

#### Adding a Meal
```javascript
// Before
await addPlanReceta(planId, {
  recetaId,
  dia,
  tipoComida,
  porciones
});

// After
const plan = await fetchPlan(planId);
plan.dias[diaIndex].comidas[tipoComida] = {
  recetaId,
  porcionesPersonalizadas: porciones,
  preparado: false
};
await updatePlan(planId, plan);
```

#### Marking Meal as Prepared
```javascript
// Before
await updatePlanReceta(planId, planRecetaId, {
  preparado: true,
  fechaPreparacion: new Date()
});

// After
const plan = await fetchPlan(planId);
plan.dias[diaIndex].comidas[tipoComida].preparado = true;
plan.dias[diaIndex].comidas[tipoComida].fechaPreparacion = new Date();
await updatePlan(planId, plan);
```

### 4. New Features to Implement

#### 1. Meal Modifications
- Add UI for:
  - Ingredient omissions
  - Additional ingredients
  - Custom instructions
  - Meal notes

#### 2. Nutritional Analysis
- Display daily nutrition totals
- Show plan-level nutrition averages
- Implement nutrition charts/graphs

#### 3. Shopping List Management
- Implement category-based organization
- Add purchase tracking
- Show cost estimates and actual costs

#### 4. Plan Preferences
- Add UI for:
  - Budget limits
  - Maximum preparation time
  - Recipe repetition preferences
  - No-cooking days
  - Outside meals

## Migration Steps

1. **Update API Calls**
   - Modify all plan-related API calls to use the new structure
   - Remove multiple API calls for plan data
   - Update error handling for new response format

2. **Update Data Models**
   - Create new TypeScript interfaces for the embedded structure
   - Update existing models to match new schema
   - Add validation for new fields

3. **Update UI Components**
   - Modify plan list view to show new summary data
   - Update plan detail view to handle embedded structure
   - Add new UI elements for meal modifications
   - Implement shopping list management interface

4. **Testing**
   - Test all plan-related functionality
   - Verify data display and updates
   - Test new features
   - Validate error handling

## Backward Compatibility

The API will maintain backward compatibility by:
1. Supporting both old and new endpoints during migration
2. Providing data transformation utilities
3. Maintaining old response format for existing clients

## Performance Considerations

1. **Data Loading**
   - Implement pagination for large meal plans
   - Use selective field projection for list views
   - Cache frequently accessed data

2. **Updates**
   - Implement optimistic updates
   - Use partial updates when possible
   - Batch multiple changes

3. **Caching**
   - Cache complete meal plans
   - Implement cache invalidation on updates
   - Use stale-while-revalidate pattern

## Error Handling

1. **API Errors**
   - Handle 404 for non-existent plans
   - Validate required fields
   - Handle validation errors for new fields

2. **Data Validation**
   - Validate meal structure
   - Check date ranges
   - Verify portion sizes

3. **UI Feedback**
   - Show loading states
   - Display error messages
   - Provide retry options

## Conclusion

This migration guide provides all necessary information for the frontend team to adapt to the new embedded meal plan structure. The changes focus on simplifying data fetching and providing richer functionality while maintaining backward compatibility.

For any questions or clarifications, please contact the backend team. 