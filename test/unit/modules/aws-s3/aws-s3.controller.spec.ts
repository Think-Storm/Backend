import { Test, TestingModule } from '@nestjs/testing';
import { AwsS3Controller } from '../../../../src/modules/aws-s3/aws-s3.controller';
import { AwsS3Service } from '../../../../src/modules/aws-s3/aws-s3.service';
import { PresignedUrlQueryDto } from '../../../../src/modules/aws-s3/dtos/presignedUrlQuery.dto';
import { defaultUser } from '../../../utils/user.utils';

describe('AwsS3Controller', () => {
  let controller: AwsS3Controller;

  const mockAwsS3Service = {
    generatePresignedUrl: jest.fn(),
  };

  const query: PresignedUrlQueryDto = {
    folder: 'avatars',
    filename: 'photo.png',
    mimetype: 'image/png',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AwsS3Controller],
      providers: [{ provide: AwsS3Service, useValue: mockAwsS3Service }],
    }).compile();

    controller = module.get<AwsS3Controller>(AwsS3Controller);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the presigned URL for the authenticated user', async () => {
    const expected = {
      uploadUrl: 'https://signed-url.example.com',
      key: `avatars/${defaultUser.id}/photo.png`,
      fileUrl: 'https://test-bucket.s3.ap-northeast-2.amazonaws.com/avatars',
    };
    mockAwsS3Service.generatePresignedUrl.mockResolvedValue(expected);

    const result = await controller.getPresignedUrl(query, defaultUser);

    expect(result).toEqual(expected);
  });

  it('should scope the S3 key generation to the authenticated user id, not caller-supplied input', async () => {
    await controller.getPresignedUrl(query, defaultUser);

    expect(mockAwsS3Service.generatePresignedUrl).toHaveBeenCalledWith(
      query.folder,
      query.filename,
      query.mimetype,
      defaultUser.id,
    );
  });
});
