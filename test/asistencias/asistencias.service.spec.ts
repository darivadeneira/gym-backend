import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AsistenciasService } from '../../src/asistencias/asistencias.service';
import { Asistencia } from '../../src/asistencias/entities/asistencia.entity';

describe('AsistenciasService', () => {
  let service: AsistenciasService;
  let repository: Repository<Asistencia>;

  const mockAsistencia: Asistencia = {
    id: 1,
    miembroId: 1,
    fechaEntrada: new Date('2025-12-20T08:00:00'),
    fechaSalida: null,
    duracionMinutos: null,
    miembro: null,
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsistenciasService,
        {
          provide: getRepositoryToken(Asistencia),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AsistenciasService>(AsistenciasService);
    repository = module.get<Repository<Asistencia>>(getRepositoryToken(Asistencia));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIn', () => {
    it('debe registrar entrada de un miembro', async () => {
      mockRepository.create.mockReturnValue(mockAsistencia);
      mockRepository.save.mockResolvedValue(mockAsistencia);

      const result = await service.checkIn(1);

      expect(result).toEqual(mockAsistencia);
      expect(mockRepository.create).toHaveBeenCalledWith({
        miembroId: 1,
        fechaEntrada: expect.any(Date),
      });
    });
  });

  describe('checkOut', () => {
    it('debe registrar salida y calcular duración en minutos', async () => {
      const asistenciaActiva = {
        ...mockAsistencia,
        fechaEntrada: new Date(Date.now() - 150 * 60000), // 150 minutos atrás
      };

      const asistenciaConSalida = {
        ...asistenciaActiva,
        fechaSalida: new Date(),
        duracionMinutos: 150,
      };

      mockRepository.findOne.mockResolvedValue(asistenciaActiva);
      mockRepository.save.mockResolvedValue(asistenciaConSalida);

      const result = await service.checkOut(1);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('duracion_minutos');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe retornar error si no existe check-in activo', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.checkOut(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No hay check-in activo');
    });
  });

  describe('getAsistenciasHoy', () => {
    it('debe retornar asistencias del día actual', async () => {
      const mockQueryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockAsistencia,
            miembro: {
              id: 1,
              nombre: 'Juan',
              apellido: 'Pérez',
            },
          },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAsistenciasHoy();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('miembro', 'Juan Pérez');
      expect(result[0]).toHaveProperty('entrada');
    });
  });

  describe('getMiembrosEnGym', () => {
    it('debe retornar solo miembros sin check-out', async () => {
      const mockQueryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockAsistencia,
            miembro: {
              id: 1,
              nombre: 'Juan',
              apellido: 'Pérez',
            },
          },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getMiembrosEnGym();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('minutos_transcurridos');
    });
  });

  describe('getEstadisticasPorDia', () => {
    it('debe retornar estadísticas agrupadas por día de la semana', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            dia: 'Monday',
            total_visitas: 45,
            promedio_minutos: 90.5,
          },
          {
            dia: 'Tuesday',
            total_visitas: 38,
            promedio_minutos: 85.2,
          },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getEstadisticasPorDia();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('dia', 'Monday');
      expect(result[0]).toHaveProperty('total_visitas', 45);
      expect(result[0]).toHaveProperty('promedio_minutos', 90.5);
    });
  });

  describe('getVisitasHoy', () => {
    it('debe contar visitas del día actual', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '25' }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getVisitasHoy();

      expect(result).toBe(25);
    });
  });
});
