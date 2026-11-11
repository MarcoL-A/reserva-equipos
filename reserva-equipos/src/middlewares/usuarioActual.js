// Carga el usuario de la sesión en cada petición (sesión 8, apartado 8).
//
// En la sesión solo está guardado usuarioId. Con ese id se consulta la fuente
// de usuarios para tener el nombre y el ROL actuales. Así:
//  - el rol nunca sale de una cookie ni de nada que controle el cliente;
//  - si el usuario dejara de existir, la sesión deja de valer.
//
// res.locals vive solo durante esta petición y además es visible desde las
// vistas: por eso la cabecera puede mostrar el nombre del usuario.

export function crearCargarUsuarioActual(servicioAuth) {
  return async function cargarUsuarioActual(req, res, next) {
    try {
      const usuarioId = req.session.usuarioId;
      res.locals.usuarioActual = usuarioId
        ? await servicioAuth.buscarPorId(usuarioId)
        : null;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
