interface MockPrismaInstance {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
}

describe('PrismaClient Singleton', () => {
  let mockInstance: MockPrismaInstance;
  let MockPrismaClient: jest.Mock;

  beforeEach(() => {
    // Reset modules and mocks
    jest.resetModules();
    jest.clearAllMocks();

    // Create fresh mocks for each test
    mockInstance = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
    MockPrismaClient = jest.fn(() => mockInstance);

    // Set up mocks
    jest.mock('@prisma/client', () => ({
      PrismaClient: MockPrismaClient,
    }));

    // Clear global state
    delete (global as any).prismaGlobal;
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    jest.resetModules();
  });

  it('should create a PrismaClient instance', async () => {
    // Import the module after setting up mocks
    const prismaModule = await import('../../../src/prisma/prisma.client');

    expect(MockPrismaClient).toHaveBeenCalledTimes(1);
    expect(prismaModule.default).toBeDefined();
    expect(prismaModule.default.$connect).toBeDefined();
    expect(prismaModule.default.$disconnect).toBeDefined();
  });

  it('should reuse the same instance when imported multiple times', async () => {
    const firstImport = (await import('../../../src/prisma/prisma.client'))
      .default;
    const secondImport = (await import('../../../src/prisma/prisma.client'))
      .default;

    expect(firstImport).toBe(secondImport);
    expect(MockPrismaClient).toHaveBeenCalledTimes(1);
  });

  describe('Development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should store the instance in globalThis.prismaGlobal', async () => {
      const instance = (await import('../../../src/prisma/prisma.client'))
        .default;
      expect((global as any).prismaGlobal).toBeDefined();
      expect((global as any).prismaGlobal).toBe(instance);
    });
  });

  describe('Production environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should not store the instance in globalThis.prismaGlobal', async () => {
      await import('../../../src/prisma/prisma.client');
      expect((global as any).prismaGlobal).toBeUndefined();
    });
  });
});
