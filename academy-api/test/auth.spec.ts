import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../src/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  it('should validate password with bcrypt compare', async () => {
    const rawPassword = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    const match = await bcrypt.compare(rawPassword, hash);
    const wrong = await bcrypt.compare('WrongPassword', hash);

    expect(match).toBe(true);
    expect(wrong).toBe(false);
  });

  it('should throw UnauthorizedException if user not found during login', async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    const mockJwt = { signAsync: vi.fn() };
    const mockConfig = { get: vi.fn() };
    const mockRedis = { get: vi.fn(), set: vi.fn() };

    const service = new AuthService(
      mockPrisma as any,
      mockJwt as any,
      mockConfig as any,
      mockRedis as any,
    );

    await expect(
      service.login({ email: 'inexistente@academias.pe', password: 'password' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
