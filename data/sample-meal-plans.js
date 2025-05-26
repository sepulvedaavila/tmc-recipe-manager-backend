const mongoose = require('mongoose');

// Sample meal plans with embedded daily structure
const sampleMealPlans = [
  {
    nombre: 'Plan Semanal Familiar',
    clienteId: new mongoose.Types.ObjectId(),
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2024-01-07'),
    porcionesBase: 4,
    estado: 'activo',
    preferencias: {
      presupuestoMaximo: 500,
      tiempoMaximoPreparacion: 120,
      evitarRepetirRecetas: true,
      diasSinCocinar: ['domingo'],
      comidaFueraCasa: [
        {
          dia: 'sabado',
          comida: 'cena',
          restaurante: 'Pizzería Local',
          costoEstimado: 80
        }
      ]
    },
    dias: [
      {
        fecha: new Date('2024-01-01'),
        diaSemana: 'lunes',
        comidas: {
          desayuno: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '08:00',
            tiempoPreparacion: 15,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: 'Desayuno ligero para comenzar la semana'
            }
          },
          almuerzo: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '12:00',
            tiempoPreparacion: 20,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: ''
            }
          },
          comida: {
            sopa: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '14:00',
              tiempoPreparacion: 30,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: 'Sopa de verduras'
              }
            },
            principal: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '14:30',
              tiempoPreparacion: 45,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: 'Plato principal nutritivo'
              }
            },
            guarnicion: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '14:30',
              tiempoPreparacion: 20,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: 'Acompañamiento saludable'
              }
            }
          },
          cena: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '19:00',
            tiempoPreparacion: 25,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: 'Cena ligera'
            }
          },
          colaciones: [
            {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '16:00',
              tiempoPreparacion: 5,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: 'Snack saludable'
              }
            }
          ]
        },
        nutricionDiaria: {
          calorias: 2200,
          proteinas: 120,
          carbohidratos: 280,
          grasas: 75,
          fibra: 35,
          sodio: 2000
        },
        costoEstimadoDia: 65.50,
        notas: 'Primer día de la semana, comidas balanceadas',
        completado: false,
        porcentajeCompletado: 0
      },
      {
        fecha: new Date('2024-01-02'),
        diaSemana: 'martes',
        comidas: {
          desayuno: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '08:00',
            tiempoPreparacion: 10,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: 'Desayuno rápido'
            }
          },
          comida: {
            sopa: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '14:00',
              tiempoPreparacion: 25,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: ''
              }
            },
            principal: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '14:30',
              tiempoPreparacion: 40,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: ''
              }
            }
          },
          cena: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '19:30',
            tiempoPreparacion: 30,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: ''
            }
          }
        },
        nutricionDiaria: {
          calorias: 2100,
          proteinas: 110,
          carbohidratos: 260,
          grasas: 70,
          fibra: 30,
          sodio: 1800
        },
        costoEstimadoDia: 58.75,
        notas: '',
        completado: false,
        porcentajeCompletado: 0
      }
    ],
    listaCompras: [
      {
        ingrediente: 'pollo',
        cantidadTotal: 1.5,
        unidad: 'kg',
        categoria: 'proteina',
        seccionSupermercado: 'carnicería',
        prioridad: 'alta',
        costoEstimado: 45.00,
        comprado: false,
        recetasQueLoUsan: [
          {
            recetaId: new mongoose.Types.ObjectId(),
            nombreReceta: 'Pollo a la plancha',
            cantidadNecesaria: 0.8
          }
        ]
      },
      {
        ingrediente: 'arroz',
        cantidadTotal: 500,
        unidad: 'g',
        categoria: 'granos',
        seccionSupermercado: 'abarrotes',
        prioridad: 'media',
        costoEstimado: 12.00,
        comprado: false,
        recetasQueLoUsan: [
          {
            recetaId: new mongoose.Types.ObjectId(),
            nombreReceta: 'Arroz blanco',
            cantidadNecesaria: 300
          }
        ]
      }
    ],
    resumen: {
      totalRecetas: 8,
      costoTotalEstimado: 124.25,
      costoPromedioDiario: 62.13,
      tiempoTotalPreparacion: 285,
      nutricionPromedioDiaria: {
        calorias: 2150,
        proteinas: 115,
        carbohidratos: 270,
        grasas: 72.5,
        fibra: 32.5,
        sodio: 1900
      },
      distribucionCategorias: {
        sopas: 2,
        platosFuertes: 3,
        guarniciones: 1,
        postres: 0
      }
    },
    vecesUsado: 0,
    calificacionGeneral: null,
    comentariosGenerales: '',
    compartido: false,
    usuariosCompartidos: []
  },
  {
    nombre: 'Plan Vegetariano Semanal',
    clienteId: new mongoose.Types.ObjectId(),
    fechaInicio: new Date('2024-01-08'),
    fechaFin: new Date('2024-01-14'),
    porcionesBase: 2,
    estado: 'borrador',
    preferencias: {
      presupuestoMaximo: 300,
      tiempoMaximoPreparacion: 90,
      evitarRepetirRecetas: false,
      diasSinCocinar: [],
      comidaFueraCasa: []
    },
    dias: [
      {
        fecha: new Date('2024-01-08'),
        diaSemana: 'lunes',
        comidas: {
          desayuno: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '07:30',
            tiempoPreparacion: 10,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [
                {
                  nombre: 'semillas de chía',
                  cantidad: 1,
                  unidad: 'cucharadas'
                }
              ],
              instruccionesAdicionales: 'Agregar semillas de chía al final',
              notas: 'Smoothie verde energético'
            }
          },
          comida: {
            principal: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '13:00',
              tiempoPreparacion: 35,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: 'Ensalada completa con quinoa'
              }
            },
            guarnicion: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '13:00',
              tiempoPreparacion: 15,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: 'Pan integral casero'
              }
            }
          },
          cena: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '18:30',
            tiempoPreparacion: 25,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: 'Sopa de lentejas'
            }
          }
        },
        nutricionDiaria: {
          calorias: 1800,
          proteinas: 85,
          carbohidratos: 220,
          grasas: 60,
          fibra: 40,
          sodio: 1500
        },
        costoEstimadoDia: 42.00,
        notas: 'Día vegetariano completo',
        completado: false,
        porcentajeCompletado: 0
      }
    ],
    listaCompras: [
      {
        ingrediente: 'quinoa',
        cantidadTotal: 200,
        unidad: 'g',
        categoria: 'granos',
        seccionSupermercado: 'abarrotes',
        prioridad: 'alta',
        costoEstimado: 25.00,
        comprado: false,
        recetasQueLoUsan: [
          {
            recetaId: new mongoose.Types.ObjectId(),
            nombreReceta: 'Ensalada de quinoa',
            cantidadNecesaria: 150
          }
        ]
      },
      {
        ingrediente: 'espinacas',
        cantidadTotal: 300,
        unidad: 'g',
        categoria: 'vegetales',
        seccionSupermercado: 'verdulería',
        prioridad: 'alta',
        costoEstimado: 18.00,
        comprado: false,
        recetasQueLoUsan: [
          {
            recetaId: new mongoose.Types.ObjectId(),
            nombreReceta: 'Smoothie verde',
            cantidadNecesaria: 100
          }
        ]
      }
    ],
    resumen: {
      totalRecetas: 4,
      costoTotalEstimado: 42.00,
      costoPromedioDiario: 42.00,
      tiempoTotalPreparacion: 85,
      nutricionPromedioDiaria: {
        calorias: 1800,
        proteinas: 85,
        carbohidratos: 220,
        grasas: 60,
        fibra: 40,
        sodio: 1500
      },
      distribucionCategorias: {
        sopas: 1,
        platosFuertes: 2,
        guarniciones: 1,
        postres: 0
      }
    },
    vecesUsado: 0,
    calificacionGeneral: null,
    comentariosGenerales: 'Plan enfocado en alimentación vegetariana balanceada',
    compartido: false,
    usuariosCompartidos: []
  },
  {
    nombre: 'Plan Express 3 Días',
    clienteId: new mongoose.Types.ObjectId(),
    fechaInicio: new Date('2024-01-15'),
    fechaFin: new Date('2024-01-17'),
    porcionesBase: 1,
    estado: 'activo',
    preferencias: {
      presupuestoMaximo: 150,
      tiempoMaximoPreparacion: 60,
      evitarRepetirRecetas: true,
      diasSinCocinar: [],
      comidaFueraCasa: [
        {
          dia: 'miercoles',
          comida: 'comida',
          restaurante: 'Comida rápida',
          costoEstimado: 35
        }
      ]
    },
    dias: [
      {
        fecha: new Date('2024-01-15'),
        diaSemana: 'lunes',
        comidas: {
          desayuno: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '08:30',
            tiempoPreparacion: 5,
            preparado: true,
            fechaPreparacion: new Date('2024-01-15T08:30:00'),
            calificacion: 4,
            comentarios: 'Rápido y nutritivo',
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: 'Avena con frutas'
            }
          },
          comida: {
            principal: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '13:30',
              tiempoPreparacion: 20,
              preparado: true,
              fechaPreparacion: new Date('2024-01-15T13:30:00'),
              calificacion: 5,
              comentarios: 'Excelente sabor',
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: 'Pasta con verduras'
              }
            }
          },
          cena: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '19:00',
            tiempoPreparacion: 15,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: 'Ensalada ligera'
            }
          }
        },
        nutricionDiaria: {
          calorias: 1600,
          proteinas: 70,
          carbohidratos: 200,
          grasas: 55,
          fibra: 25,
          sodio: 1200
        },
        costoEstimadoDia: 38.50,
        notas: 'Día de comidas rápidas y saludables',
        completado: false,
        porcentajeCompletado: 67
      },
      {
        fecha: new Date('2024-01-16'),
        diaSemana: 'martes',
        comidas: {
          desayuno: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '08:00',
            tiempoPreparacion: 8,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: 'Tostadas con aguacate'
            }
          },
          comida: {
            principal: {
              recetaId: new mongoose.Types.ObjectId(),
              horaPreferida: '14:00',
              tiempoPreparacion: 25,
              preparado: false,
              modificaciones: {
                ingredientesOmitidos: [],
                ingredientesAdicionales: [],
                instruccionesAdicionales: '',
                notas: 'Sándwich gourmet'
              }
            }
          },
          cena: {
            recetaId: new mongoose.Types.ObjectId(),
            horaPreferida: '18:30',
            tiempoPreparacion: 12,
            preparado: false,
            modificaciones: {
              ingredientesOmitidos: [],
              ingredientesAdicionales: [],
              instruccionesAdicionales: '',
              notas: 'Yogurt con granola'
            }
          }
        },
        nutricionDiaria: {
          calorias: 1550,
          proteinas: 65,
          carbohidratos: 190,
          grasas: 52,
          fibra: 22,
          sodio: 1100
        },
        costoEstimadoDia: 35.75,
        notas: '',
        completado: false,
        porcentajeCompletado: 0
      }
    ],
    listaCompras: [
      {
        ingrediente: 'aguacate',
        cantidadTotal: 2,
        unidad: 'piezas',
        categoria: 'frutas',
        seccionSupermercado: 'verdulería',
        prioridad: 'alta',
        costoEstimado: 20.00,
        comprado: true,
        fechaCompra: new Date('2024-01-14'),
        recetasQueLoUsan: [
          {
            recetaId: new mongoose.Types.ObjectId(),
            nombreReceta: 'Tostadas con aguacate',
            cantidadNecesaria: 1
          }
        ]
      }
    ],
    resumen: {
      totalRecetas: 6,
      costoTotalEstimado: 74.25,
      costoPromedioDiario: 37.13,
      tiempoTotalPreparacion: 85,
      nutricionPromedioDiaria: {
        calorias: 1575,
        proteinas: 67.5,
        carbohidratos: 195,
        grasas: 53.5,
        fibra: 23.5,
        sodio: 1150
      },
      distribucionCategorias: {
        sopas: 0,
        platosFuertes: 4,
        guarniciones: 0,
        postres: 0
      }
    },
    vecesUsado: 1,
    ultimaActividad: new Date('2024-01-15'),
    calificacionGeneral: 4,
    comentariosGenerales: 'Plan perfecto para días ocupados',
    compartido: true,
    usuariosCompartidos: [
      {
        clienteId: new mongoose.Types.ObjectId(),
        permisos: 'lectura'
      }
    ]
  }
];

module.exports = sampleMealPlans; 