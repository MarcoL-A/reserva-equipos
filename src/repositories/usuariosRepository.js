// Repositorio de usuarios en memoria.
// Es el único sitio desde el que se llega al passwordHash. El servicio de
// autenticación lo usa para comparar y nunca lo deja salir hacia las vistas.

export function crearRepositorioUsuarios(iniciales = []) {
  const datos = new Map(iniciales.map((u) => [u.id, { ...u }]));

  let siguienteId = 1;
  for (const id of datos.keys()) {
    if (id >= siguienteId) siguienteId = id + 1;
  }

  return {
    async listar() {
      return [...datos.values()].map((u) => ({ ...u }));
    },

    async buscarPorId(id) {
      const usuario = datos.get(id);
      return usuario ? { ...usuario } : undefined;
    },

    // El correo llega ya normalizado (sin espacios y en minúsculas).
    async buscarPorEmail(email) {
      const usuario = [...datos.values()].find((u) => u.email === email);
      return usuario ? { ...usuario } : undefined;
    },

    async crear(nuevo) {
      const usuario = { ...nuevo, id: siguienteId };
      siguienteId += 1;
      datos.set(usuario.id, usuario);
      return { ...usuario };
    }
  };
}
