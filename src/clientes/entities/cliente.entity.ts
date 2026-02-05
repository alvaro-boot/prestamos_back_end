import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Prestamo } from '../../prestamos/entities/prestamo.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('clientes')
@Index('idx_clientes_usuario', ['usuarioId'])
@Index('idx_clientes_usuario_documento', ['usuarioId', 'documento'], {
  unique: true,
})
export class Cliente {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'usuario_id' })
  usuarioId: number;

  @Column({ type: 'varchar', length: 20 })
  documento: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @OneToMany(() => Prestamo, (prestamo) => prestamo.cliente)
  prestamos: Prestamo[];
}
