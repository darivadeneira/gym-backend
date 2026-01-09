import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    ConfigModule.forRoot({ isGlobal: true }), // Carga .env automáticamente
    TypeOrmModule.forRoot({
      type: 'postgres', // REQUERIDO: TypeORM necesita saber el driver
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // Crear tablas automáticamente (solo desarrollo)
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
export class AppModule { }
