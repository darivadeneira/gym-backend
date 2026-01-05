import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeudasController } from './deudas.controller';
import { DeudasService } from './deudas.service';
import { Deuda } from './entities/deuda.entity';
import { Pago } from '../pagos/entities/pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deuda, Pago])],
  controllers: [DeudasController],
  providers: [DeudasService],
  exports: [DeudasService],
})
export class DeudasModule {}
