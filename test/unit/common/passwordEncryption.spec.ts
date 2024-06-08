import { PasswordEncryption } from '../../../src/common/passwordEncryption';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';

describe('PasswordEncryption', () => {
  let passwordEncryption: PasswordEncryption;
  const defaultPassword = 'defaultPassword';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordEncryption],
    }).compile();

    passwordEncryption = module.get<PasswordEncryption>(PasswordEncryption);
  });

  describe('createSaltAndHashedPassword function', () => {
    it('should return salt and correctly hashed password ', async () => {
      const passwordData =
        await passwordEncryption.createSaltAndHashedPassword(defaultPassword);

      expect(passwordData.passwordSalt).toBeDefined();
      expect(passwordData.passwordSalt.length).toBeGreaterThan(0);

      const expectedHashedPassword = await bcrypt.hash(
        defaultPassword,
        passwordData.passwordSalt,
      );
      expect(passwordData.hashedPassword).toBe(expectedHashedPassword);
    });
  });
});
