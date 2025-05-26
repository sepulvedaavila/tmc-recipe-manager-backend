const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const RecetaOptimizada = require('../../schemas/OptimizedReceta');

describe('OptimizedReceta Schema Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await RecetaOptimizada.deleteMany({});
  });

  describe('Schema Validation', () => {
    describe('Recipe Name Validation', () => {
      test('should require recipe name', async () => {
        const receta = new RecetaOptimizada({
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors.nombre).toBeDefined();
        expect(error.errors.nombre.message).toBe('El nombre de la receta es obligatorio');
      });

      test('should reject names shorter than 3 characters', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'ab',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors.nombre).toBeDefined();
        expect(error.errors.nombre.message).toBe('El nombre debe tener al menos 3 caracteres');
      });

      test('should reject names longer than 200 characters', async () => {
        const longName = 'a'.repeat(201);
        const receta = new RecetaOptimizada({
          nombre: longName,
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors.nombre).toBeDefined();
        expect(error.errors.nombre.message).toBe('El nombre no puede exceder 200 caracteres');
      });

      test('should accept valid recipe names', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha con Verduras',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error).toBeFalsy();
      });
    });

    describe('Description Validation', () => {
      test('should require description', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors.descripcion).toBeDefined();
        expect(error.errors.descripcion.message).toBe('La descripción es obligatoria');
      });

      test('should reject descriptions shorter than 10 characters', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Corta',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors.descripcion).toBeDefined();
        expect(error.errors.descripcion.message).toBe('La descripción debe tener al menos 10 caracteres');
      });
    });

    describe('Category Validation', () => {
      test('should require category', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors.categoria).toBeDefined();
        expect(error.errors.categoria.message).toBe('La categoría es obligatoria');
      });

      test('should reject invalid categories', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'categoria-invalida',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors.categoria).toBeDefined();
        expect(error.errors.categoria.message).toBe('Categoría no válida');
      });

      test('should accept valid categories', async () => {
        const validCategories = ['sopa', 'plato-fuerte', 'guarnicion', 'postre', 'bebida', 'entrada'];
        
        for (const categoria of validCategories) {
          const receta = new RecetaOptimizada({
            nombre: 'Receta de Prueba',
            descripcion: 'Una deliciosa receta de prueba',
            categoria,
            ingredientes: [{
              nombre: 'ingrediente',
              cantidad: 100,
              unidad: 'g',
              categoria: 'otros'
            }]
          });

          const error = receta.validateSync();
          expect(error).toBeFalsy();
        }
      });
    });
  });

  describe('Embedded Ingredients Validation', () => {
    test('should require at least one ingredient', async () => {
      const receta = new RecetaOptimizada({
        nombre: 'Pollo a la Plancha',
        descripcion: 'Una deliciosa receta de prueba',
        categoria: 'plato-fuerte',
        ingredientes: []
      });

      const error = receta.validateSync();
      expect(error.errors.ingredientes).toBeDefined();
      expect(error.errors.ingredientes.message).toBe('La receta debe tener al menos un ingrediente');
    });

    describe('Ingredient Name Validation', () => {
      test('should require ingredient name', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors['ingredientes.0.nombre']).toBeDefined();
        expect(error.errors['ingredientes.0.nombre'].message).toBe('El nombre del ingrediente es obligatorio');
      });

      test('should reject ingredient names shorter than 2 characters', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'a',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors['ingredientes.0.nombre']).toBeDefined();
        expect(error.errors['ingredientes.0.nombre'].message).toBe('El nombre debe tener al menos 2 caracteres');
      });

      test('should convert ingredient names to lowercase', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'POLLO',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        await receta.save();
        expect(receta.ingredientes[0].nombre).toBe('pollo');
      });
    });

    describe('Ingredient Quantity Validation', () => {
      test('should require ingredient quantity', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors['ingredientes.0.cantidad']).toBeDefined();
        expect(error.errors['ingredientes.0.cantidad'].message).toBe('La cantidad es obligatoria');
      });

      test('should reject negative quantities', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: -1,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors['ingredientes.0.cantidad']).toBeDefined();
        expect(error.errors['ingredientes.0.cantidad'].message).toBe('La cantidad debe ser mayor a 0');
      });

      test('should reject zero quantities', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 0,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors['ingredientes.0.cantidad']).toBeDefined();
        expect(error.errors['ingredientes.0.cantidad'].message).toBe('La cantidad debe ser mayor a 0');
      });

      test('should accept valid quantities', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error).toBeFalsy();
      });
    });

    describe('Ingredient Unit Validation', () => {
      test('should require ingredient unit', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            categoria: 'proteina',
            unidad: '' // Empty string should trigger required validation
          }]
        });

        const error = receta.validateSync();
        expect(error).toBeDefined();
        expect(error.errors['ingredientes.0.unidad']).toBeDefined();
        expect(error.errors['ingredientes.0.unidad'].message).toBe('La unidad es obligatoria');
      });

      test('should reject invalid units', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'unidad-invalida',
            categoria: 'proteina'
          }]
        });

        const error = receta.validateSync();
        expect(error.errors['ingredientes.0.unidad']).toBeDefined();
        expect(error.errors['ingredientes.0.unidad'].message).toContain('Unidad no válida');
      });

      test('should accept valid units', async () => {
        const validUnits = ['kg', 'g', 'l', 'ml', 'piezas', 'tazas', 'cucharadas', 'cucharaditas', 'latas', 'paquetes'];
        
        for (const unidad of validUnits) {
          const receta = new RecetaOptimizada({
            nombre: 'Receta de Prueba',
            descripcion: 'Una deliciosa receta de prueba',
            categoria: 'plato-fuerte',
            ingredientes: [{
              nombre: 'ingrediente',
              cantidad: 100,
              unidad,
              categoria: 'otros'
            }]
          });

          const error = receta.validateSync();
          expect(error).toBeFalsy();
        }
      });
    });

    describe('Ingredient Category Validation', () => {
      test('should accept valid ingredient categories', async () => {
        const validCategories = ['proteina', 'vegetales', 'frutas', 'lacteos', 'granos', 'especias', 'aceites', 'otros'];
        
        for (const categoria of validCategories) {
          const receta = new RecetaOptimizada({
            nombre: 'Receta de Prueba',
            descripcion: 'Una deliciosa receta de prueba',
            categoria: 'plato-fuerte',
            ingredientes: [{
              nombre: 'ingrediente',
              cantidad: 100,
              unidad: 'g',
              categoria
            }]
          });

          const error = receta.validateSync();
          expect(error).toBeFalsy();
        }
      });

      test('should default to "otros" category', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g'
          }]
        });

        await receta.save();
        expect(receta.ingredientes[0].categoria).toBe('otros');
      });
    });

    describe('Ingredient Cost Validation', () => {
      test('should reject negative costs', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina',
            costoUnitario: -10
          }]
        });

        const error = receta.validateSync();
        expect(error.errors['ingredientes.0.costoUnitario']).toBeDefined();
        expect(error.errors['ingredientes.0.costoUnitario'].message).toBe('El costo unitario no puede ser negativo');
      });

      test('should accept zero and positive costs', async () => {
        const receta = new RecetaOptimizada({
          nombre: 'Pollo a la Plancha',
          descripcion: 'Una deliciosa receta de prueba',
          categoria: 'plato-fuerte',
          ingredientes: [{
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina',
            costoUnitario: 15.50
          }]
        });

        const error = receta.validateSync();
        expect(error).toBeFalsy();
      });
    });
  });

  describe('Nutritional Information Validation', () => {
    test('should reject negative nutritional values', async () => {
      const receta = new RecetaOptimizada({
        nombre: 'Pollo a la Plancha',
        descripcion: 'Una deliciosa receta de prueba',
        categoria: 'plato-fuerte',
        ingredientes: [{
          nombre: 'pollo',
          cantidad: 500,
          unidad: 'g',
          categoria: 'proteina',
          nutricion: {
            calorias: -100
          }
        }]
      });

      const error = receta.validateSync();
      expect(error.errors['ingredientes.0.nutricion.calorias']).toBeDefined();
      expect(error.errors['ingredientes.0.nutricion.calorias'].message).toBe('Las calorías no pueden ser negativas');
    });

    test('should accept valid nutritional values', async () => {
      const receta = new RecetaOptimizada({
        nombre: 'Pollo a la Plancha',
        descripcion: 'Una deliciosa receta de prueba',
        categoria: 'plato-fuerte',
        ingredientes: [{
          nombre: 'pollo',
          cantidad: 500,
          unidad: 'g',
          categoria: 'proteina',
          nutricion: {
            calorias: 250,
            proteinas: 30,
            carbohidratos: 0,
            grasas: 12,
            fibra: 0,
            sodio: 75,
            azucar: 0
          }
        }]
      });

      const error = receta.validateSync();
      expect(error).toBeFalsy();
    });
  });

  describe('Recipe Functionality', () => {
    test('should save a complete recipe with embedded ingredients', async () => {
      const receta = new RecetaOptimizada({
        nombre: 'Pollo a la Plancha con Verduras',
        descripcion: 'Una deliciosa receta de pollo a la plancha acompañado de verduras frescas',
        categoria: 'plato-fuerte',
        ingredientes: [
          {
            nombre: 'pechuga de pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina',
            costoUnitario: 12.50,
            nutricion: {
              calorias: 165,
              proteinas: 31,
              carbohidratos: 0,
              grasas: 3.6,
              fibra: 0,
              sodio: 74,
              azucar: 0
            }
          },
          {
            nombre: 'brócoli',
            cantidad: 200,
            unidad: 'g',
            categoria: 'vegetales',
            costoUnitario: 8.00,
            nutricion: {
              calorias: 34,
              proteinas: 2.8,
              carbohidratos: 7,
              grasas: 0.4,
              fibra: 2.6,
              sodio: 33,
              azucar: 1.5
            }
          },
          {
            nombre: 'aceite de oliva',
            cantidad: 2,
            unidad: 'cucharadas',
            categoria: 'aceites',
            costoUnitario: 25.00
          }
        ],
        tiempoPreparacion: 15,
        tiempoCoccion: 20,
        porcionesBase: 2,
        instrucciones: [
          {
            paso: 1,
            descripcion: 'Sazonar el pollo con sal y pimienta',
            tiempo: 5
          },
          {
            paso: 2,
            descripcion: 'Calentar la plancha con aceite de oliva',
            tiempo: 5
          },
          {
            paso: 3,
            descripcion: 'Cocinar el pollo 8 minutos por cada lado',
            tiempo: 16
          }
        ],
        tags: ['saludable', 'proteina', 'bajo-carbohidratos'],
        restriccionesDieteticas: ['sin-gluten']
      });

      const savedReceta = await receta.save();
      
      expect(savedReceta._id).toBeDefined();
      expect(savedReceta.nombre).toBe('Pollo a la Plancha con Verduras');
      expect(savedReceta.ingredientes).toHaveLength(3);
      expect(savedReceta.ingredientes[0].nombre).toBe('pechuga de pollo');
      expect(savedReceta.costoTotal).toBeGreaterThan(0);
      expect(savedReceta.costoPorPorcion).toBeGreaterThan(0);
    });

    test('should calculate total cost correctly', async () => {
      const receta = new RecetaOptimizada({
        nombre: 'Receta Simple',
        descripcion: 'Una receta simple para probar cálculos',
        categoria: 'plato-fuerte',
        ingredientes: [
          {
            nombre: 'ingrediente1',
            cantidad: 2,
            unidad: 'kg',
            categoria: 'otros',
            costoUnitario: 10 // 2 * 10 = 20
          },
          {
            nombre: 'ingrediente2',
            cantidad: 3,
            unidad: 'l',
            categoria: 'otros',
            costoUnitario: 5 // 3 * 5 = 15
          }
        ],
        porcionesBase: 4
      });

      await receta.save();
      
      expect(receta.costoTotal).toBe(35); // 20 + 15
      expect(receta.costoPorPorcion).toBe(8.75); // 35 / 4
    });

    test('should scale recipe correctly', async () => {
      const receta = new RecetaOptimizada({
        nombre: 'Receta Escalable',
        descripcion: 'Una receta para probar escalado',
        categoria: 'plato-fuerte',
        ingredientes: [
          {
            nombre: 'ingrediente1',
            cantidad: 100,
            unidad: 'g',
            categoria: 'otros',
            costoUnitario: 1
          }
        ],
        porcionesBase: 2,
        costoTotal: 100
      });

      const recetaEscalada = receta.escalarReceta(4);
      
      expect(recetaEscalada.ingredientes[0].cantidad).toBe(200); // 100 * 2
      expect(recetaEscalada.porcionesActuales).toBe(4);
      expect(recetaEscalada.costoTotal).toBe(200); // 100 * 2
    });

    test('should retrieve recipe with single query', async () => {
      const receta = new RecetaOptimizada({
        nombre: 'Receta Completa',
        descripcion: 'Una receta completa con todos los datos',
        categoria: 'plato-fuerte',
        ingredientes: [
          {
            nombre: 'pollo',
            cantidad: 500,
            unidad: 'g',
            categoria: 'proteina',
            costoUnitario: 12.50
          },
          {
            nombre: 'arroz',
            cantidad: 200,
            unidad: 'g',
            categoria: 'granos',
            costoUnitario: 3.00
          }
        ]
      });

      await receta.save();
      
      // Single query to get complete recipe with embedded ingredients
      const foundReceta = await RecetaOptimizada.findOne({ nombre: 'Receta Completa' });
      
      expect(foundReceta).toBeDefined();
      expect(foundReceta.ingredientes).toHaveLength(2);
      expect(foundReceta.ingredientes[0].nombre).toBe('pollo');
      expect(foundReceta.ingredientes[1].nombre).toBe('arroz');
      
      // Verify no additional queries needed for ingredients
      expect(foundReceta.ingredientes[0].cantidad).toBe(500);
      expect(foundReceta.ingredientes[0].unidad).toBe('g');
      expect(foundReceta.ingredientes[0].categoria).toBe('proteina');
      expect(foundReceta.ingredientes[0].costoUnitario).toBe(12.50);
    });
  });

  describe('Indexes and Performance', () => {
    test('should have text index for search', async () => {
      const indexes = await RecetaOptimizada.collection.getIndexes();
      const textIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[1] === 'text')
      );
      expect(textIndex).toBeDefined();
    });

    test('should have ingredient name index', async () => {
      const indexes = await RecetaOptimizada.collection.getIndexes();
      const ingredientIndex = Object.keys(indexes).find(key => 
        key.includes('ingredientes.nombre')
      );
      expect(ingredientIndex).toBeDefined();
    });
  });
}); 