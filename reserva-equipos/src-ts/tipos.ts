// Modelos del dominio con tipos. Las uniones de literales limitan los valores
// posibles: el compilador rechaza un rol "superadmin" o un turno "noche"
// escritos en el código.
//
// Importante: los tipos desaparecen al compilar. Describen el programa, pero
// no validan los datos que llegan de fuera (un formulario, una URL...).

export type Rol = "usuario" | "admin";
export type Turno = "manana" | "tarde";
export type TipoEquipo = "sobremesa" | "portatil";
export type EstadoEquipo = "operativo" | "fuera_de_servicio";
export type EstadoReserva = "activa" | "cancelada";

export interface Equipo {
  readonly id: number;
  codigo: string;
  nombre: string;
  tipo: TipoEquipo;
  estado: EstadoEquipo;
}

export interface Usuario {
  readonly id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
}

export interface Reserva {
  readonly id: number;
  equipoId: number;
  usuarioId: number;
  fecha: string; // "AAAA-MM-DD"
  turno: Turno;
  estado: EstadoReserva;
}

// Datos de una reserva que todavía no tiene id: se lo asigna el repositorio.
export interface NuevaReserva {
  equipoId: number;
  usuarioId: number;
  fecha: string;
  turno: Turno;
  estado: EstadoReserva;
}
