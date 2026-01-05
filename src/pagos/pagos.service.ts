import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
  ) {}

  findAll(): Promise<Pago[]> {
    return this.pagosRepository.find({
      relations: ['miembro'],
      order: { fechaPago: 'DESC' },
    });
  }

  findOne(id: number): Promise<Pago | null> {
    return this.pagosRepository.findOne({
      where: { id },
      relations: ['miembro', 'membresia'],
    });
  }

  findByMiembro(miembroId: number): Promise<Pago[]> {
    return this.pagosRepository.find({
      where: { miembroId },
      order: { fechaPago: 'DESC' },
    });
  }

  // Query 6: Resumen de pagos del mes actual
  async getResumenMes(): Promise<any> {
    const result = await this.pagosRepository
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total_pagos')
      .addSelect('COALESCE(SUM(p.monto), 0)', 'ingresos_totales')
      .addSelect('COALESCE(SUM(p.monto_pendiente), 0)', 'pendientes_totales')
      .addSelect('COALESCE(AVG(p.monto), 0)', 'promedio_pago')
      .where('MONTH(p.fecha_pago) = MONTH(CURDATE())')
      .andWhere('YEAR(p.fecha_pago) = YEAR(CURDATE())')
      .getRawOne();

    return {
      total_pagos: parseInt(result.total_pagos) || 0,
      ingresos_totales: parseFloat(result.ingresos_totales) || 0,
      pendientes_totales: parseFloat(result.pendientes_totales) || 0,
      promedio_pago: parseFloat(result.promedio_pago) || 0,
    };
  }

  // Query 7: Pagos por método de pago
  async getPagosPorMetodo(): Promise<any[]> {
    const result = await this.pagosRepository
      .createQueryBuilder('p')
      .select('p.metodo_pago', 'metodo_pago')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(p.monto), 0)', 'total')
      .where('MONTH(p.fecha_pago) = MONTH(CURDATE())')
      .andWhere('YEAR(p.fecha_pago) = YEAR(CURDATE())')
      .groupBy('p.metodo_pago')
      .getRawMany();

    return result.map((r) => ({
      metodo_pago: r.metodo_pago,
      cantidad: parseInt(r.cantidad),
      total: parseFloat(r.total),
    }));
  }

  async getIngresosMes(): Promise<number> {
    const result = await this.pagosRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.monto), 0)', 'total')
      .where('MONTH(p.fecha_pago) = MONTH(CURDATE())')
      .andWhere('YEAR(p.fecha_pago) = YEAR(CURDATE())')
      .getRawOne();

    return parseFloat(result.total) || 0;
  }
}
