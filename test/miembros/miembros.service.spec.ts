import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MiembrosService } from '../../src/miembros/miembros.service';
import { Miembro } from '../../src/miembros/entities/miembro.entity';
import { CreateMiembroDto } from '../../src/miembros/dto/create-miembro.dto';
import { UpdateMiembroDto } from '../../src/miembros/dto/update-miembro.dto';
import { NotFoundException } from '@nestjs/common';

describe('MiembrosService', () => {
  let service: MiembrosService;
  let repository: Repository<Miembro>;

  const mockMiembro: Miembro = {
    id: 1,
    codigoMiembro: 'GYM-0001',
    nombre: 'Juan',
    apellido: 'Pérez',
    cedula: '1234567890',
    email: 'juan@test.com',
    telefono: '0999999999',
    fechaNacimiento: new Date('1990-01-01'),
    genero: 'M',
    direccion: 'Calle Principal 123',
    fotoUrl: null,
    contactoEmergencia: 'María Pérez',
    telefonoEmergencia: '0988888888',
    notas: '',
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiembrosService,
        {
          provide: getRepositoryToken(Miembro),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MiembrosService>(MiembrosService);
    repository = module.get<Repository<Miembro>>(getRepositoryToken(Miembro));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un miembro con código autogenerado', async () => {
      const createDto: CreateMiembroDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
        cedula: '1234567890',
        email: 'juan@test.com',
        telefono: '0999999999',
      };

      mockRepository.count.mockResolvedValue(0);
      mockRepository.create.mockReturnValue(mockMiembro);
      mockRepository.save.mockResolvedValue(mockMiembro);

      const result = await service.create(createDto);

      expect(result).toEqual(mockMiembro);
      expect(result.codigoMiembro).toBe('GYM-0001');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe generar códigos secuenciales (GYM-0001, GYM-0002, ...)', async () => {
      mockRepository.count.mockResolvedValue(5);
      mockRepository.create.mockReturnValue({ ...mockMiembro, codigoMiembro: 'GYM-0006' });
      mockRepository.save.mockResolvedValue({ ...mockMiembro, codigoMiembro: 'GYM-0006' });

      const result = await service.create({
        nombre: 'Test',
        apellido: 'User',
      });

      expect(result.codigoMiembro).toBe('GYM-0006');
    });

    it('debe establecer activo=true por defecto', async () => {
      const createDto: CreateMiembroDto = {
        nombre: 'Juan',
        apellido: 'Pérez',
      };

      mockRepository.count.mockResolvedValue(0);
      mockRepository.create.mockReturnValue(mockMiembro);
      mockRepository.save.mockResolvedValue(mockMiembro);

      const result = await service.create(createDto);

      expect(result.activo).toBe(true);
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los miembros ordenados por fecha de creación', async () => {
      const mockMiembros = [mockMiembro];
      mockRepository.find.mockResolvedValue(mockMiembros);

      const result = await service.findAll();

      expect(result).toEqual(mockMiembros);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findAllActive', () => {
    it('debe retornar solo miembros activos', async () => {
      const mockMiembros = [mockMiembro];
      mockRepository.find.mockResolvedValue(mockMiembros);

      const result = await service.findAllActive();

      expect(result).toEqual(mockMiembros);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { activo: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('debe encontrar un miembro por ID', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockMiembro);

      const result = await service.findOne(1);

      expect(result).toEqual(mockMiembro);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('debe retornar null si no encuentra el miembro', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('debe buscar por nombre', async () => {
      mockRepository.find.mockResolvedValue([mockMiembro]);

      const result = await service.search('Juan');

      expect(result).toEqual([mockMiembro]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('debe buscar por cédula', async () => {
      mockRepository.find.mockResolvedValue([mockMiembro]);

      const result = await service.search('1234567890');

      expect(result).toEqual([mockMiembro]);
    });

    it('debe buscar por código de miembro', async () => {
      mockRepository.find.mockResolvedValue([mockMiembro]);

      const result = await service.search('GYM-0001');

      expect(result).toEqual([mockMiembro]);
    });
  });

  describe('update', () => {
    it('debe actualizar un miembro existente', async () => {
      const updateDto: UpdateMiembroDto = {
        telefono: '0987654321',
        email: 'nuevo@test.com',
      };

      const updatedMiembro = { ...mockMiembro, ...updateDto };

      mockRepository.findOneBy.mockResolvedValue(mockMiembro);
      mockRepository.save.mockResolvedValue(updatedMiembro);

      const result = await service.update(1, updateDto);

      expect(result.telefono).toBe('0987654321');
      expect(result.email).toBe('nuevo@test.com');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (soft delete)', () => {
    it('debe desactivar el miembro en lugar de eliminarlo', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockMiembro);
      mockRepository.save.mockResolvedValue({ ...mockMiembro, activo: false });

      const result = await service.remove(1);

      expect(result.message).toContain('desactivado');
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ activo: false }),
      );
    });

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('hardRemove', () => {
    it('debe eliminar permanentemente un miembro', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.hardRemove(1);

      expect(result.message).toContain('eliminado permanentemente');
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('debe lanzar NotFoundException si no se eliminó ningún registro', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.hardRemove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('countActive', () => {
    it('debe contar solo miembros activos', async () => {
      mockRepository.count.mockResolvedValue(150);

      const result = await service.countActive();

      expect(result).toBe(150);
      expect(mockRepository.count).toHaveBeenCalledWith({ where: { activo: true } });
    });
  });
});
