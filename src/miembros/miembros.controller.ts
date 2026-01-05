import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject, forwardRef } from '@nestjs/common';
import { MiembrosService } from './miembros.service';
import { Miembro } from './entities/miembro.entity';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { MembresiasService } from '../membresias/membresias.service';
import { DeudasService } from '../deudas/deudas.service';
import { PlanesService } from '../planes/planes.service';

@Controller('miembros')
export class MiembrosController {
  constructor(
    private readonly miembrosService: MiembrosService,
    @Inject(forwardRef(() => MembresiasService))
    private readonly membresiasService: MembresiasService,
    @Inject(forwardRef(() => DeudasService))
    private readonly deudasService: DeudasService,
    @Inject(forwardRef(() => PlanesService))
    private readonly planesService: PlanesService,
  ) {}

  // POST /miembros - Crear nuevo miembro con membresía y posible deuda
  @Post()
  async create(@Body() createMiembroDto: CreateMiembroDto): Promise<any> {
    // 1. Crear el miembro
    const miembro = await this.miembrosService.create(createMiembroDto);

    let membresia: any = null;
    let deuda: any = null;

    // 2. Si hay planId, crear membresía
    if (createMiembroDto.planId) {
      const plan = await this.planesService.findOne(createMiembroDto.planId);
      
      if (plan) {
        const precioPlan = createMiembroDto.precioPlan ?? Number(plan.precio);
        const montoPagado = createMiembroDto.montoPagado ?? precioPlan;

        // Crear membresía
        membresia = await this.membresiasService.create({
          miembroId: miembro.id,
          planId: plan.id,
          precioPagado: montoPagado,
          mesesPagados: 1,
          metodoPago: createMiembroDto.metodoPago,
          comprobanteUrl: createMiembroDto.comprobanteUrl,
        });

        // 3. Si pagó menos del precio del plan, crear deuda
        if (montoPagado < precioPlan) {
          const montoDeuda = precioPlan - montoPagado;
          
          const fechaVencimiento = new Date();
          fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // Vence en 30 días

          deuda = await this.deudasService.create({
            miembroId: miembro.id,
            montoTotal: montoDeuda,
            montoPagado: 0,
            concepto: `Saldo pendiente - ${plan.nombre}`,
            fechaVencimiento,
          });
        }
      }
    }

    return {
      success: true,
      message: deuda 
        ? `Miembro registrado con deuda de $${Number(deuda.montoPendiente).toFixed(2)}`
        : 'Miembro registrado exitosamente',
      data: {
        ...miembro,
        membresia,
        deuda,
      },
    };
  }

  // GET /miembros - Obtener todos los miembros (solo datos básicos)
  @Get()
  findAll(@Query('activo') activo?: string): Promise<Miembro[]> {
    if (activo === 'true') {
      return this.miembrosService.findAllActive();
    }
    return this.miembrosService.findAll();
  }

  // GET /miembros/lista - Obtener todos los miembros con membresía y deudas (OPTIMIZADO)
  @Get('lista')
  async findAllWithDetails(): Promise<any[]> {
    const miembros = await this.miembrosService.findAllActive();
    
    // Obtener todos los datos en paralelo para todos los miembros
    const miembrosConDetalles = await Promise.all(
      miembros.map(async (miembro) => {
        const [membresiaActiva, deudas] = await Promise.all([
          this.membresiasService.findActivaByMiembro(miembro.id),
          this.deudasService.findByMiembro(miembro.id),
        ]);
        
        const deudasPendientes = deudas.filter(d => d.estado === 'pendiente' || d.estado === 'parcial');
        
        // Calcular estado de membresía
        let alerta = 'SIN MEMBRESIA';
        let diasRestantes = 0;
        
        if (membresiaActiva && membresiaActiva.fechaFin) {
          const hoy = new Date();
          const fechaFin = new Date(membresiaActiva.fechaFin);
          diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diasRestantes < 0) {
            alerta = 'VENCIDA';
          } else if (diasRestantes <= 7) {
            alerta = 'POR VENCER';
          } else {
            alerta = 'ACTIVA';
          }
        }
        
        return {
          ...miembro,
          codigo_miembro: miembro.codigoMiembro || `GYM-${String(miembro.id).padStart(3, '0')}`,
          plan_nombre: membresiaActiva?.plan?.nombre || null,
          membresia_fecha_inicio: membresiaActiva?.fechaInicio || null,
          membresia_fecha_fin: membresiaActiva?.fechaFin || null,
          membresia_estado: membresiaActiva?.estado || null,
          dias_restantes: diasRestantes,
          alerta,
          total_deuda: deudasPendientes.reduce((sum, d) => sum + Number(d.montoPendiente), 0),
          tiene_deuda: deudasPendientes.length > 0,
        };
      })
    );
    
    return miembrosConDetalles;
  }

  // GET /miembros/buscar?q=texto - Buscar miembros
  @Get('buscar')
  search(@Query('q') query: string): Promise<Miembro[]> {
    if (!query) {
      return Promise.resolve([]);
    }
    return this.miembrosService.search(query);
  }

  // GET /miembros/:id - Obtener un miembro por ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Miembro | { message: string }> {
    const miembro = await this.miembrosService.findOne(+id);
    if (!miembro) {
      return { message: 'Miembro no encontrado' };
    }
    return miembro;
  }

  // GET /miembros/:id/completo - Obtener miembro con membresía y deudas
  @Get(':id/completo')
  async findOneCompleto(@Param('id') id: string): Promise<any> {
    const miembro = await this.miembrosService.findOne(+id);
    if (!miembro) {
      return { message: 'Miembro no encontrado' };
    }

    const membresiaActiva = await this.membresiasService.findActivaByMiembro(+id);
    const deudas = await this.deudasService.findByMiembro(+id);
    const deudasPendientes = deudas.filter(d => d.estado === 'pendiente' || d.estado === 'parcial');

    return {
      ...miembro,
      membresia: membresiaActiva,
      deudas: deudasPendientes,
      totalDeuda: deudasPendientes.reduce((sum, d) => sum + Number(d.montoPendiente), 0),
    };
  }

  // PUT /miembros/:id - Actualizar miembro
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMiembroDto: UpdateMiembroDto,
  ): Promise<{ success: boolean; message: string; data: Miembro }> {
    const miembro = await this.miembrosService.update(+id, updateMiembroDto);
    return {
      success: true,
      message: 'Miembro actualizado correctamente',
      data: miembro,
    };
  }

  // DELETE /miembros/:id - Desactivar miembro (soft delete)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.miembrosService.remove(+id);
  }
}
