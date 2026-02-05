import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { PrestamoVersion } from '../../prestamo-versiones/entities/prestamo-version.entity';
import { Cuota } from '../../cuotas/entities/cuota.entity';
import { Pago } from '../../pagos/entities/pago.entity';
import { HistorialPrestamo } from '../../historial-prestamo/entities/historial-prestamo.entity';

@Entity('prestamos')
@Index('idx_prestamos_cliente', ['clienteId'])
@Index('idx_prestamos_estado', ['estado'])
@Index('idx_prestamos_organizacion', ['organizacionId'])
export class Prestamo {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'organizacion_id' })
  organizacionId: number;

  @Column({ type: 'bigint', name: 'cliente_id' })
  clienteId: number;

  @Column({
    type: 'enum',
    enum: ['ACTIVO', 'CANCELADO', 'REFINANCIADO', 'PAGADO'],
  })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @ManyToOne(() => Cliente, (cliente) => cliente.prestamos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @OneToMany(() => PrestamoVersion, (version) => version.prestamo)
  versiones: PrestamoVersion[];

  @OneToMany(() => Cuota, (cuota) => cuota.prestamo)
  cuotas: Cuota[];

  @OneToMany(() => Pago, (pago) => pago.prestamo)
  pagos: Pago[];

  @OneToMany(() => HistorialPrestamo, (historial) => historial.prestamo)
  historial: HistorialPrestamo[];
}
