import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../../../src/modules/storage/storage.service';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';

const mockCreateSignedUploadUrl = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockFrom = jest.fn(() => ({
  createSignedUploadUrl: mockCreateSignedUploadUrl,
  getPublicUrl: mockGetPublicUrl,
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ storage: { from: mockFrom } })),
}));

describe('StorageService', () => {
  let service: StorageService;

  const BUCKET = 'uploads';

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://project.supabase.co';
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-role-key';
      if (key === 'SUPABASE_STORAGE_BUCKET') return BUCKET;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the upload URL, key and public URL for a signed upload', async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: 'https://project.supabase.co/upload/signed',
        token: 't',
      },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://project.supabase.co/public/avatars/cat.jpg' },
    });

    const result = await service.generatePresignedUrl('avatars', 'cat.jpg');

    expect(mockFrom).toHaveBeenCalledWith(BUCKET);
    expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith('avatars/cat.jpg');
    expect(result).toEqual({
      uploadUrl: 'https://project.supabase.co/upload/signed',
      key: 'avatars/cat.jpg',
      fileUrl: 'https://project.supabase.co/public/avatars/cat.jpg',
    });
  });

  it('raises when the signed upload cannot be created', async () => {
    mockCreateSignedUploadUrl.mockResolvedValue({
      data: null,
      error: { message: 'Bucket not found' },
    });

    await expect(
      service.generatePresignedUrl('avatars', 'cat.jpg'),
    ).rejects.toBeInstanceOf(ServiceException);
  });
});
