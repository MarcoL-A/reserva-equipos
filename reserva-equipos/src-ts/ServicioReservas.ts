// Servicio tipado de reservas: las mismas reglas que
// src/services/reservasService.js, con tipos explícitos en los métodos
// públicos y en sus valores de retorno.
//
// INYECCIÓN DE DEPENDENCIAS: el servicio no hace "new RepositorioReservasMap()"
// por dentro. Recibe en el constructor un objeto que cumple el contrato
// RepositorioReservas. Quien lo construye decide la implementación, y una
// prueba puede entregarle un repositorio con sus propios datos.

import type { Equipo, Reserva, Turno, Usuario } from "./tipos.js";
import type { RepositorioReservas } from "./RepositorioReservas.js";
import { ErrorDominio } from "./ErrorDominio.js";
import {
  esFechaValida, estaReservado, fechaDeHoy, obtenerEquiposDisponibles
} from "./reglas.js";

export class ServicioReservas {
  private readonly repo: RepositorioReservas;

  constructor(repo: RepositorioReservas) {
    this.repo = repo;
  }

  // De una lista de equipos, los que se pueden reservar en esa fecha y turno.
  async equiposDisponibles(
    equipos: Equipo[], fecha: string, turno: Turno
  ): Promise<Equipo[]> {
    const reservas = await this.repo.listar();
    return obtenerEquiposDisponibles(equipos, reservas, fecha, turno);
  }

  // "hoy" es un parámetro con valor por defecto para poder hacer
  // demostraciones y pruebas con una fecha fija.
  async reservar(
    equipo: Equipo, usuario: Usuario, fecha: string, turno: Turno,
    hoy: string = fechaDeHoy()
  ): Promise<Reserva> {
    if (!esFechaValida(fecha) || fecha < hoy) {
      throw new ErrorDominio("DATOS_INVALIDOS",
        "La fecha no es válida o es anterior al día de hoy.");
    }
    if (equipo.estado !== "operativo") {
      throw new ErrorDominio("CONFLICTO",
        "El equipo está fuera de servicio.");
    }

    const reservas = await this.repo.listar();
    if (estaReservado(equipo.id, fecha, turno, reservas)) {
      throw new ErrorDominio("CONFLICTO",
        "El equipo ya está reservado para esa fecha y turno.");
    }

    return this.repo.crear({
      equipoId: equipo.id,
      usuarioId: usuario.id,
      fecha,
      turno,
      estado: "activa"
    });
  }

  async reservasDe(usuario: Usuario): Promise<Reserva[]> {
    const reservas = await this.repo.listar();
    return reservas.filter((r) => r.usuarioId === usuario.id);
  }

  async cancelar(
    reservaId: number, usuario: Usuario, hoy: string = fechaDeHoy()
  ): Promise<Reserva> {
    const reserva = await this.repo.buscarPorId(reservaId);
    // Con strict, el compilador no deja usar "reserva" sin comprobar antes
    // que no es undefined.
    if (!reserva) {
      throw new ErrorDominio("NO_ENCONTRADO", "La reserva no existe.");
    }

    const esAdmin = usuario.rol === "admin";
    if (!esAdmin && reserva.usuarioId !== usuario.id) {
      throw new ErrorDominio("SIN_PERMISO",
        "No puedes cancelar una reserva de otro usuario.");
    }
    if (reserva.estado !== "activa") {
      throw new ErrorDominio("CONFLICTO", "La reserva ya estaba cancelada.");
    }
    if (!esAdmin && reserva.fecha < hoy) {
      throw new ErrorDominio("CONFLICTO",
        "No se puede cancelar una reserva cuya fecha ya ha pasado.");
    }

    const cancelada: Reserva = { ...reserva, estado: "cancelada" };
    await this.repo.guardar(cancelada);
    return cancelada;
  }
}
