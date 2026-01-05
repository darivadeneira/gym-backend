import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, Length, IsNumber } from 'class-validator';

export class CreateMiembroDto {
  @IsString()
  @Length(2, 100)
  nombre: string;

  @IsString()
  @Length(2, 100)
  apellido: string;

  @IsOptional()
  @IsString()
  @Length(10, 20)
  cedula?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(7, 20)
  telefono?: string;

  @IsOptional()
  @IsString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsEnum(['M', 'F', 'Otro'])
  genero?: 'M' | 'F' | 'Otro';

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsString()
  contactoEmergencia?: string;

  @IsOptional()
  @IsString()
  telefonoEmergencia?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  // Datos para crear membresía inicial (opcional)
  @IsOptional()
  @IsNumber()
  planId?: number;

  // Monto pagado (si es menor al plan, se crea deuda)
  @IsOptional()
  @IsNumber()
  montoPagado?: number;

  // Precio del plan (para calcular deuda)
  @IsOptional()
  @IsNumber()
  precioPlan?: number;

  // Método de pago (efectivo o transferencia)
  @IsOptional()
  @IsString()
  metodoPago?: 'efectivo' | 'transferencia';

  // URL del comprobante de transferencia
  @IsOptional()
  @IsString()
  comprobanteUrl?: string;
}

