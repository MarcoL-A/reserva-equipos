// Rutas públicas del catálogo: las puede usar un visitante sin sesión.

import { Router } from 'express';

export function crearRutasEquipos(controlador) {
  const router = Router();

  router.get('/equipos', controlador.listar);
  router.get('/equipos/:id', controlador.detalle);

  // Cookie de preferencias. Es pública y solo cambia una preferencia del
  // propio navegador; no toca la sesión ni los datos del servidor.
  router.post('/preferencias/tipo', controlador.guardarPreferencia);

  return router;
}
