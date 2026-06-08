import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IWalletTransaction,
  WalletTransactionType,
  WalletTransactionReason,
} from '@boxplay/shared';
import { Wallet } from './wallet.entity';

@Entity('wallet_transactions')
@Index('idx_wallet_txn', ['walletId', 'type'])
export class WalletTransaction implements IWalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'wallet_id' })
  walletId: string;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: WalletTransactionReason,
  })
  reason: WalletTransactionReason;

  @Column({ type: 'uuid', name: 'reference_id', nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
}
