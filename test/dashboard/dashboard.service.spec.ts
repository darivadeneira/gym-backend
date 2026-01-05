import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from '../../src/dashboard/dashboard.service';
import { Miembro } from '../../src/miembros/entities/miembro.entity';
import { Membresia } from '../../src/membresias/entities/membresia.entity';
import { Pago } from '../../src/pagos/entities/pago.entity';
import { Deuda } from '../../src/deudas/entities/deuda.entity';
import { Asistencia } from '../../src/asistencias/entities/asistencia.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let miembrosRepository: Repository<Miembro>;
  let membresiasRepository: Repository<Membresia>;
  let pagosRepository: Repository<Pago>;
  let deudasRepository: Repository<Deuda>;
  let asistenciasRepository: Repository<Asistencia>;

  const createMockRepository = () => ({
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Miembro), useValue: createMockRepository() },
        { provide: getRepositoryToken(Membresia), useValue: createMockRepository() },
        { provide: getRepositoryToken(Pago), useValue: createMockRepository() },
        { provide: getRepositoryToken(Deuda), useValue: createMockRepository() },
        { provide: getRepositoryToken(Asistencia), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    miembrosRepository = module.get(getRepositoryToken(Miembro));
    membresiasRepository = module.get(getRepositoryToken(Membresia));
    pagosRepository = module.get(getRepositoryToken(Pago));
    deudasRepository = module.get(getRepositoryToken(Deuda));
    asistenciasRepository = module.get(getRepositoryToken(Asistencia));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getResumenGeneral', () => {
    it('debe retornar resumen con todas las métricas', async () => {
      // Mock counts
      jest.spyOn(miembrosRepository, 'count').mockResolvedValue(150);
      jest.spyOn(membresiasRepository, 'count')
        .mockResolvedValueOnce(120) // activas
        .mockResolvedValueOnce(30); // vencidas

      // Mock query builders para ingresos, deudas y visitas
      const mockPagosQB = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '5000.00' }),
      };

      const mockDeudasQB = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '800.00' }),
      };

      const mockAsistenciasQB = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '45' }),
      };

      jest.spyOn(pagosRepository, 'createQueryBuilder').mockReturnValue(mockPagosQB as any);
      jest.spyOn(deudasRepository, 'createQueryBuilder').mockReturnValue(mockDeudasQB as any);
      jest.spyOn(asistenciasRepository, 'createQueryBuilder').mockReturnValue(mockAsistenciasQB as any);

      const result = await service.getResumenGeneral();

      expect(result).toEqual({
        total_miembros_activos: 150,
        membresias_activas: 120,
        membresias_vencidas: 30,
        ingresos_mes: 5000.0,
        deuda_total: 800.0,
        visitas_hoy: 45,
      });
    });
  });

  describe('getTopMiembrosFrecuentes', () => {
    it('debe retornar top 5 miembros con más visitas', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { id: 1, miembro: 'Juan Pérez', visitas: 25, minutos_totales: 2250 },
          { id: 2, miembro: 'María García', visitas: 22, minutos_totales: 1980 },
          { id: 3, miembro: 'Carlos López', visitas: 20, minutos_totales: 1800 },
          { id: 4, miembro: 'Ana Martínez', visitas: 18, minutos_totales: 1620 },
          { id: 5, miembro: 'Pedro Sánchez', visitas: 15, minutos_totales: 1350 },
        ]),
      };

      jest.spyOn(asistenciasRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTopMiembrosFrecuentes();

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({
        id: 1,
        miembro: 'Juan Pérez',
        visitas: 25,
        minutos_totales: 2250,
      });
    });
  });

  describe('getIngresosPorPlan', () => {
    it('debe retornar ingresos agrupados por plan', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { plan: 'Mensual', cantidad_pagos: 80, ingresos_totales: '4000.00' },
          { plan: 'Trimestral', cantidad_pagos: 20, ingresos_totales: '2400.00' },
          { plan: 'Anual', cantidad_pagos: 5, ingresos_totales: '1500.00' },
        ]),
      };

      jest.spyOn(pagosRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getIngresosPorPlan();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        plan: 'Mensual',
        cantidad_pagos: 80,
        ingresos_totales: 4000.0,
      });
    });
  });
});
