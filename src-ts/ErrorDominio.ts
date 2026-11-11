// Versión tipada del error de dominio. La unión CodigoError impide usar un
// código que no exista: un error de escritura se detecta al compilar.

export type CodigoError = "DATOS_INVALIDOS" | "SIN_PERMISO"
  | "NO_ENCONTRADO" | "CONFLICTO";

export class ErrorDominio extends Error {
  readonly codigo: CodigoError;

  constructor(codigo: CodigoError, mensaje: string) {
    super(mensaje);
    this.name = "ErrorDominio";
    this.codigo = codigo;
  }
}
