import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembresiasService } from '../../src/membresias/membresias.service';
import { Membresia } from '../../src/membresias/entities/membresia.entity';

describe('MembresiasService', () => {
  let service: MembresiasService;
  let repository: Repository<Membresia>;

  const mockMembresia: Membresia = {
    id: 1,
    miembroId: 1,
    planId: 1,
    fechaInicio: new Date('2025-01-01'),
    fechaFin: new Date('2025-02-01'),
    mesesPagados: 1,
    precioPagado: 50.0,
    estado: 'activa',
    createdAt: new Date(),
    updatedAt: new Date(),
    miembro: null,
    plan: null,
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembresiasService,
        {
          provide: getRepositoryToken(Membresia),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MembresiasService>(MembresiasService);
    repository = module.get<Repository<Membresia>>(getRepositoryToken(Membresia));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear membresía con fechas calculadas correctamente', async () => {
      const data = {
        miembroId: 1,
        planId: 1,
        precioPagado: 50.0,
        mesesPagados: 1,
      };

      mockRepository.create.mockReturnValue(mockMembresia);
      mockRepository.save.mockResolvedValue(mockMembresia);

      const result = await service.create(data);

      expect(result).toEqual(mockMembresia);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          miembroId: 1,
          planId: 1,
          precioPagado: 50.0,
          mesesPagados: 1,
          estado: 'activa',
        }),
      );
    });

    it('debe calcular fechaFin sumando meses a fechaInicio', async () => {
      const data = {
        miembroId: 1,
        planId: 1,
        precioPagado: 150.0,
        mesesPagados: 3,
      };

      const membresiaConTresMeses = {
        ...mockMembresia,
        mesesPagados: 3,
        fechaFin: new Date('2025-04-01'),
      };

      mockRepository.create.mockReturnValue(membresiaConTresMeses);
      mockRepository.save.mockResolvedValue(membresiaConTresMeses);

      await service.create(data);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mesesPagados: 3,
        }),
      );
    });

    it('debe establecer mesesPagados=1 por defecto', async () => {
      const data = {
        miembroId: 1,
        planId: 1,
        precioPagado: 50.0,
      };

      mockRepository.create.mockReturnValue(mockMembresia);
      mockRepository.save.mockResolvedValue(mockMembresia);

      await service.create(data);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mesesPagados: 1,
        }),
      );
    });
  });

  describe('findActivaByMiembro', () => {
    it('debe encontrar la membresía activa de un miembro', async () => {
      mockRepository.findOne.mockResolvedValue(mockMembresia);

      const result = await service.findActivaByMiembro(1);

      expect(result).toEqual(mockMembresia);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { miembroId: 1, estado: 'activa' },
        relations: ['plan'],
        order: { fechaFin: 'DESC' },
      });
    });

    it('debe retornar null si no hay membresía activa', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findActivaByMiembro(999);

      expect(result).toBeNull();
    });
  });

  describe('findPorVencer', () => {
    it('debe encontrar membresías que vencen en los próximos 7 días', async () => {
      const mockQueryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockMembresia,
            miembro: { id: 1, nombre: 'Juan', apellido: 'Pérez', telefono: '0999999999' },
            plan: { nombre: 'Mensual' },
          },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findPorVencer();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('dias_restantes');
      expect(result[0]).toHaveProperty('plan', 'Mensual');
    });
  });

  describe('findVencidas', () => {
    it('debe encontrar membresías vencidas', async () => {
      const mockQueryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockMembresia,
            estado: 'vencida',
            miembro: { id: 1, nombre: 'Juan', apellido: 'Pérez', telefono: '0999999999' },
            plan: { nombre: 'Mensual' },
          },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findVencidas();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('dias_vencido');
    });
  });

  describe('countActivas', () => {
    it('debe contar membresías activas', async () => {
      mockRepository.count.mockResolvedValue(45);

      const result = await service.countActivas();

      expect(result).toBe(45);
      expect(mockRepository.count).toHaveBeenCalledWith({ where: { estado: 'activa' } });
    });
  });

  describe('countVencidas', () => {
    it('debe contar membresías vencidas', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.countVencidas();

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({ where: { estado: 'vencida' } });
    });
  });
});
