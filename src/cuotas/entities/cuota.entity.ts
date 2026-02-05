import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Prestamo } from '../../prestamos/entities/prestamo.entity';
import { PrestamoVersion } from '../../prestamo-versiones/entities/prestamo-version.entity';
import { Pago } from '../../pagos/entities/pago.entity';

@Entity('cuotas')
@Index('idx_cuotas_prestamo', ['prestamoId'])
@Index('idx_cuotas_version', ['prestamoVersionId'])
@Index('idx_cuotas_estado', ['estado'])
export class Cuota {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'prestamo_id' })
  prestamoId: number;

  @Column({ type: 'bigint', name: 'prestamo_version_id' })
  prestamoVersionId: number;

  @Column({ type: 'int', name: 'numero_cuota' })
  numeroCuota: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'monto_cuota' })
  montoCuota: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'saldo_cuota' })
  saldoCuota: number;

  @Column({ type: 'date', name: 'fecha_vencimiento' })
  fechaVencimiento: Date;

  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'PAGADA', 'VENCIDA', 'PARCIAL', 'REFINANCIADA'],
  })
  estado: string;

  @ManyToOne(() => Prestamo, (prestamo) => prestamo.cuotas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestamo_id' })
  prestamo: Prestamo;

  @ManyToOne(() => PrestamoVersion, (version) => version.cuotas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestamo_version_id' })
  prestamoVersion: PrestamoVersion;

  @OneToMany(() => Pago, (pago) => pago.cuota)
  pagos: Pago[];
}
