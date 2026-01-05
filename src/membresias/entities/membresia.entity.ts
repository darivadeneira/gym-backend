import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Miembro } from '../../miembros/entities/miembro.entity';
import { Plan } from '../../planes/entities/plan.entity';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('membresias')
export class Membresia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'miembro_id' })
  miembroId: number;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: Date;

  @Column({ name: 'meses_pagados', default: 1 })
  mesesPagados: number;

  @Column({ name: 'precio_pagado', type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
  precioPagado: number;

  @Column({
    type: 'enum',
    enum: ['activa', 'vencida', 'cancelada', 'congelada'],
    default: 'activa',
  })
  estado: 'activa' | 'vencida' | 'cancelada' | 'congelada';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Miembro)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
