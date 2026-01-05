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
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('deudas')
export class Deuda {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'miembro_id' })
  miembroId: number;

  @Column({ name: 'monto_total', type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
  montoTotal: number;

  @Column({ name: 'monto_pagado', type: 'decimal', precision: 10, scale: 2, default: 0, transformer: DecimalTransformer })
  montoPagado: number;

  @Column({ name: 'monto_pendiente', type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
  montoPendiente: number;

  @Column({ length: 255 })
  concepto: string;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento: Date;

  @Column({
    type: 'enum',
    enum: ['pendiente', 'parcial', 'pagada', 'cancelada'],
    default: 'pendiente',
  })
  estado: 'pendiente' | 'parcial' | 'pagada' | 'cancelada';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Miembro)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;
}
