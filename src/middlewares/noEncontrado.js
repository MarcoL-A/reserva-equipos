// Se monta después de todas las rutas: si la petición llega hasta aquí,
// ninguna ruta la ha atendido.

export function noEncontrado(req, res) {
  return res.status(404).render('error', {
    mensaje: 'Página no encontrada.'
  });
}
