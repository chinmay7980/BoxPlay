import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ISport } from '@boxplay/shared';
import { Court } from './court.entity';

@Entity('sports')
export class Sport implements ISport {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 60, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  slug: string;

  @Column({ type: 'text', name: 'icon_url', nullable: true })
  iconUrl: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Court, (court) => court.sport)
  courts: Court[];
}
