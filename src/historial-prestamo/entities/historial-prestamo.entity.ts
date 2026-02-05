import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Prestamo } from '../../prestamos/entities/prestamo.entity';

@Entity('historial_prestamo')
@Index('idx_historial_prestamo', ['prestamoId'])
export class HistorialPrestamo {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'prestamo_id' })
  prestamoId: number;

  @Column({ type: 'varchar', length: 50 })
  accion: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'estado_anterior',
    nullable: true,
  })
  estadoAnterior: string;

  @Column({ type: 'varchar', length: 50, name: 'estado_nuevo', nullable: true })
  estadoNuevo: string;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @ManyToOne(() => Prestamo, (prestamo) => prestamo.historial, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestamo_id' })
  prestamo: Prestamo;
}
