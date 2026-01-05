import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PlanesService } from './planes.service';
import { Plan } from './entities/plan.entity';

@Controller('planes')
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  // GET /planes - Obtener todos los planes
  @Get()
  findAll(@Query('activo') activo?: string): Promise<Plan[]> {
    if (activo === 'true') {
      return this.planesService.findAllActive();
    }
    return this.planesService.findAll();
  }

  // GET /planes/:id - Obtener un plan por ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Plan | { message: string }> {
    const plan = await this.planesService.findOne(+id);
    if (!plan) {
      return { message: 'Plan no encontrado' };
    }
    return plan;
  }
  
  // POST /planes - Crear un nuevo plan
  @Post()
  async create(@Body() createPlanDto: any): Promise<Plan> {
    return this.planesService.create(createPlanDto);
  }
}
