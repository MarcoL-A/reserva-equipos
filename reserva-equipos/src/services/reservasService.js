// Servicio de reservas: aquí viven las reglas de disponibilidad, conflictos
// y cancelaciones. No depende de req, res ni EJS, y lanza errores de dominio
// (no sabe qué es un 409: eso lo traduce la capa HTTP).

import { ErrorDominio } from '../domain/errores.js';
import {
  estaReservado, fechaDeHoy, obtenerEquiposDisponibles, puedeCancelar,
  validarFechaYTurno, validarReserva
} from '../domain/reservas.js';

export function crearServicioReservas(repoReservas, repoEquipos, repoUsuarios) {
  // Añade a cada reserva el nombre del equipo y del usuario para poder
  // mostrarla. Del usuario solo sale el nombre: nunca el hash.
  async function conDetalles(reservas, usuarioActual) {
    const equipos = await repoEquipos.listar();
    const usuarios = await repoUsuarios.listar();

    return reservas.map((r) => {
      const equipo = equipos.find((e) => e.id === r.equipoId);
      const usuario = usuarios.find((u) => u.id === r.usuarioId);
      return {
        ...r,
        equipoCodigo: equipo ? equipo.codigo : '—',
        equipoNombre: equipo ? equipo.nombre : 'Equipo no encontrado',
        usuarioNombre: usuario ? usuario.nombre : 'Usuario no encontrado',
        cancelable: puedeCancelar(r, usuarioActual)
      };
    });
  }

  return {
    // Equipos que se pueden ofrecer en el formulario para una fecha y turno.
    async equiposDisponibles(fecha, turno) {
      const errores = validarFechaYTurno({ fecha, turno });
      if (Object.keys(errores).length > 0) {
        throw new ErrorDominio('DATOS_INVALIDOS',
          'La fecha o el turno no son válidos.');
      }
      const equipos = await repoEquipos.listar();
      const reservas = await repoReservas.listar();
      return obtenerEquiposDisponibles(equipos, reservas, fecha, turno);
    },

    // Crea una reserva. "usuario" es el usuario de la sesión, cargado por el
    // servidor; "datos" = { equipoId, fecha, turno } tal como llegan.
    //
    // Se repiten TODAS las comprobaciones aunque el formulario solo ofrezca
    // opciones válidas: el cliente puede manipular el HTML o usar curl, y
    // entre mostrar el formulario y enviarlo otra persona ha podido reservar.
    async crear(usuario, datos) {
      const errores = validarReserva(datos);
      if (Object.keys(errores).length > 0) {
        throw new ErrorDominio('DATOS_INVALIDOS',
          'Los datos de la reserva no son válidos.');
      }

      const equipoId = Number(datos.equipoId);
      const equipo = await repoEquipos.buscarPorId(equipoId);
      if (!equipo) {
        throw new ErrorDominio('NO_ENCONTRADO', 'El equipo no existe.');
      }
      if (equipo.estado !== 'operativo') {
        throw new ErrorDominio('CONFLICTO',
          'El equipo está fuera de servicio.');
      }

      const reservas = await repoReservas.listar();
      if (estaReservado(equipoId, datos.fecha, datos.turno, reservas)) {
        throw new ErrorDominio('CONFLICTO',
          'El equipo ya está reservado para esa fecha y turno.');
      }

      return repoReservas.crear({
        equipoId,
        // La identidad sale de la sesión, nunca de un campo del formulario.
        usuarioId: usuario.id,
        fecha: datos.fecha,
        turno: datos.turno,
        estado: 'activa'
      });
    },

    // Reservas del propio usuario, activas y canceladas.
    async listarDeUsuario(usuario) {
      const reservas = await repoReservas.listar();
      const propias = reservas.filter((r) => r.usuarioId === usuario.id);
      return conDetalles(propias, usuario);
    },

    // Todas las reservas (panel de administración).
    async listarTodas(usuario) {
      const reservas = await repoReservas.listar();
      return conDetalles(reservas, usuario);
    },

    // Huecos ya ocupados de un equipo desde hoy (para su ficha). Solo fecha
    // y turno: no se revela quién ha hecho cada reserva.
    async turnosOcupados(equipoId) {
      const hoy = fechaDeHoy();
      const reservas = await repoReservas.listar();
      return reservas
        .filter((r) => r.equipoId === equipoId
          && r.estado === 'activa'
          && r.fecha >= hoy)
        .map((r) => ({ fecha: r.fecha, turno: r.turno }));
    },

    // Cancela una reserva en nombre de "usuario".
    // El orden importa: primero existencia (404), después propiedad (403) y
    // por último el estado de la reserva (409).
    async cancelar(reservaId, usuario) {
      const reserva = await repoReservas.buscarPorId(reservaId);
      if (!reserva) {
        throw new ErrorDominio('NO_ENCONTRADO', 'La reserva no existe.');
      }

      // Comprobación de propiedad: da igual que el usuario cambie el id de
      // la URL, se compara el dueño de la reserva con el usuario de la sesión.
      const esAdmin = usuario.rol === 'admin';
      if (!esAdmin && reserva.usuarioId !== usuario.id) {
        throw new ErrorDominio('SIN_PERMISO',
          'No puedes cancelar una reserva de otro usuario.');
      }

      if (reserva.estado !== 'activa') {
        throw new ErrorDominio('CONFLICTO',
          'La reserva ya estaba cancelada.');
      }
      if (!esAdmin && reserva.fecha < fechaDeHoy()) {
        throw new ErrorDominio('CONFLICTO',
          'No se puede cancelar una reserva cuya fecha ya ha pasado.');
      }

      // No se borra: se guarda la misma reserva con el estado cambiado.
      const cancelada = { ...reserva, estado: 'cancelada' };
      await repoReservas.guardar(cancelada);
      return cancelada;
    }
  };
}
