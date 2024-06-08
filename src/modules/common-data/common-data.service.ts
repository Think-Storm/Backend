import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonDataService {
  async findAllLanguages() {
    return `This action returns all commonData`;
  }
}
