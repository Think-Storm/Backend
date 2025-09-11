import * as bcrypt from 'bcrypt';
import { passwordSaltRounds } from '../consts';
import { User } from '@think-storm/contracts';

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
    if (user?.passwordChangedAt) {
      const changedTimeStamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );
      return JWTTimestamp < changedTimeStamp;
    }

    return false;
  }
}
