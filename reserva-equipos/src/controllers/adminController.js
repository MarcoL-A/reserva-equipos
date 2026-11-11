// Controlador del panel de administración.
// Aquí NO se comprueba el rol: lo hacen exigirAutenticacion y exigirRol en
// las rutas, antes de llegar a estas funciones (src/routes/admin.routes.js).

import { ErrorDominio } from '../domain/errores.js';
import {
  ESTADOS_EQUIPO, TIPOS_EQUIPO, normalizarEquipo, validarEquipo
} from '../domain/equipos.js';
import { enteroPositivo } from '../http/enteroPositivo.js';
import { filaEquipo, filaReserva } from '../presentation/filas.js';
import { etiquetaTipo } from '../presentation/helpers.js';

export function crearControladorAdmin(servicioEquipos, servicioReservas) {
  // Pinta la página de equipos: la tabla y el formulario de alta.
  async function mostrarEquipos(res, estado, valores, errores) {
    const equipos = await servicioEquipos.listar();
    return res.status(estado).render('admin/equipos', {
      equipos: equipos.map(filaEquipo),
      tipos: TIPOS_EQUIPO.map((t) => ({ valor: t, texto: etiquetaTipo(t) })),
      valores,
      errores
    });
  }

  return {
    // GET /admin/equipos
    async listarEquipos(req, res, next) {
      try {
        const vacio = { codigo: '', nombre: '', tipo: '' };
        return await mostrarEquipos(res, 200, vacio, []);
      } catch (err) {
        return next(err);
      }
    },

    // POST /admin/equipos
    async crearEquipo(req, res, next) {
      try {
        const valores = normalizarEquipo(req.body);

        // 1) Forma de los datos.
        let errores = validarEquipo(valores);
        let equipo = null;

        // 2) Reglas del servicio (por ejemplo, código duplicado).
        if (Object.keys(errores).length === 0) {
          try {
            equipo = await servicioEquipos.crear(valores);
          } catch (err) {
            if (!(err instanceof ErrorDominio)) throw err;
            errores = { codigo: err.message };
          }
        }

        if (Object.keys(errores).length > 0) {
          // 400 y el formulario con los campos correctos conservados.
          const conservados = {
            codigo: errores.codigo ? '' : valores.codigo,
            nombre: errores.nombre ? '' : valores.nombre,
            tipo: errores.tipo ? '' : valores.tipo
          };
          return await mostrarEquipos(
            res, 400, conservados, Object.values(errores)
          );
        }

        // 3) Correcto: Post/Redirect/Get con aviso de un solo uso.
        req.session.aviso = `Equipo ${equipo.codigo} añadido.`;
        return req.session.save((err) => {
          if (err) return next(err);
          return res.redirect(303, '/admin/equipos');
        });
      } catch (err) {
        return next(err);
      }
    },

    // POST /admin/equipos/:id/estado
    async cambiarEstado(req, res, next) {
      try {
        const id = enteroPositivo(req.params.id, 'equipo');
        const estado = String(req.body?.estado ?? '').trim();
        if (!ESTADOS_EQUIPO.includes(estado)) {
          throw new ErrorDominio('DATOS_INVALIDOS',
            'El estado debe ser operativo o fuera_de_servicio.');
        }

        const equipo = await servicioEquipos.cambiarEstado(id, estado);

        req.session.aviso = `Estado de ${equipo.codigo} actualizado.`;
        return req.session.save((err) => {
          if (err) return next(err);
          return res.redirect(303, '/admin/equipos');
        });
      } catch (err) {
        return next(err);
      }
    },

    // GET /admin/reservas
    async listarReservas(req, res, next) {
      try {
        const reservas = await servicioReservas.listarTodas(
          res.locals.usuarioActual
        );
        return res.render('admin/reservas', {
          reservas: reservas.map(filaReserva)
        });
      } catch (err) {
        return next(err);
      }
    },

    // POST /admin/reservas/:id/cancelar
    // Usa la misma operación del servicio que el usuario normal. Como el
    // usuario actual es admin, el servicio le permite cancelar cualquiera.
    async cancelarReserva(req, res, next) {
      try {
        const id = enteroPositivo(req.params.id, 'reserva');
        await servicioReservas.cancelar(id, res.locals.usuarioActual);

        req.session.aviso = 'Reserva cancelada.';
        return req.session.save((err) => {
          if (err) return next(err);
          return res.redirect(303, '/admin/reservas');
        });
      } catch (err) {
        return next(err);
      }
    }
  };
}
