// Punto de entrada: construye la aplicación y la pone a escuchar. Solo esto.
// Al importar config se valida la configuración; si es incorrecta, el
// proceso termina aquí con un mensaje que indica qué variable falla.

import { config } from './config/env.js';
import { crearApp } from './app.js';

const app = crearApp();

app.listen(config.puerto, () => {
  console.log(`Servidor en http://localhost:${config.puerto}`);
});
