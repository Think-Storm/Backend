import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PasswordEncryption } from '../../../src/common/encryption/passwordEncryption';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('PasswordEncryption', () => {
  let passwordEncryption: PasswordEncryption;

  beforeAll(() => {
    passwordEncryption = new PasswordEncryption();
    jest.clearAllMocks();
  });

  describe('createSaltAndHashedPassword', () => {
    it('should create salt and hashed password', async () => {
      const mockSalt = 'test-salt';
      const mockHash = 'hashed-password';
      const password = 'test-password';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result =
        await passwordEncryption.createSaltAndHashedPassword(password);

      expect(result).toEqual({
        passwordSalt: mockSalt,
        hashedPassword: mockHash,
      });
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
    });

    it('should handle errors during salt generation', async () => {
      const error = new Error('Salt generation failed');
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(error);

      await expect(
        passwordEncryption.createSaltAndHashedPassword('test-password'),
      ).rejects.toThrow('Salt generation failed');
    });

    it('should handle errors during password hashing', async () => {
      const error = new Error('Hash generation failed');
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('test-salt');
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      await expect(
        passwordEncryption.createSaltAndHashedPassword('test-password'),
      ).rejects.toThrow('Hash generation failed');
    });
  });

  describe('isPasswordCorrect', () => {
    it('should return true for correct password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await passwordEncryption.isPasswordCorrect(
        'correct-password',
        'hashed-password',
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correct-password',
        'hashed-password',
      );
    });

    it('should return false for incorrect password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await passwordEncryption.isPasswordCorrect(
        'wrong-password',
        'hashed-password',
      );

      expect(result).toBe(false);
    });

    it('should handle bcrypt compare errors', async () => {
      const error = new Error('Compare failed');
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(
        passwordEncryption.isPasswordCorrect(
          'test-password',
          'hashed-password',
        ),
      ).rejects.toThrow('Compare failed');
    });
  });

  describe('changedPasswordAfter', () => {
    it('should return true if password was changed after token was issued', async () => {
      const user = {
        passwordChangedAt: new Date(Date.now()),
      } as User;
      const tokenTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      const result = await passwordEncryption.changedPasswordAfter(
        user,
        tokenTimestamp,
      );

      expect(result).toBe(true);
    });

    it('should return false if password was changed before token was issued', async () => {
      const user = {
        passwordChangedAt: new Date(Date.now() - 7200000), // 2 hours ago
      } as User;
      const tokenTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      const result = await passwordEncryption.changedPasswordAfter(
        user,
        tokenTimestamp,
      );

      expect(result).toBe(false);
    });

    it('should return false if password was never changed', async () => {
      const user = {
        passwordChangedAt: null,
      } as User;
      const tokenTimestamp = Math.floor(Date.now() / 1000);

      const result = await passwordEncryption.changedPasswordAfter(
        user,
        tokenTimestamp,
      );

      expect(result).toBe(false);
    });
  });
});
