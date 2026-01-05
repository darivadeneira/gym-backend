import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('planes_membresia')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'duracion_meses', default: 1 })
  duracionMeses: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
  precio: number;

  @Column({ type: 'json', nullable: true })
  beneficios: string[];

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
