// Pruebas 1, 2, 3, 4 y 10 del enunciado (más una sobre la regeneración).

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../src/app.js';
import { ANA, iniciarSesion, obtenerCsrf } from './helpers.js';

describe('registro y autenticación', () => {
  it('1. registra un usuario válido, siempre con rol usuario', async () => {
    const agente = request.agent(crearApp());

    // Se intenta colar rol=admin: el servidor debe ignorarlo.
    const registro = await agente.post('/registro').type('form').send({
      nombre: 'Marta Ruiz',
      email: 'marta@example.com',
      password: 'Marta1234',
      rol: 'admin'
    });
    expect(registro.status).toBe(303);
    expect(registro.headers.location).toBe('/login');

    // La cuenta nueva sirve para iniciar sesión...
    await iniciarSesion(agente, {
      email: 'marta@example.com',
      password: 'Marta1234'
    });
    const perfil = await agente.get('/perfil');
    expect(perfil.status).toBe(200);
    expect(perfil.text).toContain('Marta Ruiz');

    // ...y no tiene permisos de administrador.
    const admin = await agente.get('/admin/equipos');
    expect(admin.status).toBe(403);
  });

  it('2. rechaza credenciales incorrectas sin revelar si el correo existe', async () => {
    const app = crearApp();

    const claveMala = await request(app).post('/login').type('form').send({
      email: ANA.email,
      password: 'contraseña-equivocada'
    });
    const correoInexistente = await request(app).post('/login').type('form').send({
      email: 'nadie@example.com',
      password: 'contraseña-equivocada'
    });

    expect(claveMala.status).toBe(401);
    expect(correoInexistente.status).toBe(401);
    // Mismo mensaje en los dos casos.
    expect(claveMala.text).toContain('Credenciales no válidas');
    expect(correoInexistente.text).toContain('Credenciales no válidas');
  });

  it('3. redirige al login si se pide una ruta privada sin autenticación', async () => {
    const respuesta = await request(crearApp()).get('/perfil');

    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.location).toBe('/login');
  });

  it('4. permite acceder a una ruta privada con sesión', async () => {
    const agente = request.agent(crearApp());
    await iniciarSesion(agente, ANA);

    const respuesta = await agente.get('/perfil');

    expect(respuesta.status).toBe(200);
    expect(respuesta.text).toContain('Ana García');
    // La página nunca muestra el hash de la contraseña.
    expect(respuesta.text).not.toContain('$2b$');
  });

  it('10. invalida la sesión después del logout', async () => {
    const app = crearApp();
    const agente = request.agent(app);

    // Se guarda la cookie de sesión que el servidor entrega al iniciar sesión.
    const login = await agente.post('/login').type('form').send(ANA);
    const cookieDeSesion = login.headers['set-cookie'][0].split(';')[0];

    const token = await obtenerCsrf(agente);
    const logout = await agente.post('/logout').type('form').send({ _csrf: token });
    expect(logout.status).toBe(303);

    // El agente (que ya no tiene cookie) vuelve a ser anónimo.
    const conAgente = await agente.get('/perfil');
    expect(conAgente.status).toBe(303);
    expect(conAgente.headers.location).toBe('/login');

    // Y aunque alguien reenvíe la cookie antigua, tampoco entra: la sesión
    // se ha destruido en el servidor, no solo se ha borrado en el navegador.
    const conCookieAntigua = await request(app)
      .get('/perfil')
      .set('Cookie', cookieDeSesion);
    expect(conCookieAntigua.status).toBe(303);
    expect(conCookieAntigua.headers.location).toBe('/login');
  });

  it('extra: el login regenera el identificador de sesión', async () => {
    const agente = request.agent(crearApp());

    // Un registro correcto crea una sesión anónima (para guardar el aviso).
    const registro = await agente.post('/registro').type('form').send({
      nombre: 'Pablo Gil',
      email: 'pablo@example.com',
      password: 'Pablo1234'
    });
    const cookieAntes = registro.headers['set-cookie'][0].split(';')[0];

    const login = await agente.post('/login').type('form').send({
      email: 'pablo@example.com',
      password: 'Pablo1234'
    });
    const cookieDespues = login.headers['set-cookie'][0].split(';')[0];

    // Después de autenticar, el identificador es otro distinto.
    expect(cookieDespues).not.toBe(cookieAntes);
  });
});
