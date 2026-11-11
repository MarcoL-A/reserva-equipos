// Límite de intentos de inicio de sesión (sesión 9, apartado 6).
// bcrypt ya hace lento cada intento; esto además limita cuántos intentos
// puede hacer un mismo cliente: 10 cada 15 minutos. Al superarlo, responde
// 429 con el mensaje indicado.
//
// Es una función que crea el limitador (y no un limitador ya creado) porque
// el limitador lleva su propio contador: cada aplicación que se construye,
// por ejemplo en cada prueba, debe empezar con el contador a cero.

import { rateLimit } from 'express-rate-limit';

export function crearLimitadorLogin() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiados intentos. Prueba más tarde.'
  });
}
