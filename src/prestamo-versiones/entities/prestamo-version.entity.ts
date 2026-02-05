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
import { FrecuenciaPago } from '../../frecuencia-pago/entities/frecuencia-pago.entity';
import { Cuota } from '../../cuotas/entities/cuota.entity';

@Entity('prestamo_versiones')
@Index('idx_prestamo_versiones_prestamo', ['prestamoId'])
export class PrestamoVersion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'prestamo_id' })
  prestamoId: number;

  @Column({ type: 'smallint', name: 'frecuencia_pago_id' })
  frecuenciaPagoId: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  monto: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'interes_porcentaje',
  })
  interesPorcentaje: number;

  @Column({ type: 'int', name: 'plazo_meses' })
  plazoMeses: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'monto_total' })
  montoTotal: number;

  @Column({ type: 'date', name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ type: 'date', name: 'fecha_fin', nullable: true })
  fechaFin: Date;

  @ManyToOne(() => Prestamo, (prestamo) => prestamo.versiones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestamo_id' })
  prestamo: Prestamo;

  @ManyToOne(() => FrecuenciaPago, (fp) => fp.prestamoVersiones, {
    eager: true,
  })
  @JoinColumn({ name: 'frecuencia_pago_id' })
  frecuenciaPago: FrecuenciaPago;

  @OneToMany(() => Cuota, (cuota) => cuota.prestamoVersion)
  cuotas: Cuota[];
}
