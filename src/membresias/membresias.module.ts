import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembresiasController } from './membresias.controller';
import { MembresiasService } from './membresias.service';
import { Membresia } from './entities/membresia.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Deuda } from '../deudas/entities/deuda.entity';
import { Plan } from '../planes/entities/plan.entity';
import { Miembro } from '../miembros/entities/miembro.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membresia, Pago, Deuda, Plan, Miembro])],
  controllers: [MembresiasController],
  providers: [MembresiasService],
  exports: [MembresiasService],
})
export class MembresiasModule {}

