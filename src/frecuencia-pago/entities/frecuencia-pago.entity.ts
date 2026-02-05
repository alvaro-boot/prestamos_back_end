import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PrestamoVersion } from '../../prestamo-versiones/entities/prestamo-version.entity';

@Entity('frecuencia_pago')
export class FrecuenciaPago {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion: string;

  @Column({ type: 'smallint', name: 'cuotas_por_mes', default: 1 })
  cuotasPorMes: number;

  @OneToMany(() => PrestamoVersion, (version) => version.frecuenciaPago)
  prestamoVersiones: PrestamoVersion[];
}
