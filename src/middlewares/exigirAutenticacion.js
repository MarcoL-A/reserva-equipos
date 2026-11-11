// Middleware reutilizable de autenticación (sesión 9, apartado 1).
// Debe ejecutarse DESPUÉS de express-session y de cargarUsuarioActual:
// si se colocara antes, todas las peticiones parecerían anónimas.
//
// En páginas HTML, al visitante anónimo se le redirige al login con 303.

export function exigirAutenticacion(req, res, next) {
  if (!res.locals.usuarioActual) {
    return res.redirect(303, '/login');
  }
  return next();
}
