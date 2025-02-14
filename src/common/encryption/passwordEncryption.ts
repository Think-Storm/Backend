import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { passwordSaltRounds } from '../consts';

export class PasswordEncryption {
  async createSaltAndHashedPassword(password: string) {
    const passwordSalt = await bcrypt.genSalt(passwordSaltRounds);
    const hashedPassword = await bcrypt.hash(password, passwordSalt);
    return {
      passwordSalt,
      hashedPassword,
    };
  }

  async isPasswordCorrect(candidatePassword: string, userPassword: string) {
    return await bcrypt.compare(candidatePassword, userPassword);
  }

  async changedPasswordAfter(user: User, JWTTimestamp: number) {
    if (user.passwordChangedAt) {
      const changedTimeStamp = user.passwordChangedAt.getTime() / 1000;

      return JWTTimestamp < changedTimeStamp;
    }

    return false;
  }
}
