// Pruebas de las funciones puras del dominio.
// No necesitan servidor, sesión ni Supertest: reciben datos y devuelven un
// resultado. Esa es la ventaja de tener las reglas fuera de los controladores.

import { describe, expect, it } from 'vitest';
import {
  estaReservado, obtenerEquiposDisponibles, validarReserva
} from '../src/domain/reservas.js';

const equipos = [
  { id: 1, codigo: 'PC-001', nombre: 'A', tipo: 'sobremesa', estado: 'operativo' },
  { id: 2, codigo: 'PORT-001', nombre: 'B', tipo: 'portatil', estado: 'operativo' },
  { id: 3, codigo: 'PC-002', nombre: 'C', tipo: 'sobremesa', estado: 'fuera_de_servicio' }
];

const reservas = [
  { id: 1, equipoId: 1, usuarioId: 2, fecha: '2027-01-15', turno: 'manana', estado: 'activa' },
  { id: 2, equipoId: 2, usuarioId: 2, fecha: '2027-01-15', turno: 'manana', estado: 'cancelada' }
];

describe('reglas de dominio', () => {
  it('estaReservado solo tiene en cuenta las reservas activas', () => {
    expect(estaReservado(1, '2027-01-15', 'manana', reservas)).toBe(true);
    // Mismo equipo y día, otro turno: libre.
    expect(estaReservado(1, '2027-01-15', 'tarde', reservas)).toBe(false);
    // La reserva del equipo 2 está cancelada: no bloquea.
    expect(estaReservado(2, '2027-01-15', 'manana', reservas)).toBe(false);
  });

  it('obtenerEquiposDisponibles excluye los reservados y los fuera de servicio', () => {
    const manana = obtenerEquiposDisponibles(equipos, reservas, '2027-01-15', 'manana');
    expect(manana.map((e) => e.id)).toEqual([2]);

    const tarde = obtenerEquiposDisponibles(equipos, reservas, '2027-01-15', 'tarde');
    expect(tarde.map((e) => e.id)).toEqual([1, 2]);
  });

  it('validarReserva señala cada campo incorrecto', () => {
    const hoy = '2027-01-10';

    const correcta = validarReserva(
      { equipoId: '1', fecha: '2027-01-15', turno: 'tarde' }, hoy
    );
    expect(Object.keys(correcta)).toEqual([]);

    const pasada = validarReserva(
      { equipoId: '1', fecha: '2027-01-09', turno: 'tarde' }, hoy
    );
    expect(Object.keys(pasada)).toEqual(['fecha']);

    const imposible = validarReserva(
      { equipoId: 'abc', fecha: '2027-02-30', turno: 'noche' }, hoy
    );
    expect(Object.keys(imposible).sort()).toEqual(['equipoId', 'fecha', 'turno']);
  });
});
