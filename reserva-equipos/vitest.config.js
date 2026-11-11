// Configuración de las pruebas.
// "env" da valores de entorno SOLO a las pruebas: así npm test no depende
// del archivo .env ni de ningún secreto real. El secreto de abajo es un
// texto de relleno que únicamente sirve para ejecutar los tests.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      SESSION_SECRET: 'secreto-de-pruebas-no-usar-fuera-de-los-tests'
    }
  }
});
