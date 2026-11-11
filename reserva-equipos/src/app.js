// Crea y configura la aplicación Express. NO llama a listen(): eso lo hace
// server.js. Gracias a esa separación, las pruebas construyen la aplicación
// y le envían peticiones con Supertest sin abrir ningún puerto.
//
// crearApp() es además el ARCHIVO DE COMPOSICIÓN (sesión 10, apartado 5):
// aquí se crean los repositorios, se entregan a los servicios y los
// servicios a los controladores. Cada pieza recibe lo que necesita desde
// fuera (inyección de dependencias) en lugar de crearlo por dentro.
//
// Cada llamada a crearApp() produce una aplicación independiente, con sus
// propios datos, sesiones y contador de intentos de login. El servidor la
// llama una vez; cada prueba llama a la suya y así no se pisan los datos.

import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

import { config } from './config/env.js';
import { crearOpcionesSesion } from './config/session.js';
import { semilla } from './data/seed.js';

import { crearRepositorioEquipos } from './repositories/equiposRepository.js';
import { crearRepositorioReservas } from './repositories/reservasRepository.js';
import { crearRepositorioUsuarios } from './repositories/usuariosRepository.js';

import { crearServicioAuth } from './services/authService.js';
import { crearServicioEquipos } from './services/equiposService.js';
import { crearServicioReservas } from './services/reservasService.js';

import { crearControladorAuth } from './controllers/authController.js';
import { crearControladorEquipos } from './controllers/equiposController.js';
import { crearControladorReservas } from './controllers/reservasController.js';
import { crearControladorAdmin } from './controllers/adminController.js';

import { crearRutas } from './routes/index.js';

import { crearCargarUsuarioActual } from './middlewares/usuarioActual.js';
import { prepararCsrf } from './middlewares/csrf.js';
import { cargarAviso } from './middlewares/avisos.js';
import { noEncontrado } from './middlewares/noEncontrado.js';
import { tratarError } from './middlewares/tratarError.js';

export function crearApp(datos = semilla) {
  // --- Composición: repositorios -> servicios -> controladores ---------
  // Los repositorios se crean UNA vez por aplicación. Si se crearan dentro
  // de cada petición, los datos se reiniciarían en cada acceso.
  const repoEquipos = crearRepositorioEquipos(datos.equipos);
  const repoReservas = crearRepositorioReservas(datos.reservas);
  const repoUsuarios = crearRepositorioUsuarios(datos.usuarios);

  const servicioAuth = crearServicioAuth(repoUsuarios);
  const servicioEquipos = crearServicioEquipos(repoEquipos);
  const servicioReservas = crearServicioReservas(
    repoReservas, repoEquipos, repoUsuarios
  );

  const controladores = {
    auth: crearControladorAuth(servicioAuth, config),
    equipos: crearControladorEquipos(servicioEquipos, servicioReservas, config),
    reservas: crearControladorReservas(servicioReservas),
    admin: crearControladorAdmin(servicioEquipos, servicioReservas)
  };

  // --- Express ----------------------------------------------------------
  const app = express();

  // Las plantillas están en la carpeta views/ de la raíz del proyecto, que
  // es donde Express las busca por defecto.
  app.set('view engine', 'ejs');

  // En producción la aplicación suele estar detrás de un proxy que termina
  // HTTPS. Hay que indicarlo para que la cookie secure funcione.
  if (config.produccion) {
    app.set('trust proxy', 1);
  }

  // --- Middlewares globales: EL ORDEN FORMA PARTE DEL COMPORTAMIENTO ----
  // 1) Valores por defecto para que la página de error siempre pueda
  //    pintarse, aunque el fallo ocurra antes de cargar al usuario.
  app.use((req, res, next) => {
    res.locals.usuarioActual = null;
    res.locals.csrfToken = '';
    res.locals.aviso = null;
    return next();
  });
  // 2) Archivos estáticos (CSS). No necesitan sesión.
  app.use(express.static('public'));
  // 3) Cuerpo de los formularios -> req.body
  app.use(express.urlencoded({ extended: false }));
  // 4) Cookies de propósito general -> req.cookies (la de preferencias)
  app.use(cookieParser());
  // 5) Sesión -> req.session
  app.use(session(crearOpcionesSesion(config)));
  // 6) Usuario actual: necesita la sesión (paso 5)
  app.use(crearCargarUsuarioActual(servicioAuth));
  // 7) Token CSRF: necesita el usuario (paso 6)
  app.use(prepararCsrf);
  // 8) Aviso de un solo uso: necesita la sesión
  app.use(cargarAviso);

  // --- Rutas --------------------------------------------------------------
  app.use(crearRutas(controladores));

  // --- Final: 404 y tratamiento centralizado de errores ---------------
  app.use(noEncontrado);
  app.use(tratarError);

  return app;
}
