// Tratamiento centralizado de errores (sesión 10, apartado 6).
// Los cuatro parámetros identifican a esta función como middleware de errores.
// Aquí llegan todos los next(err) de controladores y middlewares.
//
//  - Error de dominio conocido: se responde con su código HTTP y su mensaje,
//    que está pensado para enseñarse al usuario.
//  - Cualquier otro error: 500 con un mensaje genérico. El detalle se queda
//    en la consola del servidor; al navegador nunca llegan trazas, rutas del
//    sistema, secretos ni hashes.

import { ErrorDominio } from '../domain/errores.js';
import { estadosHttp } from '../http/estadosHttp.js';

export function tratarError(err, req, res, next) {
  // Si ya se ha empezado a responder no se puede enviar otra respuesta.
  if (res.headersSent) return next(err);

  if (err instanceof ErrorDominio && estadosHttp[err.codigo]) {
    return res.status(estadosHttp[err.codigo]).render('error', {
      mensaje: err.message
    });
  }

  console.error('Fallo interno al procesar una petición:', err);
  return res.status(500).render('error', {
    mensaje: 'No se ha podido completar la operación.'
  });
}
