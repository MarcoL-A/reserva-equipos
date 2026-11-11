// Controlador de registro, acceso, salida y perfil.
// Un controlador es el adaptador entre HTTP y el caso de uso: lee req,
// normaliza y valida la forma de los datos, llama al servicio y decide la
// respuesta (render, redirección, código). Las reglas están en el servicio.

import { ErrorDominio } from '../domain/errores.js';
import {
  normalizarLogin, normalizarRegistro, validarLogin, validarRegistro
} from '../domain/usuarios.js';
import { NOMBRE_COOKIE_SESION, opcionesCookie } from '../config/session.js';

export function crearControladorAuth(servicioAuth, config) {
  // Inicio de sesión en el servidor (sesión 8, apartado 7).
  // 1) regenerate: se descarta el identificador de sesión anterior y se crea
  //    uno nuevo. Si alguien conocía el antiguo (fijación de sesión), ya no
  //    le sirve.
  // 2) Se guarda SOLO el id del usuario. Nombre y rol se consultan en cada
  //    petición (middlewares/usuarioActual.js).
  // 3) save: se espera a que la sesión esté guardada antes de redirigir.
  function iniciarSesion(req, res, next, usuarioId) {
    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.usuarioId = usuarioId;
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        return res.redirect(303, '/perfil');
      });
    });
  }

  return {
    mostrarRegistro(req, res) {
      return res.render('auth/registro', {
        valores: { nombre: '', email: '' },
        errores: []
      });
    },

    async registrar(req, res, next) {
      try {
        // normalizarRegistro lee solo nombre, email y password. Si el
        // cliente añade rol=admin al formulario, ese campo ni se mira.
        const valores = normalizarRegistro(req.body);

        // 1) Forma de los datos.
        let errores = validarRegistro(valores);

        // 2) Reglas del servicio (correo duplicado).
        if (Object.keys(errores).length === 0) {
          try {
            await servicioAuth.registrar(valores);
          } catch (err) {
            if (!(err instanceof ErrorDominio)) throw err;
            errores = { cuenta: err.message };
          }
        }

        if (Object.keys(errores).length > 0) {
          // 400 y de nuevo el formulario. Se conservan los campos correctos;
          // la contraseña no se devuelve nunca a la vista.
          return res.status(400).render('auth/registro', {
            valores: {
              nombre: errores.nombre ? '' : valores.nombre,
              email: errores.email ? '' : valores.email
            },
            errores: Object.values(errores)
          });
        }

        // 3) Correcto: Post/Redirect/Get con aviso de un solo uso.
        req.session.aviso = 'Cuenta creada. Ya puedes iniciar sesión.';
        return req.session.save((err) => {
          if (err) return next(err);
          return res.redirect(303, '/login');
        });
      } catch (err) {
        return next(err);
      }
    },

    mostrarLogin(req, res) {
      return res.render('auth/login', {
        valores: { email: '' },
        error: null
      });
    },

    async login(req, res, next) {
      try {
        const valores = normalizarLogin(req.body);
        const usuario = validarLogin(valores) === null
          ? await servicioAuth.autenticar(valores.email, valores.password)
          : null;

        if (!usuario) {
          // Mismo código y mismo mensaje si el correo no existe o si la
          // contraseña no coincide: no se puede averiguar qué cuentas hay.
          return res.status(401).render('auth/login', {
            valores: { email: valores.email },
            error: 'Credenciales no válidas'
          });
        }

        return iniciarSesion(req, res, next, usuario.id);
      } catch (err) {
        return next(err);
      }
    },

    // Cierre de sesión (sesión 8, apartado 5): hay que hacer las DOS cosas.
    // destroy elimina la sesión del servidor; clearCookie retira la cookie
    // del navegador. Con solo una de las dos quedaría media sesión viva.
    logout(req, res, next) {
      req.session.destroy((error) => {
        if (error) return next(error);

        res.clearCookie(NOMBRE_COOKIE_SESION, opcionesCookie(config));
        return res.redirect(303, '/login');
      });
    },

    perfil(req, res) {
      // usuarioActual es el modelo público: id, nombre, email y rol.
      return res.render('auth/perfil', {
        usuario: res.locals.usuarioActual
      });
    }
  };
}
