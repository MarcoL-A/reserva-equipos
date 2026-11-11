// Conversión de un identificador que llega como texto (sesión 10, 4.2).
// Los parámetros de la URL y los campos de formulario SIEMPRE son texto:
// "/reservas/7/cancelar" entrega "7", no 7.
//
// Rechaza campos ausentes, arrays, decimales, negativos, textos como "1abc"
// y números demasiado grandes para representarse como enteros exactos.
// La expresión regular comprueba la forma ANTES de convertir con Number.

import { ErrorDominio } from '../domain/errores.js';

export function enteroPositivo(valor, nombre) {
  if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)) {
    throw new ErrorDominio('DATOS_INVALIDOS',
      `El identificador de ${nombre} debe ser un entero positivo.`);
  }
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero)) {
    throw new ErrorDominio('DATOS_INVALIDOS',
      `El identificador de ${nombre} está fuera de rango.`);
  }
  return numero;
}
