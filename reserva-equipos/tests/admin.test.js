// Pruebas 5 y 9 del enunciado.

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../src/app.js';
import { ADMIN, ANA, iniciarSesion, obtenerCsrf } from './helpers.js';

describe('administración', () => {
  it('5. rechaza una operación de administrador hecha por un usuario ordinario', async () => {
    const app = crearApp();
    const ana = request.agent(app);
    await iniciarSesion(ana, ANA);
    // El token es válido: así el 403 solo puede deberse al rol.
    const token = await obtenerCsrf(ana);

    const pagina = await ana.get('/admin/equipos');
    expect(pagina.status).toBe(403);

    const alta = await ana.post('/admin/equipos').type('form').send({
      _csrf: token,
      codigo: 'PORT-999',
      nombre: 'Equipo colado',
      tipo: 'portatil'
    });
    expect(alta.status).toBe(403);

    // Y el equipo no se ha creado.
    const catalogo = await request(app).get('/equipos?tipo=');
    expect(catalogo.text).not.toContain('PORT-999');
  });

  it('9. rechaza un cambio de estado sin token CSRF válido', async () => {
    const app = crearApp();
    const admin = request.agent(app);
    await iniciarSesion(admin, ADMIN);

    // Sin token.
    const sinToken = await admin.post('/admin/equipos/1/estado').type('form')
      .send({ estado: 'fuera_de_servicio' });
    expect(sinToken.status).toBe(403);

    // Con un token inventado.
    const tokenFalso = await admin.post('/admin/equipos/1/estado').type('form')
      .send({ _csrf: 'token-inventado', estado: 'fuera_de_servicio' });
    expect(tokenFalso.status).toBe(403);

    // El equipo 1 sigue operativo: la operación no llegó a ejecutarse.
    const ficha = await request(app).get('/equipos/1');
    expect(ficha.text).toContain('Operativo');

    // Con el token correcto, el mismo administrador sí puede.
    const token = await obtenerCsrf(admin);
    const conToken = await admin.post('/admin/equipos/1/estado').type('form')
      .send({ _csrf: token, estado: 'fuera_de_servicio' });
    expect(conToken.status).toBe(303);

    const fichaDespues = await request(app).get('/equipos/1');
    expect(fichaDespues.text).toContain('Fuera de servicio');
  });
});
