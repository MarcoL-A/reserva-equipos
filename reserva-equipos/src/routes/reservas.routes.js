// Rutas de reservas: todas exigen sesión. Los POST exigen además token CSRF.
// Orden: 1) ¿hay usuario?  2) ¿el token es correcto?  3) controlador.

import { Router } from 'express';
import { exigirAutenticacion } from '../middlewares/exigirAutenticacion.js';
import { comprobarCsrf } from '../middlewares/csrf.js';

export function crearRutasReservas(controlador) {
  const router = Router();

  router.get('/reservas/nueva', exigirAutenticacion,
    controlador.mostrarFormulario);
  router.post('/reservas', exigirAutenticacion, comprobarCsrf,
    controlador.crear);

  router.get('/mis-reservas', exigirAutenticacion, controlador.misReservas);
  router.post('/reservas/:id/cancelar', exigirAutenticacion, comprobarCsrf,
    controlador.cancelar);

  return router;
}
