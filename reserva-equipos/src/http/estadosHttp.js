// Traducción de los códigos de los errores de dominio a códigos HTTP.
// Es la "política" de respuestas de esta aplicación y vive en la capa HTTP:
// los servicios lanzan CONFLICTO y no saben que eso acaba siendo un 409.
//
// El 401 (credenciales incorrectas) no aparece aquí porque lo responde
// directamente el controlador de login al volver a mostrar su formulario.

export const estadosHttp = {
  DATOS_INVALIDOS: 400,
  SIN_PERMISO: 403,
  NO_ENCONTRADO: 404,
  CONFLICTO: 409
};
