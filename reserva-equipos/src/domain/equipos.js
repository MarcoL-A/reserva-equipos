// Valores admitidos y validación de los datos de un equipo.

export const TIPOS_EQUIPO = ['sobremesa', 'portatil'];
export const ESTADOS_EQUIPO = ['operativo', 'fuera_de_servicio'];

// Toma del formulario SOLO los campos esperados y los limpia.
// Nunca se copia el body completo: el cliente podría añadir propiedades
// no previstas (por ejemplo, un id o un estado).
export function normalizarEquipo(body = {}) {
  return {
    codigo: String(body.codigo ?? '').trim().toUpperCase(),
    nombre: String(body.nombre ?? '').trim(),
    tipo: String(body.tipo ?? '').trim()
  };
}

// Devuelve un objeto con un mensaje por cada campo incorrecto.
export function validarEquipo(valores) {
  const errores = {};

  if (!/^[A-Z0-9-]{3,20}$/.test(valores.codigo)) {
    errores.codigo = 'El código debe tener entre 3 y 20 caracteres: letras, números o guiones.';
  }
  if (valores.nombre.length < 2 || valores.nombre.length > 80) {
    errores.nombre = 'El nombre debe tener entre 2 y 80 caracteres.';
  }
  if (!TIPOS_EQUIPO.includes(valores.tipo)) {
    errores.tipo = 'El tipo debe ser sobremesa o portátil.';
  }

  return errores;
}
