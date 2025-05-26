const sampleRecipes = [
  {
    nombre: 'Pollo a la Plancha con Verduras',
    descripcion: 'Una deliciosa receta de pollo a la plancha acompañado de verduras frescas.',
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
          grasas: 3.6
        }
      },
      {
        nombre: 'brócoli',
        cantidad: 200,
        unidad: 'g',
        categoria: 'vegetales',
        costoUnitario: 8.00
      }
    ],
    tiempoPreparacion: 15,
    tiempoCoccion: 20,
    porcionesBase: 2,
    tags: ['saludable', 'proteina']
  },
  
  {
    nombre: 'Ensalada César con Pollo',
    descripcion: 'Clásica ensalada César con pollo grillado, croutones caseros y aderezo tradicional.',
    categoria: 'entrada',
    ingredientes: [
      {
        nombre: 'lechuga romana',
        cantidad: 300,
        unidad: 'g',
        categoria: 'vegetales',
        costoUnitario: 4.50,
        nutricion: {
          calorias: 17,
          proteinas: 1.2,
          carbohidratos: 3.3,
          grasas: 0.3,
          fibra: 2.1,
          sodio: 8,
          azucar: 1.2
        },
        alergenos: []
      },
      {
        nombre: 'pechuga de pollo',
        cantidad: 300,
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
        },
        alergenos: []
      },
      {
        nombre: 'queso parmesano',
        cantidad: 50,
        unidad: 'g',
        categoria: 'lacteos',
        costoUnitario: 35.00,
        nutricion: {
          calorias: 431,
          proteinas: 38,
          carbohidratos: 4,
          grasas: 29,
          fibra: 0,
          sodio: 1529,
          azucar: 0.9
        },
        alergenos: ['lacteos']
      },
      {
        nombre: 'pan integral',
        cantidad: 100,
        unidad: 'g',
        categoria: 'granos',
        costoUnitario: 6.00,
        nutricion: {
          calorias: 247,
          proteinas: 13,
          carbohidratos: 41,
          grasas: 4.2,
          fibra: 6,
          sodio: 392,
          azucar: 3.5
        },
        alergenos: ['gluten']
      },
      {
        nombre: 'mayonesa',
        cantidad: 3,
        unidad: 'cucharadas',
        categoria: 'otros',
        costoUnitario: 8.50,
        nutricion: {
          calorias: 680,
          proteinas: 1,
          carbohidratos: 0.6,
          grasas: 75,
          fibra: 0,
          sodio: 627,
          azucar: 0.4
        },
        alergenos: ['huevos']
      },
      {
        nombre: 'anchoas',
        cantidad: 6,
        unidad: 'piezas',
        categoria: 'proteina',
        costoUnitario: 18.00,
        nutricion: {
          calorias: 131,
          proteinas: 20,
          carbohidratos: 0,
          grasas: 4.8,
          fibra: 0,
          sodio: 3668,
          azucar: 0
        },
        alergenos: ['pescado']
      },
      {
        nombre: 'ajo',
        cantidad: 2,
        unidad: 'piezas',
        categoria: 'especias',
        costoUnitario: 2.00,
        nutricion: {
          calorias: 149,
          proteinas: 6.4,
          carbohidratos: 33,
          grasas: 0.5,
          fibra: 2.1,
          sodio: 17,
          azucar: 1
        },
        alergenos: []
      },
      {
        nombre: 'limón',
        cantidad: 1,
        unidad: 'piezas',
        categoria: 'frutas',
        costoUnitario: 1.50,
        nutricion: {
          calorias: 29,
          proteinas: 1.1,
          carbohidratos: 9,
          grasas: 0.3,
          fibra: 2.8,
          sodio: 2,
          azucar: 1.5
        },
        alergenos: []
      }
    ],
    tiempoPreparacion: 20,
    tiempoCoccion: 15,
    dificultad: 'medio',
    porcionesBase: 4,
    instrucciones: [
      {
        paso: 1,
        descripcion: 'Cortar el pan en cubos y tostar en el horno hasta dorar',
        tiempo: 10,
        temperatura: '180°C',
        equipoNecesario: ['horno', 'bandeja']
      },
      {
        paso: 2,
        descripcion: 'Sazonar y cocinar el pollo a la plancha hasta dorar',
        tiempo: 12,
        temperatura: 'fuego medio-alto',
        equipoNecesario: ['plancha']
      },
      {
        paso: 3,
        descripcion: 'Preparar el aderezo mezclando mayonesa, ajo, anchoas y limón',
        tiempo: 5,
        equipoNecesario: ['licuadora', 'bowl']
      },
      {
        paso: 4,
        descripcion: 'Lavar y cortar la lechuga en trozos grandes',
        tiempo: 5,
        equipoNecesario: ['cuchillo', 'tabla de cortar']
      },
      {
        paso: 5,
        descripcion: 'Mezclar lechuga con aderezo, agregar pollo, croutones y queso',
        tiempo: 3,
        equipoNecesario: ['bowl grande', 'tenazas']
      }
    ],
    tags: ['clasico', 'proteina', 'ensalada'],
    restriccionesDieteticas: [],
    fuente: 'Receta Tradicional',
    autor: 'TMC Nutrition Team'
  },

  {
    nombre: 'Sopa de Lentejas con Verduras',
    descripcion: 'Nutritiva sopa de lentejas con verduras frescas, perfecta para días fríos y rica en proteína vegetal.',
    categoria: 'sopa',
    ingredientes: [
      {
        nombre: 'lentejas rojas',
        cantidad: 200,
        unidad: 'g',
        categoria: 'granos',
        costoUnitario: 5.50,
        nutricion: {
          calorias: 353,
          proteinas: 25,
          carbohidratos: 60,
          grasas: 1.1,
          fibra: 11,
          sodio: 6,
          azucar: 2
        },
        alergenos: []
      },
      {
        nombre: 'cebolla',
        cantidad: 150,
        unidad: 'g',
        categoria: 'vegetales',
        costoUnitario: 2.50,
        nutricion: {
          calorias: 40,
          proteinas: 1.1,
          carbohidratos: 9,
          grasas: 0.1,
          fibra: 1.7,
          sodio: 4,
          azucar: 4.2
        },
        alergenos: []
      },
      {
        nombre: 'zanahoria',
        cantidad: 200,
        unidad: 'g',
        categoria: 'vegetales',
        costoUnitario: 3.50,
        nutricion: {
          calorias: 41,
          proteinas: 0.9,
          carbohidratos: 10,
          grasas: 0.2,
          fibra: 2.8,
          sodio: 69,
          azucar: 4.7
        },
        alergenos: []
      },
      {
        nombre: 'apio',
        cantidad: 100,
        unidad: 'g',
        categoria: 'vegetales',
        costoUnitario: 4.00,
        nutricion: {
          calorias: 16,
          proteinas: 0.7,
          carbohidratos: 3,
          grasas: 0.2,
          fibra: 1.6,
          sodio: 80,
          azucar: 1.3
        },
        alergenos: []
      },
      {
        nombre: 'tomate',
        cantidad: 300,
        unidad: 'g',
        categoria: 'vegetales',
        costoUnitario: 6.00,
        nutricion: {
          calorias: 18,
          proteinas: 0.9,
          carbohidratos: 3.9,
          grasas: 0.2,
          fibra: 1.2,
          sodio: 5,
          azucar: 2.6
        },
        alergenos: []
      },
      {
        nombre: 'caldo de verduras',
        cantidad: 1.5,
        unidad: 'l',
        categoria: 'otros',
        costoUnitario: 8.00,
        nutricion: {
          calorias: 12,
          proteinas: 0.4,
          carbohidratos: 2.8,
          grasas: 0.1,
          fibra: 0,
          sodio: 775,
          azucar: 1.9
        },
        alergenos: []
      },
      {
        nombre: 'aceite de oliva',
        cantidad: 2,
        unidad: 'cucharadas',
        categoria: 'aceites',
        costoUnitario: 25.00,
        nutricion: {
          calorias: 884,
          proteinas: 0,
          carbohidratos: 0,
          grasas: 100,
          fibra: 0,
          sodio: 2,
          azucar: 0
        },
        alergenos: []
      },
      {
        nombre: 'comino',
        cantidad: 1,
        unidad: 'cucharaditas',
        categoria: 'especias',
        costoUnitario: 12.00,
        nutricion: {
          calorias: 375,
          proteinas: 18,
          carbohidratos: 44,
          grasas: 22,
          fibra: 11,
          sodio: 168,
          azucar: 2.2
        },
        alergenos: []
      },
      {
        nombre: 'pimentón dulce',
        cantidad: 1,
        unidad: 'cucharaditas',
        categoria: 'especias',
        costoUnitario: 10.00,
        nutricion: {
          calorias: 282,
          proteinas: 14,
          carbohidratos: 54,
          grasas: 13,
          fibra: 35,
          sodio: 68,
          azucar: 10
        },
        alergenos: []
      }
    ],
    tiempoPreparacion: 15,
    tiempoCoccion: 30,
    dificultad: 'facil',
    porcionesBase: 4,
    instrucciones: [
      {
        paso: 1,
        descripcion: 'Lavar las lentejas y remojar por 10 minutos',
        tiempo: 10,
        equipoNecesario: ['colador', 'bowl']
      },
      {
        paso: 2,
        descripcion: 'Picar finamente cebolla, zanahoria, apio y tomate',
        tiempo: 10,
        equipoNecesario: ['cuchillo', 'tabla de cortar']
      },
      {
        paso: 3,
        descripcion: 'Sofreír la cebolla en aceite hasta transparentar',
        tiempo: 5,
        temperatura: 'fuego medio',
        equipoNecesario: ['olla grande']
      },
      {
        paso: 4,
        descripcion: 'Agregar zanahoria y apio, cocinar 3 minutos más',
        tiempo: 3,
        temperatura: 'fuego medio',
        equipoNecesario: ['olla grande']
      },
      {
        paso: 5,
        descripcion: 'Añadir tomate, especias y cocinar 2 minutos',
        tiempo: 2,
        temperatura: 'fuego medio',
        equipoNecesario: ['olla grande']
      },
      {
        paso: 6,
        descripcion: 'Incorporar lentejas y caldo, hervir y cocinar 25 minutos',
        tiempo: 25,
        temperatura: 'fuego medio-bajo',
        equipoNecesario: ['olla grande']
      }
    ],
    tags: ['vegetariano', 'vegano', 'saludable', 'proteina-vegetal', 'economico'],
    restriccionesDieteticas: ['vegetariano', 'vegano', 'sin-gluten'],
    fuente: 'Recetas Tradicionales',
    autor: 'TMC Nutrition Team'
  },

  {
    nombre: 'Smoothie Verde Energizante',
    descripcion: 'Delicioso smoothie verde lleno de vitaminas y minerales, perfecto para comenzar el día con energía.',
    categoria: 'bebida',
    ingredientes: [
      {
        nombre: 'espinaca fresca',
        cantidad: 100,
        unidad: 'g',
        categoria: 'vegetales',
        costoUnitario: 7.00,
        nutricion: {
          calorias: 23,
          proteinas: 2.9,
          carbohidratos: 3.6,
          grasas: 0.4,
          fibra: 2.2,
          sodio: 79,
          azucar: 0.4
        },
        alergenos: []
      },
      {
        nombre: 'plátano',
        cantidad: 150,
        unidad: 'g',
        categoria: 'frutas',
        costoUnitario: 3.00,
        nutricion: {
          calorias: 89,
          proteinas: 1.1,
          carbohidratos: 23,
          grasas: 0.3,
          fibra: 2.6,
          sodio: 1,
          azucar: 12
        },
        alergenos: []
      },
      {
        nombre: 'manzana verde',
        cantidad: 120,
        unidad: 'g',
        categoria: 'frutas',
        costoUnitario: 4.50,
        nutricion: {
          calorias: 52,
          proteinas: 0.3,
          carbohidratos: 14,
          grasas: 0.2,
          fibra: 2.4,
          sodio: 1,
          azucar: 10
        },
        alergenos: []
      },
      {
        nombre: 'jengibre fresco',
        cantidad: 10,
        unidad: 'g',
        categoria: 'especias',
        costoUnitario: 15.00,
        nutricion: {
          calorias: 80,
          proteinas: 1.8,
          carbohidratos: 18,
          grasas: 0.8,
          fibra: 2,
          sodio: 13,
          azucar: 1.7
        },
        alergenos: []
      },
      {
        nombre: 'agua de coco',
        cantidad: 300,
        unidad: 'ml',
        categoria: 'otros',
        costoUnitario: 12.00,
        nutricion: {
          calorias: 19,
          proteinas: 0.7,
          carbohidratos: 3.7,
          grasas: 0.2,
          fibra: 1.1,
          sodio: 105,
          azucar: 2.6
        },
        alergenos: []
      },
      {
        nombre: 'semillas de chía',
        cantidad: 15,
        unidad: 'g',
        categoria: 'granos',
        costoUnitario: 45.00,
        nutricion: {
          calorias: 486,
          proteinas: 17,
          carbohidratos: 42,
          grasas: 31,
          fibra: 34,
          sodio: 16,
          azucar: 0
        },
        alergenos: []
      },
      {
        nombre: 'limón',
        cantidad: 0.5,
        unidad: 'piezas',
        categoria: 'frutas',
        costoUnitario: 1.50,
        nutricion: {
          calorias: 29,
          proteinas: 1.1,
          carbohidratos: 9,
          grasas: 0.3,
          fibra: 2.8,
          sodio: 2,
          azucar: 1.5
        },
        alergenos: []
      }
    ],
    tiempoPreparacion: 10,
    tiempoCoccion: 0,
    dificultad: 'facil',
    porcionesBase: 2,
    instrucciones: [
      {
        paso: 1,
        descripcion: 'Lavar bien la espinaca y las frutas',
        tiempo: 3,
        equipoNecesario: ['colador']
      },
      {
        paso: 2,
        descripcion: 'Pelar y cortar el plátano y la manzana en trozos',
        tiempo: 3,
        equipoNecesario: ['cuchillo', 'tabla de cortar']
      },
      {
        paso: 3,
        descripcion: 'Pelar y rallar el jengibre finamente',
        tiempo: 2,
        equipoNecesario: ['rallador']
      },
      {
        paso: 4,
        descripcion: 'Agregar todos los ingredientes a la licuadora',
        tiempo: 1,
        equipoNecesario: ['licuadora']
      },
      {
        paso: 5,
        descripcion: 'Licuar hasta obtener una consistencia suave y homogénea',
        tiempo: 2,
        equipoNecesario: ['licuadora']
      }
    ],
    tags: ['saludable', 'vegano', 'detox', 'energizante', 'sin-gluten'],
    restriccionesDieteticas: ['vegetariano', 'vegano', 'sin-gluten', 'sin-lacteos'],
    fuente: 'Nutricionista Ana López',
    autor: 'TMC Nutrition Team'
  }
];

module.exports = sampleRecipes; 