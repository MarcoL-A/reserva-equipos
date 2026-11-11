// Demostración independiente del núcleo tipado: no necesita Express ni EJS.
//   npm run build:ts   (compila src-ts/ en dist/)
//   npm run demo:ts    (ejecuta dist/demo.js)

import { RepositorioReservasMap } from "./RepositorioReservasMap.js";
import { ServicioReservas } from "./ServicioReservas.js";
import { ErrorDominio } from "./ErrorDominio.js";
import type { Equipo, Usuario } from "./tipos.js";

const pc1: Equipo = {
  id: 1, codigo: "PC-001", nombre: "Ordenador aula 1",
  tipo: "sobremesa", estado: "operativo"
};
const portatil: Equipo = {
  id: 2, codigo: "PORT-001", nombre: "Portátil Lenovo",
  tipo: "portatil", estado: "operativo"
};
const pc2: Equipo = {
  id: 3, codigo: "PC-002", nombre: "Ordenador aula 2",
  tipo: "sobremesa", estado: "fuera_de_servicio"
};
const equipos: Equipo[] = [pc1, portatil, pc2];

const ana: Usuario = {
  id: 2, nombre: "Ana García", email: "ana@example.com",
  passwordHash: "(no se usa en la demostración)", rol: "usuario"
};
const luis: Usuario = {
  id: 3, nombre: "Luis Pérez", email: "luis@example.com",
  passwordHash: "(no se usa en la demostración)", rol: "usuario"
};

// Composición: primero el repositorio, después el servicio que lo recibe.
const repo = new RepositorioReservasMap();
const servicio = new ServicioReservas(repo);

// Fechas fijas para que el resultado sea siempre el mismo.
const HOY = "2027-01-10";
const FECHA = "2027-01-15";

const primera = await servicio.reservar(pc1, ana, FECHA, "manana", HOY);
console.log("1. Reserva creada con id", primera.id, "y estado", primera.estado);

try {
  await servicio.reservar(pc1, luis, FECHA, "manana", HOY);
} catch (err) {
  // "err" es de tipo unknown: hay que comprobar qué es antes de leer su código.
  if (!(err instanceof ErrorDominio)) throw err;
  console.log("2. Luis pide el mismo equipo, fecha y turno:", err.codigo);
}

const manana = await servicio.equiposDisponibles(equipos, FECHA, "manana");
console.log("3. Disponibles por la mañana:",
  manana.map((e) => e.codigo).join(", "));

const tarde = await servicio.equiposDisponibles(equipos, FECHA, "tarde");
console.log("4. Disponibles por la tarde:",
  tarde.map((e) => e.codigo).join(", "));

try {
  await servicio.cancelar(primera.id, luis, HOY);
} catch (err) {
  if (!(err instanceof ErrorDominio)) throw err;
  console.log("5. Luis intenta cancelar la reserva de Ana:", err.codigo);
}

const cancelada = await servicio.cancelar(primera.id, ana, HOY);
console.log("6. Ana cancela su reserva. Estado:", cancelada.estado);

const segunda = await servicio.reservar(pc1, luis, FECHA, "manana", HOY);
console.log("7. Ahora Luis sí puede reservar ese hueco. Id:", segunda.id);
