// Servicio de equipos: catálogo con filtros, alta y cambio de estado.

import { ErrorDominio } from '../domain/errores.js';
import {
  ESTADOS_EQUIPO, TIPOS_EQUIPO, validarEquipo
} from '../domain/equipos.js';

export function crearServicioEquipos(repoEquipos) {
  return {
    // tipo: 'portatil', 'sobremesa' o null (todos).
    // soloOperativos: true para ocultar los que están fuera de servicio.
    async listar({ tipo = null, soloOperativos = false } = {}) {
      if (tipo !== null && !TIPOS_EQUIPO.includes(tipo)) {
        throw new ErrorDominio('DATOS_INVALIDOS',
          'El tipo de equipo no es válido.');
      }
      const equipos = await repoEquipos.listar();
      return equipos.filter((e) => (tipo === null || e.tipo === tipo)
        && (!soloOperativos || e.estado === 'operativo'));
    },

    async obtener(id) {
      const equipo = await repoEquipos.buscarPorId(id);
      if (!equipo) {
        throw new ErrorDominio('NO_ENCONTRADO', 'El equipo no existe.');
      }
      return equipo;
    },

    // valores = { codigo, nombre, tipo } ya normalizados.
    async crear(valores) {
      const errores = validarEquipo(valores);
      if (Object.keys(errores).length > 0) {
        throw new ErrorDominio('DATOS_INVALIDOS',
          'Los datos del equipo no son válidos.');
      }

      const equipos = await repoEquipos.listar();
      if (equipos.some((e) => e.codigo === valores.codigo)) {
        throw new ErrorDominio('DATOS_INVALIDOS',
          'Ya existe un equipo con ese código.');
      }

      // Todo equipo nuevo nace operativo; el estado no viene del formulario.
      return repoEquipos.crear({
        codigo: valores.codigo,
        nombre: valores.nombre,
        tipo: valores.tipo,
        estado: 'operativo'
      });
    },

    async cambiarEstado(id, estado) {
      if (!ESTADOS_EQUIPO.includes(estado)) {
        throw new ErrorDominio('DATOS_INVALIDOS',
          'El estado debe ser operativo o fuera_de_servicio.');
      }
      const equipo = await repoEquipos.buscarPorId(id);
      if (!equipo) {
        throw new ErrorDominio('NO_ENCONTRADO', 'El equipo no existe.');
      }
      const actualizado = { ...equipo, estado };
      await repoEquipos.guardar(actualizado);
      return actualizado;
    }
  };
}
