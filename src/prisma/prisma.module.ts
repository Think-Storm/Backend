import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  // with the help of `DynamicModule` we can import `PrismaModule` with existing client.
  static forTest(prisma): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PrismaService,
          useFactory: () => prisma as PrismaService,
        },
      ],
      exports: [PrismaService],
    };
  }
}
