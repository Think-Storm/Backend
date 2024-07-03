import * as bcrypt from 'bcrypt';
import { passwordSaltRounds } from './consts';

export class PasswordEncryption {
  async createSaltAndHashedPassword(password: string) {
    const passwordSalt = await bcrypt.genSalt(passwordSaltRounds);
    const hashedPassword = await bcrypt.hash(password, passwordSalt);
    return {
      passwordSalt,
      hashedPassword,
    };
  }

  async correctPassword(candidatePassword: string, userPassword: string) {
    return await bcrypt.compare(candidatePassword, userPassword);
  }
}
