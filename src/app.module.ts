import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MiembrosModule } from './miembros/miembros.module';
import { PlanesModule } from './planes/planes.module';
import { MembresiasModule } from './membresias/membresias.module';
import { PagosModule } from './pagos/pagos.module';
import { DeudasModule } from './deudas/deudas.module';
import { AsistenciasModule } from './asistencias/asistencias.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'gymAdmin',
      password: 'gympass7979',
      database: 'gymdatabase',
      autoLoadEntities: true,
      synchronize: true, // Crear tablas automáticamente (solo desarrollo)
    }),
    MiembrosModule,
    PlanesModule,
    MembresiasModule,
    PagosModule,
    DeudasModule,
    AsistenciasModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
