// Servicio de autenticación: registro, comprobación de credenciales y
// consulta del usuario actual. No conoce req, res ni EJS.
// Recibe el repositorio desde fuera (inyección de dependencias): no sabe
// si los usuarios están en un Map o en una base de datos.

import bcrypt from 'bcrypt';
import { ErrorDominio } from '../domain/errores.js';
import { aUsuarioPublico, validarRegistro } from '../domain/usuarios.js';

// Factor de coste de bcrypt: cuanto mayor, más lento es calcular cada hash
// y más caro resulta probar contraseñas por fuerza bruta.
const COSTE_BCRYPT = 12;

export function crearServicioAuth(repoUsuarios) {
  return {
    // valores = { nombre, email, password } ya normalizados.
    async registrar(valores) {
      // El servicio repite la validación: no se fía de que quien le llama
      // (hoy un controlador, mañana otra cosa) la haya hecho.
      const errores = validarRegistro(valores);
      if (Object.keys(errores).length > 0) {
        throw new ErrorDominio('DATOS_INVALIDOS',
          'Los datos de registro no son válidos.');
      }

      const existente = await repoUsuarios.buscarPorEmail(valores.email);
      if (existente) {
        throw new ErrorDominio('DATOS_INVALIDOS',
          'No se puede crear la cuenta.');
      }

      // Se guarda el hash, nunca la contraseña.
      const passwordHash = await bcrypt.hash(valores.password, COSTE_BCRYPT);
      const usuario = await repoUsuarios.crear({
        nombre: valores.nombre,
        email: valores.email,
        passwordHash,
        // El registro público SIEMPRE crea usuarios ordinarios.
        rol: 'usuario'
      });
      return aUsuarioPublico(usuario);
    },

    // Devuelve el usuario (sin hash) si las credenciales son correctas, o
    // null en cualquier otro caso. Quien llama no puede saber si ha fallado
    // el correo o la contraseña, y por tanto tampoco puede contárselo a nadie.
    async autenticar(email, password) {
      const usuario = await repoUsuarios.buscarPorEmail(email);
      const coincide = usuario
        ? await bcrypt.compare(password, usuario.passwordHash)
        : false;
      return coincide ? aUsuarioPublico(usuario) : null;
    },

    // Se usa en cada petición para cargar el usuario de la sesión con sus
    // datos ACTUALES (nombre y rol) desde la fuente de usuarios.
    async buscarPorId(id) {
      const usuario = await repoUsuarios.buscarPorId(id);
      return usuario ? aUsuarioPublico(usuario) : null;
    }
  };
}
