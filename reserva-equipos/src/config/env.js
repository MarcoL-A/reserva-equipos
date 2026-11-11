// Configuración centralizada (sesión 11, apartado 3.1).
// Este módulo se ejecuta UNA vez, al importarlo. Si algún valor es incorrecto
// lanza un error y el servidor no llega a arrancar: es preferible fallar aquí
// que descubrir el problema en mitad de una petición.
// Los mensajes nombran la variable, pero nunca imprimen el secreto recibido.

const entorno = process.env.NODE_ENV ?? 'development';
if (!['development', 'test', 'production'].includes(entorno)) {
  throw new Error('NODE_ENV no válido: usa development, test o production');
}

// process.env siempre entrega cadenas: hay que comprobar la forma y convertir.
const puertoTexto = process.env.PORT ?? '3000';
const puerto = Number(puertoTexto);
if (!/^\d+$/.test(puertoTexto) || !Number.isInteger(puerto)
    || puerto < 1 || puerto > 65535) {
  throw new Error('PORT debe estar entre 1 y 65535');
}

const secreto = process.env.SESSION_SECRET;
if (!secreto || secreto.length < 32) {
  throw new Error('SESSION_SECRET no está configurado correctamente');
}

export const config = Object.freeze({
  entorno,
  puerto,
  produccion: entorno === 'production',
  sessionSecret: secreto
});
