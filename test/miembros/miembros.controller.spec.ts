import { Test, TestingModule } from '@nestjs/testing';
import { MiembrosController } from '../../src/miembros/miembros.controller';
import { MiembrosService } from '../../src/miembros/miembros.service';
import { MembresiasService } from '../../src/membresias/membresias.service';
import { DeudasService } from '../../src/deudas/deudas.service';
import { PlanesService } from '../../src/planes/planes.service';
import { CreateMiembroDto } from '../../src/miembros/dto/create-miembro.dto';
import { UpdateMiembroDto } from '../../src/miembros/dto/update-miembro.dto';

describe('MiembrosController', () => {
  let controller: MiembrosController;
  let miembrosService: MiembrosService;
  let membresiasService: MembresiasService;
  let deudasService: DeudasService;
  let planesService: PlanesService;

  // Mock data
  const mockMiembro = {
    id: 1,
    codigoMiembro: 'GYM-0001',
    nombre: 'Juan',
    apellido: 'Pérez',
    cedula: '1234567890',
    email: 'juan@test.com',
    telefono: '0999999999',
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlan = {
    id: 1,
    nombre: 'Mensual',
    descripcion: 'Plan mensual básico',
    duracionMeses: 1,
    precio: 50.0,
    beneficios: ['Acceso al gym', 'Vestuarios'],
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembresia = {
    id: 1,
    miembroId: 1,
    planId: 1,
    fechaInicio: new Date(),
    fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    mesesPagados: 1,
    precioPagado: 50.0,
    estado: 'activa' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeuda = {
    id: 1,
    miembroId: 1,
    montoTotal: 20.0,
    montoPagado: 0,
    montoPendiente: 20.0,
    concepto: 'Saldo pendiente - Mensual',
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    estado: 'pendiente' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiembrosController],
      providers: [
        {
          provide: MiembrosService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllActive: jest.fn(),
            findOne: jest.fn(),
            search: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: MembresiasService,
          useValue: {
            create: jest.fn(),
            findActivaByMiembro: jest.fn(),
          },
        },
        {
          provide: DeudasService,
          useValue: {
            create: jest.fn(),
            findByMiembro: jest.fn(),
          },
        },
        {
          provide: PlanesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MiembrosController>(MiembrosController);
    miembrosService = module.get<MiembrosService>(MiembrosService);
    membresiasService = module.get<MembresiasService>(MembresiasService);
    deudasService = module.get<DeudasService>(DeudasService);
    planesService = module.get<PlanesService>(PlanesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /miembros', () => {
    it('debe crear un miembro sin membresía', async () => {
      const createDto: CreateMiembroDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: '1234567890',
        email: 'juan@test.com',
        telefono: '0999999999',
      };

      jest.spyOn(miembrosService, 'create').mockResolvedValue(mockMiembro);

      const result = await controller.create(createDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('codigoMiembro', 'GYM-0001');
      expect(miembrosService.create).toHaveBeenCalledWith(createDto);
    });

    it('debe crear un miembro con membresía completa (pago total)', async () => {
      const createDto: CreateMiembroDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: '1234567890',
        planId: 1,
        montoPagado: 50.0,
        precioPlan: 50.0,
      };

      jest.spyOn(miembrosService, 'create').mockResolvedValue(mockMiembro);
      jest.spyOn(planesService, 'findOne').mockResolvedValue(mockPlan);
      jest.spyOn(membresiasService, 'create').mockResolvedValue(mockMembresia);

      const result = await controller.create(createDto);

      expect(result).toHaveProperty('membresia');
      expect(result.deuda).toBeNull();
      expect(result.mensaje).toBe('Miembro registrado exitosamente');
      expect(membresiasService.create).toHaveBeenCalled();
    });

    it('debe crear un miembro con deuda parcial', async () => {
      const createDto: CreateMiembroDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: '1234567890',
        planId: 1,
        montoPagado: 30.0,
        precioPlan: 50.0,
      };

      jest.spyOn(miembrosService, 'create').mockResolvedValue(mockMiembro);
      jest.spyOn(planesService, 'findOne').mockResolvedValue(mockPlan);
      jest.spyOn(membresiasService, 'create').mockResolvedValue(mockMembresia);
      jest.spyOn(deudasService, 'create').mockResolvedValue(mockDeuda);

      const result = await controller.create(createDto);

      expect(result).toHaveProperty('membresia');
      expect(result).toHaveProperty('deuda');
      expect(result.mensaje).toContain('deuda');
      expect(deudasService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          miembroId: 1,
          montoTotal: 20.0,
          montoPagado: 0,
        }),
      );
    });
  });

  describe('GET /miembros', () => {
    it('debe retornar todos los miembros', async () => {
      const mockMiembros = [mockMiembro];
      jest.spyOn(miembrosService, 'findAll').mockResolvedValue(mockMiembros);

      const result = await controller.findAll();

      expect(result).toEqual(mockMiembros);
      expect(miembrosService.findAll).toHaveBeenCalled();
    });

    it('debe filtrar solo miembros activos', async () => {
      const mockMiembros = [mockMiembro];
      jest.spyOn(miembrosService, 'findAllActive').mockResolvedValue(mockMiembros);

      const result = await controller.findAll('true');

      expect(result).toEqual(mockMiembros);
      expect(miembrosService.findAllActive).toHaveBeenCalled();
    });
  });

  describe('GET /miembros/buscar', () => {
    it('debe buscar miembros por query', async () => {
      const mockMiembros = [mockMiembro];
      jest.spyOn(miembrosService, 'search').mockResolvedValue(mockMiembros);

      const result = await controller.search('Juan');

      expect(result).toEqual(mockMiembros);
      expect(miembrosService.search).toHaveBeenCalledWith('Juan');
    });

    it('debe retornar array vacío si no hay query', async () => {
      const result = await controller.search('');

      expect(result).toEqual([]);
    });
  });

  describe('GET /miembros/:id', () => {
    it('debe retornar un miembro por ID', async () => {
      jest.spyOn(miembrosService, 'findOne').mockResolvedValue(mockMiembro);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockMiembro);
      expect(miembrosService.findOne).toHaveBeenCalledWith(1);
    });

    it('debe retornar mensaje si no encuentra el miembro', async () => {
      jest.spyOn(miembrosService, 'findOne').mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(result).toEqual({ message: 'Miembro no encontrado' });
    });
  });

  describe('GET /miembros/:id/completo', () => {
    it('debe retornar miembro con membresía y deudas', async () => {
      const mockDeudasPendientes = [mockDeuda];

      jest.spyOn(miembrosService, 'findOne').mockResolvedValue(mockMiembro);
      jest.spyOn(membresiasService, 'findActivaByMiembro').mockResolvedValue(mockMembresia);
      jest.spyOn(deudasService, 'findByMiembro').mockResolvedValue(mockDeudasPendientes);

      const result = await controller.findOneCompleto('1');

      expect(result).toHaveProperty('membresia');
      expect(result).toHaveProperty('deudas');
      expect(result).toHaveProperty('totalDeuda', 20.0);
      expect(result.deudas).toHaveLength(1);
    });

    it('debe retornar mensaje si no encuentra el miembro', async () => {
      jest.spyOn(miembrosService, 'findOne').mockResolvedValue(null);

      const result = await controller.findOneCompleto('999');

      expect(result).toEqual({ message: 'Miembro no encontrado' });
    });
  });

  describe('PUT /miembros/:id', () => {
    it('debe actualizar un miembro', async () => {
      const updateDto: UpdateMiembroDto = {
        telefono: '0987654321',
      };

      const updatedMiembro = { ...mockMiembro, ...updateDto };
      jest.spyOn(miembrosService, 'update').mockResolvedValue(updatedMiembro);

      const result = await controller.update('1', updateDto);

      expect(result.telefono).toBe('0987654321');
      expect(miembrosService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('DELETE /miembros/:id', () => {
    it('debe desactivar un miembro (soft delete)', async () => {
      const mockResponse = { message: 'Miembro Juan Pérez ha sido desactivado' };
      jest.spyOn(miembrosService, 'remove').mockResolvedValue(mockResponse);

      const result = await controller.remove('1');

      expect(result).toEqual(mockResponse);
      expect(miembrosService.remove).toHaveBeenCalledWith(1);
    });
  });
});
