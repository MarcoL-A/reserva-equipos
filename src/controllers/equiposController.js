// Controlador del catálogo público de equipos y de la cookie de preferencias.

import { ErrorDominio } from '../domain/errores.js';
import { TIPOS_EQUIPO } from '../domain/equipos.js';
import { enteroPositivo } from '../http/enteroPositivo.js';
import { opcionesCookie } from '../config/session.js';
import { filaEquipo, filaTurnoOcupado } from '../presentation/filas.js';
import { etiquetaTipo } from '../presentation/helpers.js';

const COOKIE_PREFERENCIA = 'tipoPreferido';
const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;

// La cookie de preferencias la puede haber escrito o modificado el cliente:
// solo se acepta si su valor es uno de los tipos permitidos.
function leerPreferencia(req) {
  const valor = req.cookies?.[COOKIE_PREFERENCIA];
  return TIPOS_EQUIPO.includes(valor) ? valor : null;
}

// Convierte la query (?tipo=...&operativos=...) en los filtros del servicio.
// Los valores de la query son texto: "true" no es true, hay que compararlo.
function leerFiltros(query, preferencia) {
  const sinFiltros = query.tipo === undefined && query.operativos === undefined;
  if (sinFiltros) {
    // Filtro INICIAL del catálogo: el tipo preferido guardado en la cookie.
    return { tipo: preferencia, soloOperativos: false };
  }

  const tipo = String(query.tipo ?? '').trim();
  if (tipo !== '' && !TIPOS_EQUIPO.includes(tipo)) {
    throw new ErrorDominio('DATOS_INVALIDOS',
      'El filtro tipo debe ser portatil o sobremesa.');
  }

  const operativos = String(query.operativos ?? '').trim();
  if (!['', 'true', 'false'].includes(operativos)) {
    throw new ErrorDominio('DATOS_INVALIDOS',
      'El filtro operativos debe ser true o false.');
  }

  return {
    tipo: tipo === '' ? null : tipo,
    soloOperativos: operativos === 'true'
  };
}

export function crearControladorEquipos(servicioEquipos, servicioReservas, config) {
  return {
    // GET /equipos
    async listar(req, res, next) {
      try {
        const preferencia = leerPreferencia(req);
        const filtros = leerFiltros(req.query, preferencia);
        const equipos = await servicioEquipos.listar(filtros);

        const sinFiltros = req.query.tipo === undefined
          && req.query.operativos === undefined;

        return res.render('equipos/lista', {
          equipos: equipos.map(filaEquipo),
          filtros: {
            tipo: filtros.tipo ?? '',
            soloOperativos: filtros.soloOperativos
          },
          preferencia: preferencia ?? '',
          // Texto para avisar de que se está aplicando la preferencia.
          preferenciaAplicada: sinFiltros && preferencia
            ? etiquetaTipo(preferencia)
            : null
        });
      } catch (err) {
        return next(err);
      }
    },

    // GET /equipos/:id
    async detalle(req, res, next) {
      try {
        const id = enteroPositivo(req.params.id, 'equipo');
        const equipo = await servicioEquipos.obtener(id);
        const ocupados = await servicioReservas.turnosOcupados(id);

        return res.render('equipos/detalle', {
          equipo: filaEquipo(equipo),
          ocupados: ocupados.map(filaTurnoOcupado)
        });
      } catch (err) {
        return next(err);
      }
    },

    // POST /preferencias/tipo
    // Guarda el tipo preferido en una cookie (sesión 7, apartado 10). Es un
    // dato pequeño y no sensible, por eso puede vivir en el navegador. Nunca
    // se usa para decidir permisos.
    guardarPreferencia(req, res) {
      const tipo = String(req.body?.tipo ?? '').trim();

      if (tipo === '') {
        // "Sin preferencia": se retira la cookie.
        res.clearCookie(COOKIE_PREFERENCIA, opcionesCookie(config));
        return res.redirect(303, '/equipos');
      }

      if (!TIPOS_EQUIPO.includes(tipo)) {
        return res.status(400).render('error', {
          mensaje: 'El tipo preferido debe ser portatil o sobremesa.'
        });
      }

      res.cookie(COOKIE_PREFERENCIA, tipo, {
        ...opcionesCookie(config),
        maxAge: TREINTA_DIAS
      });
      return res.redirect(303, '/equipos');
    }
  };
}
