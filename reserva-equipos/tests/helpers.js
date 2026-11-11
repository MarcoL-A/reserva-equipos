// Ayudas comunes para las pruebas.
//
// Las pruebas usan los datos de src/data/seed.js, que son cuentas y equipos
// de prueba controlados. Cada prueba llama a crearApp() y obtiene una
// aplicación NUEVA con esos datos recién copiados: lo que hace una prueba
// (reservar, cancelar...) no afecta a las demás.

export const ADMIN = { email: 'admin@example.com', password: 'Admin1234' };
export const ANA = { email: 'ana@example.com', password: 'Ana12345' };
export const LUIS = { email: 'luis@example.com', password: 'Luis1234' };

// Una fecha lejana para que "no anterior a hoy" se cumpla siempre.
export const FECHA_FUTURA = '2099-06-15';

// Inicia sesión con un agente de Supertest. El agente conserva las cookies
// entre peticiones, igual que un navegador.
export async function iniciarSesion(agente, credenciales) {
  await agente
    .post('/login')
    .type('form')
    .send(credenciales)
    .expect(303);
}

// Saca el token CSRF del HTML de una página autenticada: está en el campo
// oculto <input type="hidden" name="_csrf" value="...">.
export async function obtenerCsrf(agente) {
  const respuesta = await agente.get('/perfil').expect(200);
  const coincidencia = respuesta.text.match(/name="_csrf" value="([^"]+)"/);
  return coincidencia[1];
}
