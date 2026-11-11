// Rutas de administración: reservadas al rol admin.
// Ocultar el enlace en el menú no protege nada; lo que protege es que TODAS
// estas rutas pasan por exigirRol('admin') en el servidor. Un usuario
// ordinario que conozca la URL o use curl recibe 403.

import { Router } from 'express';
import { exigirAutenticacion } from '../middlewares/exigirAutenticacion.js';
import { exigirRol } from '../middlewares/exigirRol.js';
import { comprobarCsrf } from '../middlewares/csrf.js';

export function crearRutasAdmin(controlador) {
  const router = Router();
  const soloAdmin = exigirRol('admin');

  router.get('/admin/equipos', exigirAutenticacion, soloAdmin,
    controlador.listarEquipos);
  router.post('/admin/equipos', exigirAutenticacion, soloAdmin, comprobarCsrf,
    controlador.crearEquipo);
  router.post('/admin/equipos/:id/estado', exigirAutenticacion, soloAdmin,
    comprobarCsrf, controlador.cambiarEstado);

  router.get('/admin/reservas', exigirAutenticacion, soloAdmin,
    controlador.listarReservas);
  router.post('/admin/reservas/:id/cancelar', exigirAutenticacion, soloAdmin,
    comprobarCsrf, controlador.cancelarReserva);

  return router;
}
