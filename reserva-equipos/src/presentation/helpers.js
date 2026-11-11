// Helpers de presentación (sesión 11, apartado 1.2): funciones pequeñas que
// convierten un valor interno en el texto que ve el usuario.
// Su resultado depende solo de sus argumentos. NO deciden nada del negocio:
// etiquetaTurno('manana') devuelve "Mañana", pero no decide qué turnos existen.

export function etiquetaTipo(tipo) {
  if (tipo === 'portatil') return 'Portátil';
  if (tipo === 'sobremesa') return 'Sobremesa';
  return tipo;
}

export function etiquetaEstadoEquipo(estado) {
  if (estado === 'operativo') return 'Operativo';
  if (estado === 'fuera_de_servicio') return 'Fuera de servicio';
  return estado;
}

export function etiquetaTurno(turno) {
  if (turno === 'manana') return 'Mañana';
  if (turno === 'tarde') return 'Tarde';
  return turno;
}

export function etiquetaEstadoReserva(estado) {
  if (estado === 'activa') return 'Activa';
  if (estado === 'cancelada') return 'Cancelada';
  return estado;
}

export function etiquetaEquipo(equipo) {
  return `${equipo.codigo} · ${equipo.nombre} (${etiquetaTipo(equipo.tipo)})`;
}

// "2027-01-15" -> "15/01/2027". Si no tiene esa forma, se devuelve tal cual.
export function formatearFecha(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(0, 4)}`;
}
