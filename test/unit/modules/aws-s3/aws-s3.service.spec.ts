import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsS3Service } from '../../../../src/modules/aws-s3/aws-s3.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('AwsS3Service', () => {
  let service: AwsS3Service;

  const config: Record<string, string> = {
    AWS_REGION: 'ap-northeast-2',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    AWS_S3_BUCKET: 'test-bucket',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => config[key]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsS3Service,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AwsS3Service>(AwsS3Service);

    (getSignedUrl as jest.Mock).mockResolvedValue(
      'https://signed-url.example.com',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should namespace the generated object key by the authenticated user id', async () => {
    const result = await service.generatePresignedUrl(
      'avatars',
      'photo.png',
      'image/png',
      42,
    );

    expect(result.key).toBe('avatars/42/photo.png');
    expect(result.uploadUrl).toBe('https://signed-url.example.com');
    expect(result.fileUrl).toBe(
      'https://test-bucket.s3.ap-northeast-2.amazonaws.com/avatars/42/photo.png',
    );
  });

  it('should scope different users to different keys for the same filename and folder', async () => {
    const userAResult = await service.generatePresignedUrl(
      'avatars',
      'photo.png',
      'image/png',
      1,
    );
    const userBResult = await service.generatePresignedUrl(
      'avatars',
      'photo.png',
      'image/png',
      2,
    );

    expect(userAResult.key).not.toBe(userBResult.key);
  });
});
