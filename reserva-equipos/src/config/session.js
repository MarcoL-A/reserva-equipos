// Opciones de express-session y de las cookies (sesiones 7 y 9).

export const NOMBRE_COOKIE_SESION = 'reservas.sid';

const TREINTA_MINUTOS = 30 * 60 * 1000;

// Atributos comunes a las cookies de la aplicación. Se reutilizan en tres
// sitios: la cookie de sesión, clearCookie del logout y la cookie de preferencias.
//  - httpOnly: el JavaScript del navegador no puede leer la cookie.
//  - secure: solo viaja por HTTPS (se activa en producción).
//  - sameSite lax: limita el envío de la cookie desde otros sitios.
export function opcionesCookie(config) {
  return {
    httpOnly: true,
    secure: config.produccion,
    sameSite: 'lax'
  };
}

export function crearOpcionesSesion(config) {
  return {
    name: NOMBRE_COOKIE_SESION,
    secret: config.sessionSecret,
    // No volver a guardar una sesión que no ha cambiado.
    resave: false,
    // No crear una sesión vacía para cada visitante anónimo.
    saveUninitialized: false,
    cookie: {
      ...opcionesCookie(config),
      maxAge: TREINTA_MINUTOS
    }
  };
}
