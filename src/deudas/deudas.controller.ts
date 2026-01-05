import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { DeudasService } from './deudas.service';

@Controller('deudas')
export class DeudasController {
  constructor(private readonly deudasService: DeudasService) {}

  @Get()
  findAll() {
    return this.deudasService.findAll();
  }

  @Get('pendientes')
  findPendientes() {
    return this.deudasService.findPendientes();
  }

  @Get('miembros-con-deudas')
  getMiembrosConDeudas() {
    return this.deudasService.getMiembrosConDeudas();
  }

  @Get('miembro/:miembroId')
  findByMiembro(@Param('miembroId') miembroId: string) {
    return this.deudasService.findByMiembro(+miembroId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deudasService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const deuda = await this.deudasService.update(+id, updateDto);
    return {
      success: true,
      message: 'Deuda actualizada correctamente',
      data: deuda
    };
  }
}
