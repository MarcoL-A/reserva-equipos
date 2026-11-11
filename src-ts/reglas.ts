// Versión tipada de las reglas puras de src/domain/reservas.js.

import type { Equipo, Reserva, Turno } from "./tipos.js";

export function fechaDeHoy(): string {
  const ahora = new Date();
  const anio = String(ahora.getFullYear());
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(5, 7));
  const dia = Number(fecha.slice(8, 10));
  const real = new Date(anio, mes - 1, dia);
  return real.getFullYear() === anio
    && real.getMonth() === mes - 1
    && real.getDate() === dia;
}

export function estaReservado(
  equipoId: number, fecha: string, turno: Turno, reservas: Reserva[]
): boolean {
  return reservas.some((r) => r.equipoId === equipoId
    && r.fecha === fecha
    && r.turno === turno
    && r.estado === "activa");
}

export function obtenerEquiposDisponibles(
  equipos: Equipo[], reservas: Reserva[], fecha: string, turno: Turno
): Equipo[] {
  return equipos.filter((e) => e.estado === "operativo"
    && !estaReservado(e.id, fecha, turno, reservas));
}
