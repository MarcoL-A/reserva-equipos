// Mensajes de confirmación de un solo uso ("flash", sesión 10, apartado 7).
//
// Tras un POST correcto el controlador guarda un texto en req.session.aviso
// y redirige. El aviso tiene que sobrevivir a esa redirección, por eso va en
// la sesión. En el siguiente GET se copia a res.locals (para la vista) y se
// borra de la sesión: si se recarga la página, ya no vuelve a aparecer.
//
// Solo se consume en peticiones GET, que son las que muestran páginas.

export function cargarAviso(req, res, next) {
  res.locals.aviso = null;
  if (req.method === 'GET' && req.session.aviso) {
    res.locals.aviso = req.session.aviso;
    delete req.session.aviso;
  }
  return next();
}
