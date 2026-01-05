import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('miembros')
export class Miembro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_miembro', length: 20, unique: true, nullable: true })
  codigoMiembro: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ length: 20, unique: true, nullable: true })
  cedula: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: Date;

  @Column({ type: 'enum', enum: ['M', 'F', 'Otro'], nullable: true })
  genero: 'M' | 'F' | 'Otro';

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ name: 'foto_url', length: 255, nullable: true })
  fotoUrl: string;

  @Column({ name: 'contacto_emergencia', length: 100, nullable: true })
  contactoEmergencia: string;

  @Column({ name: 'telefono_emergencia', length: 20, nullable: true })
  telefonoEmergencia: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'fecha_registro', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaRegistro: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
