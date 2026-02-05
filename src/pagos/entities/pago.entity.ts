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
import { Cuota } from '../../cuotas/entities/cuota.entity';

@Entity('pagos')
@Index('idx_pagos_prestamo', ['prestamoId'])
@Index('idx_pagos_cuota', ['cuotaId'])
export class Pago {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'prestamo_id' })
  prestamoId: number;

  @Column({ type: 'bigint', name: 'cuota_id', nullable: true })
  cuotaId: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'monto_pagado' })
  montoPagado: number;

  @Column({ type: 'varchar', length: 30, name: 'metodo_pago', nullable: true })
  metodoPago: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia: string;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @CreateDateColumn({ name: 'fecha_pago' })
  fechaPago: Date;

  @ManyToOne(() => Prestamo, (prestamo) => prestamo.pagos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestamo_id' })
  prestamo: Prestamo;

  @ManyToOne(() => Cuota, (cuota) => cuota.pagos, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cuota_id' })
  cuota: Cuota | null;
}
