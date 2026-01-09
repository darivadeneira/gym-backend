import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Deuda } from './entities/deuda.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Membresia } from '../membresias/entities/membresia.entity';

@Injectable()
export class DeudasService {
  constructor(
    @InjectRepository(Deuda)
    private deudasRepository: Repository<Deuda>,
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(Membresia)
    private membresiasRepository: Repository<Membresia>,
  ) { }

  findAll(): Promise<Deuda[]> {
    return this.deudasRepository.find({
      relations: ['miembro'],
      order: { fechaVencimiento: 'DESC' },
    });
  }

  findOne(id: number): Promise<Deuda | null> {
    return this.deudasRepository.findOne({
      where: { id },
      relations: ['miembro'],
    });
  }

  // Query 8: Miembros con deudas pendientes
  async getMiembrosConDeudas(): Promise<any[]> {
    const result = await this.deudasRepository
      .createQueryBuilder('d')
      .innerJoin('d.miembro', 'm')
      .select('m.id', 'id')
      .addSelect("CONCAT(m.nombre, ' ', m.apellido)", 'nombre')
      .addSelect('m.telefono', 'telefono')
      .addSelect('m.email', 'email')
      .addSelect('SUM(d.monto_pendiente)', 'deuda_total')
      .where('d.estado IN (:...estados)', { estados: ['pendiente', 'parcial'] })
      .groupBy('m.id')
      .orderBy('deuda_total', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      telefono: r.telefono,
      email: r.email,
      deuda_total: parseFloat(r.deuda_total) || 0,
    }));
  }

  // Query 9: Detalle de deudas por miembro
  findByMiembro(miembroId: number): Promise<Deuda[]> {
    return this.deudasRepository.find({
      where: { miembroId },
      order: { fechaVencimiento: 'DESC' },
    });
  }

  findPendientes(): Promise<Deuda[]> {
    return this.deudasRepository.find({
      where: { estado: In(['pendiente', 'parcial']) },
      relations: ['miembro'],
      order: { fechaVencimiento: 'ASC' },
    });
  }

  async getDeudaTotal(): Promise<number> {
    const result = await this.deudasRepository
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.monto_pendiente), 0)', 'total')
      .where('d.estado IN (:...estados)', { estados: ['pendiente', 'parcial'] })
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  // CREATE - Crear nueva deuda
  async create(data: {
    miembroId: number;
    montoTotal: number;
    montoPagado: number;
    concepto: string;
    fechaVencimiento?: Date;
  }): Promise<Deuda> {
    const montoPendiente = data.montoTotal - data.montoPagado;
    const estado = data.montoPagado > 0 ? 'parcial' : 'pendiente';

    const deuda = this.deudasRepository.create({
      miembroId: data.miembroId,
      montoTotal: data.montoTotal,
      montoPagado: data.montoPagado,
      montoPendiente,
      concepto: data.concepto,
      fechaVencimiento: data.fechaVencimiento || new Date(),
      estado,
    });

    return this.deudasRepository.save(deuda);
  }

  // Abonar a una deuda
  async abonar(id: number, monto: number): Promise<Deuda> {
    const deuda = await this.findOne(id);
    if (!deuda) {
      throw new Error('Deuda no encontrada');
    }

    deuda.montoPagado += monto;
    deuda.montoPendiente = deuda.montoTotal - deuda.montoPagado;

    if (deuda.montoPendiente <= 0) {
      deuda.estado = 'pagada';
      deuda.montoPendiente = 0;
    } else {
      deuda.estado = 'parcial';
    }

    // Registrar pago
    const pago = this.pagosRepository.create({
      miembroId: deuda.miembroId,
      monto: monto,
      metodoPago: 'efectivo', // Default
      concepto: `Abono a deuda: ${deuda.concepto}`,
      fechaPago: new Date()
    });
    await this.pagosRepository.save(pago);

    return this.deudasRepository.save(deuda);
  }

  // UPDATE - Actualizar deuda manualmente
  async update(id: number, data: Partial<Deuda>): Promise<Deuda> {
    const deuda = await this.findOne(id);
    if (!deuda) {
      throw new Error('Deuda no encontrada');
    }

    const oldMontoPagado = Number(deuda.montoPagado);

    Object.assign(deuda, data);

    // Recalcular pendiente si cambiaron los montos
    if (data.montoTotal !== undefined || data.montoPagado !== undefined) {
      deuda.montoPendiente = Number(deuda.montoTotal) - Number(deuda.montoPagado);

      if (deuda.montoPendiente <= 0) {
        deuda.estado = 'pagada';
        deuda.montoPendiente = 0;
      } else if (deuda.montoPagado > 0) {
        deuda.estado = 'parcial';
      } else {
        deuda.estado = 'pendiente';
      }

      // Lógica inteligente para actualizar Pagos
      const newMontoPagado = Number(deuda.montoPagado);

      if (newMontoPagado !== oldMontoPagado) {
        // Buscar pagos con el mismo concepto, ordenados por fecha (más reciente primero)
        const pagosExistentes = await this.pagosRepository.find({
          where: { miembroId: deuda.miembroId, concepto: deuda.concepto },
          order: { fechaPago: 'DESC' }
        });

        if (pagosExistentes.length > 0) {
          // Estrategia: Aplicar la diferencia al último pago registrado
          // Esto permite "corregir" el último pago o acumular en él, evitando duplicados
          const ultimoPago = pagosExistentes[0];
          const diff = newMontoPagado - oldMontoPagado;

          // Actualizar monto
          ultimoPago.monto = Number(ultimoPago.monto) + diff;

          // Evitar montos negativos (opcional, pero buena práctica)
          if (ultimoPago.monto < 0) ultimoPago.monto = 0;

          await this.pagosRepository.save(ultimoPago);
        } else {
          // Si no hay pagos previos, creamos uno nuevo con la diferencia
          // (o con el total si partimos de cero)
          // Nota: Si oldMontoPagado > 0 pero no hay pagos, hay inconsistencia previa.
          // Asumimos que el usuario quiere registrar el "nuevo" valor visible.
          const diff = newMontoPagado - oldMontoPagado;
          if (diff > 0) {
            const pago = this.pagosRepository.create({
              miembroId: deuda.miembroId,
              monto: diff,
              metodoPago: 'efectivo',
              concepto: `Ajuste/Abono: ${deuda.concepto}`,
              fechaPago: new Date()
            });
            await this.pagosRepository.save(pago);
          }
        }
      }

      // Sincronizar precioPagado en la membresía si la deuda es de membresía
      if (deuda.concepto.includes('Membresía')) {
        const membresia = await this.membresiasRepository.findOne({
          where: { miembroId: deuda.miembroId, estado: 'activa' }
        });

        if (membresia) {
          membresia.precioPagado = Number(deuda.montoPagado);
          await this.membresiasRepository.save(membresia);
        }
      }
    }

    return this.deudasRepository.save(deuda);
  }
}

