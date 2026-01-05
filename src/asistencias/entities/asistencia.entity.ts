import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Miembro } from '../../miembros/entities/miembro.entity';

@Entity('asistencias')
export class Asistencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'miembro_id' })
  miembroId: number;

  @Column({ name: 'fecha_entrada', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaEntrada: Date;

  @Column({ name: 'fecha_salida', type: 'timestamp', nullable: true })
  fechaSalida: Date;

  @Column({ name: 'duracion_minutos', nullable: true })
  duracionMinutos: number;

  @ManyToOne(() => Miembro)
  @JoinColumn({ name: 'miembro_id' })
  miembro: Miembro;
}
