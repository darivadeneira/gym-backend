import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Gym Management API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let createdMiembroId: number;
  let createdMembresiaId: number;
  let createdDeudaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    // Limpieza: eliminar datos de prueba creados
    if (createdMiembroId) {
      try {
        await dataSource.query(`DELETE FROM deudas WHERE miembro_id = ?`, [createdMiembroId]);
        await dataSource.query(`DELETE FROM membresias WHERE miembro_id = ?`, [createdMiembroId]);
        await dataSource.query(`DELETE FROM asistencias WHERE miembro_id = ?`, [createdMiembroId]);
        await dataSource.query(`DELETE FROM miembros WHERE id = ?`, [createdMiembroId]);
      } catch (e) {
        console.log('Error cleaning up test data:', e);
      }
    }
    await app.close();
  });

  // ==========================================
  // TESTS PARA /miembros
  // ==========================================
  describe('/miembros (REST API)', () => {
    
    describe('POST /miembros - Crear miembro', () => {
      it('debe crear un miembro nuevo sin membresía', async () => {
        const miembroData = {
          nombre: 'Test',
          apellido: 'E2E',
          cedula: `TEST-${Date.now()}`,
          email: 'test.e2e@example.com',
          telefono: '0999999999',
        };

        const response = await request(app.getHttpServer())
          .post('/miembros')
          .send(miembroData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('codigoMiembro');
        expect(response.body.nombre).toBe('Test');
        expect(response.body.apellido).toBe('E2E');
        expect(response.body.activo).toBe(true);

        createdMiembroId = response.body.id;
      });

      it('debe rechazar miembro sin nombre', async () => {
        const miembroData = {
          apellido: 'Only',
        };

        await request(app.getHttpServer())
          .post('/miembros')
          .send(miembroData)
          .expect(400);
      });

      it('debe rechazar miembro sin apellido', async () => {
        const miembroData = {
          nombre: 'Only',
        };

        await request(app.getHttpServer())
          .post('/miembros')
          .send(miembroData)
          .expect(400);
      });
    });

    describe('GET /miembros - Listar miembros', () => {
      it('debe retornar lista de miembros', async () => {
        const response = await request(app.getHttpServer())
          .get('/miembros')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('debe filtrar miembros activos con ?activo=true', async () => {
        const response = await request(app.getHttpServer())
          .get('/miembros?activo=true')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((miembro: any) => {
          expect(miembro.activo).toBe(true);
        });
      });
    });

    describe('GET /miembros/buscar - Buscar miembros', () => {
      it('debe buscar miembros por nombre', async () => {
        const response = await request(app.getHttpServer())
          .get('/miembros/buscar?q=Test')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('debe retornar array vacío si no hay query', async () => {
        const response = await request(app.getHttpServer())
          .get('/miembros/buscar?q=')
          .expect(200);

        expect(response.body).toEqual([]);
      });
    });

    describe('GET /miembros/:id - Obtener miembro', () => {
      it('debe retornar miembro por ID', async () => {
        if (!createdMiembroId) return;

        const response = await request(app.getHttpServer())
          .get(`/miembros/${createdMiembroId}`)
          .expect(200);

        expect(response.body.id).toBe(createdMiembroId);
        expect(response.body.nombre).toBe('Test');
      });

      it('debe retornar mensaje si ID no existe', async () => {
        const response = await request(app.getHttpServer())
          .get('/miembros/999999')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('GET /miembros/:id/completo - Miembro con detalles', () => {
      it('debe retornar miembro con membresía y deudas', async () => {
        if (!createdMiembroId) return;

        const response = await request(app.getHttpServer())
          .get(`/miembros/${createdMiembroId}/completo`)
          .expect(200);

        expect(response.body).toHaveProperty('membresia');
        expect(response.body).toHaveProperty('deudas');
        expect(response.body).toHaveProperty('totalDeuda');
      });
    });

    describe('PUT /miembros/:id - Actualizar miembro', () => {
      it('debe actualizar datos del miembro', async () => {
        if (!createdMiembroId) return;

        const updateData = {
          telefono: '0888888888',
          notas: 'Actualizado por test E2E',
        };

        const response = await request(app.getHttpServer())
          .put(`/miembros/${createdMiembroId}`)
          .send(updateData)
          .expect(200);

        expect(response.body.telefono).toBe('0888888888');
        expect(response.body.notas).toBe('Actualizado por test E2E');
      });
    });

    describe('DELETE /miembros/:id - Desactivar miembro', () => {
      it('debe desactivar miembro (soft delete)', async () => {
        if (!createdMiembroId) return;

        const response = await request(app.getHttpServer())
          .delete(`/miembros/${createdMiembroId}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('desactivado');

        // Reactivar para otros tests
        await request(app.getHttpServer())
          .put(`/miembros/${createdMiembroId}`)
          .send({ activo: true });
      });
    });
  });

  // ==========================================
  // TESTS PARA /planes
  // ==========================================
  describe('/planes (REST API)', () => {
    it('GET /planes - debe listar todos los planes', async () => {
      const response = await request(app.getHttpServer())
        .get('/planes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ==========================================
  // TESTS PARA /membresias
  // ==========================================
  describe('/membresias (REST API)', () => {
    it('GET /membresias - debe listar todas las membresías', async () => {
      const response = await request(app.getHttpServer())
        .get('/membresias')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /membresias/activas - debe listar membresías activas', async () => {
      const response = await request(app.getHttpServer())
        .get('/membresias/activas')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((mem: any) => {
        expect(mem.estado).toBe('activa');
      });
    });

    it('GET /membresias/por-vencer - debe listar membresías por vencer', async () => {
      const response = await request(app.getHttpServer())
        .get('/membresias/por-vencer')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /membresias/vencidas - debe listar membresías vencidas', async () => {
      const response = await request(app.getHttpServer())
        .get('/membresias/vencidas')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ==========================================
  // TESTS PARA /deudas
  // ==========================================
  describe('/deudas (REST API)', () => {
    it('GET /deudas - debe listar todas las deudas', async () => {
      const response = await request(app.getHttpServer())
        .get('/deudas')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /deudas/pendientes - debe listar deudas pendientes', async () => {
      const response = await request(app.getHttpServer())
        .get('/deudas/pendientes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /deudas/miembros-con-deudas - debe listar miembros morosos', async () => {
      const response = await request(app.getHttpServer())
        .get('/deudas/miembros-con-deudas')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ==========================================
  // TESTS PARA /pagos
  // ==========================================
  describe('/pagos (REST API)', () => {
    it('GET /pagos - debe listar todos los pagos', async () => {
      const response = await request(app.getHttpServer())
        .get('/pagos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /pagos/resumen-mes - debe retornar resumen del mes', async () => {
      const response = await request(app.getHttpServer())
        .get('/pagos/resumen-mes')
        .expect(200);

      expect(response.body).toHaveProperty('total_pagos');
      expect(response.body).toHaveProperty('ingresos_totales');
    });

    it('GET /pagos/por-metodo - debe retornar pagos agrupados por método', async () => {
      const response = await request(app.getHttpServer())
        .get('/pagos/por-metodo')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ==========================================
  // TESTS PARA /asistencias
  // ==========================================
  describe('/asistencias (REST API)', () => {
    it('GET /asistencias - debe listar asistencias', async () => {
      const response = await request(app.getHttpServer())
        .get('/asistencias')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /asistencias/hoy - debe retornar asistencias del día', async () => {
      const response = await request(app.getHttpServer())
        .get('/asistencias/hoy')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /asistencias/en-gym - debe retornar miembros actualmente en gym', async () => {
      const response = await request(app.getHttpServer())
        .get('/asistencias/en-gym')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /asistencias/estadisticas-dia - debe retornar estadísticas por día', async () => {
      const response = await request(app.getHttpServer())
        .get('/asistencias/estadisticas-dia')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    describe('Check-in / Check-out', () => {
      it('POST /asistencias/check-in/:id - debe registrar entrada', async () => {
        if (!createdMiembroId) return;

        const response = await request(app.getHttpServer())
          .post(`/asistencias/check-in/${createdMiembroId}`)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.miembroId).toBe(createdMiembroId);
      });

      it('POST /asistencias/check-out/:id - debe registrar salida', async () => {
        if (!createdMiembroId) return;

        const response = await request(app.getHttpServer())
          .post(`/asistencias/check-out/${createdMiembroId}`)
          .expect(201);

        expect(response.body).toHaveProperty('success');
      });
    });
  });

  // ==========================================
  // TESTS PARA /dashboard
  // ==========================================
  describe('/dashboard (REST API)', () => {
    it('GET /dashboard/resumen - debe retornar métricas generales', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/resumen')
        .expect(200);

      expect(response.body).toHaveProperty('total_miembros_activos');
      expect(response.body).toHaveProperty('membresias_activas');
      expect(response.body).toHaveProperty('membresias_vencidas');
      expect(response.body).toHaveProperty('ingresos_mes');
      expect(response.body).toHaveProperty('deuda_total');
      expect(response.body).toHaveProperty('visitas_hoy');
    });

    it('GET /dashboard/top-miembros - debe retornar top 5 frecuentes', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/top-miembros')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('GET /dashboard/ingresos-por-plan - debe retornar ingresos agrupados', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/ingresos-por-plan')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
