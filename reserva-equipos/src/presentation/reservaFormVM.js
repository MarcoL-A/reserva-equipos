// Modelo de vista del formulario de reservas (sesión 11, apartado 1.3).
//
// Un modelo de vista es un objeto preparado para UNA pantalla: reúne las
// opciones, los valores escritos, los mensajes y las banderas que necesita
// esa página. No es un modelo del dominio (Equipo, Reserva) y no contiene
// nada sensible: ni el usuario completo, ni la sesión, ni ningún hash.
//
// Parámetros:
//   equipos     equipos disponibles que ha decidido el servicio
//   valores     lo que envió el usuario, como texto: { fecha, turno, equipoId }
//   errores     objeto { campo: mensaje } con los campos incorrectos
//   consultado  true si ya se ha buscado disponibilidad para fecha y turno
//   hoy         fecha mínima que admite el campo de fecha

import { TURNOS } from '../domain/reservas.js';
import { etiquetaEquipo, etiquetaTurno, formatearFecha } from './helpers.js';

export function crearReservaFormVM({
  equipos = [], valores = {}, errores = {}, consultado = false, hoy
}) {
  // Conservación de valores: se mantiene lo que era correcto y se vacía
  // el campo que tiene un error, para que el usuario solo corrija ese.
  const conservados = {
    fecha: errores.fecha ? '' : (valores.fecha ?? ''),
    turno: errores.turno ? '' : (valores.turno ?? ''),
    equipoId: errores.equipoId ? '' : (valores.equipoId ?? '')
  };

  // Los value de un <option> son texto, igual que lo que envía el formulario:
  // así la vista compara cadenas con cadenas sin conversiones repartidas.
  const opcionesEquipo = equipos.map((e) => ({
    valor: String(e.id),
    texto: etiquetaEquipo(e)
  }));

  // Un equipo enviado que ya no está entre las opciones no se conserva
  // como si siguiera siendo una opción válida.
  if (!opcionesEquipo.some((o) => o.valor === conservados.equipoId)) {
    conservados.equipoId = '';
  }

  return {
    titulo: 'Nueva reserva',
    hoy,
    turnos: TURNOS.map((t) => ({ valor: t, texto: etiquetaTurno(t) })),
    equipos: opcionesEquipo,
    consultado,
    // Ayuda de interfaz, no una autorización: el POST se valida igualmente.
    puedeEnviar: consultado && opcionesEquipo.length > 0,
    fechaTexto: formatearFecha(conservados.fecha),
    turnoTexto: etiquetaTurno(conservados.turno),
    valores: conservados,
    errores: Object.values(errores)
  };
}
