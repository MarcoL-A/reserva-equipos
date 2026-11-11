// Junta todos los routers en uno solo. Sirve como mapa de la aplicación.

import { Router } from 'express';
import { crearRutasAuth } from './auth.routes.js';
import { crearRutasEquipos } from './equipos.routes.js';
import { crearRutasReservas } from './reservas.routes.js';
import { crearRutasAdmin } from './admin.routes.js';

export function crearRutas(controladores) {
  const router = Router();

  // La portada es el catálogo.
  router.get('/', (req, res) => res.redirect(303, '/equipos'));

  router.use(crearRutasAuth(controladores.auth));
  router.use(crearRutasEquipos(controladores.equipos));
  router.use(crearRutasReservas(controladores.reservas));
  router.use(crearRutasAdmin(controladores.admin));

  return router;
}
