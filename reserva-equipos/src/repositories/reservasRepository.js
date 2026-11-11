// Repositorio de reservas en memoria. Mismo contrato que el de equipos:
// listar, buscarPorId, crear y guardar, siempre devolviendo copias.
//
// Aquí NO hay reglas: el repositorio no sabe qué es un conflicto de turno ni
// quién puede cancelar. Eso lo decide el servicio.

export function crearRepositorioReservas(iniciales = []) {
  const datos = new Map(iniciales.map((r) => [r.id, { ...r }]));

  let siguienteId = 1;
  for (const id of datos.keys()) {
    if (id >= siguienteId) siguienteId = id + 1;
  }

  return {
    async listar() {
      return [...datos.values()].map((r) => ({ ...r }));
    },

    async buscarPorId(id) {
      const reserva = datos.get(id);
      return reserva ? { ...reserva } : undefined;
    },

    async crear(nueva) {
      const reserva = { ...nueva, id: siguienteId };
      siguienteId += 1;
      datos.set(reserva.id, reserva);
      return { ...reserva };
    },

    // Cancelar una reserva es guardar la misma reserva con otro estado:
    // el registro nunca se elimina de la colección.
    async guardar(reserva) {
      if (!datos.has(reserva.id)) {
        throw new Error('No existe el registro que actualizar');
      }
      datos.set(reserva.id, { ...reserva });
    }
  };
}
