import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UserRole,
} from '@boxplay/shared';
import * as bcrypt from 'bcryptjs';
import { User } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { OnboardingStatus } from '@boxplay/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();
    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    if (dto.phone) {
      const existingPhone = await this.usersService.findByPhone(dto.phone);
      if (existingPhone) {
        throw new ConflictException('Phone number is already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const userRole = dto.role || UserRole.PLAYER;

    // Run within database transaction
    const { user, walletBalance } = await this.dataSource.transaction(
      async (manager) => {
        // 1. Create user record
        const userRepo = manager.getRepository(User);
        const newUser = userRepo.create({
          name: dto.name,
          email,
          phone: dto.phone || null,
          passwordHash,
          role: userRole,
          isVerified: false,
          isActive: true,
          onboardingStatus:
            userRole === UserRole.OWNER
              ? OnboardingStatus.PENDING
              : OnboardingStatus.APPROVED,
        });
        const savedUser = await userRepo.save(newUser);

        // 2. Create user wallet
        const wallet = await this.walletService.createWallet(
          savedUser.id,
          manager,
        );

        // 3. Add signup bonus (₹50) only for PLAYER role
        let balance = 0;
        if (userRole === UserRole.PLAYER) {
          await this.walletService.addSignupBonus(wallet.id, manager);
          balance = 50.0;
        }

        return { user: savedUser, walletBalance: balance };
      },
    );

    // Generate Access & Refresh tokens
    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        walletBalance,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    let user = await this.usersService.findByEmail(dto.loginId);
    if (!user) {
      user = await this.usersService.findByPhone(dto.loginId);
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const wallet = await this.walletService.getWalletByUserId(user.id);
    let walletBalance = 0;
    if (wallet) {
      walletBalance = await this.walletService.getBalanceByWalletId(wallet.id);
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        walletBalance,
      },
    };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new ForbiddenException('Access Denied');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.update(userId, { refreshTokenHash: null });
  }

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);
    return { accessToken, refreshToken };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshTokenHash: hash });
  }
}
