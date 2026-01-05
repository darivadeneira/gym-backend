import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Miembro } from './entities/miembro.entity';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { validarCedulaEcuatoriana, obtenerErrorCedula } from '../common/utils/cedula-validator';

@Injectable()
export class MiembrosService {
  constructor(
    @InjectRepository(Miembro)
    private miembrosRepository: Repository<Miembro>,
  ) {}

  // Generar código de miembro único
  private async generateCodigoMiembro(): Promise<string> {
    const count = await this.miembrosRepository.count();
    const nextNumber = count + 1;
    return `GYM-${String(nextNumber).padStart(4, '0')}`;
  }

  // CREATE - Crear nuevo miembro
  async create(createMiembroDto: CreateMiembroDto): Promise<Miembro> {
    // Validar formato de cédula ecuatoriana
    if (createMiembroDto.cedula) {
      const errorCedula = obtenerErrorCedula(createMiembroDto.cedula);
      if (errorCedula) {
        throw new BadRequestException(errorCedula);
      }

      // Verificar si la cédula ya existe
      const existingByCedula = await this.miembrosRepository.findOneBy({ 
        cedula: createMiembroDto.cedula 
      });
      if (existingByCedula) {
        throw new ConflictException(
          `Ya existe un miembro registrado con la cédula ${createMiembroDto.cedula}`
        );
      }
    }

    // Verificar si el email ya existe
    if (createMiembroDto.email) {
      const existingByEmail = await this.miembrosRepository.findOneBy({ 
        email: createMiembroDto.email 
      });
      if (existingByEmail) {
        throw new ConflictException(
          `Ya existe un miembro registrado con el email ${createMiembroDto.email}`
        );
      }
    }

    const codigoMiembro = await this.generateCodigoMiembro();
    
    const miembro = this.miembrosRepository.create({
      ...createMiembroDto,
      codigoMiembro,
      activo: createMiembroDto.activo ?? true,
      fechaRegistro: new Date(),
    });

    return this.miembrosRepository.save(miembro);
  }

  // READ - Obtener todos los miembros
  findAll(): Promise<Miembro[]> {
    return this.miembrosRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // READ - Obtener solo miembros activos
  findAllActive(): Promise<Miembro[]> {
    return this.miembrosRepository.find({
      where: { activo: true },
      order: { createdAt: 'DESC' },
    });
  }

  // READ - Obtener un miembro por ID
  async findOne(id: number): Promise<Miembro | null> {
    return this.miembrosRepository.findOneBy({ id });
  }

  // READ - Buscar miembros
  search(query: string): Promise<Miembro[]> {
    return this.miembrosRepository.find({
      where: [
        { nombre: Like(`%${query}%`) },
        { apellido: Like(`%${query}%`) },
        { cedula: Like(`%${query}%`) },
        { codigoMiembro: Like(`%${query}%`) },
      ],
    });
  }

  // UPDATE - Actualizar miembro
  async update(id: number, updateMiembroDto: UpdateMiembroDto): Promise<Miembro> {
    const miembro = await this.findOne(id);
    
    if (!miembro) {
      throw new NotFoundException(`Miembro con ID ${id} no encontrado`);
    }

    // Actualizar campos
    Object.assign(miembro, updateMiembroDto);
    
    return this.miembrosRepository.save(miembro);
  }

  // DELETE - Eliminar miembro (soft delete - solo desactivar)
  async remove(id: number): Promise<{ message: string }> {
    const miembro = await this.findOne(id);
    
    if (!miembro) {
      throw new NotFoundException(`Miembro con ID ${id} no encontrado`);
    }

    // Soft delete: solo desactivar
    miembro.activo = false;
    await this.miembrosRepository.save(miembro);

    return { message: `Miembro ${miembro.nombre} ${miembro.apellido} ha sido desactivado` };
  }

  // DELETE HARD - Eliminar permanentemente (usar con cuidado)
  async hardRemove(id: number): Promise<{ message: string }> {
    const result = await this.miembrosRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Miembro con ID ${id} no encontrado`);
    }

    return { message: 'Miembro eliminado permanentemente' };
  }

  // Contar miembros activos
  async countActive(): Promise<number> {
    return this.miembrosRepository.count({ where: { activo: true } });
  }
}
