// Middleware de autorización por rol (sesión 9, apartado 2).
// Es una fábrica: exigirRol('admin') devuelve el middleware que comprueba.
//
// El rol se lee del usuario que el servidor ha cargado desde su fuente de
// usuarios, nunca de req.body, req.query ni de una cookie.
//  - Sin sesión: 303 al login (falta autenticación).
//  - Con sesión pero sin el rol: 403 (identidad válida sin permiso).

export function exigirRol(...rolesPermitidos) {
  return (req, res, next) => {
    const usuario = res.locals.usuarioActual;
    if (!usuario) {
      return res.redirect(303, '/login');
    }
    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).render('error', {
        mensaje: 'No tienes permiso para acceder a esta página.'
      });
    }
    return next();
  };
}
