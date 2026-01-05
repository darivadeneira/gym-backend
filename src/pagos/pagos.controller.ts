import { Controller, Get, Param } from '@nestjs/common';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get()
  findAll() {
    return this.pagosService.findAll();
  }

  @Get('resumen-mes')
  getResumenMes() {
    return this.pagosService.getResumenMes();
  }

  @Get('por-metodo')
  getPagosPorMetodo() {
    return this.pagosService.getPagosPorMetodo();
  }

  @Get('miembro/:miembroId')
  findByMiembro(@Param('miembroId') miembroId: string) {
    return this.pagosService.findByMiembro(+miembroId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagosService.findOne(+id);
  }
}
