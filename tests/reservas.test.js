// Pruebas 6, 7 y 8 del enunciado.

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { crearApp } from '../src/app.js';
import {
  ANA, FECHA_FUTURA, LUIS, iniciarSesion, obtenerCsrf
} from './helpers.js';

describe('reservas', () => {
  it('6. crea una reserva válida de un equipo disponible', async () => {
    const agente = request.agent(crearApp());
    await iniciarSesion(agente, ANA);
    const token = await obtenerCsrf(agente);

    const respuesta = await agente.post('/reservas').type('form').send({
      _csrf: token,
      equipoId: '2',
      fecha: FECHA_FUTURA,
      turno: 'manana'
    });

    // Post/Redirect/Get: 303 hacia la lista de reservas.
    expect(respuesta.status).toBe(303);
    expect(respuesta.headers.location).toBe('/mis-reservas');

    // El GET siguiente muestra el aviso de confirmación...
    const lista = await agente.get('/mis-reservas');
    expect(lista.status).toBe(200);
    expect(lista.text).toContain('Reserva creada correctamente.');

    // ...y es de un solo uso: al recargar ya no aparece.
    const recarga = await agente.get('/mis-reservas');
    expect(recarga.text).not.toContain('Reserva creada correctamente.');
  });

  it('7. rechaza una reserva duplicada para el mismo equipo, fecha y turno', async () => {
    const app = crearApp();
    const datos = { equipoId: '2', fecha: FECHA_FUTURA, turno: 'tarde' };

    // Ana reserva primero.
    const ana = request.agent(app);
    await iniciarSesion(ana, ANA);
    const tokenAna = await obtenerCsrf(ana);
    await ana.post('/reservas').type('form')
      .send({ _csrf: tokenAna, ...datos })
      .expect(303);

    // Luis pide exactamente lo mismo: conflicto.
    const luis = request.agent(app);
    await iniciarSesion(luis, LUIS);
    const tokenLuis = await obtenerCsrf(luis);
    const duplicada = await luis.post('/reservas').type('form')
      .send({ _csrf: tokenLuis, ...datos });

    expect(duplicada.status).toBe(409);
    expect(duplicada.text).toContain('ya está reservado');

    // El mismo equipo y día, pero en el otro turno, sí se puede reservar.
    const otroTurno = await luis.post('/reservas').type('form')
      .send({ _csrf: tokenLuis, ...datos, turno: 'manana' });
    expect(otroTurno.status).toBe(303);
  });

  it('8. rechaza la cancelación de una reserva ajena', async () => {
    const app = crearApp();

    // La reserva 1 de los datos de prueba es de Ana. Luis intenta cancelarla
    // escribiendo su id en la URL, con su propio token CSRF válido.
    const luis = request.agent(app);
    await iniciarSesion(luis, LUIS);
    const tokenLuis = await obtenerCsrf(luis);
    const ajena = await luis.post('/reservas/1/cancelar').type('form')
      .send({ _csrf: tokenLuis });

    expect(ajena.status).toBe(403);

    // La reserva sigue activa: su dueña todavía puede cancelarla.
    const ana = request.agent(app);
    await iniciarSesion(ana, ANA);
    const tokenAna = await obtenerCsrf(ana);
    const propia = await ana.post('/reservas/1/cancelar').type('form')
      .send({ _csrf: tokenAna });

    expect(propia.status).toBe(303);
    expect(propia.headers.location).toBe('/mis-reservas');
  });
});
