import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get()
  getResumenGeneral() {
    return this.dashboardService.getResumenGeneral();
  }

  @Get('top-miembros')
  getTopMiembrosFrecuentes() {
    return this.dashboardService.getTopMiembrosFrecuentes();
  }

  @Get('ingresos-por-plan')
  getIngresosPorPlan() {
    return this.dashboardService.getIngresosPorPlan();
  }

  @Get('ingresos-ultimos-meses')
  getIngresosUltimos6Meses() {
    return this.dashboardService.getIngresosUltimos6Meses();
  }
}
