import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Miembro } from '../miembros/entities/miembro.entity';
import { Membresia } from '../membresias/entities/membresia.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Deuda } from '../deudas/entities/deuda.entity';
import { Asistencia } from '../asistencias/entities/asistencia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Miembro, Membresia, Pago, Deuda, Asistencia]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
