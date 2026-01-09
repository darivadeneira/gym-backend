import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Membresia } from './entities/membresia.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Deuda } from '../deudas/entities/deuda.entity';
import { Plan } from '../planes/entities/plan.entity';
import { Miembro } from '../miembros/entities/miembro.entity';

@Injectable()
export class MembresiasService {
  constructor(
    @InjectRepository(Membresia)
    private membresiasRepository: Repository<Membresia>,
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(Deuda)
    private deudasRepository: Repository<Deuda>,
    @InjectRepository(Plan)
    private planesRepository: Repository<Plan>,
    @InjectRepository(Miembro)
    private miembrosRepository: Repository<Miembro>,
  ) { }

  findAll(): Promise<Membresia[]> {
    return this.membresiasRepository.find({
      relations: ['miembro', 'plan'],
    });
  }

  findOne(id: number): Promise<Membresia | null> {
    return this.membresiasRepository.findOne({
      where: { id },
      relations: ['miembro', 'plan'],
    });
  }

  findByMiembro(miembroId: number): Promise<Membresia[]> {
    return this.membresiasRepository.find({
      where: { miembroId },
      relations: ['plan'],
    });
  }

  findActivas(): Promise<Membresia[]> {
    return this.membresiasRepository.find({
      where: { estado: 'activa' },
      relations: ['miembro', 'plan'],
    });
  }

  // Query 4: Membresías por vencer (próximos 7 días)
  async findPorVencer(): Promise<any[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const membresias = await this.membresiasRepository
      .createQueryBuilder('mem')
      .innerJoinAndSelect('mem.miembro', 'm')
      .innerJoinAndSelect('mem.plan', 'pm')
      .where('mem.estado = :estado', { estado: 'activa' })
      .andWhere('mem.fechaFin BETWEEN :today AND :nextWeek', {
        today: today.toISOString().split('T')[0],
        nextWeek: nextWeek.toISOString().split('T')[0],
      })
      .orderBy('mem.fechaFin', 'ASC')
      .getMany();

    // Si está vacio devolver mensaje de error
    if (membresias.length === 0) {
      throw new NotFoundException('No hay membresías por vencer');
    }

    return membresias.map((mem) => ({
      id: mem.miembro.id,
      nombre: `${mem.miembro.nombre} ${mem.miembro.apellido}`,
      telefono: mem.miembro.telefono,
      fecha_fin: mem.fechaFin,
      dias_restantes: Math.ceil(
        (new Date(mem.fechaFin).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      ),
      plan: mem.plan.nombre,
    }));
  }

  // Query 5: Membresías vencidas
  async findVencidas(): Promise<any[]> {
    const today = new Date();

    const membresias = await this.membresiasRepository
      .createQueryBuilder('mem')
      .innerJoinAndSelect('mem.miembro', 'm')
      .innerJoinAndSelect('mem.plan', 'pm')
      .where('mem.estado = :estado', { estado: 'vencida' })
      .orderBy('mem.fechaFin', 'DESC')
      .getMany();

    return membresias.map((mem) => ({
      id: mem.miembro.id,
      nombre: `${mem.miembro.nombre} ${mem.miembro.apellido}`,
      telefono: mem.miembro.telefono,
      fecha_fin: mem.fechaFin,
      dias_vencido: Math.ceil(
        (today.getTime() - new Date(mem.fechaFin).getTime()) / (1000 * 60 * 60 * 24),
      ),
      plan: mem.plan.nombre,
    }));
  }

  async countActivas(): Promise<number> {
    return this.membresiasRepository.count({ where: { estado: 'activa' } });
  }

  async countVencidas(): Promise<number> {
    return this.membresiasRepository.count({ where: { estado: 'vencida' } });
  }

  // CREATE - Crear nueva membresía con pago y deuda automáticos
  async create(data: {
    miembroId: number;
    planId: number;
    precioPagado: number;
    mesesPagados?: number;
    metodoPago?: 'efectivo' | 'transferencia';
    comprobanteUrl?: string;
  }): Promise<{
    membresia: Membresia;
    pago: Pago | null;
    deuda: Deuda | null;
    message: string;
  }> {
    // 0. Desactivar membresías anteriores activas
    const membresiasActivas = await this.membresiasRepository.find({
      where: { miembroId: data.miembroId, estado: 'activa' }
    });

    if (membresiasActivas.length > 0) {
      for (const mem of membresiasActivas) {
        mem.estado = 'cancelada';
        await this.membresiasRepository.save(mem);
      }
    }

    // 1. Obtener el plan y el miembro
    const plan = await this.planesRepository.findOne({ where: { id: data.planId } });
    if (!plan) {
      throw new Error('Plan no encontrado');
    }

    const miembro = await this.miembrosRepository.findOne({ where: { id: data.miembroId } });
    if (!miembro) {
      throw new Error('Miembro no encontrado');
    }

    const meses = data.mesesPagados || 1;
    const precioTotal = Number(plan.precio) * meses;
    const precioPagado = Number(data.precioPagado) || 0;

    // 2. Crear membresía
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + meses);

    const membresia = this.membresiasRepository.create({
      miembroId: data.miembroId,
      planId: data.planId,
      fechaInicio,
      fechaFin,
      mesesPagados: meses,
      precioPagado,
      estado: 'activa',
    });
    const savedMembresia = await this.membresiasRepository.save(membresia);

    // 3. Crear pago si hay monto pagado
    let pago: Pago | null = null;
    if (precioPagado > 0) {
      pago = this.pagosRepository.create({
        miembroId: data.miembroId,
        membresiaId: savedMembresia.id,
        monto: precioPagado,
        metodoPago: data.metodoPago || 'efectivo',
        concepto: `Membresía ${plan.nombre} - ${meses} mes(es)`,
        mesCorrespondiente: `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth() + 1).padStart(2, '0')}`,
        notas: data.comprobanteUrl ? `Comprobante: ${data.comprobanteUrl}` : undefined,
      });
      await this.pagosRepository.save(pago);
    }

    // 4. Crear deuda si el pago es menor al precio total
    let deuda: Deuda | null = null;
    if (precioPagado < precioTotal) {
      const montoPendiente = precioTotal - precioPagado;
      deuda = this.deudasRepository.create({
        miembroId: data.miembroId,
        montoTotal: precioTotal,
        montoPagado: precioPagado,
        montoPendiente,
        concepto: `Membresía ${plan.nombre} - ${meses} mes(es)`,
        fechaVencimiento: fechaFin,
        estado: precioPagado > 0 ? 'parcial' : 'pendiente',
      });
      await this.deudasRepository.save(deuda);
    }

    // 5. Generar mensaje de respuesta
    let message = 'Membresía asignada correctamente';
    if (pago && !deuda) {
      message = `Membresía asignada. Pago de $${precioPagado.toFixed(2)} registrado.`;
    } else if (pago && deuda) {
      message = `Membresía asignada. Pago de $${precioPagado.toFixed(2)} registrado. Deuda pendiente: $${deuda.montoPendiente.toFixed(2)}`;
    } else if (!pago && deuda) {
      message = `Membresía asignada. Deuda pendiente: $${deuda.montoPendiente.toFixed(2)}`;
    }

    return { membresia: savedMembresia, pago, deuda, message };
  }

  // Obtener membresía activa de un miembro
  async findActivaByMiembro(miembroId: number): Promise<Membresia | null> {
    return this.membresiasRepository.findOne({
      where: { miembroId, estado: 'activa' },
      relations: ['plan'],
      order: { fechaFin: 'DESC' },
    });
  }

  // Obtener última membresía de un miembro (activa o vencida)
  async findUltimaByMiembro(miembroId: number): Promise<Membresia | null> {
    // Primero buscar activa
    const activa = await this.findActivaByMiembro(miembroId);
    if (activa) return activa;

    // Si no hay activa, buscar la más reciente (vencida o cancelada)
    return this.membresiasRepository.findOne({
      where: { miembroId },
      relations: ['plan'],
      order: { fechaFin: 'DESC' },
    });
  }

  // UPDATE - Actualizar membresía manualmente
  async update(id: number, data: Partial<Membresia>): Promise<Membresia> {
    const membresia = await this.findOne(id);
    if (!membresia) {
      throw new Error('Membresía no encontrada');
    }

    const oldPrecioPagado = Number(membresia.precioPagado);

    Object.assign(membresia, data);

    // Si cambió el precio pagado, actualizar el pago existente o registrar ajuste
    if (data.precioPagado !== undefined) {
      const newPrecioPagado = Number(data.precioPagado);

      // Buscar pago asociado a esta membresía
      const pagoExistente = await this.pagosRepository.findOne({
        where: { membresiaId: membresia.id },
        order: { fechaPago: 'ASC' } // Asumimos el primero es el original
      });

      if (pagoExistente) {
        // Actualizar el pago existente
        pagoExistente.monto = newPrecioPagado;
        await this.pagosRepository.save(pagoExistente);
      } else {
        // Si no existe, crear uno nuevo con la diferencia (o el total si no habia nada)
        const diff = newPrecioPagado - oldPrecioPagado;
        if (diff !== 0) {
          const pago = this.pagosRepository.create({
            miembroId: membresia.miembroId,
            membresiaId: membresia.id,
            monto: diff,
            metodoPago: 'efectivo',
            concepto: `Ajuste Membresía ${membresia.id}`,
            fechaPago: new Date()
          });
          await this.pagosRepository.save(pago);
        }
      }
    }

    return this.membresiasRepository.save(membresia);
  }
}
