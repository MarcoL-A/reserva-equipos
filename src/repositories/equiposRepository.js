// Repositorio de equipos en memoria (sesión 10, apartado 4.4).
// Solo guarda y recupera registros: no conoce roles, HTTP ni vistas.
//
// - Devuelve COPIAS ({ ...equipo }) para que quien recibe un equipo no pueda
//   modificar el almacén por accidente: los cambios pasan siempre por guardar().
// - Los métodos son async aunque Map sea síncrono: así el servicio ya usa await
//   y no habría que tocarlo si mañana los datos estuvieran en una base de datos.

export function crearRepositorioEquipos(iniciales = []) {
  const datos = new Map(iniciales.map((e) => [e.id, { ...e }]));

  // El siguiente id libre es el mayor id inicial más uno.
  let siguienteId = 1;
  for (const id of datos.keys()) {
    if (id >= siguienteId) siguienteId = id + 1;
  }

  return {
    async listar() {
      return [...datos.values()].map((e) => ({ ...e }));
    },

    // Devuelve una copia o undefined si no existe.
    async buscarPorId(id) {
      const equipo = datos.get(id);
      return equipo ? { ...equipo } : undefined;
    },

    // Inserta un registro nuevo. El id lo decide el repositorio, no quien llama.
    async crear(nuevo) {
      const equipo = { ...nuevo, id: siguienteId };
      siguienteId += 1;
      datos.set(equipo.id, equipo);
      return { ...equipo };
    },

    // Actualiza un registro existente; no crea uno nuevo.
    async guardar(equipo) {
      if (!datos.has(equipo.id)) {
        throw new Error('No existe el registro que actualizar');
      }
      datos.set(equipo.id, { ...equipo });
    }
  };
}
