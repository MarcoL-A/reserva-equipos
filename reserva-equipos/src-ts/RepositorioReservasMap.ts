// Clase que implementa el contrato RepositorioReservas guardando los datos
// en un Map (id -> reserva).
//
// "implements" hace que el compilador compruebe que la clase ofrece todas las
// operaciones del contrato con los tipos correctos; no las escribe por nosotros.

import type { NuevaReserva, Reserva } from "./tipos.js";
import type { RepositorioReservas } from "./RepositorioReservas.js";

export class RepositorioReservasMap implements RepositorioReservas {
  // private: el resto del código no puede tocar el Map directamente, solo
  // usar listar, buscarPorId, crear y guardar (encapsulación).
  private readonly datos: Map<number, Reserva>;
  private siguienteId: number;

  constructor(iniciales: Reserva[] = []) {
    this.datos = new Map(iniciales.map((r) => [r.id, { ...r }]));

    this.siguienteId = 1;
    for (const id of this.datos.keys()) {
      if (id >= this.siguienteId) this.siguienteId = id + 1;
    }
  }

  // Se devuelven copias para que nadie modifique el almacén sin pasar
  // por guardar().
  async listar(): Promise<Reserva[]> {
    return [...this.datos.values()].map((r) => ({ ...r }));
  }

  async buscarPorId(id: number): Promise<Reserva | undefined> {
    const reserva = this.datos.get(id);
    return reserva ? { ...reserva } : undefined;
  }

  async crear(datos: NuevaReserva): Promise<Reserva> {
    const reserva: Reserva = { ...datos, id: this.siguienteId };
    this.siguienteId += 1;
    this.datos.set(reserva.id, reserva);
    return { ...reserva };
  }

  async guardar(reserva: Reserva): Promise<void> {
    if (!this.datos.has(reserva.id)) {
      throw new Error("No existe el registro que actualizar");
    }
    this.datos.set(reserva.id, { ...reserva });
  }
}
