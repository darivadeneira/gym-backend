import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MiembrosController } from './miembros.controller';
import { MiembrosService } from './miembros.service';
import { Miembro } from './entities/miembro.entity';
import { MembresiasModule } from '../membresias/membresias.module';
import { DeudasModule } from '../deudas/deudas.module';
import { PlanesModule } from '../planes/planes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Miembro]),
    forwardRef(() => MembresiasModule),
    forwardRef(() => DeudasModule),
    forwardRef(() => PlanesModule),
  ],
  controllers: [MiembrosController],
  providers: [MiembrosService],
  exports: [MiembrosService],
})
export class MiembrosModule {}
