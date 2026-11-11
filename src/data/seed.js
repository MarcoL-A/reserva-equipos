// Datos iniciales de prueba. Solo datos: nadie los modifica directamente,
// los repositorios hacen su propia copia al crearse.
//
// Los hashes se calculan al arrancar (como en la sesión 8) para no guardar
// ninguna contraseña real. Las claves de abajo son de cuentas de prueba y
// están documentadas en el README.

import bcrypt from 'bcrypt';

const COSTE_BCRYPT = 12;

export const semilla = {
  equipos: [
    {
      id: 1,
      codigo: 'PC-001',
      nombre: 'Ordenador aula 1',
      tipo: 'sobremesa',
      estado: 'operativo'
    },
    {
      id: 2,
      codigo: 'PORT-001',
      nombre: 'Portátil Lenovo',
      tipo: 'portatil',
      estado: 'operativo'
    },
    {
      id: 3,
      codigo: 'PC-002',
      nombre: 'Ordenador aula 2',
      tipo: 'sobremesa',
      estado: 'fuera_de_servicio'
    }
  ],

  usuarios: [
    {
      id: 1,
      nombre: 'Administrador',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('Admin1234', COSTE_BCRYPT),
      rol: 'admin'
    },
    {
      id: 2,
      nombre: 'Ana García',
      email: 'ana@example.com',
      passwordHash: await bcrypt.hash('Ana12345', COSTE_BCRYPT),
      rol: 'usuario'
    },
    {
      id: 3,
      nombre: 'Luis Pérez',
      email: 'luis@example.com',
      passwordHash: await bcrypt.hash('Luis1234', COSTE_BCRYPT),
      rol: 'usuario'
    }
  ],

  reservas: [
    // Activa y futura: Ana puede cancelarla.
    {
      id: 1,
      equipoId: 1,
      usuarioId: 2,
      fecha: '2027-01-15',
      turno: 'manana',
      estado: 'activa'
    },
    // Mismo día que la anterior pero otro equipo y otro turno.
    {
      id: 2,
      equipoId: 2,
      usuarioId: 3,
      fecha: '2027-01-15',
      turno: 'tarde',
      estado: 'activa'
    },
    // Cancelada: no bloquea el equipo 1 ese día por la tarde.
    {
      id: 3,
      equipoId: 1,
      usuarioId: 2,
      fecha: '2027-01-20',
      turno: 'tarde',
      estado: 'cancelada'
    },
    // Activa pero con la fecha ya pasada: Ana no puede cancelarla, el admin sí.
    {
      id: 4,
      equipoId: 2,
      usuarioId: 2,
      fecha: '2026-10-05',
      turno: 'manana',
      estado: 'activa'
    }
  ]
};
