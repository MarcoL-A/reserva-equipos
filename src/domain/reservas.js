// Reglas puras sobre reservas. Aquí no hay req, res, sesión ni repositorios:
// son funciones que reciben datos y devuelven un resultado. Por eso se pueden
// probar con arrays sencillos, sin arrancar el servidor (tests/dominio.test.js).

export const TURNOS = ['manana', 'tarde'];

// Fecha de hoy en formato "AAAA-MM-DD" (hora local del servidor).
// Con ese formato, comparar dos fechas como texto equivale a compararlas
// en el calendario: "2027-01-15" < "2027-02-01".
export function fechaDeHoy() {
  const ahora = new Date();
  const anio = String(ahora.getFullYear());
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Comprueba la forma "AAAA-MM-DD" y que el día exista de verdad.
// Date "corrige" fechas imposibles (30 de febrero pasa a ser 2 de marzo),
// así que se construye la fecha y se mira si conserva los mismos valores.
export function esFechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
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

// ¿Existe una reserva ACTIVA de ese equipo para esa fecha y turno?
// Las canceladas no cuentan: por eso un turno cancelado vuelve a quedar libre.
export function estaReservado(equipoId, fecha, turno, reservas) {
  return reservas.some((r) => r.equipoId === equipoId
    && r.fecha === fecha
    && r.turno === turno
    && r.estado === 'activa');
}

// Equipos que se pueden reservar en una fecha y turno: tienen que estar
// operativos Y no tener ya una reserva activa en ese hueco.
export function obtenerEquiposDisponibles(equipos, reservas, fecha, turno) {
  return equipos.filter((e) => e.estado === 'operativo'
    && !estaReservado(e.id, fecha, turno, reservas));
}

// Valida la fecha y el turno. Devuelve un objeto con un mensaje por cada campo
// incorrecto; si está vacío, todo es válido.
// "hoy" es un parámetro para poder probar la función con una fecha fija.
export function validarFechaYTurno(datos, hoy = fechaDeHoy()) {
  const errores = {};

  if (!esFechaValida(datos.fecha)) {
    errores.fecha = 'La fecha no es válida.';
  } else if (datos.fecha < hoy) {
    errores.fecha = 'La fecha no puede ser anterior al día de hoy.';
  }

  if (!TURNOS.includes(datos.turno)) {
    errores.turno = 'El turno debe ser mañana o tarde.';
  }

  return errores;
}

// Valida los tres datos de una reserva: equipo, fecha y turno.
// Solo comprueba la FORMA del identificador; que ese equipo exista y esté
// libre lo comprueba el servicio consultando los repositorios.
export function validarReserva(datos, hoy = fechaDeHoy()) {
  const errores = validarFechaYTurno(datos, hoy);

  const equipoTexto = String(datos.equipoId ?? '');
  if (!/^[1-9]\d*$/.test(equipoTexto)
      || !Number.isSafeInteger(Number(equipoTexto))) {
    errores.equipoId = 'Selecciona un equipo válido.';
  }

  return errores;
}

// Regla de cancelación, usada para decidir si se muestra el botón "Cancelar".
// (El servicio vuelve a comprobarlo todo al recibir el POST.)
//  - Solo se cancelan reservas activas.
//  - El administrador puede cancelar cualquiera.
//  - Un usuario, solo las suyas y si la fecha todavía no ha pasado.
export function puedeCancelar(reserva, usuario, hoy = fechaDeHoy()) {
  if (reserva.estado !== 'activa') return false;
  if (usuario.rol === 'admin') return true;
  return reserva.usuarioId === usuario.id && reserva.fecha >= hoy;
}
