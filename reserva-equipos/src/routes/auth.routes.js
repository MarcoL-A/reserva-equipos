// Rutas de registro, acceso, salida y perfil.
// Una ruta relaciona método + URL con la cadena de middlewares y el
// controlador. Se lee de izquierda a derecha: cada middleware puede cortar.

import { Router } from 'express';
import { exigirAutenticacion } from '../middlewares/exigirAutenticacion.js';
import { comprobarCsrf } from '../middlewares/csrf.js';
import { crearLimitadorLogin } from '../middlewares/limitarLogin.js';

export function crearRutasAuth(controlador) {
  const router = Router();
  const limitarLogin = crearLimitadorLogin();

  router.get('/registro', controlador.mostrarRegistro);
  router.post('/registro', controlador.registrar);

  router.get('/login', controlador.mostrarLogin);
  // El límite de intentos va antes del controlador: si se supera, ni
  // siquiera se llegan a comprobar las credenciales.
  router.post('/login', limitarLogin, controlador.login);

  // El logout es POST porque cambia el estado, y lleva token CSRF.
  router.post('/logout', exigirAutenticacion, comprobarCsrf, controlador.logout);

  router.get('/perfil', exigirAutenticacion, controlador.perfil);

  return router;
}
