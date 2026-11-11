// Convierte registros del dominio en objetos listos para pintar una fila de
// una tabla. Las vistas reciben textos ya preparados y alguna bandera
// (operativo, cancelable); no reciben el registro completo ni hacen cálculos.

import {
  etiquetaEstadoEquipo, etiquetaEstadoReserva, etiquetaTipo, etiquetaTurno,
  formatearFecha
} from './helpers.js';

export function filaEquipo(equipo) {
  return {
    id: equipo.id,
    codigo: equipo.codigo,
    nombre: equipo.nombre,
    tipo: etiquetaTipo(equipo.tipo),
    estado: etiquetaEstadoEquipo(equipo.estado),
    operativo: equipo.estado === 'operativo'
  };
}

// "reserva" viene del servicio con equipoCodigo, equipoNombre, usuarioNombre
// y cancelable ya calculados.
export function filaReserva(reserva) {
  return {
    id: reserva.id,
    equipo: `${reserva.equipoCodigo} · ${reserva.equipoNombre}`,
    usuario: reserva.usuarioNombre,
    fecha: formatearFecha(reserva.fecha),
    turno: etiquetaTurno(reserva.turno),
    estado: etiquetaEstadoReserva(reserva.estado),
    activa: reserva.estado === 'activa',
    cancelable: reserva.cancelable
  };
}

export function filaTurnoOcupado(hueco) {
  return {
    fecha: formatearFecha(hueco.fecha),
    turno: etiquetaTurno(hueco.turno)
  };
}
