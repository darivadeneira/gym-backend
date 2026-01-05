import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeudasService } from '../../src/deudas/deudas.service';
import { Deuda } from '../../src/deudas/entities/deuda.entity';

describe('DeudasService', () => {
  let service: DeudasService;
  let repository: Repository<Deuda>;

  const mockDeuda: Deuda = {
    id: 1,
    miembroId: 1,
    montoTotal: 100.0,
    montoPagado: 0,
    montoPendiente: 100.0,
    concepto: 'Saldo pendiente - Plan Mensual',
    fechaVencimiento: new Date('2025-02-20'),
    estado: 'pendiente',
    createdAt: new Date(),
    updatedAt: new Date(),
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
        DeudasService,
        {
          provide: getRepositoryToken(Deuda),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DeudasService>(DeudasService);
    repository = module.get<Repository<Deuda>>(getRepositoryToken(Deuda));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear deuda con estado "pendiente" si no se ha pagado nada', async () => {
      const data = {
        miembroId: 1,
        montoTotal: 100.0,
        montoPagado: 0,
        concepto: 'Saldo pendiente',
        fechaVencimiento: new Date('2025-02-20'),
      };

      mockRepository.create.mockReturnValue(mockDeuda);
      mockRepository.save.mockResolvedValue(mockDeuda);

      const result = await service.create(data);

      expect(result.estado).toBe('pendiente');
      expect(result.montoPendiente).toBe(100.0);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          montoPendiente: 100.0,
          estado: 'pendiente',
        }),
      );
    });

    it('debe crear deuda con estado "parcial" si hay un pago parcial', async () => {
      const data = {
        miembroId: 1,
        montoTotal: 100.0,
        montoPagado: 30.0,
        concepto: 'Saldo pendiente',
      };

      const deudaParcial = {
        ...mockDeuda,
        montoPagado: 30.0,
        montoPendiente: 70.0,
        estado: 'parcial' as const,
      };

      mockRepository.create.mockReturnValue(deudaParcial);
      mockRepository.save.mockResolvedValue(deudaParcial);

      const result = await service.create(data);

      expect(result.estado).toBe('parcial');
      expect(result.montoPendiente).toBe(70.0);
    });

    it('debe calcular montoPendiente correctamente', async () => {
      const data = {
        miembroId: 1,
        montoTotal: 150.0,
        montoPagado: 50.0,
        concepto: 'Test',
      };

      mockRepository.create.mockReturnValue({ ...mockDeuda, montoPendiente: 100.0 });
      mockRepository.save.mockResolvedValue({ ...mockDeuda, montoPendiente: 100.0 });

      const result = await service.create(data);

      expect(result.montoPendiente).toBe(100.0);
    });
  });

  describe('abonar', () => {
    it('debe sumar el abono al montoPagado y actualizar montoPendiente', async () => {
      const deudaConAbono = {
        ...mockDeuda,
        montoPagado: 50.0,
        montoPendiente: 50.0,
        estado: 'parcial' as const,
      };

      mockRepository.findOne.mockResolvedValue(mockDeuda);
      mockRepository.save.mockResolvedValue(deudaConAbono);

      const result = await service.abonar(1, 50.0);

      expect(result.montoPagado).toBe(50.0);
      expect(result.montoPendiente).toBe(50.0);
      expect(result.estado).toBe('parcial');
    });

    it('debe cambiar estado a "pagada" si montoPentiente <= 0', async () => {
      const deudaPagada = {
        ...mockDeuda,
        montoPagado: 100.0,
        montoPendiente: 0,
        estado: 'pagada' as const,
      };

      mockRepository.findOne.mockResolvedValue(mockDeuda);
      mockRepository.save.mockResolvedValue(deudaPagada);

      const result = await service.abonar(1, 100.0);

      expect(result.estado).toBe('pagada');
      expect(result.montoPendiente).toBe(0);
    });

    it('debe lanzar error si la deuda no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.abonar(999, 50.0)).rejects.toThrow('Deuda no encontrada');
    });
  });

  describe('getMiembrosConDeudas', () => {
    it('debe retornar miembros con la suma total de sus deudas', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            nombre: 'Juan Pérez',
            telefono: '0999999999',
            email: 'juan@test.com',
            deuda_total: 150.0,
          },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getMiembrosConDeudas();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('deuda_total', 150.0);
      expect(result[0]).toHaveProperty('nombre', 'Juan Pérez');
    });
  });

  describe('getDeudaTotal', () => {
    it('debe calcular la suma de todas las deudas pendientes', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '500.00' }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getDeudaTotal();

      expect(result).toBe(500.0);
    });

    it('debe retornar 0 si no hay deudas', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getDeudaTotal();

      expect(result).toBe(0);
    });
  });

  describe('findByMiembro', () => {
    it('debe retornar todas las deudas de un miembro', async () => {
      mockRepository.find.mockResolvedValue([mockDeuda]);

      const result = await service.findByMiembro(1);

      expect(result).toEqual([mockDeuda]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { miembroId: 1 },
        order: { fechaVencimiento: 'DESC' },
      });
    });
  });
});
