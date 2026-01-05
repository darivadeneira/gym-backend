import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Miembro } from '../../miembros/entities/miembro.entity';
import { Membresia } from '../../membresias/entities/membresia.entity';
import { DecimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'miembro_id' })
  miembroId: number;

  @Column({ name: 'membresia_id', nullable: true })
  membresiaId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
  monto: number;

  @Column({ name: 'monto_pendiente', type: 'decimal', precision: 10, scale: 2, default: 0, transformer: DecimalTransformer })
  montoPendiente: number;

  @Column({
    name: 'metodo_pago',
    type: 'enum',
    enum: ['efectivo', 'tarjeta', 'transferencia', 'otro'],
    default: 'efectivo',
  })
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';

  @Column({ length: 255, nullable: true })
  concepto: string;

  @Column({ name: 'mes_correspondiente', length: 20, nullable: true })
  mesCorrespondiente: string;

  @Column({ name: 'numero_recibo', length: 50, nullable: true })
  numeroRecibo: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ name: 'fecha_pago', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaPago: Date;

  @Column({ name: 'registrado_por', nullable: true })
  registradoPor: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Miembro)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;

  @ManyToOne(() => Membresia)
  @JoinColumn({ name: 'membresia_id' })
  membresia: Membresia;
}
