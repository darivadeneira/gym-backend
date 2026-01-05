import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
} from '@nestjs/common';
import { MembresiasService } from './membresias.service';
import * as fs from 'fs';
import * as path from 'path';

// DTO para crear membresía
class CreateMembresiaDto {
  miembroId: number;
  planId: number;
  mesesPagados?: number;
  precioPagado: number;
  metodoPago?: 'efectivo' | 'transferencia';
  comprobanteUrl?: string;
  miembroNombre?: string; // Para organizar archivos
}

@Controller('membresias')
export class MembresiasController {
  constructor(private readonly membresiasService: MembresiasService) {}

  // POST /membresias - Crear nueva membresía con pago y deuda automáticos
  @Post()
  async create(@Body() createMembresiaDto: CreateMembresiaDto) {
    const result = await this.membresiasService.create({
      miembroId: createMembresiaDto.miembroId,
      planId: createMembresiaDto.planId,
      precioPagado: createMembresiaDto.precioPagado,
      mesesPagados: createMembresiaDto.mesesPagados || 1,
      metodoPago: createMembresiaDto.metodoPago,
      comprobanteUrl: createMembresiaDto.comprobanteUrl,
    });

    return {
      success: true,
      message: result.message,
      data: {
        membresia: result.membresia,
        pago: result.pago,
        deuda: result.deuda,
      },
    };
  }

  // POST /membresias/comprobante - Subir comprobante de transferencia (base64)
  @Post('comprobante')
  async uploadComprobante(
    @Body() body: { 
      miembroNombre: string; 
      fileName: string; 
      fileType: string; 
      base64Data: string;
    },
  ) {
    try {
      const { miembroNombre, fileName, base64Data } = body;
      
      if (!base64Data) {
        return {
          success: false,
          message: 'No se recibió ningún archivo',
          url: null,
          filename: null,
        };
      }

      // Limpiar nombre del miembro para usarlo como directorio
      const cleanName = miembroNombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const uploadDir = path.join(process.cwd(), 'uploads', 'comprobantes', cleanName);

      // Crear directorio si no existe
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Nombre del archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      const ext = path.extname(fileName) || '.jpg';
      const finalFileName = `${cleanName}_${fecha}${ext}`;
      const filePath = path.join(uploadDir, finalFileName);

      // Decodificar base64 y guardar
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');
      fs.writeFileSync(filePath, buffer);

      // Retornar URL relativa para acceso HTTP
      const relativeUrl = `/uploads/comprobantes/${cleanName}/${finalFileName}`;

      return {
        success: true,
        message: 'Comprobante subido correctamente',
        url: relativeUrl,
        filename: finalFileName,
      };
    } catch (error) {
      console.error('Error al guardar comprobante:', error);
      return {
        success: false,
        message: 'Error al guardar el comprobante',
        url: null,
        filename: null,
      };
    }
  }

  @Get()
  findAll() {
    return this.membresiasService.findAll();
  }

  @Get('activas')
  findActivas() {
    return this.membresiasService.findActivas();
  }

  @Get('por-vencer')
  findPorVencer() {
    return this.membresiasService.findPorVencer();
  }

  @Get('vencidas')
  findVencidas() {
    return this.membresiasService.findVencidas();
  }

  @Get('miembro/:miembroId')
  findByMiembro(@Param('miembroId') miembroId: string) {
    return this.membresiasService.findByMiembro(+miembroId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membresiasService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    const membresia = await this.membresiasService.update(+id, updateDto);
    return {
      success: true,
      message: 'Membresía actualizada correctamente',
      data: membresia
    };
  }
}
