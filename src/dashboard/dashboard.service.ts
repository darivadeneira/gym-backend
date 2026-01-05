import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Miembro } from '../miembros/entities/miembro.entity';
import { Membresia } from '../membresias/entities/membresia.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Deuda } from '../deudas/entities/deuda.entity';
import { Asistencia } from '../asistencias/entities/asistencia.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Miembro)
    private miembrosRepository: Repository<Miembro>,
    @InjectRepository(Membresia)
    private membresiasRepository: Repository<Membresia>,
    @InjectRepository(Pago)
    private pagosRepository: Repository<Pago>,
    @InjectRepository(Deuda)
    private deudasRepository: Repository<Deuda>,
    @InjectRepository(Asistencia)
    private asistenciasRepository: Repository<Asistencia>,
  ) {}

  // Query 13: Resumen general del gym
  async getResumenGeneral() {
    const [
      totalMiembrosActivos,
      membresiasActivas,
      membresiasVencidas,
      ingresosMes,
      deudaTotal,
      visitasHoy,
    ] = await Promise.all([
      this.miembrosRepository.count({ where: { activo: true } }),
      this.membresiasRepository.count({ where: { estado: 'activa' } }),
      this.membresiasRepository.count({ where: { estado: 'vencida' } }),
      this.getIngresosMes(),
      this.getDeudaTotal(),
      this.getVisitasHoy(),
    ]);

    return {
      total_miembros_activos: totalMiembrosActivos,
      membresias_activas: membresiasActivas,
      membresias_vencidas: membresiasVencidas,
      ingresos_mes: ingresosMes,
      deuda_total: deudaTotal,
      visitas_hoy: visitasHoy,
    };
  }

  // Query 14: Top 5 miembros más frecuentes (último mes)
  async getTopMiembrosFrecuentes(): Promise<any[]> {
    const result = await this.asistenciasRepository
      .createQueryBuilder('a')
      .innerJoin('a.miembro', 'm')
      .select('m.id', 'id')
      .addSelect("CONCAT(m.nombre, ' ', m.apellido)", 'miembro')
      .addSelect('COUNT(a.id)', 'visitas')
      .addSelect('COALESCE(SUM(a.duracion_minutos), 0)', 'minutos_totales')
      .where('a.fecha_entrada >= CURRENT_DATE - INTERVAL \'30 days\'')
      .groupBy('m.id')
      .orderBy('visitas', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      miembro: r.miembro,
      visitas: parseInt(r.visitas) || 0,
      minutos_totales: parseInt(r.minutos_totales) || 0,
    }));
  }

  // Query 15: Ingresos por plan de membresía
  async getIngresosPorPlan(): Promise<any[]> {
    const result = await this.pagosRepository
      .createQueryBuilder('p')
      .innerJoin('p.membresia', 'mem')
      .innerJoin('mem.plan', 'pm')
      .select('pm.nombre', 'plan')
      .addSelect('COUNT(p.id)', 'cantidad_pagos')
      .addSelect('COALESCE(SUM(p.monto), 0)', 'ingresos_totales')
      .groupBy('pm.id')
      .orderBy('ingresos_totales', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      plan: r.plan,
      cantidad_pagos: parseInt(r.cantidad_pagos) || 0,
      ingresos_totales: parseFloat(r.ingresos_totales) || 0,
    }));
  }

  private async getIngresosMes(): Promise<number> {
    const result = await this.pagosRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.monto), 0)', 'total')
      .where('EXTRACT(MONTH FROM p.fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE)')
      .andWhere('EXTRACT(YEAR FROM p.fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE)')
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  private async getDeudaTotal(): Promise<number> {
    const result = await this.deudasRepository
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.monto_pendiente), 0)', 'total')
      .where('d.estado IN (:...estados)', { estados: ['pendiente', 'parcial'] })
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  private async getVisitasHoy(): Promise<number> {
    const result = await this.asistenciasRepository
      .createQueryBuilder('a')
      .select('COUNT(*)', 'total')
      .where('a.fecha_entrada::date = CURRENT_DATE')
      .getRawOne();

    return parseInt(result?.total) || 0;
  }
}
