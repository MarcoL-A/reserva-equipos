// Error de dominio (sesión 10, apartado 6).
// Representa una situación PREVISTA que impide una operación: equipo que no
// existe, turno ya ocupado, reserva de otra persona...
//
// Lleva un código estable. El programa decide por el código, nunca comparando
// el texto del mensaje, así el mensaje visible puede cambiar sin romper nada.
//
// Códigos que usa la aplicación (su traducción a HTTP está en
// src/http/estadosHttp.js, porque el dominio no sabe qué es un 409):
//   DATOS_INVALIDOS  datos mal formados o que no cumplen las reglas
//   SIN_PERMISO      identidad válida pero sin derecho a la operación
//   NO_ENCONTRADO    el recurso pedido no existe
//   CONFLICTO        la operación choca con el estado actual de los datos

export class ErrorDominio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = 'ErrorDominio';
    this.codigo = codigo;
  }
}
