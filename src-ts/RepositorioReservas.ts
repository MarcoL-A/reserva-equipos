// El CONTRATO del repositorio: qué operaciones ofrece, qué recibe y qué
// devuelve cada una. No contiene implementación.
//
// El servicio depende de esta interfaz, no de una clase concreta. Cualquier
// objeto que cumpla esta forma le sirve: hoy un Map, mañana una base de datos.

import type { NuevaReserva, Reserva } from "./tipos.js";

export interface RepositorioReservas {
  // Promesa de un array de copias; puede estar vacío.
  listar(): Promise<Reserva[]>;
  // Promise<Reserva | undefined> obliga a comprobar la ausencia tras el await.
  buscarPorId(id: number): Promise<Reserva | undefined>;
  // Inserta la reserva, le asigna un id y la devuelve ya completa.
  crear(datos: NuevaReserva): Promise<Reserva>;
  // Actualiza una reserva existente; no devuelve ningún valor útil.
  guardar(reserva: Reserva): Promise<void>;
}
