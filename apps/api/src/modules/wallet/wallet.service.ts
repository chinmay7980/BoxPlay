import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import {
  WalletTransactionType,
  WalletTransactionReason,
} from '@boxplay/shared';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
  ) {}

  async createWallet(userId: string, manager?: EntityManager): Promise<Wallet> {
    const repo = manager
      ? manager.getRepository(Wallet)
      : this.walletRepository;
    const wallet = repo.create({ userId });
    return repo.save(wallet);
  }

  async addSignupBonus(
    walletId: string,
    manager?: EntityManager,
  ): Promise<WalletTransaction> {
    const repo = manager
      ? manager.getRepository(WalletTransaction)
      : this.transactionRepository;
    const txn = repo.create({
      walletId,
      type: WalletTransactionType.CREDIT,
      amount: 50.0,
      reason: WalletTransactionReason.SIGNUP_BONUS,
      description: 'Signup bonus credit of ₹50',
    });
    return repo.save(txn);
  }

  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    return this.walletRepository.findOne({
      where: { userId },
    });
  }

  async getBalanceByWalletId(
    walletId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager
      ? manager.getRepository(WalletTransaction)
      : this.transactionRepository;
    const result = (await repo
      .createQueryBuilder('wt')
      .select(
        "COALESCE(SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN wt.type = 'debit' THEN wt.amount ELSE 0 END), 0)",
        'balance',
      )
      .where('wt.wallet_id = :walletId', { walletId })
      .getRawOne()) as unknown as { balance: string } | undefined;

    return parseFloat(result?.balance || '0.00');
  }

  async getWalletDetails(
    userId: string,
  ): Promise<{ balance: number; transactions: WalletTransaction[] }> {
    let wallet = await this.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    const balance = await this.getBalanceByWalletId(wallet.id);
    const transactions = await this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });

    return {
      balance,
      transactions,
    };
  }

  async topUpWallet(
    userId: string,
    amount: number,
  ): Promise<{ balance: number; transaction: WalletTransaction }> {
    let wallet = await this.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Top-up amount must be a positive number');
    }

    const { transaction, newBalance } = await this.walletRepository.manager.transaction(
      async (manager) => {
        const repo = manager.getRepository(WalletTransaction);
        const txn = repo.create({
          walletId: wallet.id,
          type: WalletTransactionType.CREDIT,
          amount,
          reason: WalletTransactionReason.TOPUP,
          description: `Loaded ₹${amount.toFixed(2)} into wallet`,
        });
        const savedTxn = await repo.save(txn);
        const balance = await this.getBalanceByWalletId(wallet.id, manager);
        return { transaction: savedTxn, newBalance: balance };
      },
    );

    return {
      balance: newBalance,
      transaction,
    };
  }
}
