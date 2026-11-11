// Normalización y validación de los datos de registro y de acceso
// (sesiones 8 y 9), y el modelo "público" de un usuario.

// Solo se leen nombre, email y password. Aunque el cliente envíe rol=admin,
// ese campo se ignora: el rol lo asigna siempre el servidor.
export function normalizarRegistro(body = {}) {
  return {
    nombre: String(body.nombre ?? '').trim(),
    email: String(body.email ?? '').trim().toLowerCase(),
    password: String(body.password ?? '')
  };
}

export function validarRegistro(valores) {
  const errores = {};

  if (valores.nombre.length < 2 || valores.nombre.length > 80) {
    errores.nombre = 'El nombre debe tener entre 2 y 80 caracteres.';
  }
  if (valores.email.length > 254
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)) {
    errores.email = 'El correo electrónico no es válido.';
  }
  if (valores.password.length < 8 || valores.password.length > 200) {
    errores.password = 'La contraseña debe tener entre 8 y 200 caracteres.';
  }

  return errores;
}

export function normalizarLogin(body = {}) {
  return {
    email: String(body.email ?? '').trim().toLowerCase(),
    password: String(body.password ?? '')
  };
}

// Devuelve null si los datos tienen una forma aceptable. El mensaje es siempre
// el mismo para no dar pistas sobre qué parte de las credenciales ha fallado.
export function validarLogin(valores) {
  if (!valores.email || !valores.password) {
    return 'Credenciales no válidas';
  }
  if (valores.email.length > 254 || valores.password.length > 200) {
    return 'Credenciales no válidas';
  }
  return null;
}

// Lo único de un usuario que puede salir de la capa de servicios.
// El passwordHash se queda fuera: así es imposible que acabe en una vista.
export function aUsuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol
  };
}
