// Protección CSRF con un token vinculado a la sesión (sesión 9, apartado 7).
//
// El problema: el navegador adjunta la cookie de sesión automáticamente, así
// que otra web podría hacer que un usuario autenticado enviara un POST sin
// querer. La defensa: cada formulario lleva un valor secreto e impredecible
// que solo conocen el servidor y las páginas que él mismo genera.

import crypto from 'node:crypto';

// Crea (una vez por sesión) el token y lo deja en res.locals para que las
// vistas lo pongan en un campo oculto. Solo para usuarios autenticados: son
// sus formularios los que se protegen y así no se crea una sesión a cada
// visitante anónimo.
export function prepararCsrf(req, res, next) {
  if (!res.locals.usuarioActual) {
    res.locals.csrfToken = '';
    return next();
  }
  req.session.csrfToken ??= crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  return next();
}

// Se coloca en las rutas POST que modifican estado. Compara el token de la
// sesión con el campo _csrf recibido. timingSafeEqual compara sin revelar,
// por el tiempo que tarda, cuántos caracteres coinciden.
export function comprobarCsrf(req, res, next) {
  const esperado = String(req.session.csrfToken ?? '');
  const recibido = String(req.body?._csrf ?? '');
  const a = Buffer.from(esperado);
  const b = Buffer.from(recibido);

  if (a.length === 0 || a.length !== b.length
      || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).render('error', {
      mensaje: 'Petición no permitida: el token de seguridad no es válido.'
    });
  }
  return next();
}
