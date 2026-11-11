// Controlador de reservas del usuario: formulario, creación, listado y
// cancelación. El usuario se toma SIEMPRE de res.locals.usuarioActual (lo ha
// cargado el servidor a partir de la sesión), nunca de un campo del formulario.

import { ErrorDominio } from '../domain/errores.js';
import {
  fechaDeHoy, validarFechaYTurno, validarReserva
} from '../domain/reservas.js';
import { enteroPositivo } from '../http/enteroPositivo.js';
import { estadosHttp } from '../http/estadosHttp.js';
import { filaReserva } from '../presentation/filas.js';
import { crearReservaFormVM } from '../presentation/reservaFormVM.js';

export function crearControladorReservas(servicioReservas) {
  // Vuelve a pintar el formulario después de un error, con el código HTTP
  // indicado. Si la fecha y el turno siguen siendo válidos se recargan los
  // equipos disponibles AHORA (pueden haber cambiado desde el GET).
  async function mostrarConErrores(res, estado, valores, errores) {
    const fechaYTurnoValidos = !errores.fecha && !errores.turno;
    const equipos = fechaYTurnoValidos
      ? await servicioReservas.equiposDisponibles(valores.fecha, valores.turno)
      : [];

    const vm = crearReservaFormVM({
      equipos,
      valores,
      errores,
      consultado: fechaYTurnoValidos,
      hoy: fechaDeHoy()
    });
    return res.status(estado).render('reservas/nueva', { vm });
  }

  return {
    // GET /reservas/nueva
    // GET /reservas/nueva?fecha=2027-01-15&turno=manana
    //
    // El formulario es dinámico sin JavaScript en el navegador: primero se
    // eligen fecha y turno (un GET normal) y el servidor responde con el
    // selector de equipos disponibles para ese hueco.
    async mostrarFormulario(req, res, next) {
      try {
        const valores = {
          fecha: String(req.query.fecha ?? '').trim(),
          turno: String(req.query.turno ?? '').trim(),
          equipoId: ''
        };

        // Primera visita: todavía no se ha elegido nada.
        if (valores.fecha === '' && valores.turno === '') {
          const vm = crearReservaFormVM({ hoy: fechaDeHoy() });
          return res.render('reservas/nueva', { vm });
        }

        const errores = validarFechaYTurno(valores);
        if (Object.keys(errores).length > 0) {
          return await mostrarConErrores(res, 400, valores, errores);
        }

        const equipos = await servicioReservas.equiposDisponibles(
          valores.fecha, valores.turno
        );
        const vm = crearReservaFormVM({
          equipos, valores, consultado: true, hoy: fechaDeHoy()
        });
        return res.render('reservas/nueva', { vm });
      } catch (err) {
        return next(err);
      }
    },

    // POST /reservas
    async crear(req, res, next) {
      try {
        // Se recuperan como texto solo los tres campos esperados.
        const valores = {
          equipoId: String(req.body?.equipoId ?? '').trim(),
          fecha: String(req.body?.fecha ?? '').trim(),
          turno: String(req.body?.turno ?? '').trim()
        };

        // 1) Forma de los datos: si falla, 400.
        let errores = validarReserva(valores);
        let estado = 400;

        // 2) Reglas de negocio: las decide el servicio. Si lanza un error de
        //    dominio (equipo inexistente, fuera de servicio, ya reservado...)
        //    se traduce a su código HTTP y se muestra junto al formulario.
        if (Object.keys(errores).length === 0) {
          try {
            await servicioReservas.crear(res.locals.usuarioActual, valores);
          } catch (err) {
            if (!(err instanceof ErrorDominio)) throw err;
            errores = { equipoId: err.message };
            estado = estadosHttp[err.codigo] ?? 400;
          }
        }

        if (Object.keys(errores).length > 0) {
          return await mostrarConErrores(res, estado, valores, errores);
        }

        // 3) Todo correcto: Post/Redirect/Get. El 303 hace que el navegador
        //    pida /mis-reservas con GET; recargar esa página no repite el POST.
        req.session.aviso = 'Reserva creada correctamente.';
        return req.session.save((err) => {
          if (err) return next(err);
          return res.redirect(303, '/mis-reservas');
        });
      } catch (err) {
        return next(err);
      }
    },

    // GET /mis-reservas
    async misReservas(req, res, next) {
      try {
        const reservas = await servicioReservas.listarDeUsuario(
          res.locals.usuarioActual
        );
        return res.render('reservas/mis-reservas', {
          reservas: reservas.map(filaReserva)
        });
      } catch (err) {
        return next(err);
      }
    },

    // POST /reservas/:id/cancelar
    // Si la reserva es de otro usuario, el servicio lanza SIN_PERMISO y el
    // tratamiento central de errores responde 403.
    async cancelar(req, res, next) {
      try {
        const id = enteroPositivo(req.params.id, 'reserva');
        await servicioReservas.cancelar(id, res.locals.usuarioActual);

        req.session.aviso = 'Reserva cancelada.';
        return req.session.save((err) => {
          if (err) return next(err);
          return res.redirect(303, '/mis-reservas');
        });
      } catch (err) {
        return next(err);
      }
    }
  };
}
