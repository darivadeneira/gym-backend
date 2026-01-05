import { Controller, Get, Post, Param } from '@nestjs/common';
import { AsistenciasService } from './asistencias.service';

@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly asistenciasService: AsistenciasService) {}

  @Get()
  findAll() {
    return this.asistenciasService.findAll();
  }

  @Get('hoy')
  getAsistenciasHoy() {
    return this.asistenciasService.getAsistenciasHoy();
  }

  @Get('en-gym')
  getMiembrosEnGym() {
    return this.asistenciasService.getMiembrosEnGym();
  }

  @Get('estadisticas-semana')
  getEstadisticasPorDia() {
    return this.asistenciasService.getEstadisticasPorDia();
  }

  @Post('check-in/:miembroId')
  checkIn(@Param('miembroId') miembroId: string) {
    return this.asistenciasService.checkIn(+miembroId);
  }

  @Post('check-out/:miembroId')
  checkOut(@Param('miembroId') miembroId: string) {
    return this.asistenciasService.checkOut(+miembroId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.asistenciasService.findOne(+id);
  }
}
