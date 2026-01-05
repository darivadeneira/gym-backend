import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Asistencia } from './entities/asistencia.entity';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciasRepository: Repository<Asistencia>,
  ) {}

  findAll(): Promise<Asistencia[]> {
    return this.asistenciasRepository.find({
      relations: ['miembro'],
      order: { fechaEntrada: 'DESC' },
    });
  }

  findOne(id: number): Promise<Asistencia | null> {
    return this.asistenciasRepository.findOne({
      where: { id },
      relations: ['miembro'],
    });
  }

  // Query 10: Asistencia del día actual
  async getAsistenciasHoy(): Promise<any[]> {
    const asistencias = await this.asistenciasRepository
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.miembro', 'm')
      .where('a.fechaEntrada::date = CURRENT_DATE')
      .orderBy('a.fechaEntrada', 'DESC')
      .getMany();

    return asistencias.map((a) => ({
      id: a.id,
      miembro: `${a.miembro.nombre} ${a.miembro.apellido}`,
      miembro_id: a.miembroId,
      entrada: a.fechaEntrada,
      salida: a.fechaSalida,
      minutos: a.duracionMinutos || this.calcularMinutos(a.fechaEntrada),
    }));
  }

  // Query 11: Miembros actualmente en el gym (sin check-out)
  async getMiembrosEnGym(): Promise<any[]> {
    const asistencias = await this.asistenciasRepository
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.miembro', 'm')
      .where('a.fechaEntrada::date = CURRENT_DATE')
      .andWhere('a.fechaSalida IS NULL')
      .getMany();

    return asistencias.map((a) => ({
      id: a.miembro.id,
      miembro: `${a.miembro.nombre} ${a.miembro.apellido}`,
      entrada: a.fechaEntrada,
      minutos_transcurridos: this.calcularMinutos(a.fechaEntrada),
    }));
  }

  // Query 12: Estadísticas de asistencia por día de la semana
  async getEstadisticasPorDia(): Promise<any[]> {
    const result = await this.asistenciasRepository
      .createQueryBuilder('a')
      .select("to_char(a.fecha_entrada, 'Day')", 'dia')
      .addSelect('COUNT(*)', 'total_visitas')
      .addSelect('AVG(a.duracion_minutos)', 'promedio_minutos')
      .where('a.fecha_entrada >= CURRENT_DATE - INTERVAL \'30 days\'')
      .groupBy('EXTRACT(DOW FROM a.fecha_entrada)')
      .addGroupBy("to_char(a.fecha_entrada, 'Day')")
      .orderBy('EXTRACT(DOW FROM a.fecha_entrada)', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      dia: r.dia,
      total_visitas: parseInt(r.total_visitas) || 0,
      promedio_minutos: parseFloat(r.promedio_minutos) || 0,
    }));
  }

  async getVisitasHoy(): Promise<number> {
    const result = await this.asistenciasRepository
      .createQueryBuilder('a')
      .select('COUNT(*)', 'total')
      .where('a.fecha_entrada::date = CURRENT_DATE')
      .getRawOne();

    return parseInt(result?.total) || 0;
  }

  // Check-in
  async checkIn(miembroId: number): Promise<Asistencia> {
    const asistencia = this.asistenciasRepository.create({
      miembroId,
      fechaEntrada: new Date(),
    });
    return this.asistenciasRepository.save(asistencia);
  }

  // Check-out
  async checkOut(miembroId: number): Promise<any> {
    const asistencia = await this.asistenciasRepository.findOne({
      where: {
        miembroId,
        fechaSalida: IsNull(),
      },
      order: { fechaEntrada: 'DESC' },
    });

    if (!asistencia) {
      return { success: false, message: 'No hay check-in activo' };
    }

    const ahora = new Date();
    const duracion = Math.floor(
      (ahora.getTime() - new Date(asistencia.fechaEntrada).getTime()) / 60000,
    );

    asistencia.fechaSalida = ahora;
    asistencia.duracionMinutos = duracion;

    await this.asistenciasRepository.save(asistencia);

    return { success: true, duracion_minutos: duracion };
  }

  private calcularMinutos(fechaEntrada: Date): number {
    return Math.floor((Date.now() - new Date(fechaEntrada).getTime()) / 60000);
  }
}
